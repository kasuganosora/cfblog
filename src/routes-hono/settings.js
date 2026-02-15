/**
 * Settings Routes - Hono Version
 */

import { Hono } from 'hono';
import { Settings } from '../models/Settings.js';
import { serverErrorResponse, requireAdmin } from './base.js';
import { getCachedSettings, refreshSettingsCache } from '../utils/cache.js';

const settingsRoutes = new Hono();

// GET / - 获取所有设置（优先从 R2 缓存读取）
settingsRoutes.get('/', async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settings = await getCachedSettings(bucket, db);
    return c.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /display - 获取显示设置
settingsRoutes.get('/display', async (c) => {
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /comments - 获取评论设置
settingsRoutes.get('/comments', async (c) => {
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /upload - 获取上传设置
settingsRoutes.get('/upload', async (c) => {
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /seo - 获取SEO设置
settingsRoutes.get('/seo', async (c) => {
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /blog - 更新博客信息（管理员）
settingsRoutes.put('/blog', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const blogInfo = await settingsModel.updateBlogInfo(body);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(blogInfo);
  } catch (error) {
    console.error('Update blog settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /display - 更新显示设置（管理员）
settingsRoutes.put('/display', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const displaySettings = await settingsModel.updateDisplaySettings(body);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(displaySettings);
  } catch (error) {
    console.error('Update display settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /comments - 更新评论设置（管理员）
settingsRoutes.put('/comments', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const commentSettings = await settingsModel.updateCommentSettings(body);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(commentSettings);
  } catch (error) {
    console.error('Update comment settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /upload - 更新上传设置（管理员）
settingsRoutes.put('/upload', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const uploadSettings = await settingsModel.updateUploadSettings(body);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(uploadSettings);
  } catch (error) {
    console.error('Update upload settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /seo - 更新SEO设置（管理员）
settingsRoutes.put('/seo', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const settingsModel = new Settings(db);
    const seoSettings = await settingsModel.updateSEOSettings(body);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(seoSettings);
  } catch (error) {
    console.error('Update SEO settings error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

export { settingsRoutes };
