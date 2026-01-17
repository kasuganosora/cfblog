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

    if (!body.title || !body.authorId) {
      return c.json(errorResponse('Title and author ID are required').json(), 400);
    }

    const postModel = new Post(db);
    const post = await postModel.createPost(body);

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

// GET /search - 搜索文章
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

export { postRoutes };
