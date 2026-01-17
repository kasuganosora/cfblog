# CFBlog 产品文档

## 目录

1. [项目概述](#项目概述)
2. [功能模块说明](#功能模块说明)
3. [技术架构](#技术架构)
4. [接口文档](#接口文档)
5. [部署指南](#部署指南)
6. [使用说明](#使用说明)
7. [附录](#附录)

---

## 项目概述

### 项目简介

CFBlog 是一个基于 Cloudflare 全家桶构建的现代化博客平台，采用完全无服务器架构（Serverless Architecture）。项目利用 Cloudflare Workers 提供全球边缘计算能力，结合 R2 对象存储、D1 SQL 数据库和 KV 缓存服务，构建了一个高性能、低成本、易扩展的博客系统。

### 核心特性

- **完全无服务器架构**：无需管理服务器，自动扩展
- **全球边缘部署**：利用 Cloudflare 的全球 CDN 网络，实现低延迟访问
- **多用户支持**：支持管理员和投稿者两种角色，权限隔离
- **内容管理**：文章、分类、标签的完整管理功能
- **互动功能**：评论系统、留言板、搜索功能
- **安全认证**：基于 SessionID 的安全认证机制，前端加密登录
- **响应式设计**：支持桌面端和移动端，包含深色主题
- **SEO 优化**：自动生成 Sitemap，支持友好的 URL 结构
- **缓存优化**：智能缓存策略，提升访问速度

### 技术选型

| 技术组件 | 版本 | 用途 |
|---------|------|------|
| Cloudflare Workers | - | 无服务器计算平台 |
| R2 | - | 对象存储（文章内容、附件） |
| D1 | - | SQL 数据库（结构化数据） |
| KV | - | 键值存储（缓存、会话） |
| Node.js | v18+ | 开发环境 |
| Wrangler CLI | v4.54.0+ | Cloudflare 开发工具 |
| itty-router | v4.0.0 | 路由框架 |
| markdown-it | v13.0.2 | Markdown 解析器 |
| marked | v9.1.6 | Markdown 解析器 |
| @playwright/test | v1.57.0 | E2E 测试框架 |

---

## 功能模块说明

### 1. 用户管理模块

#### 功能概述
提供完整的用户管理功能，包括用户注册、登录、信息修改、权限控制等。

#### 用户认证系统

**SessionID 认证机制**

CFBlog 采用基于 HMAC-SHA1 的 SessionID 认证机制，确保会话安全性。

**SessionID 格式**：`用户ID:时间戳:随机数:HMAC签名`

```
用户ID:      数据库中的用户唯一标识
时间戳:      生成 SessionID 的时间戳（毫秒）
随机数:      8 字节随机十六进制字符串
HMAC签名:    使用 SESSION_SECRET 对前三个部分进行 HMAC-SHA1 签名
```

**前端加密登录**

为防止密码明文传输，登录过程采用双重 SHA-256 哈希：

1. **第一轮哈希**：`SHA-256(用户名 + 密码 + 盐值 + 时间戳)`
2. **第二轮哈希**：`SHA-256(第一轮哈希结果 + 盐值 + 时间戳)`

**会话管理**

- 会话有效期：7 天（可配置）
- 支持 Cookie 和 Header 两种认证方式
- 自动过期机制
- 防重放攻击（时间戳验证，5 分钟有效期）

#### 用户角色与权限

| 角色 | 权限描述 |
|------|---------|
| **管理员（admin）** | 拥有所有权限，包括用户管理、文章管理、分类标签管理、系统设置等 |
| **投稿者（contributor）** | 可创建和编辑自己的文章，发布需要管理员审核 |
| **普通成员（member）** | 无权限，只能留言 |

#### 用户状态

| 状态 | 值 | 说明 |
|------|-----|------|
| 激活 | 1 | 正常登录和使用所有功能 |
| 禁用 | 0 | 无法登录和使用功能 |

### 2. 文章管理模块

#### 功能概述
提供完整的文章生命周期管理，包括创建、编辑、发布、删除等功能。

#### 文章状态管理

| 状态 | 值 | 说明 |
|------|-----|------|
| 草稿 | 0 | 未发布，仅作者和管理员可见 |
| 已发布 | 1 | 公开发布，所有访客可见 |
| 归档 | 2 | 已归档，不再显示在列表中 |

#### 文章核心功能

- **Markdown 编辑**：支持完整的 Markdown 语法
- **Slug 管理**：自动生成或手动指定 URL 友好的标识符
- **特色文章**：标记为特色文章，优先展示
- **评论控制**：每篇文章可独立开启或关闭评论
- **浏览量统计**：自动统计文章浏览次数
- **分类关联**：一篇文章可以属于多个分类
- **标签关联**：一篇文章可以有多个标签
- **发布时间控制**：可设置定时发布

#### 权限控制

- **创建文章**：管理员和投稿者都可以创建
- **编辑文章**：作者和管理员可以编辑
- **删除文章**：作者和管理员可以删除
- **发布文章**：管理员直接发布，投稿者需要管理员审核

### 3. 分类管理模块

#### 功能概述
提供文章分类功能，支持多级分类结构，实现内容组织和导航。

#### 分类特性

- **多级结构**：支持父子分类关系
- **多分类关联**：一篇文章可以属于多个分类
- **自动统计**：自动统计每个分类下的文章数量
- **树形展示**：后台管理以树形结构展示分类层级
- **排序控制**：支持自定义分类排序

#### 分类数据结构

```
分类1（父分类）
  ├── 分类1.1（子分类）
  │   └── 分类1.1.1（孙分类）
  └── 分类1.2（子分类）
分类2（父分类）
```

### 4. 标签管理模块

#### 功能概述
提供文章标签功能，实现灵活的内容标记和分类。

#### 标签特性

- **扁平结构**：不支持层级，所有标签在同一级别
- **多标签关联**：一篇文章可以有多个标签
- **自动统计**：自动统计每个标签下的文章数量
- **标签云**：前台展示热门标签
- **批量操作**：编辑文章时可批量创建或选择标签

### 5. 评论系统模块

#### 功能概述
访客可以在文章下发表评论，支持嵌套回复。

#### 评论特性

- **嵌套回复**：支持多级嵌套评论
- **评论审核**：可配置是否需要审核（默认通过）
- **评论状态**：已审核/待审核/已删除
- **评论统计**：自动统计每篇文章的评论数
- **评论删除**：作者、管理员和评论者可以删除

#### 评论数据结构

```
评论1（顶级评论）
  ├── 回复1（二级回复）
  │   └── 回复1.1（三级回复）
  └── 回复2（二级回复）
评论2（顶级评论）
```

### 6. 反馈/留言板模块

#### 功能概述
提供访客留言和反馈功能，用于收集用户建议和意见。

#### 留言特性

- **留言提交**：访客可以匿名或留邮箱提交留言
- **留言管理**：管理员可以查看、回复、删除留言
- **状态管理**：已处理/待处理
- **邮箱通知**：可选的邮件通知功能（可扩展）

### 7. 搜索模块

#### 功能概述
提供全站搜索功能，支持文章标题和摘要的全文搜索。

#### 搜索特性

- **关键词搜索**：支持模糊匹配
- **分页展示**：搜索结果分页显示
- **结果高亮**：搜索结果高亮显示关键词
- **搜索类型**：支持按文章类型搜索
- **搜索统计**：记录热门搜索词（可扩展）

### 8. 附件管理模块

#### 功能概述
提供文件上传和管理功能，支持图片、文档等附件。

#### 附件特性

- **文件上传**：支持多种文件格式（图片、文档等）
- **R2 存储**：文件存储在 Cloudflare R2
- **文件管理**：查看、删除、复制链接
- **类型限制**：可配置允许的文件类型
- **大小限制**：可配置文件大小上限

#### 支持的文件类型

- **图片**：JPG、PNG、GIF、WebP
- **文档**：PDF、DOC、DOCX
- **其他**：可自定义配置

### 9. 系统设置模块

#### 功能概述
提供博客系统的基础配置管理。

#### 可配置项

- **博客信息**：标题、描述、副标题
- **显示设置**：每页文章数量、分页样式
- **评论设置**：评论审核、评论权限
- **上传设置**：文件类型限制、大小限制
- **SEO 设置**：Meta 描述、关键词

---

## 技术架构

### 整体架构

CFBlog 采用分层架构设计，各层职责清晰，易于维护和扩展。

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                          │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Workers (边缘计算)               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              应用逻辑层                          │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │  路由处理器  │  │  中间件层    │             │   │
│  │  │ itty-router  │  │ CORS/认证    │             │   │
│  │  └──────┬───────┘  └──────┬───────┘             │   │
│  └─────────┼───────────────────┼─────────────────────┘   │
│            │                   │                           │
│            ↓                   ↓                           │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   业务逻辑层     │  │   模板渲染层     │              │
│  │  ┌────────────┐  │  │  Mustache 模板   │              │
│  │  │ Controller│  │  └──────────────────┘              │
│  │  │    +      │  │                                   │
│  │  │   Model   │  │                                   │
│  │  └─────┬──────┘  │                                   │
│  └────────┼─────────┘                                   │
└───────────┼─────────────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────────────────────────┐
│              Cloudflare 存储服务                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     R2       │  │     D1       │  │     KV        │   │
│  │  对象存储    │  │  SQL 数据库  │  │  键值存储    │   │
│  │  文章内容    │  │  用户/文章   │  │  缓存        │   │
│  │  附件        │  │  评论等      │  │  会话        │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 分层架构说明

#### 1. 表现层（Presentation Layer）

**职责**：处理 HTTP 请求，返回响应

**核心组件**：
- **路由处理器**：使用 itty-router 分发请求
- **中间件**：CORS 处理、认证验证、日志记录
- **模板引擎**：使用 Mustache 渲染 HTML

**关键文件**：
- `src/index.js` - 主入口，路由配置
- `src/routes/*.js` - 各模块路由处理
- `src/middleware/*.js` - 中间件实现

#### 2. 业务逻辑层（Business Logic Layer）

**职责**：实现业务规则和流程控制

**核心组件**：
- **Controller**：协调 Model 和 View，处理业务逻辑
- **Service**：可复用的业务逻辑单元

**关键文件**：
- `src/routes/*.js` - Controller 实现
- `src/services/*.js` - 业务服务

#### 3. 数据访问层（Data Access Layer）

**职责**：与存储服务交互，封装数据操作

**核心组件**：
- **BaseModel**：提供通用的 CRUD 操作
- **具体 Model**：继承 BaseModel，实现特定业务逻辑

**关键文件**：
- `src/models/BaseModel.js` - 基础模型类
- `src/models/User.js` - 用户模型
- `src/models/Post.js` - 文章模型
- `src/models/Category.js` - 分类模型
- `src/models/Tag.js` - 标签模型
- `src/models/Comment.js` - 评论模型
- `src/models/Feedback.js` - 反馈模型

#### 4. 存储层（Storage Layer）

**职责**：持久化数据

**存储服务**：
- **D1 数据库**：存储结构化数据
- **R2 对象存储**：存储大文件
- **KV 键值存储**：存储缓存和会话

### 核心流程设计

#### 登录流程

```
用户提交登录表单
    ↓
前端生成随机盐值和时间戳
    ↓
前端双重 SHA-256 哈希加密
    ↓
发送加密数据到服务器
    ↓
服务器验证用户名
    ↓
服务器验证加密密码
    ↓
生成 SessionID（用户ID + 时间戳 + 随机数 + HMAC签名）
    ↓
设置 Cookie（HttpOnly, Secure, SameSite=Lax）
    ↓
返回用户信息和 SessionID
```

#### 文章创建流程

```
管理员/投稿者提交文章
    ↓
验证认证和权限
    ↓
生成唯一 Slug
    ↓
创建文章记录（D1）
    ↓
保存文章内容到 R2
    ↓
关联分类和标签
    ↓
清除相关缓存
    ↓
返回成功响应
```

#### 缓存更新流程

```
数据更新操作
    ↓
更新数据库
    ↓
清除相关 KV 缓存
    ↓
更新 R2 缓存（如需要）
    ↓
清除页面级缓存
    ↓
返回成功响应
```

### 安全机制

#### 1. 认证安全

**SessionID 认证**
- HMAC-SHA1 签名验证
- 时间戳验证防重放
- 随机数增加熵值
- 会话过期机制

**前端加密登录**
- SHA-256 双重哈希
- 随机盐值
- 时间戳验证
- 防止密码明文传输

#### 2. 数据安全

**SQL 注入防护**
- 参数化查询
- ORM 框架保护

**XSS 防护**
- HTML 转义
- Content-Security-Policy

**CSRF 防护**
- SameSite Cookie
- CSRF Token（可扩展）

#### 3. 权限控制

**基于角色的访问控制（RBAC）**
- 管理员拥有所有权限
- 投稿者受限权限
- 资源级权限控制

### 性能优化策略

#### 1. 缓存策略

**KV 缓存**
- 热点数据缓存（分类、标签、热门文章）
- 会话缓存
- 查询结果缓存

**智能缓存**
- 自动失效机制
- 版本控制
- 缓存预热

**页面级缓存**
- 渲染后的 HTML 缓存
- 按需更新

#### 2. 边缘计算优化

**全球部署**
- 利用 Cloudflare 全球 CDN
- 就近访问
- 自动扩展

**边缘缓存**
- 静态资源 CDN 缓存
- API 响应缓存

#### 3. 数据库优化

**索引优化**
- 为常用查询字段创建索引
- 复合索引优化

**查询优化**
- 避免 N+1 查询
- 分页查询
- 只查询需要的字段

#### 4. 资源优化

**图片优化**
- 懒加载
- 响应式图片
- 格式优化

**代码优化**
- 代码压缩
- Tree Shaking
- 按需加载

---

## 接口文档

> **详细 API 文档请查看**：[PRODUCT_DOCUMENTATION_API.md](./PRODUCT_DOCUMENTATION_API.md)

### API 概述

CFBlog 提供 RESTful API，所有 API 请求返回 JSON 格式数据。

**基础 URL**：`https://your-domain.com/api`

**通用响应格式**：
```json
{
  "success": true|false,
  "message": "操作结果描述",
  "data": {},
  "error": "错误信息（仅失败时）"
}
```

**状态码说明**：
- 200：请求成功
- 400：请求参数错误
- 401：未认证或认证失败
- 403：权限不足
- 404：资源不存在
- 500：服务器内部错误

### 主要 API 端点

#### 用户认证
- `POST /api/user/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息
- `PUT /api/user/me` - 更新当前用户信息

#### 文章管理
- `GET /api/post/list` - 获取文章列表
- `GET /api/post/:id` - 获取文章详情
- `POST /api/post/create` - 创建文章
- `PUT /api/post/:id/update` - 更新文章
- `DELETE /api/post/:id/delete` - 删除文章
- `GET /api/post/search` - 搜索文章

#### 分类管理
- `GET /api/category/list` - 获取分类列表
- `GET /api/category/tree` - 获取分类树
- `POST /api/category/create` - 创建分类
- `PUT /api/category/:id/update` - 更新分类
- `DELETE /api/category/:id/delete` - 删除分类

#### 标签管理
- `GET /api/tag/list` - 获取标签列表
- `GET /api/tag/popular` - 获取热门标签
- `POST /api/tag/create` - 创建标签
- `PUT /api/tag/:id/update` - 更新标签
- `DELETE /api/tag/:id/delete` - 删除标签

#### 评论管理
- `POST /api/comment/create` - 创建评论
- `GET /api/comment/post/:postId` - 获取文章评论
- `DELETE /api/comment/:id/delete` - 删除评论

#### 反馈管理
- `POST /api/feedback/create` - 提交反馈
- `GET /api/feedback/list` - 获取反馈列表
- `DELETE /api/feedback/:id/delete` - 删除反馈

#### 搜索
- `GET /api/search` - 全站搜索

---

## 部署指南

> **详细部署文档请查看**：[PRODUCT_DOCUMENTATION_DEPLOYMENT.md](./PRODUCT_DOCUMENTATION_DEPLOYMENT.md)

### 环境要求

#### 开发环境
- Node.js v18.0.0 或更高版本
- npm v9.0.0 或更高版本
- Wrangler CLI v4.54.0 或更高版本

#### 生产环境
- Cloudflare 账号（免费或付费）
- 自定义域名（可选）

### 快速开始

#### 1. 克隆项目

```bash
git clone https://github.com/your-repo/cfblog.git
cd cfblog
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

```bash
cp dev.vars.example dev.vars
```

编辑 `dev.vars` 文件，设置环境变量。

#### 4. 创建 Cloudflare 资源

```bash
# 创建 D1 数据库
wrangler d1 create cfblog-database

# 创建 R2 存储桶
wrangler r2 bucket create cfblog-storage

# 创建 KV 命名空间
wrangler kv:namespace create "CACHE"
```

#### 5. 配置 wrangler.toml

将创建的资源 ID 添加到 `wrangler.toml` 中。

#### 6. 运行数据库迁移

```bash
npm run db:local
```

#### 7. 启动开发服务器

```bash
npm start
```

或使用后台启动脚本：

```bash
# Windows
start-dev-background.bat

# Mac/Linux
./start-dev-background.sh
```

#### 8. 访问应用

- 前台：http://localhost:8787
- 后台：http://localhost:8787/admin
- 默认账号：`admin` / `admin123`

### 生产部署

#### 1. 登录 Cloudflare

```bash
wrangler login
```

#### 2. 设置生产环境 Secrets

```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put ADMIN_PASSWORD --env production
wrangler secret put SESSION_SECRET --env production
```

#### 3. 运行数据库迁移

```bash
wrangler d1 migrations apply cfblog-database --remote
```

#### 4. 部署到 Cloudflare

```bash
wrangler deploy --env production
```

#### 5. 配置自定义域名（可选）

在 Cloudflare Dashboard 中配置自定义域名，或在命令行中：

```bash
wrangler domains add your-domain.com --env production
```

### 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| ENVIRONMENT | 环境标识 | 是 | development/production |
| JWT_SECRET | JWT 认证密钥 | 是 | 随机字符串（至少 32 字符） |
| ADMIN_PASSWORD | 默认管理员密码 | 是 | 足够强的密码 |
| SESSION_SECRET | Session 签名密钥 | 是 | 随机字符串（至少 32 字符） |

### 监控和日志

#### 查看实时日志

```bash
wrangler tail --env production
```

#### 查看部署历史

```bash
wrangler deployments list --env production
```

---

## 使用说明

> **详细使用文档请查看**：[PRODUCT_DOCUMENTATION_DEPLOYMENT.md](./PRODUCT_DOCUMENTATION_DEPLOYMENT.md) 中的"使用说明"部分

### 管理员使用指南

#### 首次登录

1. 访问 `/login` 页面
2. 使用默认账号登录：`admin` / `admin123`
3. 登录后立即修改密码

#### 系统设置

访问 `/admin/settings`，配置博客基础信息。

#### 内容管理

- **文章管理**：创建、编辑、发布、删除文章
- **分类管理**：创建、编辑、删除分类，管理层级关系
- **标签管理**：创建、编辑、删除标签
- **评论管理**：审核、回复、删除评论
- **留言管理**：查看、回复、处理留言
- **附件管理**：上传、管理文件

#### 用户管理

- 创建新用户
- 编辑用户信息
- 修改用户角色
- 启用/禁用用户

### 投稿者使用指南

#### 创建文章

1. 登录后台
2. 访问 `/admin/posts`
3. 点击"新建文章"
4. 填写文章内容
5. 选择状态（草稿/已发布）
6. 保存

#### 编辑文章

- 只能编辑自己创建的文章
- 编辑后需要重新提交审核（如果已发布）

### 访客使用指南

#### 浏览内容

- 首页：查看最新文章
- 分类页：按分类浏览
- 标签页：按标签浏览
- 搜索页：搜索内容

#### 互动功能

- 发表评论
- 回复评论
- 提交留言
- 分享文章

### 内容编辑指南

#### Markdown 基础语法

```markdown
# 标题
**粗体**
*斜体*
[链接](https://example.com)
![图片](https://example.com/image.jpg)
```

#### 高级功能

- 代码高亮
- 表格
- 引用
- 列表
- 分割线

---

## 附录

### A. 项目文件结构

```
cfblog/
├── src/                      # 源代码
│   ├── index.js             # 主入口文件
│   ├── middleware/          # 中间件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由处理
│   ├── utils/              # 工具函数
│   └── services/           # 业务服务
├── migrations/             # 数据库迁移文件
├── tpls/                   # 前端模板
│   ├── base.html           # 基础模板
│   ├── home.html           # 首页模板
│   ├── post.html           # 文章详情模板
│   ├── category.html       # 分类页模板
│   ├── tag.html            # 标签页模板
│   ├── search.html         # 搜索页模板
│   ├── feedback.html       # 留言板模板
│   ├── login.html          # 登录页模板
│   └── admin/              # 后台模板
├── static/                 # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
├── tests/                  # 测试文件
│   ├── e2e/               # E2E 测试
│   ├── unit/              # 单元测试
│   └── integration/       # 集成测试
├── wrangler.toml          # Wrangler 配置
├── package.json           # 项目配置
├── dev.vars              # 开发环境变量
├── dev.vars.example      # 环境变量示例
├── start-dev.js          # 开发服务器启动脚本
├── PRODUCT_DOCUMENTATION.md          # 产品文档（主文档）
├── PRODUCT_DOCUMENTATION_API.md     # 产品文档（API 篇）
├── PRODUCT_DOCUMENTATION_DEPLOYMENT.md # 产品文档（部署篇）
└── README.md             # 项目说明
```

### B. 数据库表结构

#### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 用户名（唯一） |
| email | TEXT | 邮箱（唯一） |
| password_hash | TEXT | 密码哈希 |
| display_name | TEXT | 显示名称 |
| avatar | TEXT | 头像 URL |
| role | TEXT | 角色（admin/contributor） |
| bio | TEXT | 个人简介 |
| status | INTEGER | 状态（1=激活，0=禁用） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### posts（文章表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | TEXT | 标题 |
| slug | TEXT | URL 标识（唯一） |
| excerpt | TEXT | 摘要 |
| author_id | INTEGER | 作者 ID |
| status | INTEGER | 状态（0=草稿，1=已发布，2=归档） |
| featured | INTEGER | 特色文章（0=否，1=是） |
| comment_status | INTEGER | 评论状态（0=关闭，1=开放） |
| content_key | TEXT | R2 存储键 |
| view_count | INTEGER | 浏览量 |
| published_at | DATETIME | 发布时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### categories（分类表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 分类名称 |
| slug | TEXT | URL 标识（唯一） |
| description | TEXT | 描述 |
| parent_id | INTEGER | 父分类 ID |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### tags（标签表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 标签名称 |
| slug | TEXT | URL 标识（唯一） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### comments（评论表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| post_id | INTEGER | 文章 ID |
| author_name | TEXT | 评论者名称 |
| author_email | TEXT | 评论者邮箱 |
| content | TEXT | 评论内容 |
| parent_id | INTEGER | 父评论 ID |
| status | INTEGER | 状态（1=已审核，0=待审核） |
| created_at | DATETIME | 创建时间 |

### C. 权限矩阵

| 功能 | 管理员 | 投稿者 | 访客 |
|------|--------|--------|------|
| 查看文章 | ✓ | ✓ | ✓ |
| 创建文章 | ✓ | ✓ | ✗ |
| 编辑自己的文章 | ✓ | ✓ | ✗ |
| 编辑所有文章 | ✓ | ✗ | ✗ |
| 删除文章 | ✓ | ✗ | ✗ |
| 管理分类 | ✓ | ✗ | ✗ |
| 管理标签 | ✓ | ✗ | ✗ |
| 管理评论 | ✓ | ✗ | ✗ |
| 管理留言 | ✓ | ✗ | ✗ |
| 管理用户 | ✓ | ✗ | ✗ |
| 系统设置 | ✓ | ✗ | ✗ |
| 上传文件 | ✓ | ✓ | ✗ |
| 发表评论 | ✓ | ✓ | ✓ |
| 提交留言 | ✓ | ✓ | ✓ |

### D. 错误代码

| 代码 | 说明 | 解决方案 |
|------|------|---------|
| 400 | 请求参数错误 | 检查请求参数格式 |
| 401 | 未认证或认证失败 | 检查登录状态 |
| 403 | 权限不足 | 联系管理员 |
| 404 | 资源不存在 | 检查 URL 是否正确 |
| 500 | 服务器内部错误 | 联系技术支持 |

### E. 常见问题

#### Q: 无法登录怎么办？

A: 请检查：
1. 用户名和密码是否正确
2. 浏览器是否保存了旧 Cookie
3. 尝试清除浏览器缓存和 Cookie
4. 联系管理员重置密码

#### Q: 文章发布后不显示？

A: 请检查：
1. 文章状态是否为"已发布"
2. 文章是否设置了未来发布时间
3. 尝试清除缓存

#### Q: 图片上传失败？

A: 请检查：
1. 图片大小是否超过限制
2. 图片格式是否支持
3. 网络连接是否正常

### F. 技术支持

如遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 Cloudflare Workers 日志
3. 查看 GitHub Issues
4. 联系技术支持团队

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-16  
**维护者**：CFBlog Team

**相关文档**：
- [PRODUCT_DOCUMENTATION_API.md](./PRODUCT_DOCUMENTATION_API.md) - API 接口详细文档
- [PRODUCT_DOCUMENTATION_DEPLOYMENT.md](./PRODUCT_DOCUMENTATION_DEPLOYMENT.md) - 部署和使用指南
- [README.md](./README.md) - 项目快速开始
