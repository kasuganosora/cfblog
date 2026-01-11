# 端到端（E2E）测试文档

## 概述

本项目的 E2E 测试使用 Playwright 框架，测试用户在真实浏览器中的完整交互流程。

## 测试文件

### 1. `guest-flow.spec.js` - 访客浏览流程
测试未登录用户的完整浏览体验：

- 首页浏览
- 分类列表浏览
- 标签列表浏览
- 文章搜索
- 关于页面访问
- 联系页面访问
- 留言页面访问
- 登录页面访问
- 页面间导航
- 响应式设计（移动/平板/桌面）
- 页面加载性能
- 可访问性检查

### 2. `admin-flow.spec.js` - 管理员流程
测试登录后的管理功能：

- 管理员登录（成功/失败）
- 文章管理（创建/查看列表）
- 分类管理（访问/创建）
- 标签管理（访问）
- 仪表盘访问
- 评论管理访问
- 反馈管理访问
- 管理员注销

### 3. `interaction-flow.spec.js` - 交互功能流程
测试各种交互功能：

- 搜索功能（关键词搜索/响应时间/空搜索）
- 留言功能（提交/验证/邮箱格式）
- 登录功能（输入类型/成功跳转/错误消息）
- 表单交互（填写/按钮状态）
- 页面导航（链接跳转/前进后退）
- 页面滚动和交互
- 键盘交互（Tab 导航/Enter 提交）
- 视觉反馈（链接悬停/按钮点击）

## 安装依赖

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## 运行测试

### 运行所有 E2E 测试
```bash
npm run test:e2e
```

### 在特定浏览器运行
```bash
# 仅 Chrome
npm run test:e2e:chromium

# 仅 Firefox
npm run test:e2e:firefox

# 仅 Safari
npm run test:e2e:webkit
```

### 运行特定测试文件
```bash
# 仅访客流程
npx playwright test guest-flow.spec.js

# 仅管理员流程
npx playwright test admin-flow.spec.js

# 仅交互功能
npx playwright test interaction-flow.spec.js
```

### 运行特定测试
```bash
# 运行匹配名称的测试
npx playwright test -g "登录"

# 运行第 3 个测试
npx playwright test --project=chromium --grep "管理员可以成功登录"
```

### 调试模式
```bash
# 显示浏览器窗口
npx playwright test --debug

# 慢动作模式
npx playwright test --headed --slow-mo=1000
```

### 生成测试报告
```bash
# HTML 报告
npx playwright show-report

# 报告会在测试后自动生成在 test-results 目录
```

## 测试覆盖

### 浏览器覆盖
- ✅ Chrome (Chromium)
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### 设备覆盖
- ✅ 桌面设备 (1920x1080)
- ✅ 平板设备 (768x1024)
- ✅ 移动设备 (375x667)

### 功能覆盖
- ✅ 用户认证（登录/注销）
- ✅ 内容浏览（首页/分类/标签）
- ✅ 内容搜索
- ✅ 表单提交（留言/反馈）
- ✅ 管理功能（仪表盘/内容管理）
- ✅ 页面导航
- ✅ 响应式设计
- ✅ 可访问性
- ✅ 性能指标

## 测试环境

### 开发环境
测试会自动启动 `npm run dev` 服务器，运行在 `http://localhost:8787`

### 环境变量
可以通过环境变量自定义测试配置：

```bash
# 设置基础 URL
export BASE_URL="http://localhost:8787"

# 设置并发数
export CI=true

# 运行测试
npm run test:e2e
```

## 配置说明

`playwright.config.js` 包含以下配置：

- **测试目录**: `./tests/e2e`
- **并发运行**: 默认启用
- **重试次数**: CI 环境下 2 次
- **报告格式**: HTML, List, JSON
- **截图**: 仅在失败时捕获
- **视频**: 仅在失败时录制
- **超时设置**: 操作 10s，导航 30s

## 持续集成

在 CI/CD 流程中运行 E2E 测试：

```yaml
# GitHub Actions 示例
- name: Install Playwright
  run: npm ci && npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

## 最佳实践

### 编写新测试
1. 使用描述性的测试名称
2. 每个测试关注一个功能点
3. 使用 `expect()` 进行断言
4. 等待网络空闲后再断言
5. 使用页面定位器而非脆弱的选择器

### 示例测试
```javascript
test('用户可以登录', async ({ page }) => {
  await page.goto('/login');
  
  // 填写表单
  await page.fill('input[type="password"]', 'password');
  
  // 提交
  await page.click('button[type="submit"]');
  
  // 等待并断言
  await page.waitForURL(/dashboard/);
  expect(page.url()).toContain('/dashboard');
});
```

### 调试测试
1. 使用 `--debug` 模式
2. 添加 `page.pause()` 暂停执行
3. 使用 `page.screenshot()` 截图
4. 检查控制台日志

## 故障排除

### 服务器未启动
```bash
# 确保开发服务器在运行
npm run dev

# 或让 Playwright 自动启动（默认行为）
npm run test:e2e
```

### 测试超时
- 增加 `actionTimeout` 和 `navigationTimeout`
- 检查网络连接
- 添加 `page.waitForLoadState('networkidle')`

### 元素未找到
- 使用 Playwright Inspector 定位元素
- 添加等待：`await page.waitForSelector()`
- 检查元素是否在 iframe 中

## 相关资源

- [Playwright 文档](https://playwright.dev/)
- [最佳实践](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-playwright)
