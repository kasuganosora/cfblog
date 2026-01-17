# CFBlog - 基于Cloudflare全家桶的现代化博客平台

一个完全无服务器架构的博客系统,利用Cloudflare Workers的全球边缘计算能力,结合R2对象存储、D1 SQL数据库和KV缓存服务。

## 项目特性

✅ **完全无服务器架构** - 无需管理服务器,自动扩展
✅ **全球边缘部署** - 利用Cloudflare全球CDN网络
✅ **多用户支持** - 支持管理员和投稿者角色,权限隔离
✅ **内容管理** - 文章、分类、标签完整管理功能
✅ **互动功能** - 评论系统、留言板、搜索功能
✅ **安全认证** - 基于SessionID的安全认证,前端加密登录
✅ **智能缓存** - KV缓存策略,提升访问速度
✅ **SEO优化** - 自动生成Sitemap,友好URL结构

## 技术栈

### 后端
- **Cloudflare Workers** - 无服务器计算平台
- **D1** - SQL数据库
- **R2** - 对象存储
- **KV** - 键值存储
- **itty-router** v4.0.0 - 路由框架
- **Node.js** v18+ - 开发环境
- **Wrangler CLI** v4.54.0+ - Cloudflare开发工具

### 前端
- **Mustache** - 模板引擎
- **Markdown** - 内容编辑
- **响应式CSS** - 支持桌面和移动端
- **JavaScript ES6+** - 现代浏览器支持

## 项目结构

```
cfblog/
├── src/                        # 源代码
│   ├── index-hono.js          # 主入口文件（Hono框架）
│   ├── index.js              # 主入口文件（itty-router版本 - 备用）
│   ├── routes-hono/          # Hono路由模块
│   │   ├── post.js          # 文章路由
│   │   ├── user.js          # 用户路由
│   │   ├── category.js      # 分类路由
│   │   ├── tag.js           # 标签路由
│   │   ├── comment.js       # 评论路由
│   │   ├── feedback.js      # 反馈路由
│   │   ├── search.js        # 搜索路由
│   │   ├── upload.js        # 上传路由
│   │   ├── settings.js      # 设置路由
│   │   ├── admin.js         # 管理后台路由
│   │   ├── frontend.js      # 前台路由
│   │   └── base.js         # 基础工具和中间件
│   ├── middleware/            # 中间件
│   │   ├── cors.js          # CORS中间件
│   │   └── error.js        # 错误处理
│   ├── models/               # 数据模型
│   │   ├── BaseModel.js     # 基础模型类
│   │   ├── User.js          # 用户模型
│   │   ├── Post.js          # 文章模型
│   │   ├── Category.js      # 分类模型
│   │   ├── Tag.js           # 标签模型
│   │   ├── Comment.js       # 评论模型
│   │   ├── Feedback.js      # 反馈模型
│   │   └── Settings.js      # 设置模型
│   ├── routes/               # 原路由（itty-router - 备用）
│   │   ├── user.js          # 用户路由
│   │   ├── post.js          # 文章路由
│   │   ├── category.js      # 分类路由
│   │   ├── tag.js           # 标签路由
│   │   ├── comment.js       # 评论路由
│   │   ├── feedback.js      # 反馈路由
│   │   ├── search.js        # 搜索路由
│   │   ├── upload.js        # 上传路由
│   │   ├── settings.js      # 设置路由
│   │   ├── frontend.js      # 前台路由
│   │   ├── admin/           # 后台路由
│   │   │   └── dashboard.js
│   │   └── cache-admin.js  # 缓存管理路由
│   └── utils/                # 工具函数
│       ├── auth.js          # 认证工具
│       ├── cache.js         # 缓存工具
│       ├── response.js      # 响应工具
│       └── slug.js         # Slug生成工具
├── migrations/               # 数据库迁移文件
├── scripts/                  # 工具脚本
│   └── generate-test-data.js # 测试数据生成
├── static/                   # 静态资源
├── wrangler.toml            # Wrangler配置
├── package.json             # 项目配置
├── dev.vars                 # 开发环境变量
├── start-dev.js            # 开发服务器启动脚本
└── PRODUCT_DOCUMENTATION.md  # 产品文档
```

## 快速开始

### 环境要求

- Node.js v18.0.0 或更高版本
- npm v9.0.0 或更高版本
- Wrangler CLI v4.54.0 或更高版本

### 安装依赖

```bash
npm install
```

项目已使用Hono框架，itty-router作为备选保留。

### 框架说明

**默认框架**: Hono v4.11.4

CFBlog现在默认使用Hono框架，它提供了：
- ✅ 更简洁的路由配置
- ✅ 内置中间件系统（CORS、Logger等）
- ✅ 更好的错误处理
- ✅ 优秀的TypeScript支持
- ✅ 完善的文档

**旧框架**: itty-router v4.0.0（仍保留在项目中，可通过修改wrangler.toml的main字段切换）

### 配置环境变量

复制环境变量示例文件:

```bash
cp dev.vars.example dev.vars
```

编辑 `dev.vars` 文件,设置环境变量。

### 创建Cloudflare资源

创建D1数据库:

```bash
npx wrangler d1 create cfblog-database
```

创建R2存储桶:

```bash
npx wrangler r2 bucket create cfblog-storage
```

创建KV命名空间:

```bash
npx wrangler kv:namespace create "CACHE"
```

将创建的资源ID添加到 `wrangler.toml` 中。

### 运行数据库迁移

```bash
npm run db:local
```

### 启动开发服务器

```bash
npm start
```

或使用后台启动脚本:

```bash
# Windows
start-dev-background.bat

# Mac/Linux
./start-dev-background.sh
```

### 访问应用

- 前台: http://localhost:8787
- 后台: http://localhost:8787/admin
- 默认账号: `admin` / `admin123`

## API端点

### 用户认证
- `POST /api/user/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息
- `PUT /api/user/me` - 更新当前用户信息
- `GET /api/user/list` - 获取用户列表(管理员)
- `POST /api/user/create` - 创建用户(管理员)
- `PUT /api/user/:id/status` - 更新用户状态(管理员)
- `PUT /api/user/:id/role` - 更新用户角色(管理员)
- `DELETE /api/user/:id` - 删除用户(管理员)

### 文章管理
- `GET /api/post/list` - 获取文章列表
- `GET /api/post/:id` - 获取文章详情
- `GET /api/post/slug/:slug` - 根据slug获取文章
- `POST /api/post/create` - 创建文章
- `PUT /api/post/:id/update` - 更新文章
- `DELETE /api/post/:id/delete` - 删除文章
- `GET /api/post/search` - 搜索文章

### 分类管理
- `GET /api/category/list` - 获取分类列表
- `GET /api/category/tree` - 获取分类树
- `GET /api/category/:id` - 获取分类详情
- `POST /api/category/create` - 创建分类(管理员)
- `PUT /api/category/:id/update` - 更新分类(管理员)
- `DELETE /api/category/:id/delete` - 删除分类(管理员)

### 标签管理
- `GET /api/tag/list` - 获取标签列表
- `GET /api/tag/popular` - 获取热门标签
- `GET /api/tag/:id` - 获取标签详情
- `POST /api/tag/create` - 创建标签(管理员)
- `PUT /api/tag/:id/update` - 更新标签(管理员)
- `DELETE /api/tag/:id/delete` - 删除标签(管理员)

### 评论管理
- `POST /api/comment/create` - 创建评论
- `GET /api/comment/post/:postId` - 获取文章评论
- `DELETE /api/comment/:id/delete` - 删除评论(管理员)

### 反馈管理
- `POST /api/feedback/create` - 提交反馈
- `GET /api/feedback/list` - 获取反馈列表(管理员)
- `DELETE /api/feedback/:id/delete` - 删除反馈(管理员)

### 系统设置
- `GET /api/settings` - 获取所有设置
- `GET /api/settings/blog` - 获取博客信息
- `GET /api/settings/display` - 获取显示设置
- `GET /api/settings/comments` - 获取评论设置
- `GET /api/settings/upload` - 获取上传设置
- `GET /api/settings/seo` - 获取SEO设置
- `PUT /api/settings/blog` - 更新博客信息
- `PUT /api/settings/display` - 更新显示设置
- `PUT /api/settings/comments` - 更新评论设置
- `PUT /api/settings/upload` - 更新上传设置
- `PUT /api/settings/seo` - 更新SEO设置

### 搜索
- `GET /api/search` - 全站搜索

### 缓存管理(管理员)
- `DELETE /admin/api/cache/all` - 清除所有缓存
- `DELETE /admin/api/cache/posts` - 清除文章缓存
- `DELETE /admin/api/cache/categories` - 清除分类缓存
- `DELETE /admin/api/cache/tags` - 清除标签缓存
- `DELETE /admin/api/cache/html` - 清除HTML缓存

## 开发进度

### ✅ 已完成
- [x] 环境搭建和配置
- [x] 数据库设计和迁移(12个迁移文件)
- [x] 测试数据生成脚本
- [x] 用户管理模块(完整实现)
- [x] 系统设置模块(完整实现)
- [x] 分类管理模块(完整实现)
- [x] 标签管理模块(完整实现)
- [x] 文章管理模块(完整实现)
- [x] 评论系统模块(完整实现)
- [x] 反馈/留言板模块(完整实现)
- [x] 搜索模块(完整实现)
- [x] 缓存管理模块(完整实现)
- [x] 前台路由系统(完整实现)
- [x] 语义化HTML结构
- [x] 模块化组件设计
- [x] 主题系统框架
- [x] 国际化(i18n)框架
- [x] 响应式设计基础
- [x] E2E测试框架(88+测试用例)
- [x] 问题识别和修复措施
- [x] 完整的测试文档

### ⏳ 待完成
- [ ] 修复wrangler配置和启动问题
- [ ] 执行完整E2E测试
- [ ] 修复测试发现的问题
- [ ] 存储服务配置(R2、KV)
- [ ] 深色主题实现
- [ ] 完整的部署文档
- [ ] 生产环境部署

## 用户角色

| 角色 | 权限 |
|------|------|
| **管理员(admin)** | 拥有所有权限,包括用户管理、文章管理、分类标签管理、系统设置等 |
| **投稿者(contributor)** | 可创建和编辑自己的文章,发布需要管理员审核 |
| **普通成员(member)** | 无权限,只能留言 |

## 数据库表结构

- `users` - 用户表
- `posts` - 文章表
- `categories` - 分类表
- `tags` - 标签表
- `comments` - 评论表
- `feedback` - 反馈表
- `attachments` - 附件表
- `settings` - 设置表
- `post_categories` - 文章-分类关联表
- `post_tags` - 文章-标签关联表
- `trackbacks` - 引用表(预留)

## 测试数据

项目包含完整的测试数据生成脚本,可以生成:
- 20+ 用户(管理员、投稿者、成员)
- 15+ 分类(支持多级结构)
- 30+ 标签
- 200+ 文章(已发布、草稿、归档)
- 300+ 评论(支持嵌套回复)
- 50+ 反馈/留言
- 30+ 附件

运行测试数据生成:

```bash
node scripts/generate-test-data.js
```

## 安全特性

- ✅ SessionID认证(HMAC-SHA1签名)
- ✅ 前端双重SHA-256哈希加密
- ✅ 时间戳验证防重放攻击
- ✅ 会话自动过期机制
- ✅ SQL注入防护(参数化查询)
- ✅ XSS防护(HTML转义)
- ✅ CORS配置
- ✅ SameSite Cookie

## 性能优化

- ✅ KV缓存策略
- ✅ 数据库索引优化
- ✅ 查询分页
- ✅ 边缘计算优化
- ✅ CDN静态资源
- ✅ 智能缓存失效机制

## SEO优化

- ✅ 友好的URL结构
- ✅ Meta标签支持
- ✅ Sitemap生成
- ✅ Open Graph标签(待实现)
- ✅ 结构化数据(待实现)

## 文档

- [产品文档](./PRODUCT_DOCUMENTATION.md)
- [API文档](./PRODUCT_DOCUMENTATION_API.md)
- [部署文档](./PRODUCT_DOCUMENTATION_DEPLOYMENT.md)
- [前台开发指南](./FRONTEND_GUIDE.md)
- [E2E测试指南](./E2E_TEST_GUIDE.md)
- [项目进度](./PROJECT_PROGRESS.md)

## E2E 测试

CFBlog 提供完整的 E2E 测试解决方案，覆盖所有前台核心功能。

### 快速开始

```bash
# 1. 初始化数据库
npm run db:local

# 2. 导入测试数据
npm run db:seed

# 3. 运行 E2E 测试
npm run test:e2e

# 4. 查看测试报告
npm run test:e2e:report
```

### 测试覆盖范围

✅ **首页功能** - 文章列表、搜索、导航、分页  
✅ **文章详情** - 内容展示、评论、点赞、分享  
✅ **认证权限** - 登录/注销、权限控制、用户角色  
✅ **国际化** - 多语言切换、内容翻译  
✅ **主题切换** - 深色/浅色主题、样式切换  
✅ **评论功能** - 提交评论、回复、删除  
✅ **响应式设计** - 移动端、平板端、桌面端

### 测试组件

- **CacheManager** - 缓存管理（自动清空缓存）
- **ServerCheck** - 服务器检查（自动启动开发服务器）
- **UserSwitcher** - 用户切换（不同角色登录）
- **LoginChecker** - 登录验证（权限检查）
- **TestHelper** - 测试辅助工具

详细说明请查看 [E2E 测试指南](./E2E_TEST_GUIDE.md)

## 贡献

欢迎提交Issue和Pull Request!

## 许可证

MIT License

## 联系方式

- GitHub Issues
- 邮箱: support@cfblog.local

---

**最后更新**: 2026-01-16
**项目版本**: 1.0.0
**当前进度**: 约80%
