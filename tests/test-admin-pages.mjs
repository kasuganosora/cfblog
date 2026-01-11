// 后台管理页面测试
import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

// 断言工具
const assert = {
  equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`断言失败: ${message}\n   期望: ${expected}\n   实际: ${actual}`);
    }
  },

  notEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(`断言失败: ${message}\n   期望不等于: ${expected}\n   实际: ${actual}`);
    }
  },

  isTrue(value, message = '') {
    if (!value) {
      throw new Error(`断言失败: ${message}\n   期望为真，实际为: ${value}`);
    }
  },

  isFalse(value, message = '') {
    if (value) {
      throw new Error(`断言失败: ${message}\n   期望为假，实际为: ${value}`);
    }
  },

  contains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`断言失败: ${message}\n   "${haystack}" 不包含 "${needle}"`);
    }
  }
};

// 测试类
class AdminTestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0
    };
    this.authToken = null;
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
    console.log('⚙️  开始运行后台管理页面测试...\n');

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
      // 先登录获取 token
      await this.login();

      // 测试仪表盘
      await this.testDashboard();

      // 测试文章管理
      await this.testPostManagement();

      // 测试分类管理
      await this.testCategoryManagement();

      // 测试标签管理
      await this.testTagManagement();

      // 测试评论管理
      await this.testCommentManagement();

      // 测试留言管理
      await this.testFeedbackManagement();

      // 测试附件管理
      await this.testAttachmentManagement();

      this.printSummary();
    } catch (error) {
      console.error('\n❌ 测试运行失败:', error.message);
      process.exit(1);
    }
  }

  async login() {
    console.log('🔐 登录后台管理...');

    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();

    if (data.success && data.data.token) {
      this.authToken = data.data.token;
      console.log('✅ 登录成功');
    } else {
      throw new Error('登录失败，请确保数据库已初始化且管理员账号已创建');
    }
  }

  async fetchPage(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const text = await response.text();

    return {
      status: response.status,
      html: text,
      ok: response.ok
    };
  }

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 通过: ${this.testResults.passed}`);
    console.log(`   ❌ 失败: ${this.testResults.failed}`);
    console.log(`   📈 总计: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有后台页面测试通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  有后台页面测试失败！');
      process.exit(1);
    }
  }

  // 测试仪表盘
  async testDashboard() {
    console.log('\n📊 测试仪表盘...');

    await this.test('仪表盘可以访问', async () => {
      const { status } = await this.fetchPage('/admin');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('仪表盘包含统计卡片', async () => {
      const { html } = await this.fetchPage('/admin');
      assert.contains(html, 'stat-card', '应该包含统计卡片');
    });

    await this.test('仪表盘包含侧边栏', async () => {
      const { html } = await this.fetchPage('/admin');
      assert.contains(html, 'admin-sidebar', '应该包含侧边栏');
    });

    await this.test('仪表盘包含菜单项', async () => {
      const { html } = await this.fetchPage('/admin');
      assert.contains(html, 'admin-menu', '应该包含菜单');
      assert.contains(html, '仪表盘', '应该包含仪表盘菜单项');
    });
  }

  // 测试文章管理
  async testPostManagement() {
    console.log('\n📝 测试文章管理...');

    await this.test('文章列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/posts');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('文章创建页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/posts/create');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('文章列表页包含表格', async () => {
      const { html } = await this.fetchPage('/admin/posts');
      assert.contains(html, 'table', '应该包含表格');
    });

    await this.test('文章创建页包含表单', async () => {
      const { html } = await this.fetchPage('/admin/posts/create');
      assert.contains(html, 'form', '应该包含表单');
      assert.contains(html, 'title', '应该包含标题输入框');
      assert.contains(html, 'content', '应该包含内容输入框');
    });
  }

  // 测试分类管理
  async testCategoryManagement() {
    console.log('\n📂 测试分类管理...');

    await this.test('分类列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/categories');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('分类列表页包含分类列表', async () => {
      const { html } = await this.fetchPage('/admin/categories');
      assert.contains(html, 'category', '应该包含分类内容');
    });
  }

  // 测试标签管理
  async testTagManagement() {
    console.log('\n🏷️  测试标签管理...');

    await this.test('标签列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/tags');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('标签列表页包含标签列表', async () => {
      const { html } = await this.fetchPage('/admin/tags');
      assert.contains(html, 'tag', '应该包含标签内容');
    });
  }

  // 测试评论管理
  async testCommentManagement() {
    console.log('\n💬 测试评论管理...');

    await this.test('评论列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/comments');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('评论列表页包含评论列表', async () => {
      const { html } = await this.fetchPage('/admin/comments');
      assert.contains(html, 'comment', '应该包含评论内容');
    });
  }

  // 测试留言管理
  async testFeedbackManagement() {
    console.log('\n📨 测试留言管理...');

    await this.test('留言列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/feedbacks');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('留言列表页包含留言列表', async () => {
      const { html } = await this.fetchPage('/admin/feedbacks');
      assert.contains(html, 'feedback', '应该包含留言内容');
    });
  }

  // 测试附件管理
  async testAttachmentManagement() {
    console.log('\n📎 测试附件管理...');

    await this.test('附件列表页可以访问', async () => {
      const { status } = await this.fetchPage('/admin/attachments');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('附件列表页包含上传区域', async () => {
      const { html } = await this.fetchPage('/admin/attachments');
      assert.contains(html, 'upload', '应该包含上传区域');
    });
  }
}

// 运行测试
const runner = new AdminTestRunner();
runner.run().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
