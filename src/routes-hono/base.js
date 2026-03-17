/**
 * Base Router for Hono Routes
 * 提供通用工具函数
 */

import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';
import { Comment } from '../models/Comment.js';
import { Feedback } from '../models/Feedback.js';
import { Settings } from '../models/Settings.js';
import { validateSessionId } from '../utils/auth.js';

// 统一响应格式
export const successResponse = (data, message = 'Success', status = 200) => ({
  status,
  json: () => ({
    success: true,
    message,
    data
  })
});

export const errorResponse = (message, status = 400) => ({
  status,
  json: () => ({
    success: false,
    message
  })
});

export const notFoundResponse = (message = 'Not Found') => ({
  status: 404,
  json: () => ({
    success: false,
    message
  })
});

export const unauthorizedResponse = (message = 'Unauthorized') => ({
  status: 401,
  json: () => ({
    success: false,
    message
  })
});

export const forbiddenResponse = (message = 'Forbidden') => ({
  status: 403,
  json: () => ({
    success: false,
    message
  })
});

export const serverErrorResponse = (message = 'Internal Server Error') => ({
  status: 500,
  json: () => ({
    success: false,
    message
  })
});

// DB中间件
export const withDB = (ModelClass) => async (c, next) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }
    c.model = new ModelClass(db);
    await next();
  } catch (error) {
    console.error('DB middleware error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
};

// 安全解析整数，处理 NaN 情况
export const safeParseInt = (value, defaultValue = null) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// 分页参数解析
export const parsePagination = (c) => {
  const url = new URL(c.req.url);
  const page = safeParseInt(url.searchParams.get('page'), 1);
  const limit = safeParseInt(url.searchParams.get('limit'), 10);
  return { page, limit };
};

// 用户认证中间件
export const requireAuth = async (c, next) => {
  try {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionId) {
      return c.json(unauthorizedResponse('Not logged in').json(), 401);
    }

    const secret = c.env?.SESSION_SECRET;
    if (!secret) {
      console.error('SESSION_SECRET not configured');
      return c.json(serverErrorResponse('Server configuration error').json(), 500);
    }
    const sessionData = await validateSessionId(sessionId, secret);
    if (!sessionData) {
      return c.json(unauthorizedResponse('Invalid or expired session').json(), 401);
    }

    // Fetch user from DB and attach to context
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const userModel = new User(db);
    const user = await userModel.findById(sessionData.userId);
    if (!user || user.status !== 1) {
      return c.json(unauthorizedResponse('User not found or disabled').json(), 401);
    }

    // Remove password hash and attach user to context
    const { password_hash, ...safeUser } = user;
    c.set('user', safeUser);
    c.set('userId', safeUser.id);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json(serverErrorResponse('Authentication error').json(), 500);
  }
};

// 管理员权限中间件 (includes auth check)
export const requireAdmin = async (c, next) => {
  try {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionId) {
      return c.json(unauthorizedResponse('Not logged in').json(), 401);
    }

    const secret = c.env?.SESSION_SECRET;
    if (!secret) {
      console.error('SESSION_SECRET not configured');
      return c.json(serverErrorResponse('Server configuration error').json(), 500);
    }
    const sessionData = await validateSessionId(sessionId, secret);
    if (!sessionData) {
      return c.json(unauthorizedResponse('Invalid or expired session').json(), 401);
    }

    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const userModel = new User(db);
    const user = await userModel.findById(sessionData.userId);
    if (!user || user.status !== 1) {
      return c.json(unauthorizedResponse('User not found or disabled').json(), 401);
    }

    if (user.role !== 'admin') {
      return c.json(forbiddenResponse('Admin access required').json(), 403);
    }

    const { password_hash, ...safeUser } = user;
    c.set('user', safeUser);
    c.set('userId', safeUser.id);

    await next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return c.json(serverErrorResponse('Authentication error').json(), 500);
  }
};
