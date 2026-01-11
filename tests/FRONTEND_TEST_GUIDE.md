# 前端测试指南

## 概述

本指南详细说明了 cfblog 项目的前端测试，包括前台页面测试、后台管理页面测试和交互功能测试。

## 测试类型

### 1. 前台页面测试 (`test-frontend-pages.mjs`)

测试前台博客的所有主要页面，包括：

#### 首页测试
- ✅ 首页可以访问
- ✅ 首页包含必需元素（header, footer, main）
- ✅ 首页包含导航链接
- ✅ 首页包含搜索功能

#### 分类页面测试
- ✅ 分类列表页可以访问
- ✅ 分类列表页包含标题

#### 标签页面测试
- ✅ 标签列表页可以访问
- ✅ 标签列表页包含标题

#### 文章详情页测试
- ✅ 搜索结果页可以访问
- ✅ 搜索页面包含搜索表单

#### 搜索页面测试
- ✅ 搜索页面可以访问
- ✅ 搜索页面包含搜索框

#### 留言页面测试
- ✅ 留言页面可以访问
- ✅ 留言页面包含表单

#### 登录页面测试
- ✅ 登录页面可以访问
- ✅ 登录页面包含表单

### 2. 后台管理页面测试 (`test-admin-pages.mjs`)

测试后台管理系统的所有主要页面，包括：

#### 登录认证
- 自动登录获取认证令牌
- 验证登录功能

#### 仪表盘测试
- ✅ 仪表盘可以访问
- ✅ 仪表盘包含统计卡片
- ✅ 仪表盘包含侧边栏
- ✅ 仪表盘包含菜单项

#### 文章管理测试
- ✅ 文章列表页可以访问
- ✅ 文章创建页可以访问
- ✅ 文章列表页包含表格
- ✅ 文章创建页包含表单

#### 分类管理测试
- ✅ 分类列表页可以访问
- ✅ 分类列表页包含分类列表

#### 标签管理测试
- ✅ 标签列表页可以访问
- ✅ 标签列表页包含标签列表

#### 评论管理测试
- ✅ 评论列表页可以访问
- ✅ 评论列表页包含评论列表

#### 留言管理测试
- ✅ 留言列表页可以访问
- ✅ 留言列表页包含留言列表

#### 附件管理测试
- ✅ 附件列表页可以访问
- ✅ 附件列表页包含上传区域

### 3. 前端交互功能测试 (`test-frontend-interactive.mjs`)

测试前端的 JavaScript 交互功能：

#### 搜索功能测试
- ✅ 搜索 API 可以访问
- ✅ 搜索返回数据格式正确
- ✅ 搜索页面包含搜索脚本

#### 评论功能测试
- ✅ 获取评论列表 API 可以访问
- ✅ 评论列表返回数据格式正确
- ✅ 文章详情页包含评论表单脚本

#### 留言功能测试
- ✅ 留言页面可以访问
- ✅ 提交留言 API 可以访问
- ✅ 留言页面包含表单验证脚本

#### 表单验证测试
- ✅ 登录页面包含表单
- ✅ 登录 API 验证功能

## 运行测试

### 前置条件

在运行前端测试之前，确保：

1. **开发服务器正在运行**
   ```bash
   npm run dev
   ```

2. **数据库已初始化**
   ```bash
   npm run db:local
   ```

3. **管理员账号已创建**
   - 默认账号：admin
   - 默认密码：admin123

### 运行单个测试

#### 运行前台页面测试
```bash
npm run test:frontend
# 或
powershell -Command "node tests/test-frontend-pages.mjs"
```

#### 运行后台页面测试
```bash
npm run test:admin
# 或
powershell -Command "node tests/test-admin-pages.mjs"
```

#### 运行交互功能测试
```bash
npm run test:frontend-interactive
# 或
powershell -Command "node tests/test-frontend-interactive.mjs"
```

### 运行所有前端测试

#### 使用 PowerShell 脚本（推荐）
```bash
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1
```

#### 手动运行所有测试
```bash
# 1. 运行前台页面测试
powershell -Command "node tests/test-frontend-pages.mjs"

# 2. 运行后台页面测试
powershell -Command "node tests/test-admin-pages.mjs"

# 3. 运行交互功能测试
powershell -Command "node tests/test-frontend-interactive.mjs"
```

## 测试文件说明

### 测试文件结构

```
tests/
├── test-frontend-pages.mjs        # 前台页面测试
├── test-admin-pages.mjs           # 后台页面测试
├── test-frontend-interactive.mjs  # 前端交互功能测试
├── test-frontend-all.mjs          # 前端测试综合运行器
└── run-frontend-tests.ps1         # PowerShell 测试运行脚本
```

### 测试类设计

每个测试文件都包含一个测试类：

#### FrontendTestRunner
```javascript
class FrontendTestRunner {
  constructor()                    // 初始化测试结果
  async test(name, fn)            // 执行单个测试
  async run()                      // 运行所有测试
  async fetchPage(path)           // 获取页面内容
  printSummary()                  // 打印测试总结

  // 页面测试方法
  async testHomePage()            // 测试首页
  async testCategoryPages()       // 测试分类页面
  async testTagPages()            // 测试标签页面
  async testPostPage()            // 测试文章页面
  async testSearchPage()          // 测试搜索页面
  async testFeedbackPage()        // 测试留言页面
  async testLoginPage()           // 测试登录页面
}
```

#### AdminTestRunner
```javascript
class AdminTestRunner {
  constructor()                    // 初始化测试结果
  async test(name, fn)            // 执行单个测试
  async run()                      // 运行所有测试
  async login()                    // 登录获取 token
  async fetchPage(path)           // 获取页面内容（带认证）
  printSummary()                  // 打印测试总结

  // 页面测试方法
  async testDashboard()           // 测试仪表盘
  async testPostManagement()      // 测试文章管理
  async testCategoryManagement()  // 测试分类管理
  async testTagManagement()       // 测试标签管理
  async testCommentManagement()   // 测试评论管理
  async testFeedbackManagement()  // 测试留言管理
  async testAttachmentManagement() // 测试附件管理
}
```

#### InteractiveTestRunner
```javascript
class InteractiveTestRunner {
  constructor()                    // 初始化测试结果
  async test(name, fn)            // 执行单个测试
  async run()                      // 运行所有测试
  async request(path, method, body, headers)  // 发送 API 请求
  printSummary()                  // 打印测试总结

  // 功能测试方法
  async testSearchFeature()       // 测试搜索功能
  async testCommentFeature()     // 测试评论功能
  async testFeedbackFeature()    // 测试留言功能
  async testFormValidation()     // 测试表单验证
}
```

## 测试断言

前端测试使用的断言方法：

```javascript
// 相等断言
assert.equal(actual, expected, message)

// 不等断言
assert.notEqual(actual, expected, message)

// 真值断言
assert.isTrue(value, message)

// 假值断言
assert.isFalse(value, message)

// 包含断言
assert.contains(haystack, needle, message)

// 长度断言
assert.length(array, expected, message)
```

## 测试覆盖

### 前台页面覆盖

| 页面 | URL | 测试项 |
|------|-----|--------|
| 首页 | / | 页面访问、HTML 元素、导航链接、搜索功能 |
| 分类列表 | /category/all | 页面访问、标题显示 |
| 标签列表 | /tag/all | 页面访问、标题显示 |
| 搜索页面 | /search | 页面访问、搜索表单 |
| 留言页面 | /feedback | 页面访问、留言表单 |
| 登录页面 | /login | 页面访问、登录表单 |

### 后台页面覆盖

| 页面 | URL | 测试项 |
|------|-----|--------|
| 仪表盘 | /admin | 页面访问、统计卡片、侧边栏、菜单 |
| 文章列表 | /admin/posts | 页面访问、表格显示 |
| 文章创建 | /admin/posts/create | 页面访问、表单元素 |
| 分类管理 | /admin/categories | 页面访问、分类列表 |
| 标签管理 | /admin/tags | 页面访问、标签列表 |
| 评论管理 | /admin/comments | 页面访问、评论列表 |
| 留言管理 | /admin/feedbacks | 页面访问、留言列表 |
| 附件管理 | /admin/attachments | 页面访问、上传区域 |

### 交互功能覆盖

| 功能 | API 端点 | 测试项 |
|------|----------|--------|
| 搜索 | /api/search | API 访问、数据格式、脚本加载 |
| 评论 | /api/comment | API 访问、数据格式、表单脚本 |
| 留言 | /api/feedback | API 访问、表单脚本 |
| 登录验证 | /api/user/login | 表单验证、错误处理 |

## 常见问题

### 1. 测试失败：无法连接到开发服务器

**问题**：
```
❌ 无法连接到开发服务器
   请确保开发服务器正在运行: npm run dev
```

**解决方案**：
```bash
# 启动开发服务器
npm run dev

# 等待服务器启动完成后，在另一个终端运行测试
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1
```

### 2. 后台测试失败：登录失败

**问题**：
```
❌ 登录后台管理...
登录失败，请确保数据库已初始化且管理员账号已创建
```

**解决方案**：
```bash
# 初始化数据库
npm run db:local

# 确保 dev.vars 中包含正确的管理员密码
# 默认账号：admin
# 默认密码：admin123
```

### 3. PowerShell 执行策略错误

**问题**：
```
无法加载文件 run-frontend-tests.ps1，因为在此系统上禁止运行脚本
```

**解决方案**：
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或使用完整命令
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1
```

### 4. Node.js 命令执行受限

**问题**：
直接使用 `node` 命令无法执行测试

**解决方案**：
```bash
# 使用 PowerShell 脚本
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1

# 或使用 npm 脚本
npm run test:frontend
npm run test:admin
npm run test:frontend-interactive
```

## 扩展测试

### 添加新的页面测试

在 `test-frontend-pages.mjs` 或 `test-admin-pages.mjs` 中添加新的测试方法：

```javascript
async testNewPage() {
  console.log('📄 测试新页面...');

  await this.test('新页面可以访问', async () => {
    const { status } = await this.fetchPage('/new-page');
    assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
  });

  await this.test('新页面包含必需元素', async () => {
    const { html } = await this.fetchPage('/new-page');
    assert.contains(html, '必需的元素', '应该包含特定元素');
  });
}
```

然后在 `run()` 方法中调用：

```javascript
async run() {
  // ... 其他测试
  await this.testNewPage();
  // ...
}
```

### 添加新的交互功能测试

在 `test-frontend-interactive.mjs` 中添加新的功能测试：

```javascript
async testNewFeature() {
  console.log('✨ 测试新功能...');

  await this.test('新功能 API 可以访问', async () => {
    const { status } = await this.request('/api/new-feature');
    assert.equal(status, 200, `状态码应该是 200，实际是 ${status}`);
  });
}
```

## 最佳实践

1. **测试独立性**：每个测试应该独立运行，不依赖其他测试
2. **清晰的测试名称**：使用描述性的测试名称，如"首页可以访问"
3. **有意义的断言消息**：提供清晰的错误消息
4. **测试覆盖**：确保覆盖所有主要功能点
5. **定期运行**：在开发过程中定期运行测试
6. **CI/CD 集成**：考虑将测试集成到 CI/CD 流程中

## 相关文档

- [测试总结](./TEST_SUMMARY.md) - 测试套件概述
- [测试报告](./TESTING_REPORT.md) - 最新测试运行结果
- [测试修复总结](./TEST_FIX_SUMMARY.md) - 单元测试修复详情
- [快速测试指南](./QUICK_TEST.md) - 快速开始测试
- [集成测试](./integration/api.test.js) - API 集成测试
