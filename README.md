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

#### 快速启动 (推荐)

Windows 用户:
```bash
start-dev.bat
```

Mac/Linux 用户:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

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

项目包含完整的测试套件，包括单元测试、集成测试和前端测试。

### 测试类型

1. **单元测试** - 测试核心工具函数（认证、响应等）
2. **集成测试** - 测试 API 端点（需要开发服务器运行）
3. **前端测试** - 测试前台和后台页面（需要开发服务器运行）

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

### 测试文档

详细的测试文档请查看：
- [测试总结](./TEST_SUMMARY.md) - 测试套件概述
- [测试报告](./TESTING_REPORT.md) - 最新测试运行结果
- [前端测试总结](./FRONTEND_TEST_SUMMARY.md) - 前端测试创建总结
- [快速测试指南](./QUICK_TEST.md) - 快速开始测试
- [测试文档](./tests/README.md) - 完整的测试指南
- [前端测试指南](./tests/FRONTEND_TEST_GUIDE.md) - 前端测试详细指南

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

# 5. 运行数据库迁移
wrangler d1 migrations apply cfblog-database

# 6. 部署
npm run deploy
```

## 项目特点

- 完全无服务器架构
- 使用 Cloudflare Workers 提供全球边缘计算
- R2 存储用于文件和内容
- D1 SQL 数据库用于结构化数据
- KV 用于高速缓存
- 响应式前台界面
- 功能完整的后台管理
- RESTful API 设计
- JWT 认证系统
- 多角色支持（管理员、投稿者）

## 许可证

MIT
