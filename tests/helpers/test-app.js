/**
 * Test App Factory
 * 创建可测试的 Hono app 实例
 */

import app from '../../src/index-hono.js';
import { hashPassword, generateSessionId } from '../../src/utils/auth.js';

const TEST_SECRET = 'test-session-secret-for-testing';

/**
 * 向 app 发送请求
 */
export async function request(path, options = {}, env = {}) {
  const defaultEnv = {
    SESSION_SECRET: TEST_SECRET,
    ...env
  };

  return app.request(path, options, defaultEnv);
}

/**
 * 生成管理员 session cookie
 */
export async function getAdminSessionCookie() {
  const sessionId = await generateSessionId(1, TEST_SECRET);
  return `session=${sessionId}`;
}

/**
 * 生成普通用户 session cookie
 */
export async function getUserSessionCookie() {
  const sessionId = await generateSessionId(2, TEST_SECRET);
  return `session=${sessionId}`;
}

/**
 * 生成测试用的密码 hash
 */
export async function getTestPasswordHash(password = 'admin123') {
  return hashPassword(password);
}

export { TEST_SECRET };
