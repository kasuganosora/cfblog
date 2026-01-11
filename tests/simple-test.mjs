// 简单测试脚本
import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

async function testLogin() {
  console.log('测试登录...');

  const response = await fetch(`${API_BASE}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  const data = await response.json();

  console.log('状态码:', response.status);
  console.log('响应:', JSON.stringify(data, null, 2));

  return data.success;
}

testLogin().then(success => {
  if (success) {
    console.log('\n✅ 测试通过');
    process.exit(0);
  } else {
    console.log('\n❌ 测试失败');
    process.exit(1);
  }
}).catch(error => {
  console.error('测试错误:', error);
  process.exit(1);
});
