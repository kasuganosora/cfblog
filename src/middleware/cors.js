// 添加 CORS 头到响应
export function addCorsHeaders(response) {
  const headers = new Headers(response.headers);

  // 如果是开发环境，允许所有源
  if (typeof globalThis !== 'undefined' && globalThis.ENVIRONMENT === 'development') {
    headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // 生产环境应该配置具体的域名
    headers.set('Access-Control-Allow-Origin', '*');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// 处理 OPTIONS 请求
export function handleOptionsRequest() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  return new Response(null, {
    status: 200,
    headers,
  });
}