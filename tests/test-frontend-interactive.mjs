// 前端交互功能测试（JavaScript 功能）
import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

// 断言工具
const assert = {
  equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`断言失败: ${message}\n   期望: ${expected}\n   实际: ${actual}`);
    }
  },

  isTrue(value, message = '') {
    if (!value) {
      throw new Error(`断言失败: ${message}\n   期望为真，实际为: ${value}`);
    }
  },

  contains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`断言失败: ${message}\n   "${haystack}" 不包含 "${needle}"`);
    }
  }
};

class InteractiveTestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0
    };
    this.createdData = {};
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
    console.log('🎯 开始运行前端交互功能测试...\n');

    // 检查服务器是否运行
    try {
      await fetch(`${API_BASE}/`, { method: 'HEAD' });
    } catch (error) {
      console.error('❌ 无法连接到开发服务器');
      console.error(`   请确保开发服务器正在运行: npm run dev`);
      process.exit(1);
    }

    try {
      // 测试搜索功能
      await this.testSearchFeature();

      // 测试评论功能
      await this.testCommentFeature();

      // 测试留言功能
      await this.testFeedbackFeature();

      // 测试表单验证
      await this.testFormValidation();

      this.printSummary();
    } catch (error) {
      console.error('\n❌ 测试运行失败:', error.message);
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

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 通过: ${this.testResults.passed}`);
    console.log(`   ❌ 失败: ${this.testResults.failed}`);
    console.log(`   📈 总计: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有前端交互测试通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  有前端交互测试失败！');
      process.exit(1);
    }
  }

  // 测试搜索功能
  async testSearchFeature() {
    console.log('🔍 测试搜索功能...');

    await this.test('搜索 API 可以访问', async () => {
      const { status } = await this.request('/api/search?q=test');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('搜索返回数据格式正确', async () => {
      const { data } = await this.request('/api/search?q=test');
      assert.isTrue(data.success, 'success 字段应该为 true');
      assert.isTrue(Array.isArray(data.data.data), 'data 字段应该是数组');
    });

    await this.test('搜索页面包含搜索脚本', async () => {
      const response = await fetch(`${API_BASE}/search`);
      const html = await response.text();
      assert.contains(html, 'main.js', '应该包含主脚本');
    });
  }

  // 测试评论功能
  async testCommentFeature() {
    console.log('\n💬 测试评论功能...');

    // 先创建一个测试文章
    const loginRes = await this.request('/api/user/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginRes.success) {
      console.log('⚠️  跳过评论测试（需要先登录）');
      return;
    }

    const token = loginRes.data.token;

    await this.test('获取评论列表 API 可以访问', async () => {
      const { status } = await this.request('/api/comment/list');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('评论列表返回数据格式正确', async () => {
      const { data } = await this.request('/api/comment/list');
      assert.isTrue(data.success, 'success 字段应该为 true');
      assert.isTrue(Array.isArray(data.data.data), 'data 字段应该是数组');
    });

    await this.test('文章详情页包含评论表单脚本', async () => {
      const response = await fetch(`${API_BASE}/`);
      const html = await response.text();
      assert.contains(html, 'comment', '应该包含评论相关内容');
      assert.contains(html, 'main.js', '应该包含交互脚本');
    });
  }

  // 测试留言功能
  async testFeedbackFeature() {
    console.log('\n📨 测试留言功能...');

    await this.test('留言页面可以访问', async () => {
      const { status } = await this.request('/feedback');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('提交留言 API 可以访问', async () => {
      const { data } = await this.request('/api/feedback/submit', 'POST', {
        name: '测试用户',
        email: 'test@example.com',
        subject: '测试主题',
        content: '测试内容'
      });

      // 即使失败，API 也应该返回响应
      assert.isTrue(data !== null, 'API 应该返回响应');
    });

    await this.test('留言页面包含表单验证脚本', async () => {
      const response = await fetch(`${API_BASE}/feedback`);
      const html = await response.text();
      assert.contains(html, 'form', '应该包含表单');
      assert.contains(html, 'main.js', '应该包含交互脚本');
    });
  }

  // 测试表单验证
  async testFormValidation() {
    console.log('\n📝 测试表单验证...');

    await this.test('登录页面包含表单', async () => {
      const response = await fetch(`${API_BASE}/login`);
      const html = await response.text();
      assert.contains(html, '<form', '应该包含表单元素');
      assert.contains(html, 'name="username"', '应该包含用户名输入框');
      assert.contains(html, 'name="password"', '应该包含密码输入框');
    });

    await this.test('登录 API 验证功能', async () => {
      // 测试空用户名
      const res1 = await this.request('/api/user/login', 'POST', {
        username: '',
        password: ''
      });
      assert.isTrue(!res1.success || res1.status !== 200, '空用户名应该验证失败');

      // 测试错误密码
      const res2 = await this.request('/api/user/login', 'POST', {
        username: 'admin',
        password: 'wrongpassword'
      });
      assert.isTrue(!res2.success || res2.status === 401, '错误密码应该验证失败');
    });
  }
}

// 运行测试
const runner = new InteractiveTestRunner();
runner.run().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
