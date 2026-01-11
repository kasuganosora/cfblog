# Cloudflare Blog 演示

## 快速开始

1. **启动开发服务器**
   ```bash
   cd d:/code/cfblog
   npm run dev
   ```
   这将在本地启动开发服务器，默认端口是 8787。

2. **运行 API 测试**
   在另一个终端中运行：
   ```bash
   npm test
   ```
   这将测试基本的 API 功能。

3. **访问博客**
   - 前台: http://localhost:8787
   - 后台: http://localhost:8787/admin

## 功能测试

### 1. 创建管理员账户
访问 http://localhost:8787/login，使用默认管理员账户登录：
- 用户名: admin
- 密码: admin123

### 2. 创建分类和标签
在后台管理界面，可以创建分类和标签：
- 访问 http://localhost:8787/admin/categories
- 访问 http://localhost:8787/admin/tags

### 3. 发布文章
在后台管理界面，创建和发布文章：
- 访问 http://localhost:8787/admin/posts/create
- 填写文章标题、内容，选择分类和标签
- 点击"发布文章"

### 4. 查看文章和评论
- 在前台 http://localhost:8787 查看发布的文章
- 点击文章标题进入详情页
- 在文章下方发表评论

### 5. 留言功能
- 访问 http://localhost:8787/feedback
- 可以发表留言和建议

### 6. 搜索功能
- 在顶部导航栏点击搜索图标
- 输入关键词搜索文章

## 测试 API

### 登录
```bash
curl -X POST http://localhost:8787/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 获取文章列表
```bash
curl http://localhost:8787/api/post/list
```

### 创建分类
```bash
curl -X POST http://localhost:8787/api/category/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"技术","description":"技术相关文章"}'
```

### 创建文章
```bash
curl -X POST http://localhost:8787/api/post/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"测试文章","content":"这是测试内容","status":1}'
```

## 部署

1. **设置环境变量**
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put ADMIN_PASSWORD
   ```

2. **创建数据库**
   ```bash
   wrangler d1 create cfblog-database
   ```

3. **创建存储桶**
   ```bash
   wrangler r2 bucket create cfblog-storage
   ```

4. **运行数据库迁移**
   ```bash
   wrangler d1 migrations apply cfblog-database
   ```

5. **部署到 Cloudflare**
   ```bash
   npm run deploy
   ```

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
│   │   └── ...         # 其他模型
│   ├── routes/          # 路由处理
│   │   ├── user.js      # 用户路由
│   │   ├── post.js      # 文章路由
│   │   └── ...         # 其他路由
│   ├── services/        # 业务逻辑
│   └── utils/           # 工具函数
├── static/              # 静态文件
│   ├── css/             # 样式文件
│   ├── js/              # JavaScript 文件
│   └── db/migrations/   # 数据库迁移文件
├── tpls/                # 前端模板
│   ├── admin/           # 后台模板
│   └── *.html          # 前台模板
├── wrangler.toml        # Wrangler 配置
├── dev.vars.example     # 环境变量示例
└── package.json         # 项目依赖
```

## 技术栈

- **Cloudflare Workers**: 服务器less 计算平台
- **R2**: 对象存储，用于存储文章正文和附件
- **D1**: SQL 数据库，存储用户、评论和其他数据
- **KV**: 键值存储，用于缓存
- **Node.js**: 开发环境
- **Wrangler**: Cloudflare 开发工具