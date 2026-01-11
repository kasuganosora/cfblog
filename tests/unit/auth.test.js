// 认证工具测试
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../../src/utils/auth.js';
import { assert } from './test-utils.js';

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
