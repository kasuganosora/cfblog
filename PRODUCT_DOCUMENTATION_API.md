# CFBlog 产品文档 - API 接口篇

## 接口文档（续）

### 标签接口（续）

#### 4. 创建标签

**接口**：`POST /api/tag/create`

**认证**：需要管理员权限

**请求体**：
```json
{
  "name": "新标签",
  "slug": "new-tag"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "创建标签成功",
  "data": {
    "id": 3,
    "name": "新标签",
    "slug": "new-tag"
  }
}
```

#### 5. 更新标签

**接口**：`PUT /api/tag/:id/update`

**认证**：需要管理员权限

**请求体**：同创建标签

**响应示例**：
```json
{
  "success": true,
  "message": "更新标签成功",
  "data": {
    "id": 1,
    "name": "更新后的标签",
    "slug": "cloudflare"
  }
}
```

#### 6. 删除标签

**接口**：`DELETE /api/tag/:id/delete`

**认证**：需要管理员权限

**限制**：标签下必须没有文章才能删除

**响应示例**：
```json
{
  "success": true,
  "message": "删除标签成功"
}
```

### 评论接口

#### 1. 创建评论

**接口**：`POST /api/comment/create`

**认证**：不需要

**请求体**：
```json
{
  "postId": 1,
  "authorName": "访客",
  "authorEmail": "visitor@example.com",
  "content": "这是一条评论",
  "parentId": null
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "post_id": 1,
    "author_name": "访客",
    "author_email": "visitor@example.com",
    "content": "这是一条评论",
    "parent_id": null,
    "status": 1,
    "created_at": "2024-01-16T00:00:00.000Z"
  }
}
```

#### 2. 获取文章评论

**接口**：`GET /api/comment/post/:postId`

**认证**：不需要

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 20 |

**响应示例**：
```json
{
  "success": true,
  "message": "获取评论成功",
  "data": {
    "success": true,
    "data": [
      {
        "id": 1,
        "post_id": 1,
        "author_name": "访客",
        "content": "这是一条评论",
        "parent_id": null,
        "status": 1,
        "created_at": "2024-01-16T00:00:00.000Z",
        "replies": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

#### 3. 删除评论

**接口**：`DELETE /api/comment/:id/delete`

**认证**：需要管理员权限

**响应示例**：
```json
{
  "success": true,
  "message": "删除评论成功"
}
```

### 反馈接口

#### 1. 提交反馈

**接口**：`POST /api/feedback/create`

**认证**：不需要

**请求体**：
```json
{
  "name": "访客",
  "email": "visitor@example.com",
  "content": "这是一条反馈"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "反馈提交成功",
  "data": {
    "id": 1,
    "name": "访客",
    "email": "visitor@example.com",
    "content": "这是一条反馈",
    "status": 1,
    "created_at": "2024-01-16T00:00:00.000Z"
  }
}
```

#### 2. 获取反馈列表

**接口**：`GET /api/feedback/list`

**认证**：需要管理员权限

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 20 |
| status | integer | 否 | 状态筛选 |

**响应示例**：
```json
{
  "success": true,
  "message": "获取反馈列表成功",
  "data": {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "访客",
        "email": "visitor@example.com",
        "content": "这是一条反馈",
        "status": 1,
        "created_at": "2024-01-16T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### 3. 删除反馈

**接口**：`DELETE /api/feedback/:id/delete`

**认证**：需要管理员权限

**响应示例**：
```json
{
  "success": true,
  "message": "删除反馈成功"
}
```

### 搜索接口

#### 全站搜索

**接口**：`GET /api/search`

**认证**：不需要

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| type | string | 否 | 搜索类型（post/all） |
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 10 |

**响应示例**：
```json
{
  "success": true,
  "message": "搜索成功",
  "data": {
    "keyword": "Cloudflare",
    "results": [
      {
        "type": "post",
        "id": 1,
        "title": "Cloudflare Workers 入门",
        "slug": "cloudflare-workers-intro",
        "excerpt": "这是文章摘要..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### 用户管理接口（管理员）

#### 1. 获取用户列表

**接口**：`GET /api/user/list`

**认证**：需要管理员权限

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 10 |
| role | string | 否 | 角色筛选 |
| status | integer | 否 | 状态筛选 |

**响应示例**：
```json
{
  "success": true,
  "message": "获取用户列表成功",
  "data": {
    "success": true,
    "data": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "display_name": "管理员",
        "role": "admin",
        "status": 1,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### 2. 创建用户

**接口**：`POST /api/user/create`

**认证**：需要管理员权限

**请求体**：
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "新用户",
  "role": "contributor"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "创建用户成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "display_name": "新用户",
    "role": "contributor",
    "status": 1
  }
}
```

#### 3. 更新用户状态

**接口**：`PUT /api/user/:id/status`

**认证**：需要管理员权限

**请求体**：
```json
{
  "status": 0
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "更新用户状态成功"
}
```

#### 4. 更新用户角色

**接口**：`PUT /api/user/:id/role`

**认证**：需要管理员权限

**请求体**：
```json
{
  "role": "admin"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "更新用户角色成功"
}
```

#### 5. 删除用户

**接口**：`DELETE /api/user/:id`

**认证**：需要管理员权限

**限制**：不能删除自己

**响应示例**：
```json
{
  "success": true,
  "message": "删除用户成功"
}
```

### 上传接口

#### 上传文件

**接口**：`POST /api/upload`

**认证**：需要登录

**请求格式**：`multipart/form-data`

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 文件 |

**响应示例**：
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "id": 1,
    "filename": "unique-filename.jpg",
    "original_name": "image.jpg",
    "mime_type": "image/jpeg",
    "file_size": 123456,
    "storage_key": "uploads/unique-filename.jpg",
    "url": "https://your-domain.com/uploads/unique-filename.jpg",
    "created_at": "2024-01-16T00:00:00.000Z"
  }
}
```

### Sitemap 接口

#### 获取 Sitemap

**接口**：`GET /sitemap.xml`

**认证**：不需要

**响应格式**：XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2024-01-16T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/post/first-post</loc>
    <lastmod>2024-01-15T12:00:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 缓存管理接口（管理员）

#### 清除缓存

**接口**：`DELETE /admin/api/cache/*`

**认证**：需要管理员权限

**接口列表**：
- `DELETE /admin/api/cache/all` - 清除所有缓存
- `DELETE /admin/api/cache/posts` - 清除文章缓存
- `DELETE /admin/api/cache/categories` - 清除分类缓存
- `DELETE /admin/api/cache/tags` - 清除标签缓存
- `DELETE /admin/api/cache/html` - 清除 HTML 页面缓存

**响应示例**：
```json
{
  "success": true,
  "message": "缓存清除成功"
}
```

---

## 前端页面路由

### 公共页面

#### 1. 首页

**路由**：`/` 或 `/index.html`

**功能**：展示最新发布的文章列表

#### 2. 文章详情页

**路由**：`/post/:slug`

**功能**：展示文章完整内容和评论

#### 3. 分类页面

**路由**：`/category/:slug`

**功能**：展示该分类下的所有文章

#### 4. 分类列表页

**路由**：`/categories`

**功能**：展示所有分类

#### 5. 标签页面

**路由**：`/tag/:slug`

**功能**：展示该标签下的所有文章

#### 6. 标签列表页

**路由**：`/tags`

**功能**：展示所有标签

#### 7. 搜索页

**路由**：`/search`

**功能**：搜索和展示搜索结果

#### 8. 留言板页

**路由**：`/feedback`

**功能**：提交和展示留言

#### 9. 登录页

**路由**：`/login`

**功能**：用户登录

### 管理后台页面

#### 1. 仪表盘

**路由**：`/admin`

**功能**：展示系统概览和统计数据

#### 2. 文章管理

**路由**：`/admin/posts`

**功能**：文章列表、创建、编辑、删除

#### 3. 分类管理

**路由**：`/admin/categories`

**功能**：分类列表、创建、编辑、删除

#### 4. 标签管理

**路由**：`/admin/tags`

**功能**：标签列表、创建、编辑、删除

#### 5. 评论管理

**路由**：`/admin/comments`

**功能**：评论列表、审核、删除

#### 6. 留言管理

**路由**：`/admin/feedback`

**功能**：留言列表、回复、删除

#### 7. 附件管理

**路由**：`/admin/attachments`

**功能**：文件列表、上传、删除

#### 8. 用户管理

**路由**：`/admin/users`

**功能**：用户列表、创建、编辑、删除

#### 9. 系统设置

**路由**：`/admin/settings`

**功能**：博客配置管理
