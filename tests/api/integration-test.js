/**
 * Backend API Integration Test
 * 测试所有后台API接口
 */

const API_BASE = 'http://localhost:8787';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 测试结果
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// 辅助函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✓ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`✗ ${testName}: ${message}`, 'red');
  }
}

async function testEndpoint(method, endpoint, data = null, testName) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== POST API Tests ====================
async function testPostAPI() {
  log('\n=== Testing Post API ===', 'cyan');

  // 1. 获取文章列表
  const listResult = await testEndpoint('GET', '/api/post/list');
  logTest(
    'GET /api/post/list',
    listResult.success && listResult.data.success,
    listResult.error || listResult.data?.message
  );

  // 2. 获取指定ID文章
  const byIdResult = await testEndpoint('GET', '/api/post/1');
  logTest(
    'GET /api/post/1',
    byIdResult.success && byIdResult.data.success,
    byIdResult.error || byIdResult.data?.message
  );

  // 3. 根据slug获取文章
  const bySlugResult = await testEndpoint('GET', '/api/post/slug/test-post');
  logTest(
    'GET /api/post/slug/:slug',
    bySlugResult.success,
    bySlugResult.error || bySlugResult.data?.message
  );

  // 4. 创建文章 (需要auth)
  const createResult = await testEndpoint('POST', '/api/post/create', {
    title: '测试文章',
    slug: 'test-post-api',
    content: '这是测试内容',
    excerpt: '测试摘要',
    status: 1,
    author_id: 1
  });
  logTest(
    'POST /api/post/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 5. 更新文章
  const updateResult = await testEndpoint('PUT', '/api/post/1/update', {
    title: '更新后的标题'
  });
  logTest(
    'PUT /api/post/1/update',
    updateResult.success || updateResult.status === 400,
    updateResult.error || updateResult.data?.message
  );

  // 6. 搜索文章
  const searchResult = await testEndpoint('GET', '/api/post/search?keyword=test&page=1&limit=10');
  logTest(
    'GET /api/post/search',
    searchResult.success || searchResult.status === 400,
    searchResult.error || searchResult.data?.message
  );
}

// ==================== User API Tests ====================
async function testUserAPI() {
  log('\n=== Testing User API ===', 'cyan');

  // 1. 用户登录
  const loginResult = await testEndpoint('POST', '/api/user/login', {
    username: 'admin',
    password: 'admin123'
  });
  logTest(
    'POST /api/user/login',
    loginResult.success || loginResult.status === 401,
    loginResult.error || loginResult.data?.message
  );

  // 2. 获取当前用户信息 (未登录)
  const meResult = await testEndpoint('GET', '/api/user/me');
  logTest(
    'GET /api/user/me (unauthenticated)',
    meResult.status === 401 || meResult.status === 200,
    meResult.error || meResult.data?.message
  );

  // 3. 获取用户列表
  const userListResult = await testEndpoint('GET', '/api/user/list?page=1&limit=10');
  logTest(
    'GET /api/user/list',
    userListResult.success,
    userListResult.error || userListResult.data?.message
  );

  // 4. 创建用户
  const createResult = await testEndpoint('POST', '/api/user/create', {
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123',
    role: 'user'
  });
  logTest(
    'POST /api/user/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 5. 更新用户状态
  const statusResult = await testEndpoint('PUT', '/api/user/1/status', {
    status: 1
  });
  logTest(
    'PUT /api/user/1/status',
    statusResult.success || statusResult.status === 400,
    statusResult.error || statusResult.data?.message
  );

  // 6. 更新用户角色
  const roleResult = await testEndpoint('PUT', '/api/user/1/role', {
    role: 'admin'
  });
  logTest(
    'PUT /api/user/1/role',
    roleResult.success || roleResult.status === 400,
    roleResult.error || roleResult.data?.message
  );
}

// ==================== Category API Tests ====================
async function testCategoryAPI() {
  log('\n=== Testing Category API ===', 'cyan');

  // 1. 获取分类列表
  const listResult = await testEndpoint('GET', '/api/category/list');
  logTest(
    'GET /api/category/list',
    listResult.success,
    listResult.error || listResult.data?.message
  );

  // 2. 获取分类树
  const treeResult = await testEndpoint('GET', '/api/category/tree');
  logTest(
    'GET /api/category/tree',
    treeResult.success,
    treeResult.error || treeResult.data?.message
  );

  // 3. 获取指定分类
  const byIdResult = await testEndpoint('GET', '/api/category/1');
  logTest(
    'GET /api/category/1',
    byIdResult.success,
    byIdResult.error || byIdResult.data?.message
  );

  // 4. 创建分类
  const createResult = await testEndpoint('POST', '/api/category/create', {
    name: '测试分类',
    slug: 'test-category',
    description: '测试描述'
  });
  logTest(
    'POST /api/category/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 5. 更新分类
  const updateResult = await testEndpoint('PUT', '/api/category/1/update', {
    name: '更新后的分类'
  });
  logTest(
    'PUT /api/category/1/update',
    updateResult.success || updateResult.status === 400,
    updateResult.error || updateResult.data?.message
  );
}

// ==================== Tag API Tests ====================
async function testTagAPI() {
  log('\n=== Testing Tag API ===', 'cyan');

  // 1. 获取标签列表
  const listResult = await testEndpoint('GET', '/api/tag/list');
  logTest(
    'GET /api/tag/list',
    listResult.success,
    listResult.error || listResult.data?.message
  );

  // 2. 获取热门标签
  const popularResult = await testEndpoint('GET', '/api/tag/popular?limit=10');
  logTest(
    'GET /api/tag/popular',
    popularResult.success,
    popularResult.error || popularResult.data?.message
  );

  // 3. 获取指定标签
  const byIdResult = await testEndpoint('GET', '/api/tag/1');
  logTest(
    'GET /api/tag/1',
    byIdResult.success,
    byIdResult.error || byIdResult.data?.message
  );

  // 4. 创建标签
  const createResult = await testEndpoint('POST', '/api/tag/create', {
    name: '测试标签',
    slug: 'test-tag'
  });
  logTest(
    'POST /api/tag/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 5. 更新标签
  const updateResult = await testEndpoint('PUT', '/api/tag/1/update', {
    name: '更新后的标签'
  });
  logTest(
    'PUT /api/tag/1/update',
    updateResult.success || updateResult.status === 400,
    updateResult.error || updateResult.data?.message
  );
}

// ==================== Comment API Tests ====================
async function testCommentAPI() {
  log('\n=== Testing Comment API ===', 'cyan');

  // 1. 创建评论
  const createResult = await testEndpoint('POST', '/api/comment/create', {
    post_id: 1,
    author_name: '测试用户',
    author_email: 'test@example.com',
    content: '这是一条测试评论'
  });
  logTest(
    'POST /api/comment/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 2. 获取文章评论
  const listResult = await testEndpoint('GET', '/api/comment/post/1?page=1&limit=10');
  logTest(
    'GET /api/comment/post/1',
    listResult.success,
    listResult.error || listResult.data?.message
  );

  // 3. 获取指定评论
  const byIdResult = await testEndpoint('GET', '/api/comment/1');
  logTest(
    'GET /api/comment/1',
    byIdResult.success,
    byIdResult.error || byIdResult.data?.message
  );
}

// ==================== Feedback API Tests ====================
async function testFeedbackAPI() {
  log('\n=== Testing Feedback API ===', 'cyan');

  // 1. 提交反馈
  const createResult = await testEndpoint('POST', '/api/feedback/create', {
    name: '访客',
    email: 'visitor@example.com',
    content: '这是一条反馈内容'
  });
  logTest(
    'POST /api/feedback/create',
    createResult.success || createResult.status === 400,
    createResult.error || createResult.data?.message
  );

  // 2. 获取反馈列表
  const listResult = await testEndpoint('GET', '/api/feedback/list?page=1&limit=10');
  logTest(
    'GET /api/feedback/list',
    listResult.success,
    listResult.error || listResult.data?.message
  );

  // 3. 获取指定反馈
  const byIdResult = await testEndpoint('GET', '/api/feedback/1');
  logTest(
    'GET /api/feedback/1',
    byIdResult.success || byIdResult.status === 404,
    byIdResult.error || byIdResult.data?.message
  );
}

// ==================== Search API Tests ====================
async function testSearchAPI() {
  log('\n=== Testing Search API ===', 'cyan');

  // 1. 全局搜索
  const searchAllResult = await testEndpoint('GET', '/api/search?keyword=test&type=all&page=1&limit=10');
  logTest(
    'GET /api/search (all)',
    searchAllResult.success || searchAllResult.status === 400,
    searchAllResult.error || searchAllResult.data?.message
  );

  // 2. 搜索文章
  const searchPostsResult = await testEndpoint('GET', '/api/search?keyword=test&type=posts');
  logTest(
    'GET /api/search (posts)',
    searchPostsResult.success || searchPostsResult.status === 400,
    searchPostsResult.error || searchPostsResult.data?.message
  );

  // 3. 搜索分类
  const searchCategoriesResult = await testEndpoint('GET', '/api/search?keyword=test&type=categories');
  logTest(
    'GET /api/search (categories)',
    searchCategoriesResult.success || searchCategoriesResult.status === 400,
    searchCategoriesResult.error || searchCategoriesResult.data?.message
  );

  // 4. 搜索标签
  const searchTagsResult = await testEndpoint('GET', '/api/search?keyword=test&type=tags');
  logTest(
    'GET /api/search (tags)',
    searchTagsResult.success || searchTagsResult.status === 400,
    searchTagsResult.error || searchTagsResult.data?.message
  );
}

// ==================== Settings API Tests ====================
async function testSettingsAPI() {
  log('\n=== Testing Settings API ===', 'cyan');

  // 1. 获取所有设置
  const allResult = await testEndpoint('GET', '/api/settings');
  logTest(
    'GET /api/settings',
    allResult.success,
    allResult.error || allResult.data?.message
  );

  // 2. 获取博客信息
  const blogResult = await testEndpoint('GET', '/api/settings/blog');
  logTest(
    'GET /api/settings/blog',
    blogResult.success,
    blogResult.error || blogResult.data?.message
  );

  // 3. 获取显示设置
  const displayResult = await testEndpoint('GET', '/api/settings/display');
  logTest(
    'GET /api/settings/display',
    displayResult.success,
    displayResult.error || displayResult.data?.message
  );

  // 4. 获取评论设置
  const commentsResult = await testEndpoint('GET', '/api/settings/comments');
  logTest(
    'GET /api/settings/comments',
    commentsResult.success,
    commentsResult.error || commentsResult.data?.message
  );

  // 5. 获取上传设置
  const uploadResult = await testEndpoint('GET', '/api/settings/upload');
  logTest(
    'GET /api/settings/upload',
    uploadResult.success,
    uploadResult.error || uploadResult.data?.message
  );

  // 6. 获取SEO设置
  const seoResult = await testEndpoint('GET', '/api/settings/seo');
  logTest(
    'GET /api/settings/seo',
    seoResult.success,
    seoResult.error || seoResult.data?.message
  );

  // 7. 更新博客信息
  const updateBlogResult = await testEndpoint('PUT', '/api/settings/blog', {
    title: '测试博客',
    description: '测试描述'
  });
  logTest(
    'PUT /api/settings/blog',
    updateBlogResult.success,
    updateBlogResult.error || updateBlogResult.data?.message
  );

  // 8. 更新显示设置
  const updateDisplayResult = await testEndpoint('PUT', '/api/settings/display', {
    postsPerPage: 10
  });
  logTest(
    'PUT /api/settings/display',
    updateDisplayResult.success,
    updateDisplayResult.error || updateDisplayResult.data?.message
  );
}

// ==================== Health Check ====================
async function testHealthCheck() {
  log('\n=== Testing Health Check ===', 'cyan');

  const result = await testEndpoint('GET', '/health');
  logTest(
    'GET /health',
    result.success && result.data.success,
    result.error || result.data?.message
  );
}

// ==================== Main Test Runner ====================
async function runAllTests() {
  log('\n' + '='.repeat(50), 'cyan');
  log('CFBlog Backend API Integration Tests', 'cyan');
  log('='.repeat(50), 'cyan');

  // Check if server is running
  log('\nChecking if server is running...', 'yellow');
  const healthCheck = await fetch(`${API_BASE}/health`).catch(() => null);

  if (!healthCheck) {
    log('\n❌ Server is not running! Please start the server first:', 'red');
    log('   npm run dev', 'yellow');
    log('   Or:', 'yellow');
    log('   npx wrangler dev --local --port 8787', 'yellow');
    process.exit(1);
  }

  log('✓ Server is running\n', 'green');

  try {
    // Run all tests
    await testHealthCheck();
    await testPostAPI();
    await testUserAPI();
    await testCategoryAPI();
    await testTagAPI();
    await testCommentAPI();
    await testFeedbackAPI();
    await testSearchAPI();
    await testSettingsAPI();

    // Print summary
    log('\n' + '='.repeat(50), 'cyan');
    log('Test Summary', 'cyan');
    log('='.repeat(50), 'cyan');
    log(`Total Tests: ${testResults.total}`, 'blue');
    log(`Passed: ${testResults.passed}`, 'green');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'blue');
    log('='.repeat(50) + '\n', 'cyan');

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Test suite failed with error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
