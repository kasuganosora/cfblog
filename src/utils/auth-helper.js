import { verifyToken } from './auth.js';

// 认证辅助函数 - 从请求中提取并验证token
// 返回：{ user: payload } 或抛出错误
export async function authenticateRequest(request, env) {
  let token = null;

  // 尝试从 Cookie 获取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.substring(6); // 去掉 "token=" 前缀
    }
  }

  // 如果Cookie中没有，尝试从 Authorization 头获取
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // 去掉 "Bearer " 前缀
    }
  }

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token, env.JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// 认证辅助函数 - 包装路由处理器，自动处理认证
export function withAuth(handler) {
  return async (request, env, ctx) => {
    const user = await authenticateRequest(request, env);

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: '未提供认证令牌或令牌无效'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    request.user = user;
    return handler(request, env, ctx);
  };
}

// 角色检查辅助函数
export function withRole(roles) {
  return (handler) => {
    return async (request, env, ctx) => {
      const user = await authenticateRequest(request, env);

      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          message: '未提供认证令牌或令牌无效'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      if (!roles.includes(user.role)) {
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

      request.user = user;
      return handler(request, env, ctx);
    };
  };
}
