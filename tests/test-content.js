// 内容管理功能测试
const fetch = require('undici').fetch;
const API_BASE = 'http://localhost:8787';

let authToken = '';

async function login() {
  const response = await fetch(`${API_BASE}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const data = await response.json();
  if (data.success) {
    authToken = data.data.token;
    console.log('✅ 登录成功');
    return true;
  }
  return false;
}

async function testCreateCategory() {
  console.log('\n测试创建分类...');
  try {
    const response = await fetch(`${API_BASE}/api/category/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: '测试分类',
        slug: 'test-category',
        description: '这是一个测试分类'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 创建分类成功');
      console.log('   分类ID:', data.data.id);
      console.log('   分类名称:', data.data.name);
      return data.data;
    } else {
      console.log('❌ 创建分类失败:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 创建分类请求失败:', error.message);
    return null;
  }
}

async function testCreateTag() {
  console.log('\n测试创建标签...');
  try {
    const response = await fetch(`${API_BASE}/api/tag/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: '测试标签',
        slug: 'test-tag'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 创建标签成功');
      console.log('   标签ID:', data.data.id);
      console.log('   标签名称:', data.data.name);
      return data.data;
    } else {
      console.log('❌ 创建标签失败:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 创建标签请求失败:', error.message);
    return null;
  }
}

async function testCreatePost(category) {
  console.log('\n测试创建文章...');
  try {
    const response = await fetch(`${API_BASE}/api/post/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: '测试文章',
        slug: 'test-post',
        excerpt: '这是文章摘要',
        content: '# 测试文章\n\n这是文章内容。',
        status: 1,
        categoryIds: category ? [category.id] : []
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 创建文章成功');
      console.log('   文章ID:', data.data.id);
      console.log('   文章标题:', data.data.title);
      return data.data;
    } else {
      console.log('❌ 创建文章失败:', data.message);
      console.log('   响应:', JSON.stringify(data));
      return null;
    }
  } catch (error) {
    console.log('❌ 创建文章请求失败:', error.message);
    return null;
  }
}

async function testGetPosts() {
  console.log('\n测试获取文章列表...');
  try {
    const response = await fetch(`${API_BASE}/api/post/list?page=1&limit=10`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 获取文章列表成功');
      console.log('   文章数量:', data.data.pagination.total);
      if (data.data.data.length > 0) {
        console.log('   第一篇:', data.data.data[0].title);
      }
      return true;
    } else {
      console.log('❌ 获取文章列表失败:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取文章列表请求失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('📝 开始内容管理功能测试...\n');

  // 登录
  if (!await login()) {
    console.log('\n❌ 登录失败，测试终止');
    process.exit(1);
  }

  // 测试创建分类
  const category = await testCreateCategory();

  // 测试创建标签
  const tag = await testCreateTag();

  // 测试创建文章
  const post = await testCreatePost(category);

  // 测试获取文章列表
  await testGetPosts();

  console.log('\n✅ 内容管理功能测试完成');
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
