/**
 * User Routes - Hono Version
 */

import { Hono } from 'hono';
import { User } from '../models/User.js';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  parsePagination
} from './base.js';

const userRoutes = new Hono();

// POST /login - 用户登录
userRoutes.post('/login', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    let username, password;

    // Try JSON first, then fall back to form data
    try {
      const body = await c.req.json();
      username = body.username;
      password = body.password;
    } catch {
      const body = await c.req.parseBody();
      username = body.username;
      password = body.password;
    }

    if (!username || !password) {
      return c.json(errorResponse('Username and password are required').json(), 400);
    }

    const userModel = new User(db);
    const user = await userModel.verifyCredentials(username, password);

    // Generate session ID
    const sessionId = 'session-' + Date.now() + '-' + Math.random();

    return c.json({
      success: true,
      data: { user, sessionId },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(errorResponse(error.message).json(), 401);
  }
});

// GET /me - 获取当前用户信息
userRoutes.get('/me', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionId) {
      return c.json({
        success: false,
        message: 'Not logged in'
      }, 401);
    }

    // TODO: 验证session并获取用户
    return c.json({
      success: true,
      data: { message: 'Session validation needed' }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// GET /list - 获取用户列表
userRoutes.get('/list', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const userModel = new User(db);
    const result = await userModel.getUserList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
      role: params.role,
      status: params.status !== undefined ? parseInt(params.status) : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Get user list error:', error);
    return c.json(serverErrorResponse(error.message).json(), 500);
  }
});

// POST /api/user/create - 创建用户
userRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    if (!body.username || !body.email || !body.password) {
      return c.json(errorResponse('Username, email, and password are required').json(), 400);
    }

    const userModel = new User(db);
    const user = await userModel.createUser(body);

    return c.json(user, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/user/:id/status - 更新用户状态
userRoutes.put('/user/:id/status', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const { status } = await c.req.json();

    if (status === undefined) {
      return c.json(errorResponse('Status is required').json(), 400);
    }

    const userModel = new User(db);
    await userModel.updateStatus(id, parseInt(status));

    return c.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/user/:id/role - 更新用户角色
userRoutes.put('/user/:id/role', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const { role } = await c.req.json();

    if (!role) {
      return c.json(errorResponse('Role is required').json(), 400);
    }

    const userModel = new User(db);
    await userModel.updateRole(id, role);

    return c.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// DELETE /api/user/:id - 删除用户
userRoutes.delete('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = parseInt(c.req.param('id'));
    const userModel = new User(db);
    await userModel.deleteUser(id);

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { userRoutes };
