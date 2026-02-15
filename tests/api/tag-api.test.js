/**
 * Tag API Tests
 * 测试标签的公开查询和管理员操作
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

const testTag = {
  id: 1, name: 'JavaScript', slug: 'javascript',
  created_at: '2025-01-01 00:00:00'
};

const testTag2 = {
  id: 2, name: 'TypeScript', slug: 'typescript',
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
    { match: 'FROM tags WHERE id', result: 'tag' in overrides ? overrides.tag : testTag },
    {
      match: 'FROM tags WHERE slug',
      result: (sql, params) => {
        if (overrides.tagBySlug !== undefined) return overrides.tagBySlug;
        if (params[0] === 'javascript') return testTag;
        return null;
      }
    },
    { match: 'FROM post_tags', result: overrides.postTags ?? [{ tag_id: 1, post_count: 5 }, { tag_id: 2, post_count: 3 }] },
    { match: 'SELECT COUNT', result: { count: overrides.count ?? 2 } },
    { match: 'FROM tags', result: overrides.tags ?? [testTag, testTag2] },
    { match: 'INSERT INTO tags', result: null },
    { match: 'UPDATE tags', result: null },
    { match: 'DELETE FROM', result: null },
  ]);
}

// ========== List ==========

describe('GET /api/tag/list', () => {
  it('应该返回标签列表（公开接口）', async () => {
    const res = await request('/api/tag/list', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不需要登录即可访问', async () => {
    const res = await request('/api/tag/list', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持分页参数', async () => {
    const res = await request('/api/tag/list?page=1&limit=5', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });
});

// ========== Popular ==========

describe('GET /api/tag/popular', () => {
  it('应该返回热门标签（公开接口）', async () => {
    const res = await request('/api/tag/popular', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('支持 limit 参数', async () => {
    const res = await request('/api/tag/popular?limit=5', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('无标签时返回空数组', async () => {
    const res = await request('/api/tag/popular', {}, { DB: getDB({ tags: [] }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });
});

// ========== Slug ==========

describe('GET /api/tag/slug/:slug', () => {
  it('应该根据 slug 返回标签', async () => {
    const res = await request('/api/tag/slug/javascript', {}, { DB: getDB({ tagBySlug: testTag }) });
    expect(res.status).toBe(200);
  });

  it('不存在的 slug 应该返回 404', async () => {
    const res = await request('/api/tag/slug/nonexistent', {}, { DB: getDB({ tagBySlug: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Get by ID ==========

describe('GET /api/tag/:id', () => {
  it('应该返回标签详情', async () => {
    const res = await request('/api/tag/1', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不存在的标签应该返回 404', async () => {
    const res = await request('/api/tag/999', {}, { DB: getDB({ tag: null }) });
    expect(res.status).toBe(404);
  });
});

// ========== Create ==========

describe('POST /api/tag/create', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'React' })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ name: 'React' })
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以创建标签', async () => {
    const res = await request('/api/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ name: 'React' })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('缺少名称应该返回 400', async () => {
    const res = await request('/api/tag/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({})
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });
});

// ========== Update ==========

describe('PUT /api/tag/:id/update', () => {
  it('管理员应该可以更新标签', async () => {
    const res = await request('/api/tag/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ name: 'JS' })
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });

  it('未登录应该返回 401', async () => {
    const res = await request('/api/tag/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'JS' })
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/tag/1/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ name: 'JS' })
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });
});

// ========== Delete ==========

describe('DELETE /api/tag/:id/delete', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/tag/1/delete', {
      method: 'DELETE'
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/tag/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以删除标签', async () => {
    const res = await request('/api/tag/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });
});
