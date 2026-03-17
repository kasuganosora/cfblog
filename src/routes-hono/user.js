/**
 * User Routes - Hono Version
 */

import { Hono } from 'hono';
import { User } from '../models/User.js';
import { LoginAudit } from '../models/LoginAudit.js';
import { generateSessionId, validateSessionId } from '../utils/auth.js';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  parsePagination,
  safeParseInt,
  requireAuth,
  requireAdmin
} from './base.js';

const userRoutes = new Hono();

// POST /login - 用户登录（含 IP 限流和审计日志）
userRoutes.post('/login', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || '0.0.0.0';
    const userAgent = c.req.header('User-Agent') || '';

    // Check IP rate limit
    const auditModel = new LoginAudit(db);
    const { blocked, remainingMinutes } = await auditModel.isIPBlocked(ip);
    if (blocked) {
      return c.json(errorResponse(`Too many failed attempts. Please try again in ${remainingMinutes} minutes.`).json(), 429);
    }

    let username, password;
    const contentType = c.req.header('Content-Type') || '';

    // Try JSON first, then fall back to form data
    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      username = body.username;
      password = body.password;
    } else {
      // Parse form data
      try {
        const body = await c.req.parseBody();
        username = body.username;
        password = body.password;
      } catch (e) {
        return c.json(errorResponse('Invalid request format').json(), 400);
      }
    }

    if (!username || !password) {
      return c.json(errorResponse('Username and password are required').json(), 400);
    }

    const userModel = new User(db);
    try {
      const user = await userModel.verifyCredentials(username, password);

      // Login success — record and clear failed attempts
      await auditModel.recordAttempt({ ip, username, success: true, user_agent: userAgent });
      await auditModel.clearFailedAttempts(ip);

      // Generate secure session ID using HMAC
      const secret = c.env?.SESSION_SECRET;
      if (!secret) {
        console.error('SESSION_SECRET not configured');
        return c.json(serverErrorResponse('Server configuration error').json(), 500);
      }
      const sessionId = await generateSessionId(user.id, secret);

      // Set session cookie (with Secure flag for HTTPS)
      c.header('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

      return c.json({
        success: true,
        data: { user },
        message: 'Login successful'
      });
    } catch (loginError) {
      // Login failed — record failed attempt
      await auditModel.recordAttempt({ ip, username, success: false, user_agent: userAgent });
      return c.json(errorResponse('Invalid username or password').json(), 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /login-audit - 获取登录审计日志（管理员）
userRoutes.get('/login-audit', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const auditModel = new LoginAudit(db);
    const result = await auditModel.getAuditList({ page, limit });

    return c.json(result);
  } catch (error) {
    console.error('Login audit error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /me - 获取当前用户信息
userRoutes.get('/me', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    return c.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// POST /logout - 用户登出
userRoutes.post('/logout', async (c) => {
  c.header('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return c.json({ success: true, message: 'Logged out successfully' });
});

// GET /list - 获取用户列表（管理员）
userRoutes.get('/list', requireAdmin, async (c) => {
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
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// POST /api/user/create - 创建用户（管理员）
userRoutes.post('/create', requireAdmin, async (c) => {
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

// PUT /api/user/:id/profile - 修改用户资料（管理员）
userRoutes.put('/:id/profile', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid user ID').json(), 400);
    }
    const body = await c.req.json();
    const { username, email, displayName } = body;

    if (username !== undefined && !username.trim()) {
      return c.json(errorResponse('Username cannot be empty').json(), 400);
    }
    if (email !== undefined && !email.trim()) {
      return c.json(errorResponse('Email cannot be empty').json(), 400);
    }

    const userModel = new User(db);
    const updated = await userModel.updateUser(id, { username, email, displayName });

    return c.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/user/:id/password - 修改用户密码（管理员）
userRoutes.put('/:id/password', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid user ID').json(), 400);
    }
    const currentUser = c.get('user');
    const { oldPassword, newPassword } = await c.req.json();

    if (!newPassword || newPassword.length < 6) {
      return c.json(errorResponse('New password must be at least 6 characters').json(), 400);
    }

    const userModel = new User(db);

    if (id === currentUser.id) {
      // Changing own password: require old password
      if (!oldPassword) {
        return c.json(errorResponse('Old password is required when changing your own password').json(), 400);
      }
      await userModel.changePassword(id, oldPassword, newPassword);
    } else {
      // Admin resetting another user's password: no old password needed
      const { hashPassword } = await import('../utils/auth.js');
      const passwordHash = await hashPassword(newPassword);
      await userModel.update(id, {
        password_hash: passwordHash,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// PUT /api/user/:id/status - 更新用户状态（管理员）
userRoutes.put('/:id/status', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid user ID').json(), 400);
    }
    const currentUser = c.get('user');

    if (id === currentUser.id) {
      return c.json(errorResponse('Cannot change your own status').json(), 400);
    }

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

// PUT /api/user/:id/role - 更新用户角色（管理员）
userRoutes.put('/:id/role', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid user ID').json(), 400);
    }
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

// DELETE /api/user/:id - 删除用户（管理员）
userRoutes.delete('/:id', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid user ID').json(), 400);
    }
    const currentUser = c.get('user');

    if (id === currentUser.id) {
      return c.json(errorResponse('Cannot delete your own account').json(), 400);
    }

    const userModel = new User(db);
    await userModel.deleteUser(id);

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { userRoutes };
