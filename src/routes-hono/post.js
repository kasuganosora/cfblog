/**
 * Post Routes - Hono Version
 */

import { Hono } from 'hono';
import { Post } from '../models/Post.js';
import {
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  parsePagination,
  safeParseInt,
  requireAuth
} from './base.js';
import { validateSessionId } from '../utils/auth.js';
import {
  getCachedPostList, refreshPostListCache,
  cachePost, getCachedPost, deleteCachedPost,
  refreshAllPostCaches,
  savePostAsHexoMd, deleteHexoMd
} from '../utils/cache.js';

// Helper: optionally get current user ID from session cookie (no auth required)
async function getCurrentUserId(c) {
  try {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    if (!sessionId) return null;
    const secret = c.env?.SESSION_SECRET;
    if (!secret) return null;
    const sessionData = await validateSessionId(sessionId, secret);
    return sessionData?.userId || null;
  } catch {
    return null;
  }
}

// Helper: check if current user can view a draft post (must be author or admin)
async function canViewDraft(c, post) {
  const currentUserId = await getCurrentUserId(c);
  if (!currentUserId) return false;
  if (post.author_id === currentUserId) return true;
  const db = c.env?.DB;
  if (db) {
    const user = await db.prepare('SELECT role FROM users WHERE id = ?').bind(currentUserId).first();
    return user?.role === 'admin';
  }
  return false;
}

const postRoutes = new Hono();

// GET /list - 获取文章列表（无参数时从 R2 缓存读取）
// SECURITY: Non-admin users must never see draft posts. The `status` query
// parameter is intentionally ignored here; the model defaults to published-only
// when `isAdmin` is not explicitly set to true.
// The `all=1` parameter is only honoured when the user has a valid session
// (authenticated). Public/anonymous requests always see published posts only.
postRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);
    // Note: status is deliberately excluded from hasFilters — public users
    // must not be able to bypass the published-only default via query params.
    const hasFilters = params.featured !== undefined || params.category_id !== undefined || params.tag_id !== undefined;
    const page = safeParseInt(params.page, 1);
    const limit = safeParseInt(params.limit, 10);
    const isDefault = !hasFilters && page === 1 && limit === 10;

    // SECURITY: `all=1` only works for authenticated users — shows all statuses
    // including drafts. Anonymous users always see published only.
    let isAdmin = false;
    if (params.all === '1') {
      const currentUserId = await getCurrentUserId(c);
      isAdmin = !!currentUserId;
    }

    // Default request: try R2 cache first (only for public/default requests)
    if (isDefault && !isAdmin && bucket) {
      const cached = await getCachedPostList(bucket);
      if (cached) return c.json(cached);
    }

    const postModel = new Post(db);
    const result = await postModel.getPostList({
      page,
      limit,
      isAdmin,
      // SECURITY: Do NOT pass status from query params for public access.
      // The model defaults to p.status = 1 when isAdmin is false/undefined.
      featured: params.featured !== undefined ? params.featured === 'true' : undefined,
      categoryId: params.category_id !== undefined ? parseInt(params.category_id) : undefined,
      tagId: params.tag_id !== undefined ? parseInt(params.tag_id) : undefined
    });

    // Populate R2 cache on miss for default requests (public only)
    if (isDefault && !isAdmin && bucket) {
      refreshPostListCache(bucket, db).catch(() => {});
    }

    return c.json(result);
  } catch (error) {
    console.error('Post list error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /search - 搜索文章 (必须在 /:id 之前，否则会被/:id路由捕获)
postRoutes.get('/search', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const keyword = url.searchParams.get('keyword');

    if (!keyword) {
      return c.json(errorResponse('Keyword is required').json(), 400);
    }

    const { page, limit } = parsePagination(c);
    const postModel = new Post(db);

    // searchPosts defaults to status=1 (published only) — safe for public access
    const result = await postModel.searchPosts(keyword, { page, limit });

    return c.json(result);
  } catch (error) {
    console.error('Search posts error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /:id - 根据ID获取文章
// SECURITY: Draft posts are only returned to the post author or an admin.
postRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postModel = new Post(db);
    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid post ID').json(), 400);
    }
    const post = await postModel.getPostById(id);

    if (!post) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }

    // SECURITY: Block draft posts for non-author/non-admin users
    if (post.status !== 1) {
      if (!await canViewDraft(c, post)) {
        return c.json(notFoundResponse('Post not found').json(), 404);
      }
    }

    // Increment view count only for published posts and non-author visitors
    if (post.status === 1) {
      const currentUserId = await getCurrentUserId(c);
      if (!currentUserId || currentUserId !== post.author_id) {
        await postModel.incrementViewCount(id);
        post.view_count = (post.view_count || 0) + 1;
      }
    }

    return c.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /slug/:slug - 根据slug获取文章（已发布文章从 R2 缓存读取）
// SECURITY: Draft posts are only returned to the post author or an admin.
postRoutes.get('/slug/:slug', async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const slug = c.req.param('slug');

    // Try R2 cache first (only published posts are ever cached)
    const cached = await getCachedPost(bucket, slug);
    if (cached) {
      // Increment view count asynchronously (non-blocking)
      if (cached.status === 1) {
        const currentUserId = await getCurrentUserId(c);
        if (!currentUserId || currentUserId !== cached.author_id) {
          const postModel = new Post(db);
          postModel.incrementViewCount(cached.id).catch(() => {});
          cached.view_count = (cached.view_count || 0) + 1;
        }
      }
      return c.json(cached);
    }

    // Cache miss: query D1
    const postModel = new Post(db);
    const post = await postModel.getPostBySlug(slug);

    if (!post) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }

    // SECURITY: Block draft posts for non-author/non-admin users
    if (post.status !== 1) {
      if (!await canViewDraft(c, post)) {
        return c.json(notFoundResponse('Post not found').json(), 404);
      }
    }

    // Cache published posts in R2
    if (post.status === 1 && bucket) {
      cachePost(bucket, slug, post).catch(() => {});
    }

    // Increment view count only for published posts and non-author visitors
    if (post.status === 1) {
      const currentUserId = await getCurrentUserId(c);
      if (!currentUserId || currentUserId !== post.author_id) {
        await postModel.incrementViewCount(post.id);
        post.view_count = (post.view_count || 0) + 1;
      }
    }

    return c.json(post);
  } catch (error) {
    console.error('Get post by slug error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// POST /create - 创建文章（需登录）
// SECURITY: author_id is taken from the authenticated session, never from the
// request body, preventing author spoofing.
postRoutes.post('/create', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const currentUser = c.get('user');

    if (!body.title) {
      return c.json(errorResponse('Title is required').json(), 400);
    }

    // SECURITY: Always use the authenticated user's ID — ignore any
    // author_id / authorId supplied in the request body.
    const authorId = currentUser.id;

    // Build postData — author_id is passed via createPost's second parameter
    const postData = {
      title: body.title
    };

    if (body.slug !== undefined) postData.slug = body.slug;
    if (body.excerpt !== undefined) postData.excerpt = body.excerpt;
    if (body.content !== undefined) postData.content = body.content;
    if (body.content_key !== undefined) postData.content_key = body.content_key;
    if (body.status !== undefined) postData.status = body.status;
    if (body.featured !== undefined) postData.featured = body.featured;
    if (body.comment_status !== undefined) postData.comment_status = body.comment_status;
    if (body.published_at !== undefined) postData.published_at = body.published_at;

    // Pass category/tag IDs to createPost which handles them internally
    const categoryId = body.categoryId || body.category_id;
    const tagIds = body.tagIds || body.tag_ids;
    if (categoryId) postData.categoryIds = [categoryId];
    if (body.categoryIds) postData.categoryIds = body.categoryIds;
    if (tagIds) postData.tagIds = tagIds;

    const postModel = new Post(db);
    const post = await postModel.createPost(postData, authorId);

    // Refresh caches if published
    const bucket = c.env?.BUCKET;
    if (bucket && post.status === 1) {
      const origin = new URL(c.req.url).origin;
      cachePost(bucket, post.slug, post).catch(() => {});
      savePostAsHexoMd(bucket, post).catch(() => {});
      refreshAllPostCaches(bucket, db, origin).catch(() => {});
    }

    return c.json(post, 201);
  } catch (error) {
    console.error('Create post error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /:id/update - 更新文章（需登录，仅作者或管理员）
postRoutes.put('/:id/update', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid post ID').json(), 400);
    }
    const currentUser = c.get('user');
    const postModel = new Post(db);

    // Check if post exists and verify ownership
    const existingPost = await postModel.findById(id);
    if (!existingPost) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }
    if (existingPost.author_id !== currentUser.id && currentUser.role !== 'admin') {
      return c.json(forbiddenResponse('You can only edit your own posts').json(), 403);
    }

    const body = await c.req.json();

    // SECURITY: Whitelist updatable fields to prevent mass assignment.
    // (The model's updatePost also destructures only known fields, but
    // whitelisting here provides defense-in-depth and normalises naming.)
    const postData = {};
    if (body.title !== undefined) postData.title = body.title;
    if (body.excerpt !== undefined) postData.excerpt = body.excerpt;
    if (body.content !== undefined) postData.content = body.content;
    if (body.status !== undefined) postData.status = body.status;
    if (body.featured !== undefined) postData.featured = body.featured;
    // Support both camelCase and snake_case for comment_status
    if (body.commentStatus !== undefined) postData.commentStatus = body.commentStatus;
    else if (body.comment_status !== undefined) postData.commentStatus = body.comment_status;
    // Support both camelCase and snake_case for published_at
    if (body.publishedAt !== undefined) postData.publishedAt = body.publishedAt;
    else if (body.published_at !== undefined) postData.publishedAt = body.published_at;
    if (body.categoryIds !== undefined) postData.categoryIds = body.categoryIds;
    if (body.tagIds !== undefined) postData.tagIds = body.tagIds;

    const post = await postModel.updatePost(id, postData);

    // Refresh caches
    const bucket = c.env?.BUCKET;
    if (bucket) {
      const origin = new URL(c.req.url).origin;
      if (post.status === 1) {
        // Published: cache the post and refresh lists
        cachePost(bucket, post.slug, post).catch(() => {});
        savePostAsHexoMd(bucket, post).catch(() => {});
      } else if (existingPost.status === 1) {
        // Was published, now draft: remove caches
        deleteCachedPost(bucket, existingPost.slug).catch(() => {});
        deleteHexoMd(bucket, existingPost.slug).catch(() => {});
      }
      refreshAllPostCaches(bucket, db, origin).catch(() => {});
    }

    return c.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// DELETE /:id/delete - 删除文章（需登录，仅作者或管理员）
// FIX: Clean up post_tags and post_categories junction table entries before
// deleting the post to prevent orphaned rows.
postRoutes.delete('/:id/delete', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid post ID').json(), 400);
    }
    const currentUser = c.get('user');
    const postModel = new Post(db);

    // Check if post exists and verify ownership
    const existingPost = await postModel.findById(id);
    if (!existingPost) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }
    if (existingPost.author_id !== currentUser.id && currentUser.role !== 'admin') {
      return c.json(forbiddenResponse('You can only delete your own posts').json(), 403);
    }

    // Clean up junction table entries before deleting the post itself
    await db.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(id).run();
    await db.prepare('DELETE FROM post_categories WHERE post_id = ?').bind(id).run();

    await postModel.deletePost(id);

    // Refresh caches
    const bucket = c.env?.BUCKET;
    if (bucket) {
      if (existingPost.slug) {
        deleteCachedPost(bucket, existingPost.slug).catch(() => {});
        deleteHexoMd(bucket, existingPost.slug).catch(() => {});
      }
      const origin = new URL(c.req.url).origin;
      refreshAllPostCaches(bucket, db, origin).catch(() => {});
    }

    return c.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { postRoutes };