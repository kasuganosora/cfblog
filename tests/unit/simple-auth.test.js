// 简化的认证工具测试（不依赖 Cloudflare Workers API）
import { assert } from './test-utils.js';

// Base64URL 编码
function base64urlEncode(str) {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Base64URL 解码
function base64urlDecode(str) {
  str += new Array(5 - str.length % 4).join('=');
  const base64 = str.replace(/\-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

// 密码哈希
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 密码验证
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成 JWT 令牌
async function generateToken(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encodedSignature = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${encodedSignature}`;
}

// 验证 JWT 令牌
async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

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

    const payload = JSON.parse(base64urlDecode(encodedPayload));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Token verification failed: ' + error.message);
  }
}

export async function runAuthTests() {
  console.log('🔐 运行认证工具测试...\n');

  // 测试密码哈希
  await testPasswordHash();

  // 测试密码验证
  await testPasswordVerify();

  // 测试令牌生成
  await testTokenGeneration();

  // 测试令牌验证
  await testTokenVerification();

  // 测试令牌过期
  await testTokenExpiration();

  console.log('\n✅ 认证工具测试完成');
}

async function testPasswordHash() {
  console.log('测试密码哈希...');
  const password = 'test123';
  const hash = await hashPassword(password);

  assert.isDefined(hash, '密码哈希应该被生成');
  assert.isTrue(hash.length > 0, '密码哈希不应该为空');
  assert.notEqual(hash, password, '密码哈希不应该等于明文密码');

  // 相同密码应该生成相同的哈希
  const hash2 = await hashPassword(password);
  assert.equal(hash, hash2, '相同密码应该生成相同的哈希');

  // 不同密码应该生成不同的哈希
  const hash3 = await hashPassword('different');
  assert.notEqual(hash, hash3, '不同密码应该生成不同的哈希');

  console.log('✅ 密码哈希测试通过');
}

async function testPasswordVerify() {
  console.log('测试密码验证...');
  const password = 'test123';
  const wrongPassword = 'wrong123';

  const isValid = await verifyPassword(password, await hashPassword(password));
  assert.isTrue(isValid, '正确的密码应该验证通过');

  const isInvalid = await verifyPassword(wrongPassword, await hashPassword(password));
  assert.isFalse(isInvalid, '错误的密码应该验证失败');

  console.log('✅ 密码验证测试通过');
}

async function testTokenGeneration() {
  console.log('测试令牌生成...');
  const secret = 'test-secret';
  const payload = {
    id: 1,
    username: 'testuser',
    role: 'admin'
  };

  const token = await generateToken(payload, secret);

  assert.isDefined(token, '令牌应该被生成');
  assert.isTrue(token.length > 0, '令牌不应该为空');
  assert.contains(token, '.', '令牌应该包含点分隔符');

  // 令牌应该有三部分
  const parts = token.split('.');
  assert.length(parts, 3, '令牌应该有三部分');

  console.log('✅ 令牌生成测试通过');
}

async function testTokenVerification() {
  console.log('测试令牌验证...');
  const secret = 'test-secret';
  const payload = {
    id: 1,
    username: 'testuser',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
  };

  const token = await generateToken(payload, secret);
  const verified = await verifyToken(token, secret);

  assert.isDefined(verified, '令牌应该被验证');
  assert.equal(verified.id, payload.id, '令牌应该包含正确的用户ID');
  assert.equal(verified.username, payload.username, '令牌应该包含正确的用户名');
  assert.equal(verified.role, payload.role, '令牌应该包含正确的角色');

  // 错误的密钥应该验证失败
  try {
    await verifyToken(token, 'wrong-secret');
    assert.isTrue(false, '错误的密钥应该验证失败');
  } catch (error) {
    assert.isTrue(error.message.includes('Token verification failed'), '应该抛出验证失败错误');
  }

  console.log('✅ 令牌验证测试通过');
}

async function testTokenExpiration() {
  console.log('测试令牌过期...');
  const secret = 'test-secret';
  const payload = {
    id: 1,
    username: 'testuser',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
  };

  const token = await generateToken(payload, secret);

  try {
    await verifyToken(token, secret);
    assert.isTrue(false, '过期的令牌应该验证失败');
  } catch (error) {
    assert.isTrue(error.message.includes('Token expired') || error.message.includes('Token verification failed'), '应该抛出过期错误');
  }

  console.log('✅ 令牌过期测试通过');
}
