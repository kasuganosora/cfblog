import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

async function testEndpoint(path, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (!response) {
      return { success: false, error: '无法连接到服务器' };
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // 如果无法解析为JSON，尝试获取文本
      data = await response.text();
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('开始完整功能测试...\n');

  // 1. 测试前台页面
  console.log('=== 测试前台页面 ===');
  const homePage = await testEndpoint('/');
  console.log(`首页: ${homePage.success ? '✓' : '✗'} (状态码: ${homePage.status})`);

  const postsPage = await testEndpoint('/posts');
  console.log(`文章列表页: ${postsPage.success ? '✓' : '✗'} (状态码: ${postsPage.status})`);

  // 2. 测试后台管理页面
  console.log('\n=== 测试后台管理页面 ===');
  const adminPage = await testEndpoint('/admin');
  console.log(`后台管理页: ${adminPage.success ? '✓' : '✗'} (状态码: ${adminPage.status})`);

  const adminLoginPage = await testEndpoint('/admin/login');
  console.log(`后台登录页: ${adminLoginPage.success ? '✓' : '✗'} (状态码: ${adminLoginPage.status})`);

  // 3. 测试API接口
  console.log('\n=== 测试API接口 ===');
  const postsApi = await testEndpoint('/api/posts');
  console.log(`文章API: ${postsApi.success ? '✓' : '✗'} (状态码: ${postsApi.status})`);

  const categoriesApi = await testEndpoint('/api/categories');
  console.log(`分类API: ${categoriesApi.success ? '✓' : '✗'} (状态码: ${categoriesApi.status})`);

  const tagsApi = await testEndpoint('/api/tags');
  console.log(`标签API: ${tagsApi.success ? '✓' : '✗'} (状态码: ${tagsApi.status})`);

  const commentsApi = await testEndpoint('/api/comments');
  console.log(`评论API: ${commentsApi.success ? '✓' : '✗'} (状态码: ${commentsApi.status})`);

  // 4. 测试管理员登录
  console.log('\n=== 测试管理员登录 ===');
  const loginResult = await testEndpoint('/api/user/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (loginResult.success && loginResult.data.token) {
    console.log('管理员登录: ✓');
    const token = loginResult.data.token;
    
    // 5. 测试需要认证的API
    console.log('\n=== 测试需要认证的API ===');
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    
    const adminDashboard = await testEndpoint('/api/admin/dashboard', 'GET', null, authHeaders);
    console.log(`后台仪表盘API: ${adminDashboard.success ? '✓' : '✗'} (状态码: ${adminDashboard.status})`);
    
    const adminPosts = await testEndpoint('/api/admin/posts', 'GET', null, authHeaders);
    console.log(`后台文章管理API: ${adminPosts.success ? '✓' : '✗'} (状态码: ${adminPosts.status})`);
    
    const adminCategories = await testEndpoint('/api/admin/categories', 'GET', null, authHeaders);
    console.log(`后台分类管理API: ${adminCategories.success ? '✓' : '✗'} (状态码: ${adminCategories.status})`);
    
    // 6. 测试创建分类
    console.log('\n=== 测试创建分类 ===');
    const createCategory = await testEndpoint('/api/admin/category/create', 'POST', {
      name: '测试分类',
      slug: 'test-category',
      description: '这是一个测试分类'
    }, authHeaders);
    
    if (createCategory.success) {
      console.log('创建分类: ✓');
      const categoryId = createCategory.data.id;
      
      // 7. 测试创建标签
      console.log('\n=== 测试创建标签 ===');
      const createTag = await testEndpoint('/api/admin/tag/create', 'POST', {
        name: '测试标签',
        slug: 'test-tag'
      }, authHeaders);
      
      if (createTag.success) {
        console.log('创建标签: ✓');
        const tagId = createTag.data.id;
        
        // 8. 测试创建文章
        console.log('\n=== 测试创建文章 ===');
        const createPost = await testEndpoint('/api/post/create', 'POST', {
          title: '测试文章',
          content: '这是测试文章的内容',
          excerpt: '这是测试文章的摘要',
          status: 1,
          allowComment: true,
          categoryId,
          tags: [tagId]
        }, authHeaders);
        
        if (createPost.success) {
          console.log('创建文章: ✓');
          const postId = createPost.data.id;
          
          // 9. 测试发布文章
          console.log('\n=== 测试发布文章 ===');
          const publishPost = await testEndpoint(`/api/post/${postId}/update`, 'PUT', {
            status: 2 // 发布状态
          }, authHeaders);
          
          if (publishPost.success) {
            console.log('发布文章: ✓');
          } else {
            console.log(`发布文章: ✗ (状态码: ${publishPost.status})`);
            console.log('错误信息:', publishPost.data);
          }
        } else {
          console.log(`创建文章: ✗ (状态码: ${createPost.status})`);
          console.log('错误信息:', createPost.data);
        }
      } else {
        console.log(`创建标签: ✗ (状态码: ${createTag.status})`);
        console.log('错误信息:', createTag.data);
      }
    } else {
      console.log(`创建分类: ✗ (状态码: ${createCategory.status})`);
      console.log('错误信息:', createCategory.data);
    }
  } else {
    console.log('管理员登录: ✗');
    console.log('错误信息:', loginResult.data);
  }

  console.log('\n=== 测试完成 ===');
  console.log('如需查看详细信息，请访问:');
  console.log('- 前台: http://localhost:8787');
  console.log('- 后台: http://localhost:8787/admin');
  console.log('- 登录账号: admin / admin123');
}

runTests().catch(console.error);