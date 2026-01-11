// 简单的 API 测试脚本
// 这个脚本可以用于测试博客系统的各个 API 端点

// 测试配置
const API_BASE_URL = 'http://localhost:8787'; // 本地开发服务器地址
const USERNAME = 'admin';
const PASSWORD = 'admin123'; // 默认管理员密码

// 存储认证令牌
let authToken = '';

// 测试用户登录
async function testUserLogin() {
  console.log('\n=== 测试用户登录 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.data.token;
      console.log('✅ 登录成功');
      console.log('令牌:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.log('❌ 登录失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return false;
  }
}

// 测试获取当前用户信息
async function testGetCurrentUser() {
  console.log('\n=== 测试获取当前用户信息 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 获取用户信息成功');
      console.log('用户信息:', data.data);
      return true;
    } else {
      console.log('❌ 获取用户信息失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 获取用户信息请求失败:', error.message);
    return false;
  }
}

// 测试创建分类
async function testCreateCategory() {
  console.log('\n=== 测试创建分类 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/category/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: '测试分类',
        slug: 'test-category',
        description: '这是一个测试分类'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 创建分类成功');
      console.log('分类信息:', data.data);
      return data.data;
    } else {
      console.log('❌ 创建分类失败:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建分类请求失败:', error.message);
    return null;
  }
}

// 测试创建文章
async function testCreatePost(categoryId) {
  console.log('\n=== 测试创建文章 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/post/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: '测试文章标题',
        slug: 'test-post-title',
        excerpt: '这是文章的摘要',
        content: '# 测试文章内容\n\n这是一篇测试文章的内容，用于验证文章创建功能是否正常工作。',
        status: 1, // 发布状态
        categoryIds: categoryId ? [categoryId] : []
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 创建文章成功');
      console.log('文章信息:', data.data);
      return data.data;
    } else {
      console.log('❌ 创建文章失败:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 创建文章请求失败:', error.message);
    return null;
  }
}

// 测试获取文章列表
async function testGetPosts() {
  console.log('\n=== 测试获取文章列表 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/post/list?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 获取文章列表成功');
      console.log('文章数量:', data.data.pagination.total);
      console.log('第一篇文章标题:', data.data.data[0]?.title || '无文章');
      return true;
    } else {
      console.log('❌ 获取文章列表失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 获取文章列表请求失败:', error.message);
    return false;
  }
}

// 测试提交评论
async function testSubmitComment(postId) {
  console.log('\n=== 测试提交评论 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/comment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: postId,
        authorName: '测试用户',
        authorEmail: 'test@example.com',
        content: '这是一条测试评论，用于验证评论功能是否正常工作。'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 提交评论成功');
      console.log('评论信息:', data.data);
      return true;
    } else {
      console.log('❌ 提交评论失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 提交评论请求失败:', error.message);
    return false;
  }
}

// 测试提交反馈
async function testSubmitFeedback() {
  console.log('\n=== 测试提交反馈 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试用户',
        email: 'test@example.com',
        subject: '测试反馈主题',
        content: '这是一条测试反馈，用于验证反馈功能是否正常工作。'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 提交反馈成功');
      console.log('反馈信息:', data.data);
      return true;
    } else {
      console.log('❌ 提交反馈失败:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 提交反馈请求失败:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试 Cloudflare Blog API...\n');
  
  // 测试用户登录
  const loginSuccess = await testUserLogin();
  if (!loginSuccess) {
    console.log('\n❌ 登录失败，测试终止');
    return;
  }
  
  // 测试获取当前用户信息
  await testGetCurrentUser();
  
  // 测试创建分类
  const category = await testCreateCategory();
  const categoryId = category ? category.id : null;
  
  // 测试创建文章
  const post = await testCreatePost(categoryId);
  const postId = post ? post.id : null;
  
  // 测试获取文章列表
  await testGetPosts();
  
  // 测试提交评论
  if (postId) {
    await testSubmitComment(postId);
  }
  
  // 测试提交反馈
  await testSubmitFeedback();
  
  console.log('\n✅ 测试完成！');
  console.log('\n注意：这是一个基本的 API 测试，不包括所有功能的详细测试。');
  console.log('如果所有测试都成功，说明基本的博客功能正常工作。');
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
});