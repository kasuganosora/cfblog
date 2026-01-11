// 前台页面测试（带自动启动服务器）
import { spawn } from 'child_process';
import { fetch } from 'undici';
import { setTimeout } from 'timers/promises';

const API_BASE = 'http://localhost:8787';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1秒

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
  },

  length(array, expected, message = '') {
    if (array.length !== expected) {
      throw new Error(`断言失败: ${message}\n   期望长度: ${expected}\n   实际长度: ${array.length}`);
    }
  }
};

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 等待服务器启动
async function waitForServer() {
  console.log('⏳ 等待开发服务器启动...');

  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await checkServer()) {
      console.log('✅ 开发服务器已启动！');
      return true;
    }
    await setTimeout(RETRY_DELAY);
    process.stdout.write('.');
  }

  throw new Error(`开发服务器启动超时（超过 ${MAX_RETRIES * RETRY_DELAY / 1000} 秒）`);
}

// 启动开发服务器
async function startDevServer() {
  console.log('🚀 正在启动开发服务器...');

  // 检查服务器是否已在运行
  if (await checkServer()) {
    console.log('✅ 开发服务器已在运行');
    return null;
  }

  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('listening')) {
        console.log('✅ 开发服务器已启动');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('服务器错误:', data.toString());
    });

    server.on('error', (error) => {
      console.error('启动服务器失败:', error);
      reject(error);
    });

    server.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`开发服务器异常退出，退出码: ${code}`);
        reject(new Error(`开发服务器退出，退出码: ${code}`));
      }
    });

    // 保存服务器进程引用
    resolve(server);
  });
}

// 测试类
class FrontendTestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0
    };
    this.server = null;
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
    console.log('🎨 开始运行前台页面测试...\n');

    try {
      // 启动开发服务器
      this.server = await startDevServer();

      // 等待服务器就绪
      await waitForServer();

      // 运行测试
      await this.testHomePage();
      await this.testCategoryPages();
      await this.testTagPages();
      await this.testPostPage();
      await this.testSearchPage();
      await this.testFeedbackPage();
      await this.testLoginPage();

      this.printSummary();
    } catch (error) {
      console.error('\n❌ 测试运行失败:', error.message);
      await this.cleanup();
      process.exit(1);
    }

    await this.cleanup();
  }

  async cleanup() {
    if (this.server) {
      console.log('\n🛑 正在关闭开发服务器...');
      this.server.kill('SIGTERM');
      // 等待进程退出
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async fetchPage(path) {
    const response = await fetch(`${API_BASE}${path}`);
    const html = await response.text();
    return {
      status: response.status,
      html,
      ok: response.ok
    };
  }

  printSummary() {
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 通过: ${this.testResults.passed}`);
    console.log(`   ❌ 失败: ${this.testResults.failed}`);
    console.log(`   📈 总计: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 所有前台页面测试通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  有前台页面测试失败！');
      process.exit(1);
    }
  }

  // 测试首页
  async testHomePage() {
    console.log('\n📄 测试首页...');

    await this.test('首页可以访问', async () => {
      const { status, html } = await this.fetchPage('/');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('首页包含必需元素', async () => {
      const { html } = await this.fetchPage('/');
      assert.contains(html, '<header>', '应该包含 header');
      assert.contains(html, '<footer>', '应该包含 footer');
      assert.contains(html, '<main>', '应该包含 main');
    });

    await this.test('首页包含导航链接', async () => {
      const { html } = await this.fetchPage('/');
      assert.contains(html, 'href="/"', '应该包含首页链接');
      assert.contains(html, 'href="/category/all"', '应该包含分类链接');
      assert.contains(html, 'href="/tag/all"', '应该包含标签链接');
    });

    await this.test('首页包含搜索功能', async () => {
      const { html } = await this.fetchPage('/');
      assert.contains(html, 'search', '应该包含搜索元素');
    });
  }

  // 测试分类页面
  async testCategoryPages() {
    console.log('\n📂 测试分类页面...');

    await this.test('分类列表页可以访问', async () => {
      const { status } = await this.fetchPage('/category/all');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('分类列表页包含标题', async () => {
      const { html } = await this.fetchPage('/category/all');
      assert.contains(html, '分类', '应该包含分类标题');
    });
  }

  // 测试标签页面
  async testTagPages() {
    console.log('\n🏷️  测试标签页面...');

    await this.test('标签列表页可以访问', async () => {
      const { status } = await this.fetchPage('/tag/all');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('标签列表页包含标题', async () => {
      const { html } = await this.fetchPage('/tag/all');
      assert.contains(html, '标签', '应该包含标签标题');
    });
  }

  // 测试文章详情页
  async testPostPage() {
    console.log('\n📝 测试文章详情页...');

    await this.test('搜索结果页可以访问', async () => {
      const { status } = await this.fetchPage('/search');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('搜索页面包含搜索表单', async () => {
      const { html } = await this.fetchPage('/search');
      assert.contains(html, 'search', '应该包含搜索表单');
    });
  }

  // 测试搜索页面
  async testSearchPage() {
    console.log('\n🔍 测试搜索页面...');

    await this.test('搜索页面可以访问', async () => {
      const { status } = await this.fetchPage('/search');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('搜索页面包含搜索框', async () => {
      const { html } = await this.fetchPage('/search');
      assert.contains(html, 'input', '应该包含输入框');
      assert.contains(html, 'type="text"', '应该包含文本输入框');
    });
  }

  // 测试留言页面
  async testFeedbackPage() {
    console.log('\n📨 测试留言页面...');

    await this.test('留言页面可以访问', async () => {
      const { status } = await this.fetchPage('/feedback');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('留言页面包含表单', async () => {
      const { html } = await this.fetchPage('/feedback');
      assert.contains(html, 'form', '应该包含表单');
      assert.contains(html, '留言', '应该包含留言相关内容');
    });
  }

  // 测试登录页面
  async testLoginPage() {
    console.log('\n🔐 测试登录页面...');

    await this.test('登录页面可以访问', async () => {
      const { status } = await this.fetchPage('/login');
      assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
    });

    await this.test('登录页面包含表单', async () => {
      const { html } = await this.fetchPage('/login');
      assert.contains(html, 'form', '应该包含表单');
      assert.contains(html, 'username', '应该包含用户名输入框');
      assert.contains(html, 'password', '应该包含密码输入框');
    });
  }
}

// 运行测试
const runner = new FrontendTestRunner();
runner.run().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
