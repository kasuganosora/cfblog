# CFBlog E2E 测试系统

## 概述

CFBlog E2E 测试系统是一个完整的端到端测试解决方案，使用 Playwright 作为测试框架，提供自动化测试、可复用组件、多浏览器支持等功能。

## 特性

✅ **自动化环境管理** - 自动启动开发服务器、清空缓存、导入测试数据
✅ **可复用测试组件** - CacheManager、ServerCheck、UserSwitcher、LoginChecker、TestHelper
✅ **完整功能覆盖** - 首页、文章详情、认证、国际化、主题、评论、响应式
✅ **多浏览器支持** - Chrome、Firefox、Safari、Mobile Chrome
✅ **Page Object 模式** - HomePage、PostDetailPage、LoginPage
✅ **测试报告** - HTML、JSON、控制台输出

## 项目结构

```
tests/
├── e2e/                    # E2E 测试主目录
│   ├── specs/             # 测试规范文件
│   │   ├── home.spec.js           # 首页功能测试
│   │   ├── post-detail.spec.js    # 文章详情测试
│   │   ├── auth.spec.js           # 认证权限测试
│   │   ├── i18n.spec.js          # 国际化测试
│   │   ├── theme.spec.js          # 主题切换测试
│   │   ├── comments.spec.js       # 评论功能测试
│   │   └── responsive.spec.js     # 响应式设计测试
│   ├── pages/             # Page Objects
│   │   ├── home-page.js          # 首页页面对象
│   │   ├── post-detail-page.js    # 文章详情页面对象
│   │   └── login-page.js         # 登录页面对象
│   ├── playwright.config.js  # Playwright 配置
│   ├── setup.js            # 测试设置脚本
│   └── test-runner.js      # 测试运行脚本
├── helpers/               # 测试辅助工具
│   ├── cache-manager.js   # 缓存管理器
│   ├── server-check.js    # 服务器检查器
│   ├── user-switcher.js   # 用户切换器
│   ├── login-checker.js   # 登录状态检查器
│   ├── test-helper.js     # 测试辅助工具
│   └── index.js           # 导出所有辅助工具
└── fixtures/              # 测试数据
    ├── test-data.js       # 测试数据和选择器
    └── test-credentials.js # 测试凭证
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 安装浏览器

```bash
npx playwright install
```

### 3. 初始化测试环境

```bash
npm run db:local    # 应用数据库迁移
npm run db:seed     # 导入测试数据
```

### 4. 运行测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 使用 UI 模式运行
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report
```

## 测试命令

### 基本命令

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 运行特定测试文件
npx playwright test tests/e2e/specs/home.spec.js

# 运行特定测试
npx playwright test -g "应该成功加载首页"

# 只运行失败的测试
npx playwright test --grep @failed
```

### 高级命令

```bash
# UI 模式（交互式）
npm run test:e2e:ui

# 调试模式（带浏览器）
npm run test:e2e:debug

# 生成代码（记录操作）
npx playwright codegen http://localhost:8787

# 更新快照
npx playwright test --update-snapshots

# 并行运行（指定 worker 数）
npx playwright test --workers=4
```

### 测试环境管理

```bash
# 设置测试环境
npm run test:e2e:setup

# 完整的测试运行器（自动启动服务器）
npm run test:e2e:run
```

## 测试组件详解

### 1. CacheManager - 缓存管理器

```javascript
const { CacheManager } = require('../helpers/cache-manager');
const cacheManager = new CacheManager();

// 清空所有缓存
await cacheManager.clearAllCaches();

// 清空数据库测试数据
await cacheManager.clearTestData();

// 在浏览器中清空缓存
await CacheManager.clearBrowserCache(page);
```

### 2. ServerCheck - 服务器检查器

```javascript
const { ServerCheck } = require('../helpers/server-check');
const serverCheck = new ServerCheck();

// 检查服务器是否运行
const isRunning = await serverCheck.isServerRunning();

// 确保服务器运行（自动启动）
await serverCheck.ensureServer();

// 停止服务器
await serverCheck.stopServer();
```

### 3. UserSwitcher - 用户切换器

```javascript
const { UserSwitcher } = require('../helpers/user-switcher');
const userSwitcher = new UserSwitcher(page);

// 登录为管理员
await userSwitcher.loginAs('admin');

// 登录为投稿者
await userSwitcher.loginAs('contributor');

// 注销
await userSwitcher.logout();

// 切换用户
await userSwitcher.switchTo('author');

// 在特定用户上下文中执行
await userSwitcher.withUser('user', async () => {
  // 执行需要用户权限的操作
});
```

### 4. LoginChecker - 登录状态检查器

```javascript
const { LoginChecker } = require('../helpers/login-checker');
const loginChecker = new LoginChecker(page);

// 检查是否已登录
const isLoggedIn = await loginChecker.isLoggedIn();

// 获取当前用户角色
const role = await loginChecker.getCurrentRole();

// 检查是否为管理员
const isAdmin = await loginChecker.isAdmin();

// 验证登录状态一致性
const consistency = await loginChecker.verifyLoginConsistency();
// { localStorage: true, ui: true, api: true }
```

### 5. TestHelper - 测试辅助工具

```javascript
const { TestHelper } = require('../helpers/test-helper');
const helper = new TestHelper(page);

// 等待页面完全加载
await helper.waitForPageReady();

// 等待元素可见
await helper.waitForVisible('#my-element');

// 截图
await helper.screenshot('test-name');

// 切换到移动端视图
await helper.setMobileViewport();

// 切换语言
await helper.switchLanguage('en-us');

// 切换主题
await helper.switchTheme('dark');

// 填写表单
await helper.fillForm({
  '#username': 'admin',
  '#password': 'admin123'
});
```

## 测试覆盖范围

### 首页功能 (home.spec.js)

- ✅ 页面加载
- ✅ 文章列表显示
- ✅ 导航菜单
- ✅ 搜索功能
- ✅ 分类/标签导航
- ✅ 分页控制
- ✅ 主题切换
- ✅ 语言切换
- ✅ 响应式设计

### 文章详情页 (post-detail.spec.js)

- ✅ 文章内容显示
- ✅ 元数据显示（作者、日期、浏览量）
- ✅ 标签显示
- ✅ 分类显示
- ✅ 评论列表
- ✅ 点赞功能
- ✅ 分享功能
- ✅ 权限控制（编辑/删除按钮）

### 认证和权限 (auth.spec.js)

- ✅ 用户登录
- ✅ 密码错误处理
- ✅ 不存在用户处理
- ✅ 管理员权限
- ✅ 普通用户权限
- ✅ 登录状态保持
- ✅ 注销功能
- ✅ 表单验证

### 国际化 (i18n.spec.js)

- ✅ 默认语言设置
- ✅ 语言切换
- ✅ 内容翻译
- ✅ 日期格式化
- ✅ 设置持久化
- ✅ 表单验证翻译
- ✅ 404页面翻译

### 主题切换 (theme.spec.js)

- ✅ 默认主题
- ✅ 主题切换
- ✅ CSS 变量更新
- ✅ 平滑过渡
- ✅ 设置持久化
- ✅ 响应式主题
- ✅ 深色模式所有组件

### 评论功能 (comments.spec.js)

- ✅ 评论列表显示
- ✅ 评论权限控制
- ✅ 登录用户评论
- ✅ 表单验证
- ✅ 回复功能
- ✅ 删除权限
- ✅ 评论元数据

### 响应式设计 (responsive.spec.js)

- ✅ 移动端布局
- ✅ 平板端布局
- ✅ 桌面端布局
- ✅ 移动端菜单
- ✅ 响应式图片
- ✅ 字体大小适应
- ✅ 触摸目标大小
- ✅ 无横向滚动

## 测试-修复循环

### 步骤 1: 运行测试

```bash
npm run test:e2e
```

### 步骤 2: 查看报告

```bash
npm run test:e2e:report
```

### 步骤 3: 调试失败测试

```bash
# 使用调试模式
npm run test:e2e:debug

# 或调试特定测试
npx playwright test tests/e2e/specs/home.spec.js --debug
```

### 步骤 4: 修复问题

根据错误信息修复代码。

### 步骤 5: 重新测试

```bash
# 只运行失败的测试
npx playwright test --grep @failed

# 或运行所有测试
npm run test:e2e
```

### 步骤 6: 迭代

重复步骤 2-5，直到所有测试通过。

## 测试最佳实践

### 1. 使用 Page Objects

```javascript
// ✅ 好的做法
const homePage = new HomePage(page);
await homePage.goto();
const posts = await homePage.getAllPosts();

// ❌ 避免
await page.goto('/');
const posts = await page.$$eval('.post-card', ...);
```

### 2. 使用语义化选择器

```javascript
// ✅ 好的做法
await page.click('[data-testid="submit-button"]');

// ❌ 避免 CSS 选择器
await page.click('button.btn-primary');
```

### 3. 使用显式等待

```javascript
// ✅ 好的做法
await page.waitForSelector('#element', { state: 'visible' });
await page.click('#element');

// ❌ 避免固定延迟
await page.waitForTimeout(5000);
```

### 4. 保持测试独立性

```javascript
// ✅ 每个测试独立
test('测试 A', async ({ page }) => {
  // 独立设置
});

test('测试 B', async ({ page }) => {
  // 独立设置
});

// ❌ 避免测试间依赖
test('测试 B', async ({ page }) => {
  // 依赖测试 A 的结果
});
```

### 5. 清理测试环境

```javascript
// ✅ 每个测试后清理
test.afterEach(async ({ page }) => {
  await CacheManager.clearBrowserCache(page);
});

// ✅ 每个测试前设置
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});
```

## 故障排查

### 问题 1: 服务器未启动

**错误**: `Browser: Target closed`

**解决**:
```bash
# 手动启动服务器
npm start

# 或使用自动启动
npm run test:e2e:setup
```

### 问题 2: 元素未找到

**错误**: `Error: strict mode violation`

**解决**:
```javascript
// 添加显式等待
await page.waitForSelector('#my-element', { state: 'visible' });
await page.click('#my-element');
```

### 问题 3: 测试不稳定

**解决**:
```javascript
// 增加重试次数
test.configure({ retries: 3 });

// 使用更宽松的等待
await page.waitForTimeout(1000);
```

### 问题 4: 缓存干扰

**解决**:
```javascript
// 每个测试前清空缓存
test.beforeEach(async ({ page }) => {
  await CacheManager.clearBrowserCache(page);
});
```

## 配置说明

### Playwright 配置 (tests/e2e/playwright.config.js)

```javascript
export default defineConfig({
  testDir: './e2e',           // 测试目录
  fullyParallel: true,         // 并行运行测试
  retries: process.env.CI ? 2 : 0,  // 重试次数
  workers: process.env.CI ? 1 : 2,   // Worker 数量
  baseURL: 'http://localhost:8787',  // 基础 URL
  
  webServer: {
    command: 'node start-dev.js',     // 启动命令
    url: 'http://localhost:8787',    // 服务器 URL
    reuseExistingServer: true,        // 重用现有服务器
    timeout: 120000,                 // 超时时间
  },
});
```

## 更多信息

详细文档请查看:
- [E2E 测试指南](../E2E_TEST_GUIDE.md)
- [README](../README.md)

## 许可证

MIT License
