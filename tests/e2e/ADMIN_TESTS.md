# 管理后台 E2E 测试文档

## 概述

本文档描述了针对管理后台的完整端到端 (E2E) 测试套件。该测试套件使用 Playwright 编写，覆盖了管理后台的所有主要功能。

## 测试文件

- `admin-complete.spec.js` - 完整的管理后台测试套件
- `admin-production.spec.js` - 生产环境测试
- `admin-flow.spec.js` - 基础流程测试

## 环境变量配置

测试使用以下环境变量：

```bash
# 基础 URL（必填）
BASE_URL=http://localhost:8787

# 管理员凭证（可选，有默认值）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 快速开始

### 1. 启动开发服务器

```bash
# Windows
.\start-dev.bat

# PowerShell
.\start-dev.ps1

# Linux/Mac
./start-dev.sh
```

### 2. 运行完整测试套件

```bash
# Windows
.\run-admin-e2e-tests.bat

# PowerShell
.\run-admin-e2e-tests.ps1

# 或直接使用 Playwright
npx playwright test tests/e2e/admin-complete.spec.js
```

### 3. 查看测试报告

```bash
npx playwright show-report
```

## 测试覆盖范围

### 1. 登录功能测试 (6 个测试)

- ✓ 登录页面正确显示
- ✓ 正确凭据可以登录
- ✓ 错误用户名无法登录
- ✓ 错误密码无法登录
- ✓ 空用户名和密码无法登录
- ✓ 登录成功显示欢迎信息

### 2. 仪表板测试 (7 个测试)

- ✓ 仪表板页面可以访问
- ✓ 仪表板显示统计卡片
- ✓ 仪表板显示文章统计
- ✓ 仪表板显示评论统计
- ✓ 仪表板显示用户统计
- ✓ 仪表板有退出登录按钮

### 3. 文章管理测试 (9 个测试)

- ✓ 文章列表页面可以访问
- ✓ 文章列表显示表格或空消息
- ✓ 文章列表有状态过滤器
- ✓ 文章新建页面可以访问
- ✓ 文章编辑页面包含必要表单字段
- ✓ 文章列表页面有新建按钮
- ✓ 可以筛选已发布的文章
- ✓ 可以筛选草稿文章

### 4. 分类管理测试 (4 个测试)

- ✓ 分类列表页面可以访问
- ✓ 分类列表显示表格或空消息
- ✓ 分类列表有新建按钮
- ✓ 分类表格显示必要字段

### 5. 标签管理测试 (3 个测试)

- ✓ 标签列表页面可以访问
- ✓ 标签列表显示表格或空消息
- ✓ 标签列表有新建按钮

### 6. 评论管理测试 (6 个测试)

- ✓ 评论列表页面可以访问
- ✓ 评论列表显示表格或空消息
- ✓ 评论列表有状态过滤器
- ✓ 可以筛选待审核评论
- ✓ 可以筛选已批准评论

### 7. 用户管理测试 (5 个测试)

- ✓ 用户列表页面可以访问
- ✓ 用户列表显示表格或空消息
- ✓ 用户列表有角色过滤器
- ✓ 用户列表有状态过滤器
- ✓ 用户表格显示必要字段

### 8. 反馈管理测试 (3 个测试)

- ✓ 反馈列表页面可以访问
- ✓ 反馈列表显示表格或空消息
- ✓ 反馈列表有状态过滤器

### 9. 附件管理测试 (3 个测试)

- ✓ 附件列表页面可以访问
- ✓ 附件列表显示表格或空消息
- ✓ 附件页面有上传区域

### 10. 系统设置测试 (5 个测试)

- ✓ 系统设置页面可以访问
- ✓ 系统设置有保存按钮
- ✓ 系统设置包含基本设置部分
- ✓ 系统设置包含文章设置部分
- ✓ 系统设置包含评论设置部分

### 11. 导航功能测试 (4 个测试)

- ✓ 可以从仪表板导航到文章管理
- ✓ 可以从仪表板导航到分类管理
- ✓ 可以从仪表板导航到标签管理
- ✓ 可以从仪表板导航到评论管理

### 12. 认证和权限测试 (2 个测试)

- ✓ 未登录访问管理页面应重定向到登录页
- ✓ 退出登录后需要重新认证

### 13. API 功能测试 (10 个测试)

- ✓ 登录 API 正常工作
- ✓ 文章列表 API 正常工作
- ✓ 分类列表 API 正常工作
- ✓ 标签列表 API 正常工作
- ✓ 评论列表 API 正常工作
- ✓ 用户列表 API 正常工作
- ✓ 反馈列表 API 正常工作
- ✓ 设置列表 API 正常工作
- ✓ 错误的登录凭据返回错误
- ✓ 空用户名或密码返回错误

### 14. 响应式设计测试 (4 个测试)

- ✓ 仪表板在桌面端显示正常
- ✓ 仪表板在平板端显示正常
- ✓ 仪表板在移动端显示正常
- ✓ 文章管理在移动端可访问

### 15. 错误处理测试 (3 个测试)

- ✓ 不存在的页面返回 404
- ✓ 文章编辑页面访问不存在的文章应友好处理
- ✓ 错误的 API 参数返回错误

### 16. 性能测试 (3 个测试)

- ✓ 仪表板加载时间合理（< 5秒）
- ✓ 文章列表加载时间合理（< 5秒）
- ✓ 分类列表加载时间合理（< 5秒）

**总计: 77 个测试用例**

## 测试结构

```
tests/e2e/
├── admin-complete.spec.js      # 完整测试套件（77 个测试）
├── admin-production.spec.js   # 生产环境测试
├── admin-flow.spec.js         # 基础流程测试
├── album-flow.spec.js         # 相册流程测试
├── guest-flow.spec.js         # 访客流程测试
├── interaction-flow.spec.js   # 交互流程测试
└── vote-flow.spec.js          # 投票流程测试
```

## 测试分组

测试按照以下逻辑分组：

1. **功能分组** - 按管理功能模块（登录、仪表板、文章等）
2. **API 分组** - 专门测试 API 端点
3. **UI 分组** - 测试用户界面和交互
4. **性能分组** - 测试页面加载性能
5. **安全分组** - 测试认证和权限

## 运行特定测试

### 运行单个测试组

```bash
# 只运行登录测试
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 登录功能"

# 只运行文章管理测试
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 文章管理"
```

### 运行特定浏览器

```bash
# 只在 Chrome 中运行
npx playwright test tests/e2e/admin-complete.spec.js --project=chromium

# 只在 Firefox 中运行
npx playwright test tests/e2e/admin-complete.spec.js --project=firefox
```

### 调试模式

```bash
# 以调试模式运行（打开 Playwright Inspector）
npx playwright test tests/e2e/admin-complete.spec.js --debug

# 显示浏览器窗口
npx playwright test tests/e2e/admin-complete.spec.js --headed
```

## 测试配置

测试配置在 `playwright.config.js` 中：

- **超时设置**: 动作超时 10 秒，导航超时 30 秒
- **重试机制**: CI 环境下失败后重试 2 次
- **截图**: 仅在测试失败时截图
- **视频**: 仅在测试失败时录制
- **追踪**: 在首次重试时收集追踪信息

## 故障排查

### 常见问题

1. **开发服务器未启动**
   ```
   解决方法：先运行 .\start-dev.bat 启动开发服务器
   ```

2. **登录失败**
   ```
   解决方法：检查 ADMIN_USERNAME 和 ADMIN_PASSWORD 环境变量
   ```

3. **测试超时**
   ```
   解决方法：检查网络连接，或增加 playwright.config.js 中的超时时间
   ```

4. **API 返回 401**
   ```
   解决方法：确保登录功能正常，token 正确设置
   ```

## 持续集成

在 CI/CD 环境中运行测试：

```bash
# 设置环境变量
export BASE_URL=http://localhost:8787
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin123

# 运行测试
npx playwright test tests/e2e/admin-complete.spec.js

# 生成报告
npx playwright show-report
```

## 维护指南

### 添加新测试

1. 在 `admin-complete.spec.js` 中添加新的测试用例
2. 使用 `test.describe()` 组织相关的测试
3. 为每个测试提供清晰的描述
4. 使用有意义的断言

### 修改现有测试

1. 更新测试以反映 UI 或功能的变化
2. 保持测试的独立性和可重复性
3. 确保测试在所有浏览器中都能通过

### 测试最佳实践

1. **独立性** - 每个测试应该独立运行，不依赖其他测试
2. **清晰的断言** - 使用明确、有意义的断言
3. **等待策略** - 使用 Playwright 的自动等待或显式等待
4. **选择性器** - 使用稳定的选择器，避免使用脆弱的选择器
5. **错误处理** - 适当地处理异常情况

## 测试报告

测试运行后，可以在以下位置查看报告：

- **HTML 报告**: `playwright-report/index.html`
- **JSON 报告**: `test-results/e2e-results.json`
- **失败截图**: `test-results/<test-name>-failure.png`
- **失败视频**: `test-results/<test-name>/video.webm`

## 联系和支持

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 提交 Pull Request
- 查阅项目文档
