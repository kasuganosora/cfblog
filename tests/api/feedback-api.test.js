/**
 * Feedback API Tests
 * 测试反馈提交和管理员操作
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

const testFeedback = {
  id: 1, name: 'Visitor', email: 'v@test.com',
  content: 'Great blog!', status: 0,
  created_at: '2025-01-01 00:00:00'
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
    { match: 'FROM settings WHERE key IN', result: [] },
    { match: 'FROM feedback WHERE ip', result: null },
    { match: 'FROM feedback WHERE id', result: overrides.feedback ?? testFeedback },
    { match: 'SELECT COUNT', result: { count: overrides.count ?? 1 } },
    { match: 'FROM feedback', result: overrides.feedbacks ?? [testFeedback] },
    { match: 'INSERT INTO feedback', result: null },
    { match: 'DELETE FROM feedback', result: null },
  ]);
}

describe('POST /api/feedback/create', () => {
  it('应该成功提交反馈（公开接口）', async () => {
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', content: 'Feedback content' })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('缺少必填字段应该返回 400', async () => {
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });

  it('名字超过 50 字符应该返回 400', async () => {
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A'.repeat(51), content: 'Hello' })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('50');
  });

  it('内容超过 5000 字符应该返回 400', async () => {
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', content: 'x'.repeat(5001) })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('5000');
  });

  it('邮箱超过 100 字符应该返回 400', async () => {
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'a'.repeat(92) + '@test.com',
        content: 'Hello'
      })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('100');
  });
});

describe('GET /api/feedback/list', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/feedback/list', {}, { DB: getDB() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/feedback/list', {
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以查看反馈列表', async () => {
    const res = await request('/api/feedback/list', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/feedback/:id', () => {
  it('管理员应该可以查看反馈详情', async () => {
    const res = await request('/api/feedback/1', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/feedback/1', {
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/feedback/:id/delete', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/feedback/1/delete', {
      method: 'DELETE'
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('管理员应该可以删除反馈', async () => {
    const res = await request('/api/feedback/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
  });
});
