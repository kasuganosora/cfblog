// 标准化 API 响应格式
export function successResponse(data = null, message = '操作成功') {
  return new Response(JSON.stringify({
    success: true,
    message,
    data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 错误响应
export function errorResponse(message = '操作失败', status = 400, data = null) {
  return new Response(JSON.stringify({
    success: false,
    message,
    data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 未找到资源响应
export function notFoundResponse(message = '资源不存在') {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 未授权响应
export function unauthorizedResponse(message = '未授权访问') {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 禁止访问响应
export function forbiddenResponse(message = '禁止访问') {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 服务器错误响应
export function serverErrorResponse(message = '服务器内部错误') {
  return new Response(JSON.stringify({
    success: false,
    message
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}