# Cloudflare Blog

基于 Cloudflare Workers、R2、D1 和 KV 构建的博客平台。

## 功能特性

- 多用户支持（管理员、投稿者）
- 文章管理（发布、编辑、删除）
- 评论系统
- 分类和标签
- 搜索功能
- 反馈系统
- Sitemap 生成
- 附件管理
- 前台展示和后台管理

## 技术栈

- **Cloudflare Workers**: 服务器less 计算平台
- **R2**: 对象存储，用于存储文章正文和附件
- **D1**: SQL 数据库，存储用户、评论和其他数据
- **KV**: 键值存储，用于缓存
- **Node.js**: 开发环境
- **Wrangler**: Cloudflare 开发工具

## 项目结构

```
cfblog/
├── src/                  # 源代码
│   ├── index.js         # 主入口文件
│   ├── middleware/      # 中间件
│   │   ├── auth.js      # 认证中间件
│   │   └── cors.js      # CORS 中间件
│   ├── models/          # 数据模型
│   │   ├── BaseModel.js # 基础模型类
│   │   └── User.js      # 用户模型
│   ├── routes/          # 路由处理
│   │   ├── user.js      # 用户路由
│   │   ├── post.js      # 文章路由
│   │   └── ...
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
│       ├── auth.js      # 认证工具
│       ├── cache.js     # 缓存工具
│       ├── db.js        # 数据库工具
│       ├── response.js  # 响应工具
│       └── storage.js   # 存储工具
├── static/              # 静态文件
│   └── db/              # 数据库迁移文件
├── tpls/                # 前端模板
├── wrangler.toml        # Wrangler 配置
├── dev.vars.example     # 环境变量示例
└── package.json         # 项目依赖
```

## 开发指南

### 环境准备

1. 安装 Node.js
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 登录 Cloudflare: `wrangler login`

### 本地开发

1. 克隆项目
2. 安装依赖: `npm install`
3. 复制环境变量文件: `cp dev.vars.example dev.vars`
4. 修改 `dev.vars` 中的变量值

#### 快速启动

##### Windows 用户 (推荐使用后台启动)
```bash
# 后台启动 (推荐) - 服务器在后台运行，方便管理
start-dev-background.bat

# 停止后台服务器
stop-dev.bat

# 重启服务器
restart-dev.bat

# 交互式前台启动 (按 Ctrl+C 停止)
start-dev.bat
```

##### Mac/Linux 用户
```bash
# 给脚本添加执行权限
chmod +x start-dev.sh start-dev-background.sh stop-dev.sh restart-dev.sh

# 后台启动 (推荐)
./start-dev-background.sh

# 停止后台服务器
./stop-dev.sh

# 重启服务器
./restart-dev.sh

# 交互式前台启动 (按 Ctrl+C 停止)
./start-dev.sh
```

##### 服务器管理
- **查看日志**: 后台启动时，日志保存在 `logs/` 目录下
- **检查状态**: 访问 http://localhost:8787 查看服务器是否运行
- **终止进程**: 使用 `stop-dev` 脚本或查找占用端口 8787 的进程

#### 手动启动

1. 创建 D1 数据库: `wrangler d1 create cfblog-database`
2. 复制返回的 database_id 到 wrangler.toml
3. 创建 R2 存储桶: `wrangler r2 bucket create cfblog-storage`
4. 创建 KV 命名空间: `wrangler kv:namespace create "CACHE"`
5. 复制返回的 id 到 wrangler.toml
6. 本地迁移: `wrangler d1 migrations apply cfblog-database --local`
7. 启动开发服务器: `npm run dev`

#### 访问应用

- 前台: http://localhost:8787
- 后台: http://localhost:8787/admin
- 登录账号: admin / admin123

### 数据库迁移

1. 创建 D1 数据库: `wrangler d1 create cfblog-database`
2. 复制返回的 database_id 到 wrangler.toml
3. 本地迁移: `npm run db:local`
4. 生产迁移: `npm run db:migrate`

### 部署

1. 设置生产环境 Secrets:
   ```
   wrangler secret put JWT_SECRET
   wrangler secret put ADMIN_PASSWORD
   ```

2. 部署到 Cloudflare: `npm run deploy`

## API 文档

### 用户 API

- `POST /api/user/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息
- `PUT /api/user/me` - 更新当前用户信息
- `GET /api/user/list` - 获取用户列表（管理员）
- `POST /api/user/create` - 创建用户（管理员）
- `PUT /api/user/:id/status` - 更新用户状态（管理员）
- `PUT /api/user/:id/role` - 更新用户角色（管理员）
- `DELETE /api/user/:id` - 删除用户（管理员）

## 测试

项目包含完整的测试套件，包括单元测试、集成测试、前端测试和端到端（E2E）测试。

### 测试类型

1. **单元测试** - 测试核心工具函数（认证、响应等）
2. **集成测试** - 测试 API 端点（需要开发服务器运行）
3. **前端测试** - 测试前台和后台页面（需要开发服务器运行）
4. **端到端测试** - 在真实浏览器中测试完整用户流程

### 运行测试

#### 单元测试

Windows 用户（推荐使用 PowerShell 脚本）：

```bash
# 运行所有单元测试
powershell -ExecutionPolicy Bypass -File run-tests.ps1
```

或者使用 npm 命令：

```bash
# 运行认证测试
npm run test:auth

# 运行响应测试
npm run test:response

# 运行所有单元测试
npm run test:unit
```

#### 集成测试

```bash
# 运行集成测试（需要开发服务器运行）
powershell -ExecutionPolicy Bypass -File run-integration-test.ps1

# 或使用 npm
npm run test:integration
```

#### 前端测试

```bash
# 运行所有前端测试（需要开发服务器运行）
powershell -ExecutionPolicy Bypass -File run-frontend-tests.ps1

# 或分别运行各个测试
npm run test:frontend              # 前台页面测试
npm run test:admin                 # 后台页面测试
npm run test:frontend-interactive  # 交互功能测试
```

#### 端到端（E2E）测试

```bash
# 使用交互式脚本运行（推荐）
powershell -ExecutionPolicy Bypass -File run-e2e-tests.ps1

# 或使用 npm 命令
npm run test:e2e                  # 运行所有 E2E 测试
npm run test:e2e:chromium         # 仅 Chromium 测试
npm run test:e2e:firefox           # 仅 Firefox 测试
npm run test:e2e:webkit            # 仅 Safari 测试
npm run test:e2e:debug             # 调试模式
npm run test:e2e:report            # 查看测试报告
```

**首次运行需要安装 Playwright 浏览器：**

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 测试覆盖

#### 单元测试
- 认证工具测试（密码哈希、JWT 令牌）
- 响应工具测试（成功、错误、未授权响应）

#### 集成测试
- 用户认证（登录、获取用户信息）
- 分类管理（创建、更新、删除）
- 标签管理（创建、删除）
- 文章管理（增删改查）
- 评论功能（提交、删除）
- 反馈功能（提交、列表）
- 搜索功能

#### 前端测试
- 前台页面测试（首页、分类、标签、搜索、留言、登录）
- 后台页面测试（仪表盘、文章、分类、标签、评论、留言、附件）
- 交互功能测试（搜索、评论、留言、表单验证）

#### 端到端测试
- 访客浏览流程（13 个测试）
- 管理员管理流程（10 个测试）
- 交互功能流程（15 个测试）
- 跨浏览器测试（Chrome、Firefox、Safari）
- 响应式设计测试（桌面、平板、移动）
- 性能测试和可访问性测试

### 测试文档

详细的测试文档请查看：
- [测试总结](./TEST_SUMMARY.md) - 测试套件概述
- [测试报告](./TESTING_REPORT.md) - 最新测试运行结果
- [前端测试总结](./FRONTEND_TEST_SUMMARY.md) - 前端测试创建总结
- [前端测试结果](./FRONTEND_TEST_RESULTS.md) - 前端测试详细结果
- [E2E 测试设置](./E2E_SETUP.md) - E2E 测试完整指南
- [快速测试指南](./QUICK_TEST.md) - 快速开始测试
- [测试文档](./tests/README.md) - 完整的测试指南
- [前端测试指南](./tests/FRONTEND_TEST_GUIDE.md) - 前端测试详细指南
- [E2E 测试文档](./tests/e2e/README.md) - E2E 测试文档

### 快速测试

1. 启动开发服务器:
   ```bash
   npm run dev
   ```

2. 在另一个终端运行测试:
   ```bash
   npm run test:all
   ```

3. 访问应用进行手动测试:
   - 前台: http://localhost:8787
   - 后台: http://localhost:8787/admin
   - 登录账号: admin / admin123

### 测试功能

1. 创建分类和标签
2. 发布文章
3. 发表评论
4. 使用搜索功能
5. 发表留言

详细的测试指南请参考 [demo.md](./demo.md) 文件。

## 部署

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 文件。

快速部署命令：

```bash
# 1. 创建数据库
wrangler d1 create cfblog-database

# 2. 创建存储桶
wrangler r2 bucket create cfblog-storage

# 3. 创建 KV 命名空间
wrangler kv:namespace create "CACHE"

# 4. 设置环境变量
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET

# 5. 运行数据库迁移
wrangler d1 migrations apply cfblog-database

# 6. 部署
npm run deploy
```

### SessionID 安全配置

项目使用 sessionID 机制进行用户认证，需要配置以下环境变量：

#### 1. SESSION_SECRET (必需)
- **作用**: 用于生成和验证 sessionID 的 HMAC 签名密钥
- **要求**: 至少 32 个字符的随机字符串
- **生成方法**:
  ```bash
  # 使用 openssl 生成
  openssl rand -base64 32
  
  # 或使用 Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **设置方法**:
  ```bash
  wrangler secret put SESSION_SECRET
  ```

#### 2. 本地开发配置
在 `dev.vars` 文件中添加：
```bash
SESSION_SECRET="your-session-secret-key-here-change-in-production"
```

#### 3. SessionID 格式
生成的 sessionID 格式为：`用户ID:时间戳:随机数:HMAC签名`
- **用户ID**: 数据库中的用户 ID
- **时间戳**: 生成 sessionID 的时间戳（毫秒）
- **随机数**: 8 字节随机十六进制字符串
- **HMAC签名**: 使用 SESSION_SECRET 对前三个部分进行 HMAC-SHA1 签名

#### 4. 安全注意事项
1. **生产环境必须设置强密码**: 不要使用默认值
2. **定期轮换密钥**: 建议每 3-6 个月更换一次 SESSION_SECRET
3. **密钥长度**: 至少 32 字节（256 位）
4. **密钥存储**: 使用 Cloudflare Secrets 安全存储，不要硬编码在代码中

#### 5. Session 过期时间
- 默认: 7 天
- 可通过修改代码中的 `7 * 24 * 60 * 60 * 1000` 调整
- 过期后需要重新登录

## 项目特点

- 完全无服务器架构
- 使用 Cloudflare Workers 提供全球边缘计算
- R2 存储用于文件和内容
- D1 SQL 数据库用于结构化数据
- KV 用于高速缓存
- 响应式前台界面
- 功能完整的后台管理
- RESTful API 设计
- **SessionID 认证系统**（基于 HMAC 签名的安全 session 机制）
- 多角色支持（管理员、投稿者）
- 前端加密登录（防止密码明文传输）


# 备注
首页风格需要参考这个网站的
https://retrospectdemo.wordpress.com/?demo&iframe=true&theme_preview=true&calypso_token=8e2ac344-583a-4393-97aa-6d84c63f2371
## 许可证

MIT
