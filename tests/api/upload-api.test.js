/**
 * Upload API Tests
 * 测试文件上传权限控制
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
  ]);
}

describe('POST /api/upload', () => {
  it('未登录应该返回 401', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

    const res = await request('/api/upload', {
      method: 'POST',
      body: formData
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('管理员应该可以上传', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': adminCookie },
      body: formData
    }, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.filename).toBe('test.txt');
  });

  it('普通用户也应该可以上传', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['user content'], { type: 'text/plain' }), 'user-file.txt');

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: formData
    }, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('没有文件应该返回 400', async () => {
    const formData = new FormData();

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': adminCookie },
      body: formData
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
