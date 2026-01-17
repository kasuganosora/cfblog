/**
 * User Routes
 * Handles user authentication and management
 */

import { Router } from 'itty-router';
import { User } from '../models/User.js';
import {
  generateSessionId,
  validateSessionId
} from '../utils/auth.js';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse
} from '../utils/response.js';

const userRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new User(db));
  } catch (error) {
    console.error('User route error:', error);
    return serverErrorResponse(error.message);
  }
};

// POST /api/user/login - User login
userRouter.post('/login', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const { username, password } = await request.json();

      if (!username || !password) {
        return errorResponse('Username and password are required');
      }

      // Verify credentials
      const user = await userModel.verifyCredentials(username, password);

      // Generate session ID
      const sessionId = generateSessionId(user.id, request.env.SESSION_SECRET);

      // Set session cookie
      const response = successResponse({
        user,
        sessionId
      }, 'Login successful');

      // Set cookie
      response.headers = {
        ...response.headers,
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` // 7 days
      };

      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      return errorResponse(error.message, 401);
    }
  });
});

// GET /api/user/me - Get current user info
userRouter.get('/me', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const sessionId = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];

      if (!sessionId) {
        return unauthorizedResponse('Not logged in');
      }

      // Validate session
      const sessionData = validateSessionId(sessionId, request.env.SESSION_SECRET);
      if (!sessionData) {
        return unauthorizedResponse('Invalid session');
      }

      // Get user info
      const user = await userModel.findById(sessionData.userId);
      if (!user) {
        return unauthorizedResponse('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;
      return successResponse(userWithoutPassword);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// PUT /api/user/me - Update current user info
userRouter.put('/me', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const sessionId = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];

      if (!sessionId) {
        return unauthorizedResponse('Not logged in');
      }

      // Validate session
      const sessionData = validateSessionId(sessionId, request.env.SESSION_SECRET);
      if (!sessionData) {
        return unauthorizedResponse('Invalid session');
      }

      const body = await request.json();
      const user = await userModel.updateUser(sessionData.userId, body);

      return successResponse(user, 'User updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// GET /api/user/list - Get user list (admin only)
userRouter.get('/list', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const { page, limit, role, status } = Object.fromEntries(new URL(request.url).searchParams);

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const result = await userModel.getUserList({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role,
        status: status !== undefined ? parseInt(status) : undefined
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// POST /api/user/create - Create user (admin only)
userRouter.post('/create', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.username || !body.email || !body.password) {
        return errorResponse('Username, email, and password are required');
      }

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      const user = await userModel.createUser(body);
      return successResponse(user, 'User created successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// PUT /api/user/:id/status - Update user status (admin only)
userRouter.put('/:id/status', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const id = parseInt(request.params.id);
      const { status } = await request.json();

      if (status === undefined) {
        return errorResponse('Status is required');
      }

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await userModel.updateStatus(id, parseInt(status));
      return successResponse(null, 'User status updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// PUT /api/user/:id/role - Update user role (admin only)
userRouter.put('/:id/role', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const id = parseInt(request.params.id);
      const { role } = await request.json();

      if (!role) {
        return errorResponse('Role is required');
      }

      // TODO: Add admin authentication middleware
      // For now, skip auth check

      await userModel.updateRole(id, role);
      return successResponse(null, 'User role updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// DELETE /api/user/:id - Delete user (admin only)
userRouter.delete('/:id', async (request) => {
  return withDB(request, async (userModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add admin authentication middleware
      // Check if trying to delete self
      // For now, skip auth check

      await userModel.deleteUser(id);
      return successResponse(null, 'User deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
});

export { userRouter as userRoutes };
