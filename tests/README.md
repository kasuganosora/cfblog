# 测试文档

## 概述

本项目包含完整的测试套件，包括单元测试和集成测试。

## 测试结构

```
tests/
├── unit/              # 单元测试
│   ├── test-utils.js   # 测试工具类
│   ├── auth.test.js   # 认证测试
│   ├── response.test.js # 响应测试
│   ├── cache.test.js   # 缓存测试
│   └── run-tests.js   # 单元测试运行器
├── integration/        # 集成测试
│   ├── api.test.js    # API 集成测试
│   └── run-tests.js  # 集成测试运行器
└── README.md          # 本文档
```

## 运行测试

### 1. 统一测试运行器（推荐）

使用统一测试运行器可以方便地运行所有测试：

```bash
# 运行所有测试
node test-runner.js

# 只运行单元测试
node test-runner.js unit

# 只运行集成测试
node test-runner.js integration

# 只运行 API 测试
node test-runner.js api

# 只运行简单测试
node test-runner.js simple
```

### 2. 使用 npm scripts

```bash
# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 API 测试
npm test

# 运行所有测试
npm run test:all

# 运行简单测试
npm run test:simple
```

### 3. 直接运行测试文件

```bash
# 运行单元测试
node tests/unit/run-tests.js

# 运行集成测试
node tests/integration/run-tests.js

# 运行 API 测试
node test-api.js

# 运行简单测试
node test-simple.js
```

## 测试类型

### 单元测试

单元测试测试独立的代码模块，不依赖外部服务：

- **认证工具测试** (`auth.test.js`)
  - 密码哈希和验证
  - JWT 令牌生成和验证
  - 令牌过期处理

- **响应工具测试** (`response.test.js`)
  - 成功响应
  - 错误响应
  - 未授权响应
  - 未找到响应

- **缓存工具测试** (`cache.test.js`)
  - 获取缓存
  - 设置缓存
  - 删除缓存

### 集成测试

集成测试测试多个组件之间的交互，需要运行中的开发服务器：

- **API 集成测试** (`api.test.js`)
  - 前台页面访问
  - 用户认证流程
  - 分类管理
  - 标签管理
  - 文章管理（增删改查）
  - 评论功能
  - 反馈功能
  - 搜索功能

### API 测试

API 测试是端到端的功能测试：

- 用户登录和认证
- 创建分类和标签
- 创建和管理文章
- 提交和管理评论
- 提交反馈
- 搜索功能

## 测试前准备

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

集成测试需要运行中的开发服务器：

```bash
npm run dev
```

### 3. 准备测试数据库

运行数据库迁移：

```bash
npm run db:local
```

确保管理员用户已创建：

```bash
# 用户名: admin
# 密码: admin123
```

## 测试覆盖率

### 单元测试覆盖

- ✅ 认证工具：密码哈希、令牌生成、令牌验证、过期处理
- ✅ 响应工具：成功、错误、未授权、未找到响应
- ✅ 缓存工具：获取、设置、删除缓存

### 集成测试覆盖

- ✅ 前台页面：首页、关于页、联系页
- ✅ 用户认证：登录、获取用户信息、权限验证
- ✅ 分类管理：创建、列表、更新、删除
- ✅ 标签管理：创建、列表、删除
- ✅ 文章管理：创建、列表、详情、更新、删除
- ✅ 评论功能：创建、列表、删除
- ✅ 反馈功能：提交、列表
- ✅ 搜索功能：搜索文章、空搜索

## 测试断言

测试工具提供以下断言方法：

```javascript
// 基本断言
assert.equal(actual, expected, message)
assert.notEqual(actual, expected, message)
assert.deepEqual(actual, expected, message)
assert.isTrue(value, message)
assert.isFalse(value, message)

// 空值断言
assert.isNull(value, message)
assert.isNotNull(value, message)
assert.isUndefined(value, message)
assert.isDefined(value, message)

// 异常断言
assert.throws(fn, message)
assert.doesNotThrow(fn, message)

// 其他断言
assert.contains(haystack, needle, message)
assert.length(array, expected, message)
```

## Mock 对象

测试工具提供以下 Mock 对象：

```javascript
// Mock 环境对象
const env = mock.env();

// Mock 请求对象
const request = mock.request('GET', 'http://test.com', { key: 'value' });
```

## 编写新测试

### 添加单元测试

1. 在 `tests/unit/` 目录创建新的测试文件
2. 导入测试工具和要测试的模块
3. 编写测试函数
4. 在 `tests/unit/run-tests.js` 中添加测试

示例：

```javascript
import { TestRunner, assert } from './test-utils.js';

export async function runMyTests() {
  console.log('测试我的模块...\n');

  await testMyFunction();
  await testMyOtherFunction();

  console.log('\n✅ 测试完成');
}

async function testMyFunction() {
  const result = myFunction();
  assert.equal(result, expected, '函数应该返回预期结果');
}
```

### 添加集成测试

1. 在 `tests/integration/` 目录创建新的测试文件
2. 使用 `APITestRunner` 类
3. 编写测试方法

示例：

```javascript
import { APITestRunner } from './api.test.js';

const runner = new APITestRunner();

await runner.test('我的功能测试', async () => {
  const res = await runner.request('/api/my-endpoint', 'POST', {
    data: 'test'
  });
  runner.assert(res.success, '请求应该成功');
});
```

## 常见问题

### 1. 集成测试失败

**问题**：集成测试无法连接到服务器

**解决方案**：
- 确保开发服务器正在运行：`npm run dev`
- 检查服务器地址是否为 `http://localhost:8787`
- 确认防火墙没有阻止连接

### 2. 单元测试失败

**问题**：单元测试运行失败

**解决方案**：
- 检查是否有语法错误
- 确认所有依赖都已安装
- 查看错误消息定位具体问题

### 3. 数据库连接失败

**问题**：测试无法连接到数据库

**解决方案**：
- 运行数据库迁移：`npm run db:local`
- 检查 `wrangler.toml` 配置
- 确认 D1 数据库已创建

## 最佳实践

1. **测试独立**：每个测试应该独立运行，不依赖其他测试
2. **清理资源**：测试后清理创建的数据
3. **明确断言**：使用清晰的断言消息
4. **测试边界**：测试边界条件和错误情况
5. **及时更新**：代码变更时及时更新测试

## 持续集成

可以在 CI/CD 流程中集成测试：

```yaml
# GitHub Actions 示例
- name: Run unit tests
  run: npm run test:unit

- name: Start dev server
  run: npm run dev &
  wait-on http://localhost:8787

- name: Run integration tests
  run: npm run test:integration
```

## 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Undici Fetch API](https://undici.nodejs.org/#/)

## 支持

如果遇到问题或需要帮助，请：
1. 查看测试输出中的错误信息
2. 检查本文档的常见问题部分
3. 查看 README.md 中的项目文档
