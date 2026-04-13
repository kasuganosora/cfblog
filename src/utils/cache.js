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
    let cursor;
    let list;
    do {
      list = await kv.list({ cursor });
      const keys = list.keys.map(k => k.name);
      for (const key of keys) {
        await kv.delete(key);
      }
      cursor = list.cursor;
    } while (!list.list_complete);

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
    let cursor;
    let list;
    do {
      list = await kv.list({ prefix, cursor });
      const keys = list.keys.map(k => k.name);
      for (const key of keys) {
        await kv.delete(key);
      }
      cursor = list.cursor;
    } while (!list.list_complete);

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
    } catch { /* empty */ }
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
      } catch { /* empty */ }
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

// ============================================================
// R2-based post caches
// ============================================================

const POSTS_DEFAULT_KEY = 'cache/posts-default.json';
const RSS_CACHE_KEY = 'cache/rss.xml';
const SITEMAP_CACHE_KEY = 'cache/sitemap.xml';
const POST_CACHE_PREFIX = 'cache/post/';

/**
 * Refresh default post list cache (published, page 1, limit 10)
 */
export const refreshPostListCache = async (bucket, db) => {
  if (!bucket || !db) return;
  try {
    const { Post } = await import('../models/Post.js');
    const postModel = new Post(db);
    const result = await postModel.getPostList({ page: 1, limit: 10, status: 1 });
    await bucket.put(POSTS_DEFAULT_KEY, JSON.stringify(result), {
      httpMetadata: { contentType: 'application/json' }
    });
  } catch (e) {
    console.error('Refresh post list cache error:', e);
  }
};

/**
 * Get cached default post list from R2
 */
export const getCachedPostList = async (bucket) => {
  if (!bucket) return null;
  try {
    const obj = await bucket.get(POSTS_DEFAULT_KEY);
    if (obj) return await obj.json();
  } catch { /* empty */ }
  return null;
};

/**
 * Cache a single published post by slug
 */
export const cachePost = async (bucket, slug, postData) => {
  if (!bucket || !slug) return;
  try {
    await bucket.put(POST_CACHE_PREFIX + slug + '.json', JSON.stringify(postData), {
      httpMetadata: { contentType: 'application/json' }
    });
  } catch (e) {
    console.error('Cache post error:', e);
  }
};

/**
 * Get cached post by slug
 */
export const getCachedPost = async (bucket, slug) => {
  if (!bucket || !slug) return null;
  try {
    const obj = await bucket.get(POST_CACHE_PREFIX + slug + '.json');
    if (obj) return await obj.json();
  } catch { /* empty */ }
  return null;
};

/**
 * Delete cached post by slug
 */
export const deleteCachedPost = async (bucket, slug) => {
  if (!bucket || !slug) return;
  try {
    await bucket.delete(POST_CACHE_PREFIX + slug + '.json');
  } catch { /* empty */ }
};

/**
 * Refresh RSS feed cache
 */
export const refreshRSSCache = async (bucket, db, siteUrl) => {
  if (!bucket || !db) return;
  try {
    const { Post } = await import('../models/Post.js');
    const { Settings } = await import('../models/Settings.js');
    const settingsModel = new Settings(db);
    const postModel = new Post(db);

    const settings = await settingsModel.getAllSettings();
    const blogTitle = settings.blog_title || 'CFBlog';
    const blogDesc = settings.blog_description || '';
    const url = siteUrl || '';

    const result = await postModel.getPostList({ page: 1, limit: 20, status: 1 });
    const posts = result.data || [];

    const escXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const toRFC822 = (d) => new Date(d).toUTCString();

    const items = posts.map(p => `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(url)}/post/${escXml(p.slug)}</link>
      <description>${escXml(p.excerpt || '')}</description>
      <pubDate>${toRFC822(p.published_at || p.created_at)}</pubDate>
      <guid isPermaLink="true">${escXml(url)}/post/${escXml(p.slug)}</guid>
    </item>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(blogTitle)}</title>
    <link>${escXml(url)}</link>
    <description>${escXml(blogDesc)}</description>
    <language>zh-CN</language>
    <atom:link href="${escXml(url)}/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    await bucket.put(RSS_CACHE_KEY, xml, {
      httpMetadata: { contentType: 'application/xml; charset=utf-8' }
    });
  } catch (e) {
    console.error('Refresh RSS cache error:', e);
  }
};

/**
 * Get cached RSS XML
 */
export const getCachedRSS = async (bucket) => {
  if (!bucket) return null;
  try {
    const obj = await bucket.get(RSS_CACHE_KEY);
    if (obj) return await obj.text();
  } catch { /* empty */ }
  return null;
};

/**
 * Refresh sitemap cache
 */
export const refreshSitemapCache = async (bucket, db, siteUrl) => {
  if (!bucket || !db) return;
  try {
    const { Post } = await import('../models/Post.js');
    const postModel = new Post(db);

    const url = siteUrl || '';
    const now = new Date().toISOString().split('T')[0];

    const result = await postModel.getPostList({ page: 1, limit: 5000, status: 1 });
    const posts = result.data || [];

    const escXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let urls = '';
    // Static pages
    urls += `  <url>\n    <loc>${escXml(url)}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    urls += `  <url>\n    <loc>${escXml(url)}/categories</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    urls += `  <url>\n    <loc>${escXml(url)}/tags</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;

    // Post pages
    for (const p of posts) {
      const lastmod = (p.updated_at || p.published_at || p.created_at || '').split('T')[0] || now;
      urls += `  <url>\n    <loc>${escXml(url)}/post/${escXml(p.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>`;

    await bucket.put(SITEMAP_CACHE_KEY, xml, {
      httpMetadata: { contentType: 'application/xml; charset=utf-8' }
    });
  } catch (e) {
    console.error('Refresh sitemap cache error:', e);
  }
};

/**
 * Get cached sitemap XML
 */
export const getCachedSitemap = async (bucket) => {
  if (!bucket) return null;
  try {
    const obj = await bucket.get(SITEMAP_CACHE_KEY);
    if (obj) return await obj.text();
  } catch { /* empty */ }
  return null;
};

/**
 * Refresh post list, RSS, and sitemap caches (call after publish/update/delete)
 */
export const refreshAllPostCaches = async (bucket, db, siteUrl) => {
  await Promise.all([
    refreshPostListCache(bucket, db),
    refreshRSSCache(bucket, db, siteUrl),
    refreshSitemapCache(bucket, db, siteUrl),
  ]);
};

// ============================================================
// Hexo-compatible markdown export
// ============================================================

const HEXO_POSTS_PREFIX = 'source/_posts/';

/**
 * Escape and quote a YAML scalar value for safe inclusion in frontmatter.
 * Values containing newlines, colons, hashes, brackets, or other special YAML
 * characters are wrapped in double quotes with proper escaping.
 */
function escYaml(s) {
  if (!s) return '""';
  const str = String(s);
  // Escape characters that need escaping inside double-quoted YAML strings
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  // Wrap in double quotes if value contains special YAML characters,
  // is empty, matches a reserved word, or starts with a digit/minus
  if (/[:#{}[\],&*?|>!%@`'"\n\r]/.test(str) || str === '' || str === 'true' || str === 'false' || /^-?\d/.test(str)) {
    return '"' + escaped + '"';
  }
  return escaped;
}

/**
 * Convert post data to Hexo-compatible markdown with frontmatter
 */
function postToHexoMd(post) {
  const fm = [
    '---',
    `title: ${escYaml(post.title)}`,
    `date: ${post.published_at || post.created_at}`,
    `updated: ${post.updated_at || post.created_at}`,
  ];
  if (post.tags?.length) {
    fm.push('tags:');
    post.tags.forEach(t => fm.push("  - " + escYaml(t.name)));
  }
  if (post.categories?.length) {
    fm.push('categories:');
    post.categories.forEach(c => fm.push("  - " + escYaml(c.name)));
  }
  if (post.excerpt) fm.push(`excerpt: ${escYaml(post.excerpt)}`);
  fm.push('---', '');

  // Replace API upload paths with Hexo-compatible paths
  const content = (post.content || '')
    .replace(/\/api\/upload\/file\/images\//g, '/images/');

  return fm.join('\n') + content;
}

/**
 * Save published post as Hexo-compatible markdown in R2
 */
export const savePostAsHexoMd = async (bucket, post) => {
  if (!bucket || !post?.slug) return;
  try {
    const md = postToHexoMd(post);
    await bucket.put(HEXO_POSTS_PREFIX + post.slug + '.md', md, {
      httpMetadata: { contentType: 'text/markdown; charset=utf-8' }
    });
  } catch (e) {
    console.error('Save Hexo md error:', e);
  }
};

/**
 * Delete Hexo markdown file from R2
 */
export const deleteHexoMd = async (bucket, slug) => {
  if (!bucket || !slug) return;
  try {
    await bucket.delete(HEXO_POSTS_PREFIX + slug + '.md');
  } catch { /* empty */ }
};
