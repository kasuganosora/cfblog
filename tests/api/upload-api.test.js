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

// Mock R2 bucket
function createMockBucket() {
  const store = new Map();
  return {
    put: async (key, data, options) => { store.set(key, { data, options }); },
    get: async (key) => {
      const obj = store.get(key);
      if (!obj) return null;
      return { body: obj.data, httpMetadata: obj.options?.httpMetadata, httpEtag: '"mock-etag"' };
    },
    delete: async (key) => { store.delete(key); }
  };
}

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
      match: 'INSERT INTO attachments',
      result: () => null,
      meta: { last_row_id: 1 }
    },
    {
      match: 'FROM attachments WHERE id',
      result: () => ({ id: 1, filename: 'test.txt', original_name: 'test.txt', mime_type: 'text/plain', file_size: 4, storage_key: 'attachments/test.txt', upload_user_id: 1, created_at: '2024-01-01' })
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
    }, { DB: getDB(), BUCKET: createMockBucket() });

    expect(res.status).toBe(401);
  });

  it('管理员应该可以上传', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': adminCookie },
      body: formData
    }, { DB: getDB(), BUCKET: createMockBucket() });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.original_name).toBe('test.txt');
    expect(json.data.url).toContain('/api/upload/file/');
  });

  it('普通用户也应该可以上传', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['user content'], { type: 'text/plain' }), 'user-file.txt');

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: formData
    }, { DB: getDB(), BUCKET: createMockBucket() });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('没有文件应该返回 400', async () => {
    const formData = new FormData();

    const res = await request('/api/upload', {
      method: 'POST',
      headers: { 'Cookie': adminCookie },
      body: formData
    }, { DB: getDB(), BUCKET: createMockBucket() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
