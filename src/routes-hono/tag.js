/**
 * Tag Routes - Hono Version
 */

import { Hono } from 'hono';
import { Tag } from '../models/Tag.js';
import {
  serverErrorResponse,
  errorResponse,
  notFoundResponse
} from './base.js';

const tagRoutes = new Hono();

// GET /api/tag/list - 获取标签列表
tagRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const tagModel = new Tag(db);
    const result = await tagModel.getTagList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Get tag list error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/tag/popular - 获取热门标签
tagRoutes.get('/popular', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const tagModel = new Tag(db);
    const tags = await tagModel.getPopularTags({ limit });

    // Return empty array if no tags
    if (!tags || tags.length === 0) {
      return c.json({ data: [], success: true });
    }

    return c.json(tags);
  } catch (error) {
    console.error('Get popular tags error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/tag/:id - 根据ID获取标签
tagRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const tagModel = new Tag(db);
    const tag = await tagModel.getTagWithPostCount(id);

    if (!tag) {
      return c.json(notFoundResponse('Tag not found').json(), 404);
    }

    return c.json(tag);
  } catch (error) {
    console.error('Get tag error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// POST /api/tag/create - 创建标签
tagRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    if (!body.name) {
      return c.json(errorResponse('Tag name is required').json(), 400);
    }

    const tagModel = new Tag(db);
    const tag = await tagModel.createTag(body);

    return c.json(tag, 201);
  } catch (error) {
    console.error('Create tag error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/tag/:id/update - 更新标签
tagRoutes.put('/:id/update', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();

    const tagModel = new Tag(db);
    const tag = await tagModel.updateTag(id, body);

    return c.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// DELETE /api/tag/:id/delete - 删除标签
tagRoutes.delete('/:id/delete', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const tagModel = new Tag(db);
    await tagModel.deleteTag(id);

    return c.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

export { tagRoutes };
