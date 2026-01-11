// 生成 JWT 令牌
export async function generateToken(payload, secret) {
  // 在 Cloudflare Workers 环境中，我们需要使用 Web Crypto API
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // 将头部和载荷进行 Base64URL 编码
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // 创建签名数据
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // 生成签名
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encodedSignature = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
  
  // 组合 JWT
  return `${data}.${encodedSignature}`;
}

// 验证 JWT 令牌
export async function verifyToken(token, secret) {
  try {
    // 分割 JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // 验证签名
    const data = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(data)
    );
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // 解码载荷
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    
    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Token verification failed: ' + error.message);
  }
}

// Base64URL 编码
function base64urlEncode(str) {
  // 将字符串转换为 base64
  const base64 = btoa(str);
  // 替换 base64 中的字符以使其 URL 安全
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Base64URL 解码
function base64urlDecode(str) {
  // 添加填充字符
  str += new Array(5 - str.length % 4).join('=');
  // 替换 URL 安全字符为标准 base64 字符
  const base64 = str.replace(/\-/g, '+').replace(/_/g, '/');

  // 解码 base64
  return atob(base64);
}

// 密码哈希（简单实现，生产环境应使用更安全的方法）
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 密码验证
export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
