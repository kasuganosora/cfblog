/**
 * Category API Tests
 * 测试分类的公开查询和管理员操作
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

const testCategory = {
  id: 1, name: 'Tech', slug: 'tech',
  description: 'Technology articles', parent_id: null,
  created_at: '2025-01-01 00:00:00'
};

const testCategory2 = {
  id: 2, name: 'Life', slug: 'life',
  description: 'Life articles', parent_id: null,
  created_at: '2025-01-02 00:00:00'
};

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
    { match: 'FROM categories WHERE id', result: 'category' in overrides ? overrides.category : testCategory },
    {
      match: 'FROM categories WHERE slug',
      result: (sql, params) => {
        if (overrides.categoryBySlug !== undefined) return overrides.categoryBySlug;
        if (params[0] === 'tech') return testCategory;
        return null;
      }
    },
    { match: 'FROM post_categories', result: { count: 0 } },
    { match: 'parent_id', result: { count: 0 } },
    { match: 'SELECT COUNT', result: { count: overrides.count ?? 2 } },
    { match: 'FROM categories', result: overrides.categories ?? [testCategory, testCategory2] },
    { match: 'INSERT INTO categories', result: null },
    { match: 'UPDATE categories', result: null },
    { match: 'DELETE FROM', result: null },
  ]);
}

// ========== List ==========

describe('GET /api/category/list', () => {
  it('应该返回分类列表（公开接口）', async () => {
    const res = await request('/api/category/list', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不需要登录即可访问', async () => {
    const res = await request('/api/category/list', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持分页参数', async () => {
    const res = await request('/api/category/list?page=1&limit=5', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== Tree ==========

describe('GET /api/category/tree', () => {
  it('应该返回分类树（公开接口）', async () => {
    const res = await request('/api/category/tree', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('无分类时返回空数组', async () => {
    const res = await request('/api/category/tree', {}, { DB: getDB({ categories: [] }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });
});

// ========== Slug ==========

describe('GET /api/category/slug/:slug', () => {
  it('应该根据 slug 返回分类', async () => {
    const res = await request('/api/category/slug/tech', {}, { DB: getDB({ categoryBySlug: testCategory }) });
    expect(res.status).toBe(200);
  });

  it('不存在的 slug 应该返回 404', async () => {
    const res = await request('/api/category/slug/nonexistent', {}, { DB: getDB({ categoryBySlug: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Get by ID ==========

describe('GET /api/category/:id', () => {
  it('应该返回分类详情', async () => {
    const res = await request('/api/category/1', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不存在的分类应该返回 404', async () => {
    const res = await request('/api/category/999', {}, { DB: getDB({ category: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Create ==========

describe('POST /api/category/create', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/category/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Category' })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/category/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ name: 'New Category' })
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以创建分类', async () => {
    const res = await request('/api/category/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ name: 'New Category' })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('缺少名称应该返回 400', async () => {
    const res = await request('/api/category/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ description: 'No name' })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });
});

// ========== Update ==========

describe('PUT /api/category/:id/update', () => {
  it('管理员应该可以更新分类', async () => {
    const res = await request('/api/category/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ name: 'Updated Tech' })
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });

  it('未登录应该返回 401', async () => {
    const res = await request('/api/category/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/category/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ name: 'Updated' })
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });
});

// ========== Delete ==========

describe('DELETE /api/category/:id/delete', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/category/1/delete', {
      method: 'DELETE'
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/category/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以删除分类', async () => {
    const res = await request('/api/category/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });
});
