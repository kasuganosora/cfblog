/**
 * Cache Utilities
 * KV cache operations
 */

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  POST: 'post',
  POST_LIST: 'post_list',
  CATEGORY: 'category',
  CATEGORY_TREE: 'category_tree',
  TAG: 'tag',
  TAG_LIST: 'tag_list',
  SETTINGS: 'settings',
  HTML: 'html'
};

/**
 * Get cache value
 */
export const getCache = async (kv, key) => {
  try {
    const value = await kv.get(key, 'json');
    return value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set cache value
 */
export const setCache = async (kv, key, value, ttl = 3600) => {
  try {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    });
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete cache value
 */
export const deleteCache = async (kv, key) => {
  try {
    await kv.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async (kv) => {
  try {
    const list = await kv.list();
    const keys = list.keys.map(k => k.name);

    for (const key of keys) {
      await kv.delete(key);
    }

    return true;
  } catch (error) {
    console.error('Clear cache error:', error);
    return false;
  }
};

/**
 * Clear cache by prefix
 */
export const clearCacheByPrefix = async (kv, prefix) => {
  try {
    const list = await kv.list({ prefix });
    const keys = list.keys.map(k => k.name);

    for (const key of keys) {
      await kv.delete(key);
    }

    return true;
  } catch (error) {
    console.error('Clear cache by prefix error:', error);
    return false;
  }
};

/**
 * Get or set cache (cache-aside pattern)
 */
export const getOrSetCache = async (kv, key, fn, ttl = 3600) => {
  const cached = await getCache(kv, key);

  if (cached !== null) {
    return cached;
  }

  const value = await fn();
  await setCache(kv, key, value, ttl);

  return value;
};

/**
 * R2-based settings cache
 * Stores all settings as a single JSON file in R2 for fast reads
 */
const SETTINGS_CACHE_KEY = 'cache/settings.json';

/**
 * Read settings from R2 cache, fallback to D1
 */
export const getCachedSettings = async (bucket, db) => {
  // Try R2 first
  if (bucket) {
    try {
      const obj = await bucket.get(SETTINGS_CACHE_KEY);
      if (obj) {
        return await obj.json();
      }
    } catch {}
  }
  // Fallback to D1
  if (db) {
    const { Settings } = await import('../models/Settings.js');
    const settingsModel = new Settings(db);
    const all = await settingsModel.getAllSettings();
    // Write back to R2 for next time
    if (bucket) {
      try {
        await bucket.put(SETTINGS_CACHE_KEY, JSON.stringify(all), {
          httpMetadata: { contentType: 'application/json' }
        });
      } catch {}
    }
    return all;
  }
  return {};
};

/**
 * Refresh settings cache in R2 (call after any settings update)
 */
export const refreshSettingsCache = async (bucket, db) => {
  if (!bucket || !db) return;
  try {
    const { Settings } = await import('../models/Settings.js');
    const settingsModel = new Settings(db);
    const all = await settingsModel.getAllSettings();
    await bucket.put(SETTINGS_CACHE_KEY, JSON.stringify(all), {
      httpMetadata: { contentType: 'application/json' }
    });
  } catch (e) {
    console.error('Refresh settings cache error:', e);
  }
};
