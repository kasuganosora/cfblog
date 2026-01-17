/**
 * Comment Routes
 * Handles comment management
 */

import { Router } from 'itty-router';
import { Comment } from '../models/Comment.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse
} from '../utils/response.js';

const commentRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Comment(db));
  } catch (error) {
    console.error('Comment route error:', error);
    return serverErrorResponse(error.message);
  }
};

// POST /api/comment/create - Create comment
commentRouter.post('/create', async (request) => {
  return withDB(request, async (commentModel) => {
    try {
      const body = await request.json();

      if (!body.postId || !body.authorName || !body.content) {
        return errorResponse('Post ID, author name, and content are required');
      }

      // Create comment
      const comment = await commentModel.createComment(body);
      return successResponse(comment, 'Comment created successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// GET /api/comment/post/:postId - Get comments for a post
commentRouter.get('/post/:postId', async (request) => {
  return withDB(request, async (commentModel) => {
    try {
      const postId = parseInt(request.params.postId);
      const { page, limit } = Object.fromEntries(new URL(request.url).searchParams);

      const result = await commentModel.getCommentsByPost(postId, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/comment/:id - Get comment by ID
commentRouter.get('/:id', async (request) => {
  return withDB(request, async (commentModel) => {
    try {
      const id = parseInt(request.params.id);
      const comment = await commentModel.getCommentById(id);

      if (!comment) {
        return notFoundResponse('Comment not found');
      }

      return successResponse(comment);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /api/comment/:id/delete - Delete comment (admin only)
commentRouter.delete('/:id/delete', async (request) => {
  return withDB(request, async (commentModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await commentModel.deleteComment(id);
      return successResponse(null, 'Comment deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
});

export { commentRouter as commentRoutes };
