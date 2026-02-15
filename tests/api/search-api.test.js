/**
 * Search API Tests
 * 测试全局搜索功能
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { request, getTestPasswordHash } from '../helpers/test-app.js';
import { createMockDB } from '../helpers/mock-db.js';

const testPost = {
  id: 1, title: 'JavaScript Tutorial', slug: 'js-tutorial',
  excerpt: 'Learn JS', status: 1,
  created_at: '2025-01-01 00:00:00'
};

function getDB() {
  return createMockDB([
    { match: 'SELECT COUNT', result: { count: 1 } },
    { match: 'FROM posts', result: [testPost] },
    { match: 'FROM categories', result: [] },
    { match: 'FROM tags', result: [] },
  ]);
}

describe('GET /api/search', () => {
  it('应该返回搜索结果（公开接口）', async () => {
    const res = await request('/api/search?keyword=JavaScript', {}, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.keyword).toBe('JavaScript');
    expect(json.results).toBeDefined();
    expect(json.pagination).toBeDefined();
  });

  it('缺少关键词应该返回 400', async () => {
    const res = await request('/api/search', {}, { DB: getDB() });
    expect(res.status).toBe(400);
  });

  it('不需要登录即可搜索', async () => {
    const res = await request('/api/search?keyword=test', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('应该支持按类型搜索', async () => {
    const res = await request('/api/search?keyword=test&type=posts', {}, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe('posts');
  });
});
