# 本地开发与调试指南

## 环境准备

### 系统要求

- Node.js >= 18
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm i -g wrangler`）
- Git

### 安装依赖

```bash
git clone https://github.com/kasuganosora/cfblog.git
cd cfblog
npm install
```

### 配置 wrangler.toml

```bash
cp wrangler.toml.example wrangler.toml
```

本地开发时 `database_id` 可以填任意值（本地模式不会连接远端数据库）：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "local-dev"
migrations_dir = "migrations"
```

### 初始化本地数据库

```bash
npm run db:local
```

这会在 `.wrangler/` 目录下创建本地 SQLite 数据库，并运行所有 15 个迁移文件（建表 + 初始管理员账号）。

### 本地环境变量（可选）

创建 `.dev.vars` 文件设置本地开发环境变量：

```
SESSION_SECRET=dev-secret-for-local-testing
```

> `.dev.vars` 已在 `.gitignore` 中，不会被提交。

## 启动开发服务器

```bash
npm run dev
```

启动后访问：

- 前端首页：http://localhost:8787
- 管理后台：http://localhost:8787/admin
- API 接口：http://localhost:8787/api/*
- 健康检查：http://localhost:8787/health

默认管理员账号：`admin` / `admin123`

### 热更新

Wrangler dev 会监听文件变更自动重启。修改 `src/` 下的任何文件后，刷新浏览器即可看到更新。

## 项目架构

```
请求 → index-hono.js → 路由分发
                         ├── /api/*     → routes-hono/{post,user,category,...}.js → models/*.js → D1
                         ├── /admin/*   → routes-hono/admin.js (Vue 3 SPA)
                         ├── /static/*  → public/ 静态文件
                         └── /*         → routes-hono/frontend.js (SSR HTML)
```

### 核心文件说明

| 文件 | 作用 |
|------|------|
| `src/index-hono.js` | 应用入口，注册中间件和路由 |
| `src/routes-hono/frontend.js` | 前端主题（HTML + CSS + JS 全在一个文件中） |
| `src/routes-hono/admin.js` | 管理后台（Vue 3 + TDesign，内联 SPA） |
| `src/routes-hono/base.js` | 认证中间件、Session 验证、响应工具函数 |
| `src/models/BaseModel.js` | 数据模型基类（D1 ORM） |
| `src/utils/auth.js` | 密码哈希（PBKDF2）、Session 生成/验证 |
| `src/utils/cache.js` | R2 缓存层（设置、文章列表、RSS） |
| `src/utils/slug.js` | Slug 生成（含中文拼音转换） |

### 数据库迁移

迁移文件在 `migrations/` 目录，按编号顺序执行：

```
0001 - users 表
0002 - posts 表
0003 - categories 表
0004 - tags 表
0005 - comments 表
0006 - feedback 表
0007 - attachments 表
0008 - settings 表
0009 - 初始管理员用户
0010 - trackbacks 表
0011 - post_categories 关联表
0012 - post_tags 关联表
0013 - posts 表增加 content 字段
0014 - login_audit 表
0015 - comments/feedback 增加 IP 字段
```

新增迁移：创建 `migrations/0016_xxx.sql`，然后运行 `npm run db:local`。

## 测试

### API 测试（Vitest）

```bash
# 运行全部 API 测试
npm run test:api

# 监听模式（修改文件自动重跑）
npm run test:api:watch

# 运行单个测试文件
npx vitest run tests/api/post-api.test.js
```

API 测试使用 mock 数据库，不依赖 Wrangler 或 D1，可以直接运行：

```
tests/
├── api/
│   ├── auth.test.js           # 认证（登录/登出/Session）
│   ├── post-api.test.js       # 文章 CRUD
│   ├── category-api.test.js   # 分类 CRUD
│   ├── tag-api.test.js        # 标签 CRUD
│   ├── comment-api.test.js    # 评论
│   ├── feedback-api.test.js   # 留言
│   ├── settings-api.test.js   # 设置
│   ├── upload-api.test.js     # 文件上传
│   ├── search-api.test.js     # 搜索
│   └── security.test.js       # 安全（XSS、SQL注入、输入长度）
└── helpers/
    ├── test-app.js            # 测试工具（request、session cookie 生成）
    └── mock-db.js             # D1 数据库 mock
```

#### 编写新测试

```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import { request, getAdminSessionCookie } from '../helpers/test-app.js';
import { createMockDB } from '../helpers/mock-db.js';

let adminCookie;

beforeAll(async () => {
  adminCookie = await getAdminSessionCookie();
});

describe('My Feature', () => {
  it('should work', async () => {
    const db = createMockDB([
      { pattern: 'SELECT.*FROM posts', response: [{ id: 1, title: 'Test' }] }
    ]);

    const res = await request('/api/post/list', {}, { DB: db });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data).toHaveLength(1);
  });
});
```

`createMockDB` 接受一个规则数组，每条规则用正则匹配 SQL 语句并返回模拟数据。

### E2E 测试（Playwright）

```bash
# 需要先安装浏览器
npx playwright install

# 运行 E2E 测试（需要先启动 dev server）
npm run test:e2e

# UI 模式（可视化调试）
npm run test:e2e:ui

# Debug 模式（逐步执行）
npm run test:e2e:debug
```

E2E 测试覆盖：首页加载、登录、文章详情、分类标签、搜索、留言、主题切换。

## 调试技巧

### 查看请求日志

Wrangler dev 会在终端打印每个请求的方法、路径和状态码：

```
<-- GET /api/post/list
--> GET /api/post/list 200 12ms
```

### 调试数据库

查看本地 D1 数据库内容：

```bash
# 执行 SQL 查询
npx wrangler d1 execute cfblog-database --local --command "SELECT * FROM posts LIMIT 5"

# 查看所有表
npx wrangler d1 execute cfblog-database --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# 查看设置
npx wrangler d1 execute cfblog-database --local --command "SELECT key, value FROM settings"
```

### 调试远端数据库

```bash
# 加 --remote 标志查询生产数据库
npx wrangler d1 execute cfblog-database --remote --command "SELECT COUNT(*) FROM posts"
```

### 重置本地数据库

删除本地数据库文件后重新迁移：

```bash
rm -rf .wrangler/state
npm run db:local
```

### 查看 R2 缓存（远端）

```bash
# 列出缓存文件
npx wrangler r2 object list cfblog-uploads --prefix cache/

# 查看某个缓存内容
npx wrangler r2 object get cfblog-uploads cache/settings.json
```

也可以在管理后台 **设置 > 运维** 中查看和管理缓存。

### 前端调试

前端主题在 `src/routes-hono/frontend.js` 中，是纯 HTML + CSS + 原生 JS：

- 使用浏览器开发者工具（F12）调试
- CSS 变量在 `:root` 中定义，可以在 DevTools 中实时修改
- 客户端 JS 使用 `console.error` 捕获异常，打开控制台查看

管理后台是 Vue 3 SPA（内联在 `admin.js` 中）：

- 使用 [Vue Devtools](https://devtools.vuejs.org/) 浏览器扩展
- TDesign 组件库文档：https://tdesign.tencent.com/vue-next/

## 常见问题

### `wrangler dev` 启动报错

```
Error: Missing entry-point
```

确认 `wrangler.toml` 存在且内容正确。如果是新克隆的项目，先运行 `cp wrangler.toml.example wrangler.toml`。

### 数据库迁移失败

```
Error: no such table: xxx
```

迁移可能没有完全运行。删除本地数据库后重试：

```bash
rm -rf .wrangler/state
npm run db:local
```

### 测试找不到模块

```
Error: Cannot find module '../helpers/test-app.js'
```

确认从项目根目录运行测试：`npm run test:api`。

### 登录失败

- 确认已运行数据库迁移（包含 `0009_init_admin_user.sql`）
- 默认账号：`admin` / `admin123`
- 用户名不区分大小写

### 图片上传在本地不工作

本地开发时 R2 存储使用本地文件系统模拟（`.wrangler/state/`）。如果上传失败，检查目录权限。
