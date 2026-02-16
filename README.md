# CFBlog

完全运行在 [Cloudflare Workers](https://workers.cloudflare.com/) 上的无服务器博客平台。零服务器、小站点零成本。

使用 **D1**（SQLite）作为数据库，**R2** 作为文件存储，**Hono** 作为 Web 框架。所有代码在边缘节点运行。

## 功能特性

- **Hono** Web 框架，边缘端渲染
- **D1**（SQLite）数据库，自动迁移
- **R2** 对象存储，用于上传文件和缓存
- **管理后台** 基于 Vue 3 + TDesign
- **Markdown 编辑器**（md-editor-v3）支持图片上传和实时预览
- **评论与留言板** 支持发言冷却、审核、作者高亮
- **RSS 订阅** 从已发布文章自动生成
- **代码高亮** highlight.js（github-dark 主题）
- **图片灯箱** 文章图片点击放大预览
- **中文 Slug** 自动拼音转换，生成友好的 URL
- **侧栏挂件** 管理后台可配置，支持 Markdown + HTML
- **暗色模式** 可切换，支持跟随系统
- **全文搜索**
- **会话认证** PBKDF2 密码哈希、登录频率限制、审计日志
- **R2 缓存层** 缓存设置、文章列表、RSS

## 快速开始

### 前置条件

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm i -g wrangler`）
- Cloudflare 账号（免费套餐即可）

### 1. 克隆并安装

```bash
git clone https://github.com/kasuganosora/cfblog.git
cd cfblog
npm install
```

### 2. 创建 Cloudflare 资源

```bash
# 创建 D1 数据库
npx wrangler d1 create cfblog-database

# 创建 R2 存储桶
npx wrangler r2 bucket create cfblog-uploads
```

### 3. 配置

```bash
cp wrangler.toml.example wrangler.toml
```

编辑 `wrangler.toml`，填入第 2 步返回的 D1 数据库 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "<your-database-id>"    # 替换为你的数据库 ID
migrations_dir = "migrations"
```

### 4. 运行数据库迁移

```bash
# 本地开发
npx wrangler d1 migrations apply cfblog-database --local

# 生产环境
npx wrangler d1 migrations apply cfblog-database --remote
```

### 5. 设置会话密钥

```bash
npx wrangler secret put SESSION_SECRET
# 输入一个随机字符串（建议 64 个字符以上）
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8787，管理后台在 http://localhost:8787/admin。

默认登录：`admin` / `admin123`（**首次登录后请立即修改密码**）。

## 部署

### 手动部署

```bash
npx wrangler deploy
```

### Cloudflare Workers Builds（CI/CD）

在 **Cloudflare Dashboard > Workers > Settings > Builds** 中连接 GitHub 仓库，配置：

| 设置项 | 值 |
|--------|-----|
| **Deploy command** | `node scripts/generate-config.js && npx wrangler deploy` |

在 **Settings > Environment variables** 中设置环境变量：

| 变量 | 必填 | 说明 |
|------|------|------|
| `CF_D1_DATABASE_ID` | 是 | D1 数据库 UUID |
| `CF_D1_DB_NAME` | 否 | D1 数据库名（默认 `cfblog-database`） |
| `CF_R2_BUCKET_NAME` | 否 | R2 桶名（默认 `cfblog-uploads`） |
| `CF_WORKER_NAME` | 否 | Worker 名称（默认 `cfblog`） |
| `CF_CUSTOM_DOMAIN` | 否 | 自定义域名（如 `blog.example.com`） |

构建脚本会自动从环境变量生成 `wrangler.toml`。

### 自定义域名（可选）

- CI/CD 中设置 `CF_CUSTOM_DOMAIN` 环境变量，或
- 在本地 `wrangler.toml` 中添加：

```toml
[[routes]]
pattern = "blog.example.com"
custom_domain = true
```

## 管理后台

登录后访问 `/admin`，功能包括：

- **仪表盘** - 数据概览、最新文章和评论
- **文章管理** - 创建/编辑/删除文章，Markdown 编辑器支持图片上传
- **分类管理** - 层级分类，支持自定义 Slug
- **标签管理**
- **评论管理** - 审核、批准/拒绝/删除
- **留言管理** - 访客留言
- **用户管理**
- **附件管理** - 已上传文件管理
- **系统设置** - 博客信息、显示、评论、上传、SEO、侧栏挂件、缓存管理

---

**English** | [中文](#cfblog)

# CFBlog

A serverless blog platform running entirely on [Cloudflare Workers](https://workers.cloudflare.com/). Zero servers, zero cost for small sites.

**D1** (SQLite) as the database, **R2** for file storage, **Hono** as the web framework. Everything runs at the edge.

## Features

- **Hono** web framework with edge-side rendering
- **D1** (SQLite) database with automatic migrations
- **R2** object storage for uploads and cache
- **Admin panel** built with Vue 3 + TDesign
- **Markdown editor** (md-editor-v3) with image upload and live preview
- **Comments & guestbook** with cooldown, moderation, author highlighting
- **RSS feed** auto-generated from published posts
- **Code highlighting** with highlight.js (github-dark theme)
- **Image lightbox** click-to-zoom on article images
- **Chinese slug support** auto pinyin conversion for URL-friendly slugs
- **Sidebar widgets** customizable via admin (Markdown + HTML)
- **Dark mode** toggle with system preference detection
- **Full-text search** across posts
- **Session auth** with PBKDF2 password hashing, login rate limiting, audit log
- **R2 caching layer** for settings, post lists, RSS

## Quick Start

### Prerequisites

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- A Cloudflare account (free plan works)

### 1. Clone and install

```bash
git clone https://github.com/kasuganosora/cfblog.git
cd cfblog
npm install
```

### 2. Create Cloudflare resources

```bash
# Create D1 database
npx wrangler d1 create cfblog-database

# Create R2 bucket
npx wrangler r2 bucket create cfblog-uploads
```

### 3. Configure

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and fill in your D1 database ID (returned from step 2):

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "<your-database-id>"    # Replace this
migrations_dir = "migrations"
```

### 4. Run database migrations

```bash
# Local development
npx wrangler d1 migrations apply cfblog-database --local

# Production
npx wrangler d1 migrations apply cfblog-database --remote
```

### 5. Set session secret

```bash
# Generate a random secret for production
npx wrangler secret put SESSION_SECRET
# Enter a random string (64+ characters recommended)
```

### 6. Start dev server

```bash
npm run dev
```

Open http://localhost:8787. Admin panel at http://localhost:8787/admin.

Default login: `admin` / `admin123` (**change immediately** after first login).

## Deployment

### Manual deploy

```bash
npx wrangler deploy
```

### Cloudflare Workers Builds (CI/CD)

Connect your GitHub repo in **Cloudflare Dashboard > Workers > Settings > Builds**, then configure:

| Setting | Value |
|---------|-------|
| **Deploy command** | `node scripts/generate-config.js && npx wrangler deploy` |

Set these **environment variables** in **Settings > Environment variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `CF_D1_DATABASE_ID` | Yes | Your D1 database UUID |
| `CF_D1_DB_NAME` | No | D1 database name (default: `cfblog-database`) |
| `CF_R2_BUCKET_NAME` | No | R2 bucket name (default: `cfblog-uploads`) |
| `CF_WORKER_NAME` | No | Worker name (default: `cfblog`) |
| `CF_CUSTOM_DOMAIN` | No | Custom domain (e.g. `blog.example.com`) |

The build script generates `wrangler.toml` from these variables automatically.

### Custom domain (optional)

To use a custom domain, either:

- Set `CF_CUSTOM_DOMAIN` env var in CI/CD, or
- Add a `[[routes]]` section to your local `wrangler.toml`:

```toml
[[routes]]
pattern = "blog.example.com"
custom_domain = true
```

## Admin Panel

Access at `/admin` after login. Features:

- **Dashboard** - Stats overview, recent posts and comments
- **Posts** - Create/edit/delete articles, Markdown editor with image upload
- **Categories** - Hierarchical categories with custom slugs
- **Tags** - Tag management
- **Comments** - Moderation, approve/reject/delete
- **Feedback** - Guestbook messages
- **Users** - User management
- **Attachments** - Uploaded files management
- **Settings** - Blog info, display, comments, upload, SEO, sidebar widgets, cache management

## Project Structure

```
cfblog/
├── src/
│   ├── index-hono.js           # App entry point
│   ├── routes-hono/            # Route handlers
│   │   ├── frontend.js         # Frontend theme (HTML/CSS/JS)
│   │   ├── admin.js            # Admin panel (Vue 3 SPA)
│   │   ├── post.js             # Post API
│   │   ├── user.js             # Auth & user API
│   │   ├── category.js         # Category API
│   │   ├── tag.js              # Tag API
│   │   ├── comment.js          # Comment API
│   │   ├── feedback.js         # Feedback API
│   │   ├── search.js           # Search API
│   │   ├── upload.js           # File upload API
│   │   ├── settings.js         # Settings API
│   │   └── base.js             # Auth middleware & helpers
│   ├── models/                 # Data models (D1 ORM)
│   └── utils/
│       ├── auth.js             # Session & password hashing
│       ├── cache.js            # R2 caching layer
│       ├── slug.js             # URL slug generation (with pinyin)
│       └── pinyin-data.js      # Chinese character to pinyin lookup
├── migrations/                 # D1 SQL migrations
├── public/                     # Static assets
│   └── static/                 # highlight.js, marked.js, etc.
├── scripts/
│   ├── generate-config.js      # Generate wrangler.toml from env vars
│   └── build-pinyin-dict.js    # Build pinyin lookup table
├── tests/                      # API tests (vitest)
├── wrangler.toml.example       # Config template
└── package.json
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server (port 8787) |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm test` | Run API tests (vitest) |

## Theming

The frontend is server-rendered in `src/routes-hono/frontend.js`. The entire theme (HTML + CSS + JS) is in this single file. Customize by modifying:

- **CSS variables** in `:root` - colors, fonts, dimensions
- **Dark mode** via `body[data-theme="dark"]` overrides
- **`layout()`** function - HTML shell, navbar, footer
- **Route handlers** - individual page layouts

No frontend build step required. Just edit and deploy.

## License

[MIT](LICENSE)
