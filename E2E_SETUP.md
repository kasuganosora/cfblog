# E2E 测试设置指南

## 快速开始

### 1. 安装依赖

```bash
npm install --save-dev @playwright/test
```

### 2. 安装 Playwright 浏览器

```bash
npx playwright install
```

这将安装 Chromium、Firefox 和 WebKit 浏览器。

### 3. 运行 E2E 测试

```bash
npm run test:e2e
```

## 测试脚本说明

### 基本测试命令

| 命令 | 说明 |
|------|------|
| `npm run test:e2e` | 运行所有 E2E 测试（无头模式）|
| `npm run test:e2e:chromium` | 仅在 Chrome 中运行 |
| `npm run test:e2e:firefox` | 仅在 Firefox 中运行 |
| `npm run test:e2e:webkit` | 仅在 Safari 中运行 |
| `npm run test:e2e:headed` | 运行测试并显示浏览器窗口 |
| `npm run test:e2e:debug` | 调试模式，逐步执行测试 |
| `npm run test:e2e:report` | 查看测试报告 |

### 运行特定测试

```bash
# 运行特定测试文件
npx playwright test guest-flow.spec.js

# 运行特定测试套件
npx playwright test -g "访客"

# 运行特定测试
npx playwright test -g "访客可以浏览首页"
```

## 测试覆盖

### 访客流程 (guest-flow.spec.js)
- ✅ 首页浏览
- ✅ 分类列表浏览
- ✅ 标签列表浏览
- ✅ 文章搜索
- ✅ 关于页面
- ✅ 联系页面
- ✅ 留言页面
- ✅ 登录页面
- ✅ 页面导航
- ✅ 响应式设计
- ✅ 页面性能
- ✅ 可访问性

### 管理员流程 (admin-flow.spec.js)
- ✅ 管理员登录
- ✅ 文章管理
- ✅ 分类管理
- ✅ 标签管理
- ✅ 仪表盘
- ✅ 评论管理
- ✅ 反馈管理
- ✅ 管理员注销

### 交互功能流程 (interaction-flow.spec.js)
- ✅ 搜索功能
- ✅ 留言功能
- ✅ 登录功能
- ✅ 表单交互
- ✅ 页面导航
- ✅ 页面滚动
- ✅ 键盘交互
- ✅ 视觉反馈

## 调试技巧

### 1. 使用调试模式

```bash
npm run test:e2e:debug
```

调试模式会：
- 显示浏览器窗口
- 逐步执行测试
- 暂停在每个断点

### 2. 添加断点

在测试代码中添加 `page.pause()`：

```javascript
test('示例测试', async ({ page }) => {
  await page.goto('/');
  
  // 暂停执行，打开 Playwright Inspector
  await page.pause();
  
  await page.click('button');
});
```

### 3. 查看网络请求

```javascript
// 监听响应
page.on('response', response => {
  console.log(`Response: ${response.url()}`);
});

// 等待特定响应
const response = await page.waitForResponse('**/api/**');
```

### 4. 截图

```javascript
// 截取整页
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// 截取元素
const element = page.locator('.header');
await element.screenshot({ path: 'header.png' });
```

## 常见问题

### 问题 1: 服务器未启动

**错误**: `Error: connect ECONNREFUSED 127.0.0.1:8787`

**解决**: Playwright 会自动启动开发服务器。如果失败，手动启动：

```bash
npm run dev
```

### 问题 2: 元素未找到

**错误**: `Error: strict mode violation: locator.click`

**解决**:
- 添加等待：`await page.waitForSelector()`
- 使用更宽泛的选择器
- 检查元素是否在 iframe 中

### 问题 3: 测试超时

**错误**: `Error: Test timeout of 30000ms exceeded`

**解决**:
- 增加 `actionTimeout` 配置
- 添加网络空闲等待：`await page.waitForLoadState('networkidle')`
- 检查是否有慢速请求

### 问题 4: 视频录制失败

**解决**: 安装 FFmpeg（用于视频录制）

**Ubuntu/Debian**:
```bash
sudo apt-get install ffmpeg
```

**macOS**:
```bash
brew install ffmpeg
```

**Windows**:
下载 FFmpeg 并添加到 PATH。

## 持续集成配置

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
```

### GitLab CI 示例

```yaml
e2e:
  image: mcr.microsoft.com/playwright:v1.48.0-jammy
  stage: test
  script:
    - npm ci
    - npx playwright install --with-deps
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
```

## 性能优化

### 1. 并发执行

Playwright 默认并行运行测试。调整工作进程数：

```javascript
// playwright.config.js
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
});
```

### 2. 重试策略

```javascript
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});
```

### 3. 跳过慢速测试

```javascript
test('慢速测试', async ({ page }) => {
  test.slow();
  // 测试代码...
});
```

## 最佳实践

### 1. 使用 Page Object Model

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }
  
  async login(password) {
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### 2. 使用数据驱动测试

```javascript
const credentials = [
  { password: 'admin123', shouldSucceed: true },
  { password: 'wrong', shouldSucceed: false },
];

for (const cred of credentials) {
  test(`登录测试: ${cred.password}`, async ({ page }) => {
    await login(page, cred.password);
    // 断言...
  });
}
```

### 3. 清理测试数据

```javascript
test.afterEach(async ({ page }) => {
  // 清理 localStorage
  await page.evaluate(() => localStorage.clear());
  
  // 清理 cookies
  const context = page.context();
  await context.clearCookies();
});
```

## 相关资源

- [Playwright 官方文档](https://playwright.dev)
- [最佳实践指南](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-playwright)
- [调试工具](https://playwright.dev/docs/debug)
