/**
 * Cache Admin Routes
 * Handles cache management
 */

import { Router } from 'itty-router';
import { clearAllCache, clearCacheByPrefix, CACHE_KEYS } from '../utils/cache.js';
import {
  successResponse,
  serverErrorResponse
} from '../utils/response.js';

const cacheRouter = Router();

// Middleware to get KV instance
const withKV = async (request, fn) => {
  try {
    const kv = request.env?.BLOG;
    if (!kv) {
      return serverErrorResponse('KV cache not available');
    }
    return fn(kv);
  } catch (error) {
    console.error('Cache route error:', error);
    return serverErrorResponse(error.message);
  }
};

// DELETE /admin/api/cache/all - Clear all cache
cacheRouter.delete('/all', async (request) => {
  return withKV(request, async (kv) => {
    try {
      await clearAllCache(kv);
      return successResponse(null, 'All cache cleared successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /admin/api/cache/posts - Clear posts cache
cacheRouter.delete('/posts', async (request) => {
  return withKV(request, async (kv) => {
    try {
      await clearCacheByPrefix(kv, CACHE_KEYS.POST);
      return successResponse(null, 'Posts cache cleared successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /admin/api/cache/categories - Clear categories cache
cacheRouter.delete('/categories', async (request) => {
  return withKV(request, async (kv) => {
    try {
      await clearCacheByPrefix(kv, CACHE_KEYS.CATEGORY);
      return successResponse(null, 'Categories cache cleared successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /admin/api/cache/tags - Clear tags cache
cacheRouter.delete('/tags', async (request) => {
  return withKV(request, async (kv) => {
    try {
      await clearCacheByPrefix(kv, CACHE_KEYS.TAG);
      return successResponse(null, 'Tags cache cleared successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// DELETE /admin/api/cache/html - Clear HTML cache
cacheRouter.delete('/html', async (request) => {
  return withKV(request, async (kv) => {
    try {
      await clearCacheByPrefix(kv, CACHE_KEYS.HTML);
      return successResponse(null, 'HTML cache cleared successfully');
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

export { cacheRouter as cacheAdminRoutes };
