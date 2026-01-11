import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { User } from '../models/User.js';
import { generateToken } from '../utils/auth.js';

// 处理用户路由
export async function handleUserRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const userModel = new User(env);
  
  try {
    // 登录
    if (path === '/api/user/login' && method === 'POST') {
      return await handleLogin(request, userModel);
    }
    
    // 获取当前用户信息
    if (path === '/api/user/me' && method === 'GET') {
      return await handleGetCurrentUser(request, userModel);
    }
    
    // 更新当前用户信息
    if (path === '/api/user/me' && method === 'PUT') {
      return await handleUpdateCurrentUser(request, userModel);
    }
    
    // 获取用户列表（需要管理员权限）
    if (path === '/api/user/list' && method === 'GET') {
      return await handleGetUsers(request, userModel);
    }
    
    // 创建用户（需要管理员权限）
    if (path === '/api/user/create' && method === 'POST') {
      return await handleCreateUser(request, userModel);
    }
    
    // 更新用户状态（需要管理员权限）
    if (path.startsWith('/api/user/') && path.endsWith('/status') && method === 'PUT') {
      const userId = path.split('/')[3];
      return await handleUpdateUserStatus(request, userId, userModel);
    }
    
    // 更新用户角色（需要管理员权限）
    if (path.startsWith('/api/user/') && path.endsWith('/role') && method === 'PUT') {
      const userId = path.split('/')[3];
      return await handleUpdateUserRole(request, userId, userModel);
    }
    
    // 删除用户（需要管理员权限）
    if (path.startsWith('/api/user/') && method === 'DELETE') {
      const userId = path.split('/')[3];
      return await handleDeleteUser(request, userId, userModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('User API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 处理登录
async function handleLogin(request, userModel) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt:', { username, passwordLength: password?.length });

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空', 400);
    }

    const result = await userModel.validatePassword(username, password);

    console.log('Validate result:', result);

    if (!result.success) {
      return errorResponse(result.message, 401);
    }

    const user = result.user;

    // 生成 JWT 令牌
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7天有效期
    };

    const token = await generateToken(payload, userModel.env.JWT_SECRET);

    // 设置 cookie (开发环境不设置 Secure)
    const isProduction = userModel.env.ENVIRONMENT === 'production';
    const cookieValue = `token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''}SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;

    return successResponse({
      token,
      user
    }, '登录成功', { 'Set-Cookie': cookieValue });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('登录失败: ' + err.message, 500);
  }
}

// 获取当前用户信息
async function handleGetCurrentUser(request, userModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const result = await userModel.getById('users', request.user.id, 'id, username, email, display_name, avatar, role, bio, status, created_at, updated_at');
    
    if (!result.success || !result.result) {
      return errorResponse('用户不存在', 404);
    }
    
    return successResponse(result.result, '获取用户信息成功');
  } catch (err) {
    console.error('Get current user error:', err);
    return errorResponse('获取用户信息失败', 500);
  }
}

// 更新当前用户信息
async function handleUpdateCurrentUser(request, userModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const userData = await request.json();
    const userId = request.user.id;
    
    const result = await userModel.updateUser(userId, userData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.user, '用户信息更新成功');
  } catch (err) {
    console.error('Update current user error:', err);
    return errorResponse('更新用户信息失败', 500);
  }
}

// 获取用户列表
async function handleGetUsers(request, userModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status');
    
    const options = { page, limit };
    if (role) options.role = role;
    if (status !== null) options.status = parseInt(status);
    
    const result = await userModel.getUsers(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取用户列表成功');
  } catch (err) {
    console.error('Get users error:', err);
    return errorResponse('获取用户列表失败', 500);
  }
}

// 创建用户
async function handleCreateUser(request, userModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const userData = await request.json();
    
    if (!userData.username || !userData.email || !userData.password || !userData.displayName) {
      return errorResponse('用户名、邮箱、密码和显示名不能为空', 400);
    }
    
    const result = await userModel.createUser(userData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.user, '创建用户成功');
  } catch (err) {
    console.error('Create user error:', err);
    return errorResponse('创建用户失败', 500);
  }
}

// 更新用户状态
async function handleUpdateUserStatus(request, userId, userModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const { status } = await request.json();
    
    if (status === undefined) {
      return errorResponse('状态不能为空', 400);
    }
    
    const result = await userModel.updateUserStatus(userId, status);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, '更新用户状态成功');
  } catch (err) {
    console.error('Update user status error:', err);
    return errorResponse('更新用户状态失败', 500);
  }
}

// 更新用户角色
async function handleUpdateUserRole(request, userId, userModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const { role } = await request.json();
    
    if (!role) {
      return errorResponse('角色不能为空', 400);
    }
    
    const result = await userModel.updateUserRole(userId, role);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, '更新用户角色成功');
  } catch (err) {
    console.error('Update user role error:', err);
    return errorResponse('更新用户角色失败', 500);
  }
}

// 删除用户
async function handleDeleteUser(request, userId, userModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  // 不允许删除自己
  if (parseInt(userId) === request.user.id) {
    return errorResponse('不能删除自己的账号', 400);
  }
  
  try {
    const result = await userModel.delete('users', userId);
    
    if (!result.success) {
      return errorResponse(result.error, 500);
    }
    
    return successResponse(null, '删除用户成功');
  } catch (err) {
    console.error('Delete user error:', err);
    return errorResponse('删除用户失败', 500);
  }
}