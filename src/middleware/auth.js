import { verifyToken } from '../utils/auth.js';

// 认证中间件
export const authMiddleware = async (request, env, ctx, next) => {
  // 获取请求路径
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 登录接口不需要认证
  if (path === '/admin/login') {
    return await next();
  }
  
  // 获取 Authorization 头
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      message: '未提供认证令牌'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
  
  const token = authHeader.substring(7); // 去掉 "Bearer " 前缀
  
  try {
    // 验证令牌
    const payload = await verifyToken(token, env.JWT_SECRET);
    
    // 将用户信息添加到请求上下文中
    request.user = payload;
    
    // 继续处理请求
    return await next();
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '无效的认证令牌'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
};

// 角色检查中间件
export const roleMiddleware = (roles) => {
  return async (request, env, ctx, next) => {
    if (!request.user) {
      return new Response(JSON.stringify({
        success: false,
        message: '未认证用户'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    if (!roles.includes(request.user.role)) {
      return new Response(JSON.stringify({
        success: false,
        message: '权限不足'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    return await next();
  };
};