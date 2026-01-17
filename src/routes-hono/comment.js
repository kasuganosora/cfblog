/**
 * Comment Routes - Hono Version
 */

import { Hono } from 'hono';
import { Comment } from '../models/Comment.js';
import {
  serverErrorResponse,
  errorResponse,
  notFoundResponse
} from './base.js';

const commentRoutes = new Hono();

// POST /api/comment/create - 创建评论
commentRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    // Support both camelCase and snake_case field names
    const postId = body.postId || body.post_id;
    const authorName = body.authorName || body.author_name;
    const authorEmail = body.authorEmail || body.author_email;
    const parentId = body.parentId || body.parent_id || null;

    if (!postId || !authorName || !body.content) {
      return c.json(errorResponse('Post ID, author name, and content are required').json(), 400);
    }

    const commentModel = new Comment(db);
    const comment = await commentModel.createComment({
      post_id: postId,
      author_name: authorName,
      author_email: authorEmail,
      content: body.content,
      parent_id: parentId
    });

    return c.json(comment, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// GET /post/:postId - 获取文章的评论
commentRoutes.get('/post/:postId', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postId = parseInt(c.req.param('postId'));
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const commentModel = new Comment(db);
    const result = await commentModel.getCommentsByPost(postId, {
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20
    });

    return c.json(result);
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/comment/:id - 根据ID获取评论
commentRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const commentModel = new Comment(db);
    const comment = await commentModel.getCommentById(id);

    if (!comment) {
      return c.json(notFoundResponse('Comment not found').json(), 404);
    }

    return c.json(comment);
  } catch (error) {
    console.error('Get comment error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// DELETE /api/comment/:id/delete - 删除评论
commentRoutes.delete('/:id/delete', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const commentModel = new Comment(db);
    await commentModel.deleteComment(id);

    return c.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { commentRoutes };
