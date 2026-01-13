import { Router } from 'itty-router';
// 强制刷新缓存 - 2024-01-13
import { addCorsHeaders, handleOptionsRequest } from './middleware/cors.js';
import { handleUserRoutes } from './routes/user.js';
import { handlePostRoutes } from './routes/post.js';
import { handleCommentRoutes } from './routes/comment.js';
import { handleCategoryRoutes } from './routes/category.js';
import { handleTagRoutes } from './routes/tag.js';
import { handleSearchRoutes } from './routes/search.js';
import { handleFeedbackRoutes } from './routes/feedback.js';
import { handleSitemapRoute } from './routes/sitemap.js';
import { handleUploadRoutes } from './routes/upload.js';
import { handleFrontendRoutes } from './routes/frontend.js';
import { handleAdminRoutes } from './routes/admin.js';

// 创建路由器
const router = Router();

// 处理 OPTIONS 请求（预检请求）
router.all('*', async (request) => {
  if (request.method === 'OPTIONS') {
    return handleOptionsRequest();
  }
  return null; // 继续处理其他请求
});

// API 路由
router.all('/api/user/*', handleUserRoutes);
router.all('/api/post/*', handlePostRoutes);
router.all('/api/comment/*', handleCommentRoutes);
router.all('/api/category/*', handleCategoryRoutes);
router.all('/api/tag/*', handleTagRoutes);
router.all('/api/search/*', handleSearchRoutes);
router.all('/api/feedback/*', handleFeedbackRoutes);
router.get('/sitemap.xml', handleSitemapRoute);
router.all('/api/upload/*', handleUploadRoutes);

// 管理后台路由（认证逻辑在 handleAdminRoutes 内部处理）
router.all('/admin/*', handleAdminRoutes);

// 前台展示路由
router.get('/*', handleFrontendRoutes);

// 404 处理
router.all('*', () => new Response('Not Found', { status: 404 }));

// 导出 fetch 处理器
export default {
  async fetch(request, env, ctx) {
    // 将 env 对象添加到请求上下文中，方便在其他地方使用
    request.env = env;

    const response = await router.handle(request, env, ctx);

    // 为所有响应添加 CORS 头
    return addCorsHeaders(response);
  }
};