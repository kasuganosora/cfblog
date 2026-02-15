/**
 * Post Routes - Hono Version
 */

import { Hono } from 'hono';
import { Post } from '../models/Post.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  parsePagination,
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

const postRoutes = new Hono();

// GET /list - 获取文章列表（无参数时从 R2 缓存读取）
postRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);
    const hasFilters = params.status !== undefined || params.featured !== undefined;
    const page = params.page ? parseInt(params.page) : 1;
    const limit = params.limit ? parseInt(params.limit) : 10;
    const isDefault = !hasFilters && page === 1 && limit === 10;

    // Default request: try R2 cache first
    if (isDefault && bucket) {
      const cached = await getCachedPostList(bucket);
      if (cached) return c.json(cached);
    }

    const postModel = new Post(db);
    const result = await postModel.getPostList({
      page,
      limit,
      status: params.status !== undefined ? parseInt(params.status) : undefined,
      featured: params.featured !== undefined ? params.featured === 'true' : undefined
    });

    // Populate R2 cache on miss for default requests
    if (isDefault && bucket) {
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

    const result = await postModel.searchPosts(keyword, { page, limit });

    return c.json(result);
  } catch (error) {
    console.error('Search posts error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /:id - 根据ID获取文章
postRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postModel = new Post(db);
    const id = parseInt(c.req.param('id'));
    const post = await postModel.getPostById(id);

    if (!post) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }

    // Increment view count only for published posts and non-author visitors
    if (post.status === 1) {
      const currentUserId = await getCurrentUserId(c);
      if (!currentUserId || currentUserId !== post.author_id) {
        await postModel.incrementViewCount(id);
      }
    }

    return c.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /slug/:slug - 根据slug获取文章（已发布文章从 R2 缓存读取）
postRoutes.get('/slug/:slug', async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const slug = c.req.param('slug');

    // Try R2 cache first
    const cached = await getCachedPost(bucket, slug);
    if (cached) {
      // Increment view count asynchronously (non-blocking)
      if (cached.status === 1) {
        const currentUserId = await getCurrentUserId(c);
        if (!currentUserId || currentUserId !== cached.author_id) {
          const postModel = new Post(db);
          postModel.incrementViewCount(cached.id).catch(() => {});
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

    // Cache published posts in R2
    if (post.status === 1 && bucket) {
      cachePost(bucket, slug, post).catch(() => {});
    }

    // Increment view count only for published posts and non-author visitors
    if (post.status === 1) {
      const currentUserId = await getCurrentUserId(c);
      if (!currentUserId || currentUserId !== post.author_id) {
        await postModel.incrementViewCount(post.id);
      }
    }

    return c.json(post);
  } catch (error) {
    console.error('Get post by slug error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// POST /create - 创建文章（需登录）
postRoutes.post('/create', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    // Support both camelCase and snake_case field names
    const authorId = body.authorId || body.author_id;

    if (!body.title || !authorId) {
      return c.json(errorResponse('Title and author ID are required').json(), 400);
    }

    // Build postData — createPost() handles categoryIds/tagIds internally
    const postData = {
      title: body.title,
      author_id: authorId
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
    const post = await postModel.createPost(postData);

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

    const id = parseInt(c.req.param('id'));
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
    const post = await postModel.updatePost(id, body);

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
postRoutes.delete('/:id/delete', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
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
