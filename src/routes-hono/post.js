/**
 * Post Routes - Hono Version
 */

import { Hono } from 'hono';
import { Post } from '../models/Post.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  parsePagination
} from './base.js';

const postRoutes = new Hono();

// GET /list - 获取文章列表
postRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postModel = new Post(db);
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const result = await postModel.getPostList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
      status: params.status !== undefined ? parseInt(params.status) : undefined,
      featured: params.featured !== undefined ? params.featured === 'true' : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Post list error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
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
    return c.json(serverErrorResponse(error.message).json(), 500);
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

    // Increment view count
    await postModel.incrementViewCount(id);

    return c.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /slug/:slug - 根据slug获取文章
postRoutes.get('/slug/:slug', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postModel = new Post(db);
    const slug = c.req.param('slug');
    const post = await postModel.getPostBySlug(slug);

    if (!post) {
      return c.json(notFoundResponse('Post not found').json(), 404);
    }

    // Increment view count
    await postModel.incrementViewCount(post.id);

    return c.json(post);
  } catch (error) {
    console.error('Get post by slug error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// POST /create - 创建文章
postRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    // Support both camelCase and snake_case field names
    const authorId = body.authorId || body.author_id;
    const categoryId = body.categoryId || body.category_id || null;

    if (!body.title || !authorId) {
      return c.json(errorResponse('Title and author ID are required').json(), 400);
    }

    // Convert to snake_case for database, only include defined fields
    const postData = {
      title: body.title,
      author_id: authorId
    };

    // Only add optional fields if they exist
    if (body.slug !== undefined) postData.slug = body.slug;
    if (body.excerpt !== undefined) postData.excerpt = body.excerpt;
    if (body.content !== undefined) postData.content = body.content;
    if (body.content_key !== undefined) postData.content_key = body.content_key;
    if (body.status !== undefined) postData.status = body.status;
    if (body.featured !== undefined) postData.featured = body.featured;
    if (body.comment_status !== undefined) postData.comment_status = body.comment_status;
    if (body.published_at !== undefined) postData.published_at = body.published_at;

    const postModel = new Post(db);
    const post = await postModel.createPost(postData);

    // Handle categories if provided
    if (categoryId) {
      await postModel.addCategoryToPost(post.id, categoryId);
    }

    // Handle tags if provided
    if (body.tagIds || body.tag_ids) {
      const tagIds = body.tagIds || body.tag_ids;
      for (const tagId of tagIds) {
        await postModel.addTagToPost(post.id, tagId);
      }
    }

    return c.json(post, 201);
  } catch (error) {
    console.error('Create post error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /:id/update - 更新文章
postRoutes.put('/:id/update', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    const postModel = new Post(db);
    const post = await postModel.updatePost(id, body);

    return c.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// DELETE /:id/delete - 删除文章
postRoutes.delete('/:id/delete', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const postModel = new Post(db);
    await postModel.deletePost(id);

    return c.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { postRoutes };
