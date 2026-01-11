// 简单的认证功能测试
const fetch = require('undici').fetch;
const API_BASE = 'http://localhost:8787';

console.log('🔐 开始认证功能测试...\n');

async function testLogin() {
  console.log('测试用户登录...');
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 登录成功');
      console.log('   令牌:', data.data.token.substring(0, 30) + '...');
      return data.data.token;
    } else {
      console.log('❌ 登录失败:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return null;
  }
}

async function testGetUser(token) {
  console.log('\n测试获取用户信息...');
  try {
    const response = await fetch(`${API_BASE}/api/user/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 获取用户信息成功');
      console.log('   用户名:', data.data.username);
      console.log('   角色:', data.data.role);
      return true;
    } else {
      console.log('❌ 获取用户信息失败:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 获取用户信息请求失败:', error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n测试未授权访问...');
  try {
    const response = await fetch(`${API_BASE}/api/user/me`);
    const data = await response.json();

    if (response.status === 401 || !data.success) {
      console.log('✅ 未授权访问被正确拒绝');
      return true;
    } else {
      console.log('❌ 未授权访问没有被拒绝');
      return false;
    }
  } catch (error) {
    console.log('❌ 未授权访问测试失败:', error.message);
    return false;
  }
}

async function runTests() {
  const token = await testLogin();

  if (!token) {
    console.log('\n❌ 登录失败，测试终止');
    process.exit(1);
  }

  await testGetUser(token);
  await testUnauthorizedAccess();

  console.log('\n✅ 认证功能测试完成');
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
