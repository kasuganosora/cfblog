# Cloudflare Blog 部署指南

本指南将帮助您将 Cloudflare Blog 项目部署到 Cloudflare Workers 平台。

## 前置条件

1. 安装 Node.js (建议版本 16 或更高)
2. 安装 Wrangler CLI: `npm install -g wrangler`
3. 登录 Cloudflare: `wrangler login`

## 部署步骤

### 1. 克隆项目并安装依赖

```bash
git clone <项目仓库地址>
cd cfblog
npm install
```

### 2. 配置 Wrangler

复制环境变量示例文件并根据需要修改：

```bash
cp dev.vars.example dev.vars
```

编辑 `dev.vars` 文件，设置以下变量：
- `JWT_SECRET`: 用于 JWT 令牌的密钥（建议使用随机生成的长字符串）
- `ADMIN_PASSWORD`: 默认管理员密码（部署后建议立即修改）

### 3. 创建 D1 数据库

```bash
wrangler d1 create cfblog-database
```

复制返回的 `database_id` 到 `wrangler.toml` 文件中，替换 `database_id = ""` 中的空字符串：

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "your-database-id-here"  # 替换为实际的数据库ID
```

### 4. 运行数据库迁移

```bash
# 本地测试
wrangler d1 migrations apply cfblog-database --local

# 生产环境
wrangler d1 migrations apply cfblog-database
```

### 5. 创建 R2 存储桶

```bash
wrangler r2 bucket create cfblog-storage
```

更新 `wrangler.toml` 文件中的 R2 配置，确保 `bucket_name` 与创建的存储桶名称一致：

```toml
[[r2_buckets]]
binding = "BLOG_STORAGE"
bucket_name = "cfblog-storage"  # 确保与创建的存储桶名称一致
```

### 6. 创建 KV 命名空间

```bash
wrangler kv:namespace create "CACHE"
```

复制返回的 `id` 和 `preview_id` 到 `wrangler.toml` 文件中：

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id-here"        # 替换为实际的ID
preview_id = "your-preview-id-here"          # 替换为实际的预览ID
```

### 7. 设置生产环境密钥

```bash
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
```

输入与 `dev.vars` 中相同的值。

### 8. 测试本地开发环境

```bash
npm run dev
```

访问 `http://localhost:8787` 查看博客。

### 9. 部署到生产环境

```bash
npm run deploy
```

部署完成后，Wrangler 将返回一个 Workers 域名，例如 `cfblog.your-subdomain.workers.dev`。

## 初始设置

1. 访问部署的域名，进入管理后台（`/admin/login`）
2. 使用管理员账户登录（用户名：`admin`，密码：您设置的 `ADMIN_PASSWORD`）
3. 在管理后台中：
   - 创建分类
   - 创建第一篇文章
   - 检查系统设置并根据需要调整
   - 添加其他用户（如需要）

## 自定义域名（可选）

如果您想使用自己的域名：

1. 在 Cloudflare Dashboard 中添加您的域名
2. 为您的域名添加 CNAME 记录指向 Workers 域名
3. 在 Workers 设置中添加自定义域名

## 监控和调试

使用以下命令查看日志：

```bash
npm run tail
```

## 故障排除

### 常见问题

1. **数据库迁移失败**
   - 确保 `wrangler.toml` 中的数据库 ID 正确
   - 检查网络连接

2. **R2 存储访问失败**
   - 确保存储桶名称正确
   - 检查权限设置

3. **JWT 认证失败**
   - 确保 `JWT_SECRET` 已正确设置
   - 检查客户端和服务器的时间同步

4. **页面显示 404**
   - 检查路由配置
   - 确保已运行数据库迁移

5. **上传文件失败**
   - 检查 R2 存储配置
   - 确认文件大小限制（当前设置为 50MB）

### 获取帮助

如果遇到问题，可以：
1. 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
2. 检查 [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
3. 查看 [Cloudflare 社区论坛](https://community.cloudflare.com/)

## 性能优化

1. 使用 KV 缓存频繁访问的数据
2. 启用 Cloudflare 的缓存标头
3. 优化数据库查询
4. 压缩静态资源

## 安全考虑

1. 定期更新 JWT 密钥
2. 使用强密码
3. 定期备份数据库
4. 启用适当的 CORS 策略
5. 限制上传文件类型和大小