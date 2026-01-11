// API 集成测试
import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

export class APITestRunner {
  constructor() {
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0
    };
    this.createdData = {
      categories: [],
      tags: [],
      posts: [],
      comments: []
    };
  }

  async test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      this.testResults.passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   ${error.message}`);
      this.testResults.failed++;
    }
  }

  async run() {
    console.log('🌐 开始运行 API 集成测试...\n');

    // 检查服务器是否运行
    try {
      await fetch(`${API_BASE}/`, { method: 'HEAD' });
    } catch (error) {
      console.error('❌ 无法连接到开发服务器');
      console.error(`   请确保开发服务器正在运行: npm run dev`);
      console.error(`   服务器地址: ${API_BASE}`);
      process.exit(1);
    }

    try {
      // 1. 测试前台页面
      await this.testFrontendPages();

      // 2. 测试用户认证
      await this.testAuthentication();

      // 3. 测试分类管理
      await this.testCategories();

      // 4. 测试标签管理
      await this.testTags();

      // 5. 测试文章管理
      await this.testPosts();

      // 6. 测试评论功能
      await this.testComments();

      // 7. 测试反馈功能
      await this.testFeedback();

      // 8. 测试搜索功能
      await this.testSearch();

      this.printSummary();
    } catch (error) {
      console.error('\n❌ 测试运行失败:', error.message);
      process.exit(1);
    }
  }

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 通过: ${this.testResults.passed}`);
    console.log(`   ❌ 失败: ${this.testResults.failed}`);
    console.log(`   📈 总计: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有 API 测试通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  有 API 测试失败！');
      process.exit(1);
    }
  }

  async request(path, method = 'GET', body = null, headers = {}) {
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

    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();

    return { status: response.status, data, success: response.ok };
  }

  async testFrontendPages() {
    console.log('📄 测试前台页面...');

    await this.test('首页可以访问', async () => {
      const res = await this.request('/');
      this.assert(res.status === 200, `状态码应该是 200，实际是 ${res.status}`);
    });

    await this.test('关于页面可以访问', async () => {
      const res = await this.request('/about');
      this.assert(res.status === 200, `状态码应该是 200，实际是 ${res.status}`);
    });

    await this.test('联系页面可以访问', async () => {
      const res = await this.request('/contact');
      this.assert(res.status === 200, `状态码应该是 200，实际是 ${res.status}`);
    });
  }

  async testAuthentication() {
    console.log('\n🔐 测试用户认证...');

    await this.test('用户可以登录', async () => {
      const res = await this.request('/api/user/login', 'POST', {
        username: 'admin',
        password: 'admin123'
      });
      this.assert(res.success, '登录应该成功');
      this.assert(res.data.token, '应该返回令牌');
      this.authToken = res.data.token;
    });

    await this.test('获取当前用户信息', async () => {
      const res = await this.request('/api/user/me', 'GET', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.assert(res.success, '获取用户信息应该成功');
      this.assert(res.data.username === 'admin', '用户名应该是 admin');
    });

    await this.test('未授权访问被拒绝', async () => {
      const res = await this.request('/api/user/me', 'GET');
      this.assert(!res.success || res.status === 401, '未授权访问应该被拒绝');
    });
  }

  async testCategories() {
    console.log('\n📂 测试分类管理...');

    await this.test('创建分类', async () => {
      const res = await this.request('/api/category/create', 'POST', {
        name: '测试分类',
        slug: 'test-category',
        description: '这是一个测试分类'
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '创建分类应该成功');
      this.assert(res.data.id, '应该返回分类 ID');
      this.createdData.categories.push(res.data);
    });

    await this.test('获取分类列表', async () => {
      const res = await this.request('/api/category/list');
      this.assert(res.success, '获取分类列表应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });

    await this.test('更新分类', async () => {
      const category = this.createdData.categories[0];
      const res = await this.request(`/api/category/${category.id}/update`, 'PUT', {
        name: '更新后的分类',
        description: '更新后的描述'
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '更新分类应该成功');
    });
  }

  async testTags() {
    console.log('\n🏷️  测试标签管理...');

    await this.test('创建标签', async () => {
      const res = await this.request('/api/tag/create', 'POST', {
        name: '测试标签',
        slug: 'test-tag'
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '创建标签应该成功');
      this.assert(res.data.id, '应该返回标签 ID');
      this.createdData.tags.push(res.data);
    });

    await this.test('获取标签列表', async () => {
      const res = await this.request('/api/tag/list');
      this.assert(res.success, '获取标签列表应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });

    await this.test('删除标签', async () => {
      const tag = this.createdData.tags[0];
      const res = await this.request(`/api/tag/${tag.id}/delete`, 'DELETE', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.assert(res.success, '删除标签应该成功');
    });
  }

  async testPosts() {
    console.log('\n📝 测试文章管理...');

    await this.test('创建文章', async () => {
      const category = this.createdData.categories[0];
      const res = await this.request('/api/post/create', 'POST', {
        title: '测试文章',
        slug: 'test-post',
        excerpt: '这是文章摘要',
        content: '# 测试文章内容\n\n这是文章正文。',
        status: 1,
        categoryIds: category ? [category.id] : []
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '创建文章应该成功');
      this.assert(res.data.id, '应该返回文章 ID');
      this.createdData.posts.push(res.data);
    });

    await this.test('获取文章列表', async () => {
      const res = await this.request('/api/post/list?page=1&limit=10');
      this.assert(res.success, '获取文章列表应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });

    await this.test('获取文章详情', async () => {
      const post = this.createdData.posts[0];
      const res = await this.request(`/api/post/${post.id}`);
      this.assert(res.success, '获取文章详情应该成功');
      this.assert(res.data.title === '测试文章', '文章标题应该正确');
    });

    await this.test('更新文章', async () => {
      const post = this.createdData.posts[0];
      const res = await this.request(`/api/post/${post.id}/update`, 'PUT', {
        title: '更新后的文章标题',
        content: '更新后的内容'
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '更新文章应该成功');
    });

    await this.test('删除文章', async () => {
      const post = this.createdData.posts[0];
      const res = await this.request(`/api/post/${post.id}/delete`, 'DELETE', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.assert(res.success, '删除文章应该成功');
    });
  }

  async testComments() {
    console.log('\n💬 测试评论功能...');

    await this.test('创建文章用于评论测试', async () => {
      const category = this.createdData.categories[0];
      const res = await this.request('/api/post/create', 'POST', {
        title: '评论测试文章',
        slug: 'comment-test-post',
        excerpt: '用于测试评论',
        content: '测试内容',
        status: 1,
        categoryIds: category ? [category.id] : []
      }, { 'Authorization': `Bearer ${this.authToken}` });
      this.assert(res.success, '创建文章应该成功');
      this.createdData.posts.push(res.data);
    });

    await this.test('提交评论', async () => {
      const post = this.createdData.posts[1];
      const res = await this.request('/api/comment/create', 'POST', {
        postId: post.id,
        authorName: '测试用户',
        authorEmail: 'test@example.com',
        content: '这是一条测试评论'
      });
      this.assert(res.success, '提交评论应该成功');
      this.assert(res.data.id, '应该返回评论 ID');
      this.createdData.comments.push(res.data);
    });

    await this.test('获取评论列表', async () => {
      const res = await this.request('/api/comment/list?page=1&limit=10');
      this.assert(res.success, '获取评论列表应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });

    await this.test('删除评论', async () => {
      const comment = this.createdData.comments[0];
      const res = await this.request(`/api/comment/${comment.id}/delete`, 'DELETE', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.assert(res.success, '删除评论应该成功');
    });
  }

  async testFeedback() {
    console.log('\n📨 测试反馈功能...');

    await this.test('提交反馈', async () => {
      const res = await this.request('/api/feedback/submit', 'POST', {
        name: '测试用户',
        email: 'test@example.com',
        subject: '测试反馈',
        content: '这是一条测试反馈'
      });
      this.assert(res.success, '提交反馈应该成功');
      this.assert(res.data.id, '应该返回反馈 ID');
    });

    await this.test('获取反馈列表（需要认证）', async () => {
      const res = await this.request('/api/feedback/list', 'GET', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.assert(res.success, '获取反馈列表应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });
  }

  async testSearch() {
    console.log('\n🔍 测试搜索功能...');

    await this.test('搜索文章', async () => {
      const res = await this.request('/api/search?q=test');
      this.assert(res.success, '搜索应该成功');
      this.assert(Array.isArray(res.data.data), '应该返回数组');
    });

    await this.test('空搜索返回空结果', async () => {
      const res = await this.request('/api/search?q=nonexistent123456');
      this.assert(res.success, '空搜索应该成功');
      this.assert(res.data.data.length === 0, '空搜索应该返回空数组');
    });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

// 运行测试
const runner = new APITestRunner();
runner.run();
