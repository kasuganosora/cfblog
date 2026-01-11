// 简单的本地测试脚本
// 用于测试基本的功能是否正确实现

// 导入要测试的模块
import { handleUserRoutes } from './src/routes/user.js';
import { handlePostRoutes } from './src/routes/post.js';
import { handleCategoryRoutes } from './src/routes/category.js';

// 模拟请求对象
function createMockRequest(url, method = 'GET', body = null, headers = {}) {
  // 添加协议以避免 Invalid URL 错误
  const fullUrl = url.startsWith('http') ? url : `https://example.com${url}`;
  return {
    url: fullUrl,
    method,
    headers,
    json: async () => body ? JSON.parse(body) : null,
    text: async () => body || null
  };
}

// 模拟环境变量
const mockEnv = {
  DB: {
    prepare: (query) => ({
      bind: (...params) => ({
        all: () => Promise.resolve({
          results: [],
          success: true
        }),
        first: () => Promise.resolve({
          results: null,
          success: true
        }),
        run: () => Promise.resolve({
          success: true,
          meta: {
            last_row_id: 1,
            changes: 1
          }
        })
      }),
      all: () => Promise.resolve({
        results: [],
        success: true
      }),
      first: () => Promise.resolve({
        results: null,
        success: true
      }),
      run: () => Promise.resolve({
        success: true,
        meta: {
          last_row_id: 1,
          changes: 1
        }
      })
    })
  },
  BLOG_STORAGE: {
    head: () => Promise.resolve({}),
    get: () => Promise.resolve({}),
    put: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  CACHE: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve()
  },
  JWT_SECRET: 'test-jwt-secret'
};

// 测试函数
async function testRoute(routeHandler, url, method = 'GET', body = null) {
  const request = createMockRequest(url, method, body);
  // 将 env 附加到请求对象上
  request.env = mockEnv;
  
  try {
    const response = await routeHandler(request, mockEnv, {});
    return response;
  } catch (error) {
    console.error(`测试失败: ${url} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runSimpleTests() {
  console.log('开始简单的本地测试...\n');
  
  // 测试用户路由
  console.log('=== 测试用户路由 ===');
  const loginResponse = await testRoute(handleUserRoutes, '/api/user/login', 'POST', JSON.stringify({
    username: 'admin',
    password: 'admin123'
  }));
  
  console.log('登录路由状态:', loginResponse.status || '无响应');
  
  const meResponse = await testRoute(handleUserRoutes, '/api/user/me');
  console.log('获取用户信息路由状态:', meResponse.status || '无响应');
  
  // 测试文章路由
  console.log('\n=== 测试文章路由 ===');
  const postsResponse = await testRoute(handlePostRoutes, '/api/post/list');
  console.log('文章列表路由状态:', postsResponse.status || '无响应');
  
  // 测试分类路由
  console.log('\n=== 测试分类路由 ===');
  const categoriesResponse = await testRoute(handleCategoryRoutes, '/api/category/list');
  console.log('分类列表路由状态:', categoriesResponse.status || '无响应');
  
  console.log('\n=== 基本路由测试完成 ===');
  console.log('注意：这只是基本的路由导入测试，不包括完整的业务逻辑测试。');
  console.log('要完整测试功能，请先运行 `wrangler dev` 启动开发服务器，然后运行 `npm test`。');
}

// 运行测试
runSimpleTests().catch(error => {
  console.error('测试运行失败:', error);
});