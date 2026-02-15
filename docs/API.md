# CFBlog API Reference

Base URL: `https://<your-worker>.workers.dev/api`

## Authentication

CFBlog uses cookie-based sessions. Call `POST /api/user/login` to obtain a session cookie, which is automatically sent with subsequent requests.

Auth levels used below:
- **Public** - No authentication required
- **Auth** - Requires valid session cookie (`requireAuth` middleware)
- **Admin** - Requires admin role (`requireAdmin` middleware)

### Standard Response Format

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Error
{ "success": false, "message": "error description" }
```

### Standard Pagination

Endpoints that return lists accept these query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page |

Paginated responses include:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

## User & Auth

### POST /api/user/login

Login and receive a session cookie. Supports both JSON and form-data.

- **Auth**: Public
- **Rate limit**: IP-based, blocks after repeated failures

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "admin", "role": "admin", ... }
  },
  "message": "Login successful"
}

// Response 429 (rate limited)
{ "success": false, "message": "Too many failed attempts. Please try again in 15 minutes." }
```

### POST /api/user/logout

Clear session cookie.

- **Auth**: Public

```json
// Response 200
{ "success": true, "message": "Logged out successfully" }
```

### GET /api/user/me

Get current logged-in user info.

- **Auth**: Auth

```json
// Response 200
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "admin", "display_name": "Admin", "role": "admin", ... }
  }
}
```

### GET /api/user/list

List all users.

- **Auth**: Admin
- **Query**: `page`, `limit`, `role` (admin/contributor/member), `status` (0/1)

### POST /api/user/create

Create a new user.

- **Auth**: Admin

```json
// Request
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```

### PUT /api/user/:id/password

Change user password. When changing your own password, `oldPassword` is required.

- **Auth**: Admin

```json
// Change own password
{ "oldPassword": "old123", "newPassword": "new456" }

// Admin reset another user's password
{ "newPassword": "new456" }
```

### PUT /api/user/:id/status

Update user active status. Cannot change your own status.

- **Auth**: Admin

```json
{ "status": 0 }   // 0 = inactive, 1 = active
```

### PUT /api/user/:id/role

Update user role.

- **Auth**: Admin

```json
{ "role": "contributor" }   // admin, contributor, member
```

### DELETE /api/user/:id

Delete a user. Cannot delete yourself.

- **Auth**: Admin

### GET /api/user/login-audit

Get login attempt history.

- **Auth**: Admin
- **Query**: `page`, `limit`

---

## Posts

### GET /api/post/list

Get post list. Default request (page 1, limit 10, no filters) is cached in R2.

- **Auth**: Public
- **Query**: `page`, `limit`, `status` (0=draft, 1=published), `featured` (true/false), `category_id`, `tag_id`

```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "Hello World",
      "slug": "hello-world",
      "excerpt": "...",
      "content": "...",
      "status": 1,
      "featured": 0,
      "view_count": 42,
      "author_id": 1,
      "username": "admin",
      "author_name": "Admin",
      "author_avatar": null,
      "published_at": "2026-02-15 10:00:00",
      "created_at": "2026-02-15 10:00:00",
      "updated_at": "2026-02-15 10:00:00"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### GET /api/post/:id

Get post by ID. Increments view count for published posts (skips if visitor is the author).

- **Auth**: Public

Returns post with categories, tags, and author info.

### GET /api/post/slug/:slug

Get post by slug. Published posts are cached in R2.

- **Auth**: Public

### GET /api/post/search

Search posts by keyword (matches title and excerpt).

- **Auth**: Public
- **Query**: `keyword` (required), `page`, `limit`

```json
// Response 200
{
  "keyword": "javascript",
  "results": [...],
  "pagination": { ... }
}
```

### POST /api/post/create

Create a new post.

- **Auth**: Auth

```json
// Request
{
  "title": "My Post",
  "author_id": 1,
  "content": "# Hello\n\nPost content...",
  "excerpt": "Short summary",
  "status": 1,
  "featured": false,
  "categoryIds": [1, 2],
  "tagIds": [3, 4]
}
```

The slug is auto-generated from the title. If published (`status: 1`), `published_at` is set automatically.

### PUT /api/post/:id/update

Update a post. Only the author or admin can edit.

- **Auth**: Auth

```json
// Request - send only fields to update
{
  "title": "Updated Title",
  "content": "New content...",
  "status": 1,
  "categoryIds": [1],
  "tagIds": [2, 3]
}
```

### DELETE /api/post/:id/delete

Delete a post. Only the author or admin can delete.

- **Auth**: Auth

---

## Categories

### GET /api/category/list

List all categories.

- **Auth**: Public
- **Query**: `page`, `limit`

### GET /api/category/tree

Get categories as a nested tree structure.

- **Auth**: Public

### GET /api/category/:id

Get category by ID (includes `post_count`).

- **Auth**: Public

### GET /api/category/slug/:slug

Get category by slug.

- **Auth**: Public

### POST /api/category/create

- **Auth**: Admin

```json
{ "name": "Tech", "description": "Technology posts", "parent_id": null }
```

Slug is auto-generated from name.

### PUT /api/category/:id/update

- **Auth**: Admin

```json
{ "name": "Technology", "description": "Updated description" }
```

### DELETE /api/category/:id/delete

- **Auth**: Admin

---

## Tags

### GET /api/tag/list

List all tags.

- **Auth**: Public
- **Query**: `page`, `limit`

### GET /api/tag/popular

Get most-used tags.

- **Auth**: Public
- **Query**: `limit` (default: 10)

### GET /api/tag/:id

Get tag by ID (includes `post_count`).

- **Auth**: Public

### GET /api/tag/slug/:slug

Get tag by slug.

- **Auth**: Public

### POST /api/tag/create

- **Auth**: Admin

```json
{ "name": "JavaScript", "description": "JS related posts" }
```

### PUT /api/tag/:id/update

- **Auth**: Admin

### DELETE /api/tag/:id/delete

- **Auth**: Admin

---

## Comments

### GET /api/comment/post/:postId

Get comments for a post.

- **Auth**: Public
- **Query**: `page`, `limit`

### GET /api/comment/:id

Get a single comment.

- **Auth**: Public

### GET /api/comment/list

List all comments (admin view).

- **Auth**: Admin
- **Query**: `page`, `limit`, `status`

### POST /api/comment/create

Submit a comment. The post must have comments enabled (`comment_status = 1`).

- **Auth**: Public

```json
{
  "post_id": 1,
  "author_name": "Alice",
  "author_email": "alice@example.com",
  "content": "Great post!",
  "parent_id": null
}
```

`parent_id` is optional - set it to reply to another comment.

### PUT /api/comment/:id/status

Moderate a comment.

- **Auth**: Admin

```json
{ "status": 1 }   // 0 = pending, 1 = approved, 2 = spam
```

### DELETE /api/comment/:id/delete

- **Auth**: Admin

---

## Feedback

### POST /api/feedback/create

Submit feedback (guestbook).

- **Auth**: Public

```json
{ "name": "Alice", "email": "alice@example.com", "content": "Hello!" }
```

### GET /api/feedback/list

- **Auth**: Admin
- **Query**: `page`, `limit`, `status`

### GET /api/feedback/:id

- **Auth**: Admin

### PUT /api/feedback/:id/status

- **Auth**: Admin

```json
{ "status": 1 }
```

### DELETE /api/feedback/:id/delete

- **Auth**: Admin

---

## Search

### GET /api/search

Global search across posts, categories, and tags.

- **Auth**: Public
- **Query**: `keyword` (required), `type` (all/posts/categories/tags), `page`, `limit`

```json
// Response 200
{
  "keyword": "javascript",
  "results": {
    "posts": [...],
    "categories": [...],
    "tags": [...]
  }
}
```

---

## Settings

### GET /api/settings

Get all settings as key-value pairs.

- **Auth**: Public (cached in R2)

### GET /api/settings/blog

Get blog info settings (`blog_title`, `blog_description`, `blog_subtitle`).

- **Auth**: Public

### GET /api/settings/display

Get display settings (`posts_per_page`, `pagination_style`).

- **Auth**: Public

### GET /api/settings/comments

Get comment settings (`comment_moderation`, `comment_permission`).

- **Auth**: Public

### GET /api/settings/seo

Get SEO settings (`meta_description`, `meta_keywords`).

- **Auth**: Public

### GET /api/settings/upload

Get upload settings (`upload_allowed_types`, `upload_max_size`).

- **Auth**: Public

### PUT /api/settings/blog

- **Auth**: Admin

```json
{ "blog_title": "My Blog", "blog_description": "A cool blog" }
```

### PUT /api/settings/display

- **Auth**: Admin

### PUT /api/settings/comments

- **Auth**: Admin

### PUT /api/settings/upload

- **Auth**: Admin

### PUT /api/settings/seo

- **Auth**: Admin

---

## File Upload

### POST /api/upload

Upload a file to R2 storage.

- **Auth**: Auth
- **Content-Type**: `multipart/form-data`
- **Body**: `file` field
- **Max size**: 10 MB
- **Allowed types**: JPEG, PNG, GIF, WebP, SVG, PDF, TXT, Markdown, ZIP, DOCX

Files are stored at `images/{YYYY}/{MM}/{filename}` in R2. Duplicate filenames get a numeric suffix (`photo-1.png`).

```json
// Response 201
{
  "success": true,
  "data": {
    "url": "/api/upload/file/images/2026/02/photo.png",
    "filename": "photo.png",
    "size": 102400,
    "mimeType": "image/png"
  }
}
```

### GET /api/upload/file/*

Serve a file from R2 storage. Responses include `Cache-Control: public, max-age=31536000`.

- **Auth**: Public

### GET /api/upload/list

List all uploaded attachments.

- **Auth**: Admin
- **Query**: `page`, `limit`, `type`

### DELETE /api/upload/:id

Delete an attachment.

- **Auth**: Admin

---

## Health Check

### GET /health

- **Auth**: Public

```json
{ "status": "ok" }
```
