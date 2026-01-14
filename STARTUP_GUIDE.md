# Cloudflare Blog 开发环境启动指南

## 跨平台启动脚本

现在项目提供了跨平台的启动脚本，支持 Windows、Linux 和 macOS。

### 主要启动方式

1. **使用 Node.js 脚本（推荐，跨平台）**：
   ```bash
   npm run start
   # 或
   node start-dev.js
   ```

2. **使用平台特定脚本**：
   - Windows: `start-dev.bat` 或 `start-dev-background.bat`
   - Linux/macOS: `start-dev.sh` 或 `start-dev-server.sh`

### 功能特性

新的跨平台脚本提供以下功能：

1. **环境检查**：
   - 检查 Node.js 是否安装
   - 检查 Wrangler 是否安装
   - 检查 Cloudflare 登录状态

2. **资源检查**（仅提示，非必需）：
   - 检查 D1 数据库
   - 检查 R2 存储桶
   - 检查 KV 命名空间

3. **自动迁移**：
   - 自动应用数据库迁移

4. **彩色输出**：
   - 使用彩色终端输出，更易阅读

5. **信号处理**：
   - 正确处理 Ctrl+C 等中断信号

### 快速开始

#### Windows 用户
```bash
# 方法1：使用批处理文件
start-dev.bat

# 方法2：使用 npm 脚本
npm run start

# 方法3：后台启动（新窗口）
start-dev-background.bat
```

#### Linux/macOS 用户
```bash
# 方法1：使用 shell 脚本
chmod +x start-dev.sh
./start-dev.sh

# 方法2：使用 npm 脚本
npm run start

# 方法3：直接运行 Node.js 脚本
node start-dev.js
```

### 环境要求

1. **Node.js**：v16 或更高版本
2. **Wrangler CLI**：已全局安装
   ```bash
   npm install -g wrangler
   ```
3. **Cloudflare 账户**：已登录
   ```bash
   wrangler login
   ```

### 访问地址

启动成功后，可以通过以下地址访问：

- **博客前台**：http://localhost:8787
- **管理后台**：http://localhost:8787/admin
- **默认登录账号**：admin / admin123

### 故障排除

1. **Wrangler 未安装**：
   ```bash
   npm install -g wrangler
   ```

2. **未登录 Cloudflare**：
   ```bash
   wrangler login
   ```

3. **数据库迁移失败**：
   - 检查网络连接
   - 确保已正确配置 wrangler.toml

4. **端口占用**：
   - 确保 8787 端口未被其他程序占用

### 开发命令

除了启动脚本，还可以使用以下命令：

```bash
# 仅启动开发服务器（不进行环境检查）
npm run dev

# 部署到生产环境
npm run deploy

# 运行所有测试
npm run test:all

# 运行 E2E 测试
npm run test:e2e
```

### 注意事项

1. 首次运行时可能需要创建 Cloudflare 资源（D1、R2、KV）
2. 脚本会提示需要手动更新的配置信息
3. 开发服务器默认使用本地数据库和存储
4. 按 Ctrl+C 可以安全停止服务器