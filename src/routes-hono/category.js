/**
 * Category Routes - Hono Version
 */

import { Hono } from 'hono';
import { Category } from '../models/Category.js';
import {
  serverErrorResponse,
  errorResponse,
  notFoundResponse
} from './base.js';

const categoryRoutes = new Hono();

// GET /api/category/list - 获取分类列表
categoryRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const categoryModel = new Category(db);
    const result = await categoryModel.getCategoryList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Get category list error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/category/tree - 获取分类树
categoryRoutes.get('/tree', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const categoryModel = new Category(db);
    const tree = await categoryModel.getCategoryTree();

    // Return empty array if no categories
    if (!tree || tree.length === 0) {
      return c.json({ data: [], success: true });
    }

    return c.json(tree);
  } catch (error) {
    console.error('Get category tree error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/category/slug/:slug - 根据slug获取分类 (必须在/:id之前)
categoryRoutes.get('/slug/:slug', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const slug = c.req.param('slug');
    const categoryModel = new Category(db);
    const category = await categoryModel.findBySlug(slug);

    if (!category) {
      return c.json(notFoundResponse('Category not found').json(), 404);
    }

    return c.json(category);
  } catch (error) {
    console.error('Get category by slug error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/category/:id - 根据ID获取分类
categoryRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const categoryModel = new Category(db);
    const category = await categoryModel.getCategoryWithPostCount(id);

    if (!category) {
      return c.json(notFoundResponse('Category not found').json(), 404);
    }

    return c.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// POST /api/category/create - 创建分类
categoryRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    if (!body.name) {
      return c.json(errorResponse('Category name is required').json(), 400);
    }

    const categoryModel = new Category(db);
    const category = await categoryModel.createCategory(body);

    return c.json(category, 201);
  } catch (error) {
    console.error('Create category error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/category/:id/update - 更新分类
categoryRoutes.put('/:id/update', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    const categoryModel = new Category(db);
    const category = await categoryModel.updateCategory(id, body);

    return c.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// DELETE /api/category/:id/delete - 删除分类
categoryRoutes.delete('/:id/delete', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const categoryModel = new Category(db);
    await categoryModel.deleteCategory(id);

    return c.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

export { categoryRoutes };
