/**
 * Feedback Routes - Hono Version
 */

import { Hono } from 'hono';
import { Feedback } from '../models/Feedback.js';
import {
  serverErrorResponse,
  errorResponse,
  requireAdmin
} from './base.js';

const feedbackRoutes = new Hono();

// POST /api/feedback/create - 提交反馈
feedbackRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    if (!body.name || !body.content) {
      return c.json(errorResponse('Name and content are required').json(), 400);
    }

    // Input length validation
    if (body.name.length > 50) {
      return c.json(errorResponse('Name must be 50 characters or less').json(), 400);
    }
    if (body.content.length > 5000) {
      return c.json(errorResponse('Content must be 5000 characters or less').json(), 400);
    }
    if (body.email && body.email.length > 100) {
      return c.json(errorResponse('Email must be 100 characters or less').json(), 400);
    }

    const feedbackModel = new Feedback(db);
    const feedback = await feedbackModel.createFeedback(body);

    return c.json(feedback, 201);
  } catch (error) {
    console.error('Create feedback error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// GET /api/feedback/list - 获取反馈列表（管理员）
feedbackRoutes.get('/list', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const feedbackModel = new Feedback(db);
    const result = await feedbackModel.getFeedbackList({
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20,
      status: params.status !== undefined ? parseInt(params.status) : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Get feedback list error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /api/feedback/:id - 根据ID获取反馈（管理员）
feedbackRoutes.get('/:id', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const feedbackModel = new Feedback(db);
    const feedback = await feedbackModel.findById(id);

    if (!feedback) {
      return c.json({
        success: false,
        message: 'Feedback not found'
      }, 404);
    }

    return c.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// DELETE /api/feedback/:id/delete - 删除反馈（管理员）
feedbackRoutes.delete('/:id/delete', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const feedbackModel = new Feedback(db);
    await feedbackModel.deleteFeedback(id);

    return c.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { feedbackRoutes };
