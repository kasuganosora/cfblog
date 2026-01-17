/**
 * Category Routes
 * Handles category management
 */

import { Router } from 'itty-router';
import { Category } from '../models/Category.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse
} from '../utils/response.js';

const categoryRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Category(db));
  } catch (error) {
    console.error('Category route error:', error);
    return serverErrorResponse(error.message);
  }
};

// GET /api/category/list - Get category list
categoryRouter.get('/list', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const { page, limit } = Object.fromEntries(new URL(request.url).searchParams);

      const result = await categoryModel.getCategoryList({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/category/tree - Get category tree
categoryRouter.get('/tree', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const tree = await categoryModel.getCategoryTree();
      return successResponse(tree);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/category/:id - Get category by ID
categoryRouter.get('/:id', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const id = parseInt(request.params.id);
      const category = await categoryModel.getCategoryWithPostCount(id);

      if (!category) {
        return notFoundResponse('Category not found');
      }

      return successResponse(category);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// POST /api/category/create - Create category (admin only)
categoryRouter.post('/create', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const body = await request.json();

      if (!body.name) {
        return errorResponse('Category name is required');
      }

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const category = await categoryModel.createCategory(body);
      return successResponse(category, 'Category created successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// PUT /api/category/:id/update - Update category (admin only)
categoryRouter.put('/:id/update', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const id = parseInt(request.params.id);
      const body = await request.json();

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const category = await categoryModel.updateCategory(id, body);
      return successResponse(category, 'Category updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// DELETE /api/category/:id/delete - Delete category (admin only)
categoryRouter.delete('/:id/delete', async (request) => {
  return withDB(request, async (categoryModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await categoryModel.deleteCategory(id);
      return successResponse(null, 'Category deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

export { categoryRouter as categoryRoutes };
