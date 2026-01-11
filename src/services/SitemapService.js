import { getCache, setCache } from '../utils/cache.js';

export class SitemapService {
  constructor(env) {
    this.env = env;
    this.cacheExpiry = 3600; // 1小时缓存
  }
  
  // 生成站点地图
  async generateSitemap() {
    try {
      // 检查缓存
      const cacheKey = 'sitemap:main';
      const cachedSitemap = await getCache(this.env, cacheKey);
      
      if (cachedSitemap.success && cachedSitemap.exists) {
        return {
          success: true,
          sitemap: cachedSitemap.data,
          fromCache: true
        };
      }
      
      // 获取网站 URL
      const siteUrl = await this.getSiteUrl();
      if (!siteUrl) {
        return { success: false, message: '未配置网站 URL' };
      }
      
      // 生成 XML
      const xml = await this.buildSitemapXml(siteUrl);
      
      // 缓存结果
      await setCache(this.env, cacheKey, xml, this.cacheExpiry);
      
      return {
        success: true,
        sitemap: xml,
        fromCache: false
      };
    } catch (error) {
      console.error('Generate sitemap error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 构建站点地图 XML
  async buildSitemapXml(siteUrl) {
    const now = new Date().toISOString();
    
    // 开始 XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // 添加首页
    xml += this.addUrlToXml(siteUrl, now, '1.0', 'daily');
    
    // 获取已发布的文章
    const posts = await this.getPublishedPosts();
    if (posts.success) {
      posts.data.forEach(post => {
        const postUrl = `${siteUrl}/post/${post.slug}`;
        const lastmod = post.updated_at || post.created_at || now;
        xml += this.addUrlToXml(postUrl, lastmod, '0.8', 'weekly');
      });
    }
    
    // 获取分类页面
    const categories = await this.getCategories();
    if (categories.success) {
      categories.data.forEach(category => {
        const categoryUrl = `${siteUrl}/category/${category.slug}`;
        const lastmod = category.updated_at || category.created_at || now;
        xml += this.addUrlToXml(categoryUrl, lastmod, '0.6', 'weekly');
      });
    }
    
    // 获取标签页面
    const tags = await this.getTags();
    if (tags.success) {
      tags.data.forEach(tag => {
        const tagUrl = `${siteUrl}/tag/${tag.slug}`;
        const lastmod = tag.updated_at || tag.created_at || now;
        xml += this.addUrlToXml(tagUrl, lastmod, '0.6', 'weekly');
      });
    }
    
    // 添加静态页面
    xml += this.addUrlToXml(`${siteUrl}/about`, now, '0.5', 'monthly');
    xml += this.addUrlToXml(`${siteUrl}/contact`, now, '0.5', 'monthly');
    
    // 结束 XML
    xml += `</urlset>`;
    
    return xml;
  }
  
  // 添加 URL 到 XML
  addUrlToXml(url, lastmod, priority, changefreq) {
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>\n`;
  }
  
  // 获取已发布的文章
  async getPublishedPosts() {
    try {
      const query = `
        SELECT id, slug, created_at, updated_at, published_at
        FROM posts
        WHERE status = 1
        ORDER BY published_at DESC
      `;
      
      const result = await this.env.DB.prepare(query).all();
      
      return {
        success: true,
        data: result.results || []
      };
    } catch (error) {
      console.error('Get published posts error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取分类
  async getCategories() {
    try {
      const query = `
        SELECT id, slug, created_at, updated_at
        FROM categories
        ORDER BY name ASC
      `;
      
      const result = await this.env.DB.prepare(query).all();
      
      return {
        success: true,
        data: result.results || []
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取标签
  async getTags() {
    try {
      const query = `
        SELECT id, slug, created_at, updated_at
        FROM tags
        ORDER BY name ASC
      `;
      
      const result = await this.env.DB.prepare(query).all();
      
      return {
        success: true,
        data: result.results || []
      };
    } catch (error) {
      console.error('Get tags error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取网站 URL
  async getSiteUrl() {
    try {
      const query = `SELECT value FROM settings WHERE key = 'site_url'`;
      const result = await this.env.DB.prepare(query).first();
      
      return result ? result.value : null;
    } catch (error) {
      console.error('Get site URL error:', error);
      return null;
    }
  }
  
  // 生成站点地图索引（如果有多个站点地图）
  async generateSitemapIndex() {
    try {
      // 检查缓存
      const cacheKey = 'sitemap:index';
      const cachedIndex = await getCache(this.env, cacheKey);
      
      if (cachedIndex.success && cachedIndex.exists) {
        return {
          success: true,
          sitemap: cachedIndex.data,
          fromCache: true
        };
      }
      
      // 获取网站 URL
      const siteUrl = await this.getSiteUrl();
      if (!siteUrl) {
        return { success: false, message: '未配置网站 URL' };
      }
      
      const now = new Date().toISOString();
      
      // 开始 XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // 添加主站点地图
      xml += `  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;
      
      // 添加文章站点地图（如果文章数量很多）
      const postsCount = await this.getPublishedPostsCount();
      if (postsCount.success && postsCount.count > 1000) {
        const totalPages = Math.ceil(postsCount.count / 1000);
        
        for (let i = 1; i <= totalPages; i++) {
          xml += `  <sitemap>
    <loc>${siteUrl}/sitemap-posts-${i}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`;
        }
      }
      
      // 结束 XML
      xml += `</sitemapindex>`;
      
      // 缓存结果
      await setCache(this.env, cacheKey, xml, this.cacheExpiry);
      
      return {
        success: true,
        sitemap: xml,
        fromCache: false
      };
    } catch (error) {
      console.error('Generate sitemap index error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 生成文章站点地图
  async generatePostsSitemap(page = 1, limit = 1000) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT id, slug, created_at, updated_at, published_at
        FROM posts
        WHERE status = 1
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const result = await this.env.DB.prepare(query).bind(limit, offset).all();
      const posts = result.results || [];
      
      if (posts.length === 0) {
        return { success: false, message: '没有找到文章' };
      }
      
      const siteUrl = await this.getSiteUrl();
      if (!siteUrl) {
        return { success: false, message: '未配置网站 URL' };
      }
      
      // 开始 XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // 添加文章 URL
      posts.forEach(post => {
        const postUrl = `${siteUrl}/post/${post.slug}`;
        const lastmod = post.updated_at || post.created_at || post.published_at;
        xml += this.addUrlToXml(postUrl, lastmod, '0.8', 'weekly');
      });
      
      // 结束 XML
      xml += `</urlset>`;
      
      return {
        success: true,
        sitemap: xml
      };
    } catch (error) {
      console.error('Generate posts sitemap error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取已发布文章数量
  async getPublishedPostsCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM posts WHERE status = 1`;
      const result = await this.env.DB.prepare(query).first();
      
      return {
        success: true,
        count: result ? result.count : 0
      };
    } catch (error) {
      console.error('Get published posts count error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 清除站点地图缓存
  async clearCache() {
    try {
      await this.env.CACHE.delete('sitemap:main');
      await this.env.CACHE.delete('sitemap:index');
      
      return { success: true, message: '站点地图缓存已清除' };
    } catch (error) {
      console.error('Clear sitemap cache error:', error);
      return { success: false, error: error.message };
    }
  }
}