import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { User } from '../models/User.js';
import { generateToken, verifyToken } from '../utils/auth.js';

// 处理用户路由
export async function handleUserRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const env = request.env;
  const userModel = new User(env);

  try {
    // 登录不需要认证
    if (path === '/api/user/login' && method === 'POST') {
      return await handleLogin(request, userModel);
    }

    // 对于其他路由,需要认证
    // 尝试获取并验证sessionID
    let sessionID = null;

    // 尝试从 Authorization 头获取（优先）
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionID = authHeader.substring(7);
    }

    // 尝试从 cookie 获取
    if (!sessionID) {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith('sessionID='));
        if (sessionCookie) {
          sessionID = sessionCookie.substring(10);
        }
      }
    }

    // API 调用必须认证
    if (!sessionID) {
      return unauthorizedResponse('未提供有效的sessionID');
    }

    // 验证sessionID
    const sessionResult = await validateSessionID(sessionID, env);
    
    if (!sessionResult.success) {
      // 检查是否是session过期
      if (sessionResult.message === 'Session已过期') {
        return errorResponse({ error: 'Session Expired' }, 401);
      }
      return unauthorizedResponse(sessionResult.message);
    }
    
    // 设置用户信息到request对象
    request.user = sessionResult.user;

    // 获取当前用户信息（兼容旧接口）
    if (path === '/api/user/me' && method === 'GET') {
      return await handleGetCurrentUser(request, userModel);
    }

    // 获取当前用户信息（新接口，也用于session验证）
    if (path === '/api/user/info' && method === 'GET') {
      return await handleGetUserInfo(request, userModel);
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
    const formData = await request.formData();
    const username = formData.get('username');
    const encryptedData = formData.get('encryptedData');
    const timestamp = formData.get('timestamp');
    const salt = formData.get('salt');

    console.log('Login attempt:', { username, encryptedDataLength: encryptedData?.length, timestamp, salt });

    if (!username || !encryptedData || !timestamp || !salt) {
      return errorResponse('登录数据不完整', 400);
    }

    // 验证时间戳（防止重放攻击，允许5分钟内的请求）
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 5 * 60 * 1000) { // 5分钟
      return errorResponse('请求已过期，请重新登录', 401);
    }

    // 获取用户信息
    const userResult = await userModel.getByUsername(username);
    if (!userResult.success || !userResult.result) {
      return errorResponse('用户不存在', 401);
    }

    const user = userResult.result;
    
    // 验证加密数据
    // 第一步：使用用户密码（存储的哈希值）+ 盐值 + 时间戳进行SHA256
    
    // 注意：这里需要根据实际存储的密码格式进行调整
    // 假设数据库中存储的是明文密码（实际应该存储哈希值）
    const passwordHash = user.password_hash;
    
    // 使用Web Crypto API进行SHA256哈希
    async function sha256(message) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
    
    // 第一步哈希：用户名+密码+盐值+时间戳
    const firstHash = await sha256(username + passwordHash + salt + timestamp);
    
    // 第二步哈希：第一步哈希结果+盐值+时间戳
    const expectedHash = await sha256(firstHash + salt + timestamp);
    
    if (encryptedData !== expectedHash) {
      return errorResponse('密码验证失败', 401);
    }

    // 生成sessionID：使用HMAC-SHA1(用户ID + 时间戳 + 随机数)
    async function generateSessionID(userId) {
      // 使用环境变量中的静态KEY，如果没有则使用默认值
      const serverKey = userModel.env.SESSION_SECRET || 'default-session-secret-key-change-in-production';
      const timestamp = Date.now().toString();
      const randomValue = crypto.getRandomValues(new Uint8Array(8));
      const randomHex = Array.from(randomValue).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // 准备数据：用户ID + 时间戳 + 随机数
      const data = `${userId}:${timestamp}:${randomHex}`;
      
      // 使用HMAC-SHA1生成签名
      const encoder = new TextEncoder();
      const keyData = encoder.encode(serverKey);
      const messageData = encoder.encode(data);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const signatureArray = Array.from(new Uint8Array(signature));
      const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // 组合sessionID：数据 + 分隔符 + 签名
      return `${data}:${signatureHex}`;
    }
    
    const sessionID = await generateSessionID(user.id);
    
    // 设置session过期时间（7天）
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // 计算过期时间戳（秒）
    const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    // 设置cookie
    const isProduction = userModel.env.ENVIRONMENT === 'production';
    const cookieValue = `sessionID=${sessionID}; HttpOnly; ${isProduction ? 'Secure;' : ''}SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;

    // 移除密码哈希，不返回给客户端
    delete user.password_hash;

    return successResponse({
      sessionID,
      user,
      expiresAt: sessionExpiry
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

// 获取用户信息（新接口，包含session验证）
async function handleGetUserInfo(request, userModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    // 直接返回request.user中的用户信息（已经通过session验证）
    const userInfo = {
      id: request.user.id,
      username: request.user.username,
      email: request.user.email,
      display_name: request.user.display_name,
      avatar: request.user.avatar,
      role: request.user.role,
      bio: request.user.bio,
      status: request.user.status,
      created_at: request.user.created_at,
      updated_at: request.user.updated_at
    };
    
    return successResponse(userInfo, '获取用户信息成功');
  } catch (err) {
    console.error('Get user info error:', err);
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

// 验证HMAC-SHA1生成的sessionID
async function validateSessionID(sessionID, env) {
  try {
    // sessionID格式：userId:timestamp:randomHex:signature
    const parts = sessionID.split(':');
    if (parts.length !== 4) {
      return { success: false, message: '无效的sessionID格式' };
    }
    
    const [userId, timestamp, randomHex, signature] = parts;
    
    // 验证时间戳（session过期时间）
    const sessionTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    
    // session有效期为7天
    if (currentTime - sessionTime > 7 * 24 * 60 * 60 * 1000) {
      return { success: false, message: 'Session已过期' };
    }
    
    // 重新计算签名进行验证
    const serverKey = env.SESSION_SECRET || 'default-session-secret-key-change-in-production';
    const data = `${userId}:${timestamp}:${randomHex}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serverKey);
    const messageData = encoder.encode(data);
    
    // 导入密钥
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['verify']
    );
    
    // 将十六进制签名转换为ArrayBuffer
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // 验证签名
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      messageData
    );
    
    if (!isValid) {
      return { success: false, message: '无效的session签名' };
    }
    
    // 获取用户信息
    const userModel = new User(env);
    const userResult = await userModel.getById('users', parseInt(userId, 10), 'id, username, email, display_name, avatar, role, bio, status, created_at, updated_at');
    
    if (!userResult.success || !userResult.result) {
      return { success: false, message: '用户不存在' };
    }
    
    const user = userResult.result;
    
    return {
      success: true,
      message: 'Session验证成功',
      user
    };
  } catch (err) {
    console.error('Session验证错误:', err);
    return { success: false, message: 'Session验证失败: ' + err.message };
  }
}