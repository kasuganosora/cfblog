/**
 * Settings Routes - Hono Version
 */

import { Hono } from 'hono';
import { Settings } from '../models/Settings.js';
import { serverErrorResponse, errorResponse, requireAdmin } from './base.js';
import { getCachedSettings, refreshSettingsCache, refreshPostListCache, refreshRSSCache, refreshSitemapCache } from '../utils/cache.js';

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

// GET /widgets - 获取侧栏挂件
settingsRoutes.get('/widgets', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const settingsModel = new Settings(db);
    const widgets = await settingsModel.getSidebarWidgets();
    return c.json(widgets);
  } catch (error) {
    console.error('Get widgets error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /widgets - 更新侧栏挂件（管理员）
settingsRoutes.put('/widgets', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();
    const widgets = Array.isArray(body) ? body : (body.widgets || []);
    const settingsModel = new Settings(db);
    const result = await settingsModel.updateSidebarWidgets(widgets);

    await refreshSettingsCache(c.env?.BUCKET, db);
    return c.json(result);
  } catch (error) {
    console.error('Update widgets error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// POST /cache/clear - 清除R2缓存（管理员）
settingsRoutes.post('/cache/clear', requireAdmin, async (c) => {
  try {
    const bucket = c.env?.BUCKET;
    if (!bucket) {
      return c.json(errorResponse('Storage not available').json(), 500);
    }

    const db = c.env?.DB;
    const body = await c.req.json();
    const target = body.target || 'all';
    const cleared = [];

    if (target === 'all' || target === 'settings') {
      if (db) {
        await refreshSettingsCache(bucket, db);
        cleared.push('settings');
      }
    }

    if (target === 'all' || target === 'posts') {
      if (db) {
        await refreshPostListCache(bucket, db);
        cleared.push('post_list');
      }
      // Clear individual post caches
      const list = await bucket.list({ prefix: 'cache/post/' });
      for (const obj of list.objects) {
        await bucket.delete(obj.key);
      }
      cleared.push('post_detail');
    }

    if (target === 'all' || target === 'rss') {
      if (db) {
        const siteUrl = new URL(c.req.url).origin;
        await refreshRSSCache(bucket, db, siteUrl);
        cleared.push('rss');
      }
    }

    if (target === 'all' || target === 'sitemap') {
      if (db) {
        const siteUrl = new URL(c.req.url).origin;
        await refreshSitemapCache(bucket, db, siteUrl);
        cleared.push('sitemap');
      }
    }

    return c.json({ success: true, message: 'Cache cleared', cleared });
  } catch (error) {
    console.error('Clear cache error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

// GET /cache/stats - 获取缓存状态（管理员）
settingsRoutes.get('/cache/stats', requireAdmin, async (c) => {
  try {
    const bucket = c.env?.BUCKET;
    if (!bucket) {
      return c.json(errorResponse('Storage not available').json(), 500);
    }

    const items = [];
    const prefixes = ['cache/'];
    for (const prefix of prefixes) {
      const list = await bucket.list({ prefix });
      for (const obj of list.objects) {
        items.push({ key: obj.key, size: obj.size, uploaded: obj.uploaded });
      }
    }

    return c.json({ success: true, data: items, total: items.length });
  } catch (error) {
    console.error('Cache stats error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { settingsRoutes };
