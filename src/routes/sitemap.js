import { SitemapService } from '../services/SitemapService.js';

// 处理 Sitemap 路由
export async function handleSitemapRoute(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  const env = request.env;
  const sitemapService = new SitemapService(env);
  
  try {
    // 主站点地图
    if (path === '/sitemap.xml') {
      const result = await sitemapService.generateSitemap();
      
      if (!result.success) {
        return new Response('生成站点地图失败', { status: 500 });
      }
      
      return new Response(result.sitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'max-age=3600', // 1小时缓存
        }
      });
    }
    
    // 站点地图索引
    if (path === '/sitemap-index.xml') {
      const result = await sitemapService.generateSitemapIndex();
      
      if (!result.success) {
        return new Response('生成站点地图索引失败', { status: 500 });
      }
      
      return new Response(result.sitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'max-age=3600', // 1小时缓存
        }
      });
    }
    
    // 文章站点地图
    if (path.startsWith('/sitemap-posts-') && path.endsWith('.xml')) {
      // 提取页码
      const match = path.match(/sitemap-posts-(\d+)\.xml$/);
      if (!match) {
        return new Response('无效的站点地图 URL', { status: 404 });
      }
      
      const page = parseInt(match[1]);
      const result = await sitemapService.generatePostsSitemap(page);
      
      if (!result.success) {
        return new Response('生成文章站点地图失败', { status: 500 });
      }
      
      return new Response(result.sitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'max-age=3600', // 1小时缓存
        }
      });
    }
    
    return new Response('未找到请求的资源', { status: 404 });
  } catch (err) {
    console.error('Sitemap error:', err);
    return new Response('服务器内部错误', { status: 500 });
  }
}