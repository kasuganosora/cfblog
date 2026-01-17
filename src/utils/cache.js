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
