/**
 * Comment API Tests
 * 测试评论创建、查询和权限控制
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

const testComment = {
  id: 1, post_id: 1, author_name: 'Visitor',
  author_email: 'v@test.com', content: 'Nice post!',
  parent_id: null, status: 1,
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
    { match: 'comment_status FROM posts', result: overrides.postCommentStatus ?? { comment_status: 1 } },
    { match: 'FROM comments WHERE id', result: 'comment' in overrides ? overrides.comment : testComment },
    { match: 'FROM comments WHERE parent_id', result: [] },
    { match: 'SELECT COUNT', result: { count: overrides.commentCount ?? 1 } },
    { match: 'FROM comments c', result: overrides.comments ?? [testComment] },
    { match: 'INSERT INTO comments', result: null },
    { match: 'DELETE FROM comments', result: null },
  ]);
}

describe('POST /api/comment/create', () => {
  it('应该成功创建评论（公开接口）', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        authorName: 'Test User',
        content: 'Great article!'
      })
    }, { DB: getDB() });

    expect(res.status).toBe(201);
  });

  it('缺少必填字段应该返回 400', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: 1 })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
  });

  it('作者名超过 50 字符应该返回 400', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        authorName: 'A'.repeat(51),
        content: 'Hello'
      })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('50');
  });

  it('内容超过 5000 字符应该返回 400', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        authorName: 'User',
        content: 'x'.repeat(5001)
      })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('5000');
  });

  it('邮箱超过 100 字符应该返回 400', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        authorName: 'User',
        authorEmail: 'a'.repeat(92) + '@test.com',
        content: 'Hello'
      })
    }, { DB: getDB() });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('100');
  });

  it('文章禁用评论时应该返回 403', async () => {
    const res = await request('/api/comment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: 1,
        authorName: 'User',
        content: 'Hello'
      })
    }, { DB: getDB({ postCommentStatus: { comment_status: 0 } }) });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/comment/post/:postId', () => {
  it('应该返回文章的评论列表（公开）', async () => {
    const res = await request('/api/comment/post/1', {}, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.pagination).toBeDefined();
  });
});

describe('GET /api/comment/:id', () => {
  it('应该返回评论详情', async () => {
    const res = await request('/api/comment/1', {}, { DB: getDB() });
    expect(res.status).toBe(200);
  });

  it('不存在的评论应该返回 404', async () => {
    const res = await request('/api/comment/999', {}, { DB: getDB({ comment: null }) });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/comment/:id/delete', () => {
  it('未登录应该返回 401', async () => {
    const res = await request('/api/comment/1/delete', {
      method: 'DELETE'
    }, { DB: getDB() });

    expect(res.status).toBe(401);
  });

  it('普通用户应该返回 403', async () => {
    const res = await request('/api/comment/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(403);
  });

  it('管理员应该可以删除评论', async () => {
    const res = await request('/api/comment/1/delete', {
      method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    }, { DB: getDB() });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
