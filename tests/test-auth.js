// 简单的认证功能测试 - 更新为新的sessionID机制
const fetch = require('undici').fetch;
const crypto = require('crypto');
const API_BASE = 'http://localhost:8787';

console.log('🔐 开始认证功能测试（新sessionID机制）...\n');

// 辅助函数：生成随机盐值
function generateSalt(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 辅助函数：SHA256哈希
async function sha256(message) {
  const hash = crypto.createHash('sha256');
  hash.update(message);
  return hash.digest('hex');
}

async function testLogin() {
  console.log('测试用户登录（新加密流程）...');
  try {
    const username = 'admin';
    const password = 'admin123'; // 注意：需要根据实际数据库密码调整
    const salt = generateSalt();
    const timestamp = Date.now().toString();
    
    // 第一步加密：用户名+密码+盐值+时间戳
    const firstHash = await sha256(username + password + salt + timestamp);
    
    // 第二步加密：拼接盐值和时间戳后再次加密
    const encryptedData = await sha256(firstHash + salt + timestamp);
    
    // 创建FormData格式的数据
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('encryptedData', encryptedData);
    formData.append('timestamp', timestamp);
    formData.append('salt', salt);

    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 登录成功');
      console.log('   sessionID:', data.data.sessionID ? data.data.sessionID.substring(0, 30) + '...' : '未返回sessionID');
      console.log('   用户:', data.data.user?.username || '未知');
      return data.data.sessionID;
    } else {
      console.log('❌ 登录失败:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return null;
  }
}

async function testGetUser(sessionID) {
  console.log('\n测试获取用户信息（使用sessionID）...');
  try {
    const response = await fetch(`${API_BASE}/api/user/info`, {
      headers: { 'Authorization': `Bearer ${sessionID}` }
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
  const sessionID = await testLogin();

  if (!sessionID) {
    console.log('\n❌ 登录失败，测试终止');
    process.exit(1);
  }

  await testGetUser(sessionID);
  await testUnauthorizedAccess();

  console.log('\n✅ 认证功能测试完成（新sessionID机制）');
}

runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
