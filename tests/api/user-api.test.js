/**
 * User API Tests
 * 测试用户认证、会话管理和权限控制
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { request, getAdminSessionCookie, getUserSessionCookie, getTestPasswordHash, TEST_SECRET } from '../helpers/test-app.js';
import { createStandardMockDB, createMockDB } from '../helpers/mock-db.js';

let adminHash;
let adminCookie;
let userCookie;

beforeAll(async () => {
  adminHash = await getTestPasswordHash('admin123');
  adminCookie = await getAdminSessionCookie();
  userCookie = await getUserSessionCookie();
});

function getDB() {
  return createStandardMockDB(adminHash);
}

function getDBWithHandlers(extraHandlers = []) {
  return createMockDB([
    {
      match: 'FROM users WHERE username',
      result: (sql, params) => {
        if (params[0] === 'admin') return { id: 1, username: 'admin', email: 'admin@test.com', password_hash: adminHash, display_name: 'Admin', role: 'admin', status: 1 };
        if (params[0] === 'user') return { id: 2, username: 'user', email: 'user@test.com', password_hash: adminHash, display_name: 'User', role: 'member', status: 1 };
        if (params[0] === 'disabled') return { id: 3, username: 'disabled', email: 'disabled@test.com', password_hash: adminHash, display_name: 'Disabled', role: 'member', status: 0 };
        return null;
      }
    },
    {
      match: 'FROM users WHERE id',
      result: (sql, params) => {
        if (params[0] === 1) return { id: 1, username: 'admin', email: 'admin@test.com', password_hash: adminHash, display_name: 'Admin', role: 'admin', status: 1 };
        if (params[0] === 2) return { id: 2, username: 'user', email: 'user@test.com', password_hash: adminHash, display_name: 'User', role: 'member', status: 1 };
        if (params[0] === 999) return null;
        return { id: params[0], username: 'test', email: 'test@test.com', password_hash: adminHash, display_name: 'Test', role: 'member', status: 1 };
      }
    },
    { match: 'SELECT COUNT', result: { count: 2 } },
    {
      match: 'FROM users',
      result: [
        { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', status: 1 },
        { id: 2, username: 'user', email: 'user@test.com', role: 'member', status: 1 }
      ]
    },
    { match: 'INSERT INTO users', result: null },
    { match: 'UPDATE users', result: null },
    { match: 'DELETE FROM', result: null },
    ...extraHandlers
  ]);
}

// ========== Login ==========

describe('POST /api/user/login', () => {
  it('正确凭证应该登录成功并设置安全 cookie', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.username).toBe('admin');
    expect(json.data.sessionId).toBeUndefined();
    expect(json.sessionId).toBeUndefined();
    expect(json.data.user.password_hash).toBeUndefined();

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('错误密码应该返回 401', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('不存在的用户与错误密码应该返回相同错误信息（防枚举）', async () => {
    const r1 = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'whatever' })
    }, { DB: getDBWithHandlers() });

    const r2 = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    }, { DB: getDBWithHandlers() });

    expect(r1.status).toBe(r2.status);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j1.message).toBe(j2.message);
  });

  it('缺少必填字段应该返回 400', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('未配置 SESSION_SECRET 应该返回 500', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    }, { DB: getDBWithHandlers(), SESSION_SECRET: undefined });

    expect(res.status).toBe(500);
  });

  it('应该支持表单格式登录', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=admin&password=admin123'
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.user.username).toBe('admin');
  });

  it('被禁用的用户不能登录', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'disabled', password: 'admin123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
  });

  it('用户名和密码都为空应返回 400', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });
});

// ========== Me ==========

describe('GET /api/user/me', () => {
  it('有效 session 应该返回用户信息（不含密码）', async () => {
    const res = await request('/api/user/me', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.username).toBe('admin');
    expect(json.data.user.password_hash).toBeUndefined();
  });

  it('无 session 应该返回 401', async () => {
    const res = await request('/api/user/me', {}, { DB: getDBWithHandlers() });
    expect(res.status).toBe(401);
  });

  it('无效 session 应该返回 401', async () => {
    const res = await request('/api/user/me', {
      headers: { 'Cookie': 'session=fake:data:here:invalid' }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
  });

  it('未配置 SESSION_SECRET 时 auth 中间件应该返回 500', async () => {
    const res = await request('/api/user/me', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDBWithHandlers(), SESSION_SECRET: undefined });

    expect(res.status).toBe(500);
  });
});

// ========== Logout ==========

describe('POST /api/user/logout', () => {
  it('应该清除 cookie 并包含 Secure 标志', async () => {
    const res = await request('/api/user/logout', {
      method: 'POST'
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('session=;');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Secure');
  });
});

// ========== User List ==========

describe('GET /api/user/list', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/user/list', {}, { DB: getDBWithHandlers() });
    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/user/list', {
      headers: { 'Cookie': userCookie }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以访问', async () => {
    const res = await request('/api/user/list', {
      headers: { 'Cookie': adminCookie }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
  });
});

// ========== Create User ==========

describe('POST /api/user/create', () => {
  it('普通用户应该返回 403', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ username: 'new', email: 'new@test.com', password: 'pass123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以创建用户', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ username: 'newuser', email: 'new@test.com', password: 'password123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(201);
  });

  it('缺少用户名应该返回 400', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ email: 'new@test.com', password: 'pass123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('缺少邮箱应该返回 400', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ username: 'newuser', password: 'pass123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('缺少密码应该返回 400', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ username: 'newuser', email: 'new@test.com' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('未登录应该返回 401', async () => {
    const res = await request('/api/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'new', email: 'new@test.com', password: 'pass123' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
  });
});

// ========== Update Status ==========

describe('PUT /api/user/:id/status', () => {
  it('管理员应该可以更新用户状态', async () => {
    const res = await request('/api/user/2/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ status: 0 })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
  });

  it('缺少 status 字段应该返回 400', async () => {
    const res = await request('/api/user/2/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({})
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/user/2/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ status: 0 })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(403);
  });

  it('未登录应该返回 401', async () => {
    const res = await request('/api/user/2/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 0 })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
  });
});

// ========== Update Role ==========

describe('PUT /api/user/:id/role', () => {
  it('管理员应该可以更新用户角色', async () => {
    const res = await request('/api/user/2/role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ role: 'contributor' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
  });

  it('缺少 role 字段应该返回 400', async () => {
    const res = await request('/api/user/2/role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({})
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('无效角色应该返回 400', async () => {
    const res = await request('/api/user/2/role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({ role: 'superadmin' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(400);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/user/2/role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: JSON.stringify({ role: 'admin' })
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(403);
  });
});

// ========== Delete User ==========

describe('DELETE /api/user/:id', () => {
  it('管理员应该可以删除用户', async () => {
    const res = await request('/api/user/2', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/user/2', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(403);
  });

  it('未登录应该返回 401', async () => {
    const res = await request('/api/user/2', {
      method: 'DELETE'
    }, { DB: getDBWithHandlers() });

    expect(res.status).toBe(401);
  });

  it('删除不存在的用户应返回错误', async () => {
    const db = createMockDB([
      {
        match: 'FROM users WHERE id',
        result: (sql, params) => {
          if (params[0] === 1) return { id: 1, username: 'admin', role: 'admin', status: 1, password_hash: adminHash };
          return null;
        }
      },
      { match: 'DELETE FROM', result: null },
    ]);
    const res = await request('/api/user/999', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: db });

    expect(res.status).toBe(500);
  });
});
