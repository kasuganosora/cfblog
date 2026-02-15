/**
 * Post API Tests
 * 测试文章 CRUD 和权限控制
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { request, getAdminSessionCookie, getUserSessionCookie, getTestPasswordHash } from '../helpers/test-app.js';
import { createMockDB } from '../helpers/mock-db.js';

let adminHash;
let adminCookie;
let userCookie;

const testPost = {
  id: 1, title: 'Test Post', slug: 'test-post',
  content: 'Post content here', excerpt: 'Excerpt',
  author_id: 1, status: 1,
  featured: 0, comment_status: 1, view_count: 10,
  created_at: '2025-01-01 00:00:00'
};

beforeAll(async () => {
  adminHash = await getTestPasswordHash('admin123');
  adminCookie = await getAdminSessionCookie();
  userCookie = await getUserSessionCookie();
});

function getDB(overrides = {}) {
  return createMockDB([
    {
      match: 'FROM users WHERE id',
      result: (sql, params) => {
        if (params[0] === 1) return { id: 1, username: 'admin', role: 'admin', status: 1, password_hash: adminHash };
        if (params[0] === 2) return { id: 2, username: 'user', role: 'member', status: 1, password_hash: adminHash };
        return null;
      }
    },
    { match: 'FROM posts WHERE id', result: overrides.post !== undefined ? overrides.post : testPost },
    {
      match: 'FROM posts WHERE slug',
      result: (sql, params) => {
        if (overrides.postBySlug !== undefined) return overrides.postBySlug;
        if (params[0] === 'test-post') return testPost;
        return null;
      }
    },
    { match: 'SELECT COUNT', result: { count: overrides.postCount ?? 1 } },
    { match: 'FROM posts p', result: overrides.posts ?? [testPost] },
    { match: 'post_categories', result: [] },
    { match: 'post_tags', result: [] },
    { match: 'FROM categories c', result: [] },
    { match: 'FROM tags t', result: [] },
    { match: 'INSERT INTO post', result: null },
    { match: 'INSERT INTO posts', result: null },
    { match: 'UPDATE posts', result: null },
    { match: 'DELETE FROM', result: null },
  ]);
}

// ========== List ==========

describe('GET /api/post/list', () => {
  it('应该返回文章列表（公开接口）', async () => {
    const res = await request('/api/post/list', {}, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
  });

  it('不需要登录即可访问', async () => {
    const res = await request('/api/post/list', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持分页参数', async () => {
    const res = await request('/api/post/list?page=1&limit=5', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持 status 过滤', async () => {
    const res = await request('/api/post/list?status=1', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持 featured 过滤', async () => {
    const res = await request('/api/post/list?featured=true', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== Search ==========

describe('GET /api/post/search', () => {
  it('有关键词时应该返回搜索结果', async () => {
    const res = await request('/api/post/search?keyword=test', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('缺少关键词应该返回 400', async () => {
    const res = await request('/api/post/search', {}, { DB: getDB() });
    expect(res.status).toBe(400);
  });

  it('支持分页参数', async () => {
    const res = await request('/api/post/search?keyword=test&page=1&limit=5', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== Get by ID ==========

describe('GET /api/post/:id', () => {
  it('应该返回文章详情', async () => {
    const res = await request('/api/post/1', {}, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe('Test Post');
  });

  it('不存在的文章应该返回 404', async () => {
    const res = await request('/api/post/999', {}, { DB: getDB({ post: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Get by Slug ==========

describe('GET /api/post/slug/:slug', () => {
  it('应该根据 slug 返回文章', async () => {
    const res = await request('/api/post/slug/test-post', {}, { DB: getDB({ postBySlug: testPost }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe('Test Post');
  });

  it('不存在的 slug 应该返回 404', async () => {
    const res = await request('/api/post/slug/nonexistent', {}, { DB: getDB({ postBySlug: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Create ==========

describe('POST /api/post/create', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Post', authorId: 1 })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('登录用户应该可以创建文章', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'New Post', authorId: 1 })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('缺少标题应该返回 400', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ authorId: 1 })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });

  it('缺少作者ID应该返回 400', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'New Post' })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });

  it('应该支持可选字段（content, excerpt, slug等）', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        title: 'Full Post',
        authorId: 1,
        slug: 'full-post',
        excerpt: 'A full post',
        content: 'Full content here',
        status: 1,
        featured: true,
        comment_status: 1
      })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('应该支持 snake_case 的 author_id', async () => {
    const res = await request('/api/post/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'New Post', author_id: 1 })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });
});

// ========== Update ==========

describe('PUT /api/post/:id/update', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/post/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('作者可以更新自己的文章', async () => {
    const res = await request('/api/post/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'Updated Title' })
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });

  it('非作者普通用户不能更新别人的文章（403）', async () => {
    const res = await request('/api/post/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ title: 'Hacked' })
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员可以更新任何文章', async () => {
    const userPost = { ...testPost, author_id: 2 };
    const res = await request('/api/post/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'Admin Edit' })
    }, { DB: getDB({ post: userPost }) });

    expect(res.status).toBe(200);
  });

  it('文章不存在应该返回 404', async () => {
    const res = await request('/api/post/999/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'X' })
    }, { DB: getDB({ post: null }) });

    expect(res.status).toBe(404);
  });
});

// ========== Delete ==========

describe('DELETE /api/post/:id/delete', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/post/1/delete', {
      method: 'DELETE'
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('非作者普通用户不能删除别人的文章（403）', async () => {
    const res = await request('/api/post/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('作者可以删除自己的文章', async () => {
    const res = await request('/api/post/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('管理员可以删除任何文章', async () => {
    const userPost = { ...testPost, author_id: 2 };
    const res = await request('/api/post/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB({ post: userPost }) });

    expect(res.status).toBe(200);
  });

  it('文章不存在时应返回 404', async () => {
    const res = await request('/api/post/999/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB({ post: null }) });

    expect(res.status).toBe(404);
  });
});
