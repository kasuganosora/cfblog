/**
 * Feedback Routes
 * Handles feedback/guestbook management
 */

import { Router } from 'itty-router';
import { Feedback } from '../models/Feedback.js';
import {
  successResponse,
  errorResponse,
  serverErrorResponse
} from '../utils/response.js';

const feedbackRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Feedback(db));
  } catch (error) {
    console.error('Feedback route error:', error);
    return serverErrorResponse(error.message);
  }
};

// POST /api/feedback/create - Submit feedback
feedbackRouter.post('/create', async (request) => {
  return withDB(request, async (feedbackModel) => {
    try {
      const body = await request.json();

      if (!body.name || !body.content) {
        return errorResponse('Name and content are required');
      }

      // Create feedback
      const feedback = await feedbackModel.createFeedback(body);
      return successResponse(feedback, 'Feedback submitted successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// GET /api/feedback/list - Get feedback list (admin only)
feedbackRouter.get('/list', async (request) => {
  return withDB(request, async (feedbackModel) => {
    try {
      const { page, limit, status } = Object.fromEntries(new URL(request.url).searchParams);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const result = await feedbackModel.getFeedbackList({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status: status !== undefined ? parseInt(status) : undefined
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/feedback/:id - Get feedback by ID
feedbackRouter.get('/:id', async (request) => {
  return withDB(request, async (feedbackModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const feedback = await feedbackModel.findById(id);

      if (!feedback) {
        return errorResponse('Feedback not found', 404);
      }

      return successResponse(feedback);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /api/feedback/:id/delete - Delete feedback (admin only)
feedbackRouter.delete('/:id/delete', async (request) => {
  return withDB(request, async (feedbackModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await feedbackModel.deleteFeedback(id);
      return successResponse(null, 'Feedback deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
});

export { feedbackRouter as feedbackRoutes };
