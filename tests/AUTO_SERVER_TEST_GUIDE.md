# 自动启动服务器的测试指南

## 概述

本指南说明了如何使用自动启动开发服务器的前端测试。

## 新增功能

### 1. 自动服务器管理

前端测试现在包含以下功能：

- ✅ **自动启动开发服务器**：如果服务器未运行，测试脚本会自动启动 `npm run dev`
- ✅ **检测运行中的服务器**：如果服务器已在运行，测试脚本会直接使用
- ✅ **等待服务器就绪**：最多等待 30 秒，每秒检查一次
- ✅ **自动清理**：测试完成后自动关闭启动的服务器

### 2. 新的测试文件

| 测试文件 | 说明 | 原始版本 |
|---------|------|----------|
| `test-frontend-pages-with-server.mjs` | 前台页面测试（自动启动服务器） | `test-frontend-pages.mjs` |
| `test-admin-pages-with-server.mjs` | 后台页面测试（自动启动服务器） | `test-admin-pages.mjs` |
| `test-frontend-interactive-with-server.mjs` | 交互功能测试（自动启动服务器） | `test-frontend-interactive.mjs` |

## 运行测试

### 方式 1：使用 npm 脚本（推荐）

```bash
# 运行前台页面测试（自动启动服务器）
npm run test:frontend:auto

# 运行后台页面测试（自动启动服务器）
npm run test:admin:auto

# 运行交互功能测试（自动启动服务器）
npm run test:interactive:auto
```

### 方式 2：使用 PowerShell 脚本

```bash
# 运行所有前端测试（自动启动服务器）
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1
```

### 方式 3：直接运行节点脚本

```bash
# 运行前台页面测试
powershell -Command "node tests/test-frontend-pages-with-server.mjs"

# 运行后台页面测试
powershell -Command "node tests/test-admin-pages-with-server.mjs"

# 运行交互功能测试
powershell -Command "node tests/test-frontend-interactive-with-server.mjs"
```

## 使用原始版本（需要手动启动服务器）

如果你需要手动管理服务器，可以使用原始版本的测试：

### 1. 手动启动服务器

```bash
npm run dev
```

### 2. 初始化数据库（如果需要）

```bash
npm run db:local
```

### 3. 在另一个终端运行测试

```bash
# 使用原始版本测试
npm run test:frontend              # 前台页面测试
npm run test:admin                 # 后台页面测试
npm run test:frontend-interactive  # 交互功能测试
```

## 工作原理

### 自动启动流程

```
1. 检查服务器是否运行
   ↓
2. 如果服务器未运行 → 启动 npm run dev
   ↓
3. 等待服务器启动（最多30秒）
   ↓
4. 运行测试
   ↓
5. 测试完成 → 关闭服务器（仅当测试启动的服务器）
```

### 代码示例

```javascript
// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:8787/', {
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
  for (let i = 0; i < 30; i++) {
    if (await checkServer()) {
      console.log('✅ 开发服务器已启动！');
      return true;
    }
    await setTimeout(1000);
  }
  throw new Error('开发服务器启动超时');
}

// 启动开发服务器
async function startDevServer() {
  // 检查服务器是否已在运行
  if (await checkServer()) {
    console.log('✅ 开发服务器已在运行');
    return null;
  }

  // 启动服务器
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  return server;
}

// 测试完成后清理
async function cleanup(server) {
  if (server) {
    console.log('🛑 正在关闭开发服务器...');
    server.kill('SIGTERM');
    await setTimeout(1000);
  }
}
```

## 配置选项

### 服务器配置

可以在测试文件中修改以下配置：

```javascript
const API_BASE = 'http://localhost:8787';  // 服务器地址
const MAX_RETRIES = 30;                       // 最大重试次数
const RETRY_DELAY = 1000;                     // 重试间隔（毫秒）
```

### 超时配置

- **默认超时**：30 秒（`MAX_RETRIES * RETRY_DELAY`）
- **增加超时**：增加 `MAX_RETRIES` 或 `RETRY_DELAY`
- **减少超时**：减少 `MAX_RETRIES` 或 `RETRY_DELAY`

## 前置条件

### 必需条件

1. **Node.js 已安装**
   ```bash
   node --version
   ```

2. **项目依赖已安装**
   ```bash
   npm install
   ```

### 可选条件（后台测试需要）

3. **数据库已初始化**
   ```bash
   npm run db:local
   ```

4. **管理员账号已创建**
   - 默认账号：admin
   - 默认密码：admin123

## 测试输出示例

### 成功的测试运行

```
🎨 开始运行前台页面测试...

🚀 正在启动开发服务器...
✅ 开发服务器已在运行

📄 测试首页...
✅ 首页可以访问
✅ 首页包含必需元素
✅ 首页包含导航链接
✅ 首页包含搜索功能

📂 测试分类页面...
✅ 分类列表页可以访问
✅ 分类列表页包含标题

...

📊 测试总结:
   ✅ 通过: 13
   ❌ 失败: 0
   📈 总计: 13

🎉 所有前台页面测试通过！

🛑 正在关闭开发服务器...
```

### 需要登录的测试

```
⚙️  开始运行后台管理页面测试...

🚀 正在启动开发服务器...
✅ 开发服务器已在运行

⏳ 等待开发服务器启动...
.✅ 开发服务器已启动！

🔐 登录后台管理...
✅ 登录成功

📊 测试仪表盘...
✅ 仪表盘可以访问
...
```

## 故障排除

### 问题 1：服务器启动超时

**错误信息**：
```
开发服务器启动超时（超过 30 秒）
```

**解决方案**：
1. 检查 `npm run dev` 是否能正常启动
2. 增加超时配置
3. 检查端口 8787 是否被占用

### 问题 2：登录失败

**错误信息**：
```
登录失败，请确保数据库已初始化且管理员账号已创建
```

**解决方案**：
```bash
# 初始化数据库
npm run db:local

# 确认管理员账号存在
# 默认账号：admin / admin123
```

### 问题 3：测试失败但服务器运行正常

**可能原因**：
- 数据库未初始化
- 服务器配置问题
- 测试数据不一致

**解决方案**：
1. 检查服务器日志
2. 重新初始化数据库
3. 使用原始版本测试（手动启动服务器）

## 性能对比

| 测试类型 | 手动启动 | 自动启动 | 差异 |
|---------|----------|----------|------|
| 前台页面 | ~2秒 | ~5秒 | +3秒 |
| 后台页面 | ~5秒 | ~8秒 | +3秒 |
| 交互功能 | ~3秒 | ~6秒 | +3秒 |

**说明**：自动启动版本会增加约 3 秒的启动时间，但提供了更好的用户体验。

## 最佳实践

### 1. 日常开发

使用自动启动版本：
```bash
npm run test:frontend:auto
```

### 2. 持续开发

手动启动服务器并运行原始版本：
```bash
# 终端 1
npm run dev

# 终端 2
npm run test:frontend
npm run test:admin
```

### 3. CI/CD

在 CI/CD 环境中，建议使用自动启动版本，以便更好地管理服务器生命周期。

### 4. 调试测试

使用原始版本，手动管理服务器，便于调试：
```bash
# 手动启动服务器
npm run dev

# 在另一个终端运行测试
node tests/test-frontend-pages.mjs
```

## 与其他测试的对比

### 单元测试

- **特点**：无需服务器
- **运行速度**：快速（< 1 秒）
- **使用场景**：测试核心工具函数

### 集成测试（原始版本）

- **特点**：需要手动启动服务器
- **运行速度**：中等（1-5 秒）
- **使用场景**：测试 API 端点

### 前端测试（自动启动版本）

- **特点**：自动启动服务器
- **运行速度**：中等（4-8 秒）
- **使用场景**：测试页面渲染和交互

## 总结

### 优势

✅ **无需手动启动服务器**：测试脚本自动管理
✅ **更好的测试体验**：一键运行所有测试
✅ **自动清理**：测试完成后自动关闭服务器
✅ **智能检测**：检测服务器是否已在运行

### 使用建议

- **日常测试**：使用自动启动版本
- **持续开发**：使用原始版本，手动启动服务器
- **CI/CD**：使用自动启动版本

### 文件参考

- [前端测试指南](./FRONTEND_TEST_GUIDE.md) - 完整的前端测试指南
- [测试总结](../../COMPLETE_TEST_SUMMARY.md) - 完整测试系统总结
- [快速测试指南](../../QUICK_TEST.md) - 快速测试指南

---

**最后更新**：2026年1月11日
**版本**：v1.1.0
**状态**：生产就绪 ✅
