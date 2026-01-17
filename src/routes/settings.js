/**
 * Settings Routes
 * Handles system settings management
 */

import { Router } from 'itty-router';
import { Settings } from '../models/Settings.js';
import {
  successResponse,
  errorResponse,
  serverErrorResponse
} from '../utils/response.js';

const settingsRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Settings(db));
  } catch (error) {
    console.error('Settings route error:', error);
    return serverErrorResponse(error.message);
  }
};

// GET /api/settings - Get all settings
settingsRouter.get('/', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const settings = await settingsModel.getAllSettings();
      return successResponse(settings);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/settings/blog - Get blog info
settingsRouter.get('/blog', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const blogInfo = await settingsModel.getBlogInfo();
      return successResponse(blogInfo);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/settings/display - Get display settings
settingsRouter.get('/display', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const displaySettings = await settingsModel.getDisplaySettings();
      return successResponse(displaySettings);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/settings/comments - Get comment settings
settingsRouter.get('/comments', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const commentSettings = await settingsModel.getCommentSettings();
      return successResponse(commentSettings);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/settings/upload - Get upload settings
settingsRouter.get('/upload', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const uploadSettings = await settingsModel.getUploadSettings();
      return successResponse(uploadSettings);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/settings/seo - Get SEO settings
settingsRouter.get('/seo', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const seoSettings = await settingsModel.getSEOSettings();
      return successResponse(seoSettings);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/settings/blog - Update blog info
settingsRouter.put('/blog', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const body = await request.json();

      const blogInfo = await settingsModel.updateBlogInfo(body);
      return successResponse(blogInfo, 'Blog info updated successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/settings/display - Update display settings
settingsRouter.put('/display', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const body = await request.json();

      const displaySettings = await settingsModel.updateDisplaySettings(body);
      return successResponse(displaySettings, 'Display settings updated successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/settings/comments - Update comment settings
settingsRouter.put('/comments', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const body = await request.json();

      const commentSettings = await settingsModel.updateCommentSettings(body);
      return successResponse(commentSettings, 'Comment settings updated successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/settings/upload - Update upload settings
settingsRouter.put('/upload', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const body = await request.json();

      const uploadSettings = await settingsModel.updateUploadSettings(body);
      return successResponse(uploadSettings, 'Upload settings updated successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/settings/seo - Update SEO settings
settingsRouter.put('/seo', async (request) => {
  return withDB(request, async (settingsModel) => {
    try {
      const body = await request.json();

      const seoSettings = await settingsModel.updateSEOSettings(body);
      return successResponse(seoSettings, 'SEO settings updated successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

export { settingsRouter as settingsRoutes };
