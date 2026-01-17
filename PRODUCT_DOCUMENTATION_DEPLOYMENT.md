# CFBlog 产品文档 - 部署与使用篇

---

## 部署指南

### 环境要求

#### 开发环境

- **Node.js**：v18.0.0 或更高版本
- **npm**：v9.0.0 或更高版本
- **Wrangler CLI**：v4.54.0 或更高版本

#### 生产环境

- Cloudflare 账号（免费或付费）
- 自定义域名（可选）

### 开发环境搭建

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

复制环境变量示例文件：

```bash
cp dev.vars.example dev.vars
```

编辑 `dev.vars` 文件：

```bash
# 环境标识
ENVIRONMENT=development

# JWT 密钥（开发环境）
JWT_SECRET=test-jwt-secret-for-development-only

# 管理员密码（开发环境）
ADMIN_PASSWORD=p123456789

# Session 密钥
SESSION_SECRET=your-session-secret-key-here-change-in-production
```

**安全提示**：
- 开发环境可以使用测试密钥
- 生产环境必须使用强随机密钥
- 密钥长度至少 32 字符

#### 4. 创建 Cloudflare 资源

##### 创建 D1 数据库

```bash
wrangler d1 create cfblog-database
```

复制返回的 `database_id` 到 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog"
database_id = "your-database-id-here"
migrations_dir = "static/db/migrations"
```

##### 创建 R2 存储桶

```bash
wrangler r2 bucket create cfblog-storage
```

编辑 `wrangler.toml`：

```toml
[[r2_buckets]]
binding = "BLOG_STORAGE"
bucket_name = "cfblog-storage"
```

##### 创建 KV 命名空间

```bash
wrangler kv:namespace create "CACHE"
```

复制返回的 `id` 到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "BLOG"
id = "your-kv-id-here"
preview_id = "local-preview-kv-id"
```

#### 5. 运行数据库迁移

本地迁移：

```bash
npm run db:local
```

#### 6. 启动开发服务器

Windows（推荐使用后台启动）：

```bash
start-dev-background.bat
```

Mac/Linux：

```bash
./start-dev-background.sh
```

或者使用 npm 命令：

```bash
npm run dev
```

#### 7. 访问应用

- 前台：http://localhost:8787
- 后台：http://localhost:8787/admin
- 默认账号：`admin` / `admin123`

### 生产环境部署

#### 1. 登录 Cloudflare

```bash
wrangler login
```

#### 2. 创建生产环境资源

##### 创建 D1 数据库（生产）

```bash
wrangler d1 create cfblog-database-prod
```

##### 创建 R2 存储桶（生产）

```bash
wrangler r2 bucket create cfblog-storage-prod
```

##### 创建 KV 命名空间（生产）

```bash
wrangler kv:namespace create "CACHE" --preview
```

#### 3. 配置生产环境

编辑 `wrangler.toml`，添加生产环境配置：

```toml
[env.production]
name = "cfblog-prod"

[env.production.vars]
ENVIRONMENT = "production"

[env.production.d1_databases]
binding = "DB"
database_name = "cfblog-prod"
database_id = "your-prod-database-id"
migrations_dir = "static/db/migrations"

[env.production.r2_buckets]
binding = "BLOG_STORAGE"
bucket_name = "cfblog-storage-prod"

[env.production.kv_namespaces]
binding = "BLOG"
id = "your-prod-kv-id"
```

#### 4. 设置生产环境 Secrets

```bash
# 设置 JWT 密钥（生产环境必须使用强密钥）
wrangler secret put JWT_SECRET --env production

# 设置管理员密码
wrangler secret put ADMIN_PASSWORD --env production

# 设置 Session 密钥
wrangler secret put SESSION_SECRET --env production
```

**生成强密钥的方法**：

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 5. 运行生产数据库迁移

```bash
wrangler d1 migrations apply cfblog-database-prod --remote
```

#### 6. 部署到 Cloudflare

```bash
# 部署到生产环境
wrangler deploy --env production
```

#### 7. 配置自定义域名（可选）

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Settings" → "Triggers"
4. 添加自定义域名

或在命令行中配置：

```bash
wrangler domains add your-domain.com --env production
```

#### 8. 配置 DNS（如果使用自定义域名）

在 Cloudflare DNS 中添加记录：

```
类型: CNAME
名称: @ (或 www)
目标: your-worker.workers.dev
代理状态: 已代理（橙色云朵）
```

### 部署检查清单

部署前请确认以下事项：

- [ ] 所有依赖已安装
- [ ] 环境变量已正确配置
- [ ] 生产环境 Secrets 已设置（不要使用默认值）
- [ ] 数据库迁移已成功执行
- [ ] R2 存储桶已创建并配置
- [ ] KV 命名空间已创建并配置
- [ ] 自定义域名 DNS 已配置（如适用）
- [ ] 测试环境功能正常

### 环境变量说明

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| ENVIRONMENT | 环境标识 | 是 | development/production |
| JWT_SECRET | JWT 认证密钥 | 是 | 随机字符串（至少 32 字符） |
| ADMIN_PASSWORD | 默认管理员密码 | 是 | 足够强的密码 |
| SESSION_SECRET | Session 签名密钥 | 是 | 随机字符串（至少 32 字符） |

### 数据库迁移管理

#### 创建新迁移

在 `migrations/` 目录下创建新的 SQL 文件，命名格式为 `NNNN_description.sql`：

```sql
-- migrations/0010_add_new_field.sql
ALTER TABLE posts ADD COLUMN new_field TEXT DEFAULT '';
```

#### 应用迁移

本地开发：

```bash
npm run db:local
```

生产环境：

```bash
npm run db:migrate
```

#### 回滚迁移

D1 不支持自动回滚，需要手动编写回滚脚本：

```bash
# 连接到数据库
wrangler d1 execute cfblog-database --local --command="DROP TABLE IF EXISTS new_table;"
```

### 常见部署问题

#### 问题 1：数据库连接失败

**症状**：部署后数据库相关功能无法使用

**解决方案**：
1. 检查 `database_id` 是否正确
2. 确认数据库迁移已执行
3. 检查 Secrets 配置

#### 问题 2：R2 上传失败

**症状**：文件上传功能无法使用

**解决方案**：
1. 确认 R2 存储桶已创建
2. 检查 `bucket_name` 配置
3. 验证 R2 权限设置

#### 问题 3：KV 缓存不工作

**症状**：缓存功能无法使用

**解决方案**：
1. 检查 KV 命名空间 ID 是否正确
2. 确认 KV 绑定名称匹配
3. 检查代码中 KV 使用方式

#### 问题 4：登录失败

**症状**：用户无法登录

**解决方案**：
1. 检查 Secrets 是否正确设置
2. 确认 Session Secret 已配置
3. 清除浏览器 Cookie

#### 问题 5：部署后 404 错误

**症状**：访问域名返回 404

**解决方案**：
1. 检查 Workers 是否成功部署
2. 确认自定义域名配置正确
3. 检查 DNS 记录

### 监控和日志

#### 查看实时日志

```bash
wrangler tail --env production
```

#### 查看部署历史

```bash
wrangler deployments list --env production
```

#### 性能监控

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 查看 "Analytics" 标签页

---

## 使用说明

### 管理员使用指南

#### 1. 首次登录

1. 访问 `/login` 页面
2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`（开发环境）
3. 登录后立即修改密码

#### 2. 系统设置

**博客基础配置**：

访问 `/admin/settings`，配置以下内容：

- 博客标题
- 博客描述
- 每页文章数量
- 评论审核开关
- 文件上传限制

#### 3. 用户管理

**创建新用户**：

1. 访问 `/admin/users`
2. 点击"新建用户"
3. 填写用户信息：
   - 用户名
   - 邮箱
   - 密码
   - 显示名称
   - 角色（管理员/投稿者）
4. 保存

**管理用户**：

- 编辑用户信息
- 启用/禁用用户
- 修改用户角色
- 删除用户（不能删除自己）

#### 4. 分类管理

**创建分类**：

1. 访问 `/admin/categories`
2. 点击"新建分类"
3. 填写分类信息：
   - 分类名称
   - Slug（自动生成）
   - 描述
   - 父分类（可选）
   - 排序
4. 保存

**管理分类**：

- 编辑分类信息
- 设置父子关系
- 调整排序
- 删除分类（必须先删除或移动分类下的文章）

#### 5. 标签管理

**创建标签**：

1. 访问 `/admin/tags`
2. 点击"新建标签"
3. 填写标签信息：
   - 标签名称
   - Slug（自动生成）
4. 保存

**管理标签**：

- 编辑标签信息
- 删除标签（必须先删除或移除标签下的文章）

#### 6. 文章管理

**创建文章**：

1. 访问 `/admin/posts`
2. 点击"新建文章"
3. 填写文章信息：
   - 标题
   - Slug（自动生成）
   - 摘要
   - 内容（支持 Markdown）
   - 状态（草稿/已发布）
   - 特色文章
   - 评论开关
   - 分类（可多选）
   - 标签（可多选）
4. 保存

**编辑文章**：

1. 在文章列表中点击"编辑"
2. 修改文章内容
3. 保存更改

**发布/取消发布**：

- 草稿 → 已发布：点击"发布"
- 已发布 → 草稿：点击"取消发布"

**删除文章**：

- 点击"删除"按钮
- 确认删除操作

**批量操作**：

- 批量删除
- 批量修改状态
- 批量添加分类/标签

#### 7. 评论管理

**审核评论**：

1. 访问 `/admin/comments`
2. 查看待审核评论
3. 点击"通过"或"拒绝"

**管理评论**：

- 回复评论
- 删除评论
- 标记为垃圾评论

#### 8. 留言管理

**查看留言**：

1. 访问 `/admin/feedback`
2. 查看所有留言
3. 查看留言详情

**处理留言**：

- 回复留言
- 标记为已处理
- 删除留言

#### 9. 附件管理

**上传文件**：

1. 访问 `/admin/attachments`
2. 点击"上传文件"
3. 选择文件
4. 等待上传完成

**管理附件**：

- 查看附件列表
- 复制附件链接
- 删除附件

### 投稿者使用指南

#### 1. 创建文章

1. 登录后台（使用投稿者账号）
2. 访问 `/admin/posts`
3. 点击"新建文章"
4. 填写文章内容
5. 选择状态：
   - **草稿**：保存为草稿，仅自己可见
   - **已发布**：提交发布，需要管理员审核
6. 保存

#### 2. 编辑文章

- 只能编辑自己创建的文章
- 编辑后需要重新提交审核

#### 3. 管理个人资料

访问 `/admin/profile`，修改：
- 显示名称
- 邮箱
- 个人简介
- 头像

### 访客使用指南

#### 1. 浏览文章

- 首页：查看最新文章
- 分类页：按分类浏览文章
- 标签页：按标签浏览文章
- 文章详情：阅读完整内容

#### 2. 搜索内容

1. 访问 `/search` 或点击搜索按钮
2. 输入关键词
3. 查看搜索结果

#### 3. 发表评论

1. 在文章详情页底部
2. 填写评论信息：
   - 名称
   - 邮箱
   - 评论内容
3. 点击提交

#### 4. 回复评论

1. 点击"回复"按钮
2. 填写回复内容
3. 提交回复

#### 5. 留言反馈

1. 访问 `/feedback`
2. 填写留言信息：
   - 名称
   - 邮箱（可选）
   - 留言内容
3. 提交留言

### 内容编辑指南

#### Markdown 基础语法

**标题**：
```markdown
# 一级标题
## 二级标题
### 三级标题
```

**强调**：
```markdown
*斜体*
**粗体**
***粗斜体***
```

**列表**：
```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

**链接**：
```markdown
[链接文本](https://example.com)
```

**图片**：
```markdown
![图片描述](https://example.com/image.jpg)
```

**代码**：
```markdown
`行内代码`

```
代码块
```
```

**引用**：
```markdown
> 引用内容
```

#### 高级功能

**插入代码高亮**：

```markdown
```javascript
function hello() {
  console.log('Hello, World!');
}
```
```

**插入表格**：

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
```

**插入分割线**：

```markdown
---
```

**插入 HTML**（支持基础标签）：

```markdown
<div class="custom-block">
  自定义内容
</div>
```

### 最佳实践

#### 1. 文章撰写

- 使用清晰的标题结构
- 添加适当的摘要
- 使用高质量的图片
- 合理使用标签和分类
- 定期更新旧内容

#### 2. SEO 优化

- 使用描述性的标题
- 优化摘要内容
- 使用语义化的标题标签
- 添加内部链接
- 定期更新内容

#### 3. 内容管理

- 定期备份重要内容
- 删除不需要的草稿
- 管理评论和留言
- 监控访问统计

#### 4. 安全建议

- 定期更改密码
- 使用强密码
- 不要共享账号
- 及时更新系统

### 故障排除

#### 常见问题

**Q: 无法登录怎么办？**

A: 请检查：
1. 用户名和密码是否正确
2. 浏览器是否保存了旧 Cookie
3. 尝试清除浏览器缓存和 Cookie
4. 联系管理员重置密码

**Q: 文章发布后不显示？**

A: 请检查：
1. 文章状态是否为"已发布"
2. 文章是否设置了未来发布时间
3. 尝试清除缓存

**Q: 图片上传失败？**

A: 请检查：
1. 图片大小是否超过限制
2. 图片格式是否支持
3. 网络连接是否正常

**Q: 评论提交失败？**

A: 请检查：
1. 是否填写了必填项
2. 评论内容是否符合规范
3. 是否被评论限制（如频率限制）

### 技术支持

如遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 Cloudflare Workers 日志
3. 查看 GitHub Issues
4. 联系技术支持团队

---

## 附录

### A. 项目文件结构

```
cfblog/
├── src/                      # 源代码
│   ├── index.js             # 主入口文件
│   ├── middleware/          # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   └── cors.js         # CORS 中间件
│   ├── models/             # 数据模型
│   │   ├── BaseModel.js   # 基础模型类
│   │   ├── User.js         # 用户模型
│   │   ├── Post.js         # 文章模型
│   │   ├── Category.js     # 分类模型
│   │   ├── Tag.js          # 标签模型
│   │   ├── Comment.js      # 评论模型
│   │   └── Feedback.js     # 反馈模型
│   ├── routes/             # 路由处理
│   │   ├── user.js         # 用户路由
│   │   ├── post.js         # 文章路由
│   │   ├── category.js     # 分类路由
│   │   ├── tag.js          # 标签路由
│   │   ├── comment.js      # 评论路由
│   │   ├── feedback.js     # 反馈路由
│   │   ├── search.js       # 搜索路由
│   │   ├── upload.js       # 上传路由
│   │   ├── frontend.js     # 前台路由
│   │   ├── admin/          # 后台路由
│   │   └── cache-admin.js  # 缓存管理路由
│   ├── utils/              # 工具函数
│   │   ├── auth.js         # 认证工具
│   │   ├── cache.js        # 缓存工具
│   │   ├── db.js           # 数据库工具
│   │   ├── response.js     # 响应工具
│   │   ├── storage.js      # 存储工具
│   │   ├── template.js     # 模板工具
│   │   └── smart-cache.js  # 智能缓存
│   └── services/           # 业务服务
├── migrations/             # 数据库迁移文件
│   ├── 0001_create_users_table.sql
│   ├── 0002_create_posts_table.sql
│   ├── 0003_create_categories_table.sql
│   ├── 0004_create_tags_table.sql
│   ├── 0005_create_comments_table.sql
│   ├── 0006_create_feedback_table.sql
│   ├── 0007_create_attachments_table.sql
│   ├── 0008_create_settings_table.sql
│   ├── 0009_init_admin_user.sql
│   └── 0010_create_trackbacks_table.sql
├── tpls/                   # 前端模板
│   ├── base.html           # 基础模板
│   ├── home.html           # 首页模板
│   ├── post.html           # 文章详情模板
│   ├── category.html       # 分类页模板
│   ├── categories.html     # 分类列表模板
│   ├── tag.html            # 标签页模板
│   ├── tags.html           # 标签列表模板
│   ├── search.html         # 搜索页模板
│   ├── feedback.html       # 留言板模板
│   ├── login.html          # 登录页模板
│   └── admin/              # 后台模板
├── static/                 # 静态资源
│   ├── css/
│   │   └── style.css       # 样式文件
│   ├── js/
│   │   └── main.js         # 主脚本
│   └── images/             # 图片资源
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
| role | TEXT | 角色 |
| bio | TEXT | 个人简介 |
| status | INTEGER | 状态 |
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
| status | INTEGER | 状态 |
| featured | INTEGER | 特色文章 |
| comment_status | INTEGER | 评论状态 |
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
| status | INTEGER | 状态 |
| created_at | DATETIME | 创建时间 |

#### feedback（反馈表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 留言者名称 |
| email | TEXT | 邮箱 |
| content | TEXT | 留言内容 |
| status | INTEGER | 状态 |
| created_at | DATETIME | 创建时间 |

#### attachments（附件表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| filename | TEXT | 文件名 |
| original_name | TEXT | 原始文件名 |
| mime_type | TEXT | MIME 类型 |
| file_size | INTEGER | 文件大小 |
| storage_key | TEXT | R2 存储键 |
| upload_user_id | INTEGER | 上传者 ID |
| created_at | DATETIME | 创建时间 |

#### settings（设置表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| key | TEXT | 配置键（唯一） |
| value | TEXT | 配置值 |
| description | TEXT | 描述 |
| updated_at | DATETIME | 更新时间 |

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

---

**文档版本**：v1.0.0  
**最后更新**：2024-01-16  
**维护者**：CFBlog Team
