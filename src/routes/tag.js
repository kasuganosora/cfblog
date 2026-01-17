/**
 * Tag Routes
 * Handles tag management
 */

import { Router } from 'itty-router';
import { Tag } from '../models/Tag.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse
} from '../utils/response.js';

const tagRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Tag(db));
  } catch (error) {
    console.error('Tag route error:', error);
    return serverErrorResponse(error.message);
  }
};

// GET /api/tag/list - Get tag list
tagRouter.get('/list', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const { page, limit } = Object.fromEntries(new URL(request.url).searchParams);

      const result = await tagModel.getTagList({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/tag/popular - Get popular tags
tagRouter.get('/popular', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const { limit } = Object.fromEntries(new URL(request.url).searchParams);

      const tags = await tagModel.getPopularTags({
        limit: limit ? parseInt(limit) : 10
      });

      return successResponse(tags);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/tag/:id - Get tag by ID
tagRouter.get('/:id', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const id = parseInt(request.params.id);
      const tag = await tagModel.getTagWithPostCount(id);

      if (!tag) {
        return notFoundResponse('Tag not found');
      }

      return successResponse(tag);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// POST /api/tag/create - Create tag (admin only)
tagRouter.post('/create', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const body = await request.json();

      if (!body.name) {
        return errorResponse('Tag name is required');
      }

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const tag = await tagModel.createTag(body);
      return successResponse(tag, 'Tag created successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// PUT /api/tag/:id/update - Update tag (admin only)
tagRouter.put('/:id/update', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const id = parseInt(request.params.id);
      const body = await request.json();

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const tag = await tagModel.updateTag(id, body);
      return successResponse(tag, 'Tag updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// DELETE /api/tag/:id/delete - Delete tag (admin only)
tagRouter.delete('/:id/delete', async (request) => {
  return withDB(request, async (tagModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await tagModel.deleteTag(id);
      return successResponse(null, 'Tag deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

export { tagRouter as tagRoutes };
