/**
 * Settings API Tests
 * 测试设置的公开读取和管理员更新
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { request, getAdminSessionCookie, getUserSessionCookie, getTestPasswordHash } from '../helpers/test-app.js';
import { createMockDB } from '../helpers/mock-db.js';

let adminHash;
let adminCookie;
let userCookie;

beforeAll(async () => {
  adminHash = await getTestPasswordHash('admin123');
  adminCookie = await getAdminSessionCookie();
  userCookie = await getUserSessionCookie();
});

function getDB() {
  return createMockDB([
    {
      match: 'FROM users WHERE id',
      result: (sql, params) => {
        if (params[0] === 1) return { id: 1, username: 'admin', role: 'admin', status: 1, password_hash: adminHash };
        if (params[0] === 2) return { id: 2, username: 'user', role: 'member', status: 1, password_hash: adminHash };
        return null;
      }
    },
    {
      match: 'FROM settings WHERE key IN',
      result: (sql, params) => {
        return params.map(k => ({ key: k, value: 'test-value' }));
      }
    },
    {
      match: 'FROM settings WHERE key',
      result: (sql, params) => {
        return { key: params[0], value: 'existing-value', description: 'desc' };
      }
    },
    {
      match: 'FROM settings',
      result: [
        { key: 'blog_title', value: 'Test Blog' },
        { key: 'blog_description', value: 'A test blog' }
      ]
    },
    { match: 'INSERT INTO settings', result: null },
    { match: 'UPDATE settings', result: null },
    { match: 'DELETE FROM settings', result: null },
  ]);
}

// ========== GET Endpoints (Public) ==========

describe('GET /api/settings', () => {
  it('应该返回设置（公开接口）', async () => {
    const res = await request('/api/settings', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不需要登录即可访问', async () => {
    const res = await request('/api/settings', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('无数据库时应返回 500', async () => {
    const res = await request('/api/settings', {}, { DB: undefined });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/settings/blog', () => {
  it('应该返回博客信息（公开接口）', async () => {
    const res = await request('/api/settings/blog', {}, { DB: getDB() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBeDefined();
  });

  it('无数据库时应返回 500', async () => {
    const res = await request('/api/settings/blog', {}, { DB: undefined });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/settings/display', () => {
  it('应该返回显示设置（公开接口）', async () => {
    const res = await request('/api/settings/display', {}, { DB: getDB() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.postsPerPage).toBeDefined();
  });
});

describe('GET /api/settings/comments', () => {
  it('应该返回评论设置（公开接口）', async () => {
    const res = await request('/api/settings/comments', {}, { DB: getDB() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.moderation).toBeDefined();
  });
});

describe('GET /api/settings/upload', () => {
  it('应该返回上传设置（公开接口）', async () => {
    const res = await request('/api/settings/upload', {}, { DB: getDB() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.allowedTypes).toBeDefined();
  });
});

describe('GET /api/settings/seo', () => {
  it('应该返回 SEO 设置（公开接口）', async () => {
    const res = await request('/api/settings/seo', {}, { DB: getDB() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.description).toBeDefined();
  });
});

// ========== PUT /blog ==========

describe('PUT /api/settings/blog', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/settings/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked' })
    }, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/settings/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ title: 'Hacked' })
    }, { DB: getDB() });
    expect(res.status).toBe(403);
  });

  it('管理员应该可以更新博客设置', async () => {
    const res = await request('/api/settings/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ title: 'New Title', description: 'New Desc' })
    }, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== PUT /display ==========

describe('PUT /api/settings/display', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/settings/display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postsPerPage: 20 })
    }, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/settings/display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ postsPerPage: 20 })
    }, { DB: getDB() });
    expect(res.status).toBe(403);
  });

  it('管理员应该可以更新显示设置', async () => {
    const res = await request('/api/settings/display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ postsPerPage: 20, paginationStyle: 'simple' })
    }, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== PUT /comments ==========

describe('PUT /api/settings/comments', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/settings/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderation: 1 })
    }, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/settings/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ moderation: 1 })
    }, { DB: getDB() });
    expect(res.status).toBe(403);
  });

  it('管理员应该可以更新评论设置', async () => {
    const res = await request('/api/settings/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ moderation: 1, permission: 'registered' })
    }, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== PUT /upload ==========

describe('PUT /api/settings/upload', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/settings/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxSize: 1048576 })
    }, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/settings/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ maxSize: 1048576 })
    }, { DB: getDB() });
    expect(res.status).toBe(403);
  });

  it('管理员应该可以更新上传设置', async () => {
    const res = await request('/api/settings/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ allowedTypes: 'jpg,png', maxSize: 1048576 })
    }, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== PUT /seo ==========

describe('PUT /api/settings/seo', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/settings/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'SEO' })
    }, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/settings/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ description: 'SEO' })
    }, { DB: getDB() });
    expect(res.status).toBe(403);
  });

  it('管理员应该可以更新 SEO 设置', async () => {
    const res = await request('/api/settings/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ description: 'New SEO', keywords: 'test,blog' })
    }, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});
