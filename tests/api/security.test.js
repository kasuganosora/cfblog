/**
 * Security Tests
 * 测试安全相关的防护措施
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { request, getAdminSessionCookie, getTestPasswordHash, TEST_SECRET } from '../helpers/test-app.js';
import { createStandardMockDB, createMockDB } from '../helpers/mock-db.js';
import { hashPassword, verifyPassword, generateSessionId, validateSessionId } from '../../src/utils/auth.js';

let adminHash;
let adminCookie;

beforeAll(async () => {
  adminHash = await getTestPasswordHash('admin123');
  adminCookie = await getAdminSessionCookie();
});

function getDB() {
  return createStandardMockDB(adminHash);
}

describe('密码安全', () => {
  it('应该使用 PBKDF2 而非 SHA-256', async () => {
    const hash = await hashPassword('test');
    expect(hash).toMatch(/^pbkdf2:/);
    expect(hash.split(':')).toHaveLength(4);
  });

  it('不应接受旧的纯 hex 哈希格式', async () => {
    const legacyHash = 'a'.repeat(64);
    const result = await verifyPassword('anything', legacyHash);
    expect(result).toBe(false);
  });

  it('密码哈希应该包含随机盐', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('会话安全', () => {
  it('sessionId 应该使用 HMAC-SHA256', async () => {
    const sid = await generateSessionId(1, 'secret');
    const parts = sid.split(':');
    expect(parts).toHaveLength(4);
    expect(parts[3]).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  it('篡改 sessionId 应该验证失败', async () => {
    const sid = await generateSessionId(1, 'secret');
    const parts = sid.split(':');
    parts[0] = '999'; // tamper userId
    const result = await validateSessionId(parts.join(':'), 'secret');
    expect(result).toBe(false);
  });

  it('登录响应不应泄露 sessionId', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDB() });

    const json = await res.json();
    expect(json.sessionId).toBeUndefined();
    expect(json.data?.sessionId).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain('sessionId');
  });

  it('登录 cookie 应该有 HttpOnly + Secure + SameSite', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDB() });

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('登出 cookie 应该有 Secure 标志', async () => {
    const res = await request('/api/user/logout', {
      method: 'POST'
    }, { DB: getDB() });

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('Secure');
  });
});

describe('用户枚举防护', () => {
  it('不存在的用户和错误密码应该返回相同信息', async () => {
    const r1 = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ghost', password: 'x' })
    }, { DB: getDB() });

    const r2 = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'x' })
    }, { DB: getDB() });

    expect(r1.status).toBe(r2.status);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.message).toBe(j2.message);
  });
});

describe('密码泄露防护', () => {
  it('登录成功不应返回 password_hash', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDB() });

    const json = await res.json();
    const body = JSON.stringify(json);
    expect(body).not.toContain('password_hash');
    expect(body).not.toContain('pbkdf2:');
  });

  it('/me 接口不应返回 password_hash', async () => {
    const res = await request('/api/user/me', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    const json = await res.json();
    const body = JSON.stringify(json);
    expect(body).not.toContain('password_hash');
    expect(body).not.toContain('pbkdf2:');
  });
});

describe('错误信息安全', () => {
  it('全局错误处理不应暴露内部信息', async () => {
    // The error handler should return generic message
    const res = await request('/api/nonexistent', {
      headers: { 'Accept': 'application/json' }
    }, { DB: getDB() });

    // Should be 404, not 500 with stack trace
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toBe('Not Found');
    expect(json.stack).toBeUndefined();
  });
});

describe('CORS 配置', () => {
  it('未配置 ALLOWED_ORIGINS 时不应返回 CORS 头', async () => {
    const res = await request('/health', {
      headers: { 'Origin': 'https://evil.com' }
    }, {});

    const corsHeader = res.headers.get('Access-Control-Allow-Origin');
    // Origin not in allowed list, should not be reflected
    expect(corsHeader).toBeNull();
  });

  it('配置的 origin 应该被允许', async () => {
    const res = await request('/health', {
      headers: { 'Origin': 'https://mysite.com' }
    }, { ALLOWED_ORIGINS: 'https://mysite.com,https://other.com' });

    const corsHeader = res.headers.get('Access-Control-Allow-Origin');
    expect(corsHeader).toBe('https://mysite.com');
  });

  it('未配置的 origin 应该被拒绝', async () => {
    const res = await request('/health', {
      headers: { 'Origin': 'https://evil.com' }
    }, { ALLOWED_ORIGINS: 'https://mysite.com' });

    const corsHeader = res.headers.get('Access-Control-Allow-Origin');
    expect(corsHeader).toBeNull();
  });
});

describe('缺少 SESSION_SECRET 防护', () => {
  it('登录时缺少 SECRET 应该返回 500', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDB(), SESSION_SECRET: undefined });

    expect(res.status).toBe(500);
  });

  it('requireAuth 缺少 SECRET 应该返回 500', async () => {
    const res = await request('/api/user/me', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB(), SESSION_SECRET: undefined });

    expect(res.status).toBe(500);
  });
});

describe('输入长度验证', () => {
  it('评论作者名 > 50 字符应该被拒绝', async () => {
    const db = createMockDB([
      { match: 'comment_status FROM posts', result: { comment_status: 1 } },
    ]);
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1, authorName: 'A'.repeat(51), content: 'Hi'
      })
    }, { DB: db });

    expect(res.status).toBe(400);
  });

  it('评论内容 > 5000 字符应该被拒绝', async () => {
    const db = createMockDB([
      { match: 'comment_status FROM posts', result: { comment_status: 1 } },
    ]);
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1, authorName: 'User', content: 'x'.repeat(5001)
      })
    }, { DB: db });

    expect(res.status).toBe(400);
  });

  it('反馈名字 > 50 字符应该被拒绝', async () => {
    const db = createMockDB([]);
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A'.repeat(51), content: 'Feedback'
      })
    }, { DB: db });

    expect(res.status).toBe(400);
  });

  it('反馈内容 > 5000 字符应该被拒绝', async () => {
    const db = createMockDB([]);
    const res = await request('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User', content: 'x'.repeat(5001)
      })
    }, { DB: db });

    expect(res.status).toBe(400);
  });
});
