/**
 * Settings Routes - Hono Version
 */

import { Hono } from 'hono';
import { Settings } from '../models/Settings.js';
import { serverErrorResponse } from './base.js';

const settingsRoutes = new Hono();

// GET / - 获取所有设置
settingsRoutes.get('/', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const settings = await settingsModel.getAllSettings();

    return c.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /blog - 获取博客信息
settingsRoutes.get('/blog', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const blogInfo = await settingsModel.getBlogInfo();

    return c.json(blogInfo);
  } catch (error) {
    console.error('Get blog settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/settings/display - 获取显示设置
settingsRoutes.get('/settings/display', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const displaySettings = await settingsModel.getDisplaySettings();

    return c.json(displaySettings);
  } catch (error) {
    console.error('Get display settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/settings/comments - 获取评论设置
settingsRoutes.get('/settings/comments', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const commentSettings = await settingsModel.getCommentSettings();

    return c.json(commentSettings);
  } catch (error) {
    console.error('Get comment settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/settings/upload - 获取上传设置
settingsRoutes.get('/settings/upload', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const uploadSettings = await settingsModel.getUploadSettings();

    return c.json(uploadSettings);
  } catch (error) {
    console.error('Get upload settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /api/settings/seo - 获取SEO设置
settingsRoutes.get('/settings/seo', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const seoSettings = await settingsModel.getSEOSettings();

    return c.json(seoSettings);
  } catch (error) {
    console.error('Get SEO settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// PUT /api/settings/blog - 更新博客信息
settingsRoutes.put('/settings/blog', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const blogInfo = await settingsModel.updateBlogInfo(body);

    return c.json(blogInfo);
  } catch (error) {
    console.error('Update blog settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// PUT /api/settings/display - 更新显示设置
settingsRoutes.put('/settings/display', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const displaySettings = await settingsModel.updateDisplaySettings(body);

    return c.json(displaySettings);
  } catch (error) {
    console.error('Update display settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// PUT /api/settings/comments - 更新评论设置
settingsRoutes.put('/settings/comments', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const commentSettings = await settingsModel.updateCommentSettings(body);

    return c.json(commentSettings);
  } catch (error) {
    console.error('Update comment settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// PUT /api/settings/upload - 更新上传设置
settingsRoutes.put('/settings/upload', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const uploadSettings = await settingsModel.updateUploadSettings(body);

    return c.json(uploadSettings);
  } catch (error) {
    console.error('Update upload settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// PUT /api/settings/seo - 更新SEO设置
settingsRoutes.put('/settings/seo', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const seoSettings = await settingsModel.updateSEOSettings(body);

    return c.json(seoSettings);
  } catch (error) {
    console.error('Update SEO settings error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

export { settingsRoutes };
