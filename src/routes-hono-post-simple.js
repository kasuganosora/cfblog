/**
 * Post Routes - Simple Hono Version
 */

import { Hono } from 'hono';
import { Post } from '../models/Post.js';

const postRoutes = new Hono();

// GET /list - 获取文章列表
postRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json({ success: false, message: 'Database not available' }, 500);
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
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /published - 获取已发布文章
postRoutes.get('/published', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json({ success: false, message: 'Database not available' }, 500);
    }

    const postModel = new Post(db);
    const result = await postModel.getPostList({ status: 1 });

    return c.json(result);
  } catch (error) {
    console.error('Get published posts error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /:id - 根据ID获取文章
postRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json({ success: false, message: 'Database not available' }, 500);
    }

    const postModel = new Post(db);
    const id = parseInt(c.req.param('id'));
    const post = await postModel.getPostById(id);

    if (!post) {
      return c.json({ success: false, message: 'Post not found' }, 404);
    }

    await postModel.incrementViewCount(id);

    return c.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { postRoutes };
