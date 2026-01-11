import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

async function testConnection() {
  console.log('测试与开发服务器的连接...\n');
  
  try {
    // 测试基本连接
    console.log('测试首页...');
    const homeResponse = await fetch(`${API_BASE}/`);
    console.log(`首页响应状态: ${homeResponse.status}`);
    
    if (homeResponse.ok) {
      console.log('✓ 开发服务器连接成功');
      console.log('\n可以访问以下地址进行手动测试:');
      console.log('- 前台: http://localhost:8787');
      console.log('- 后台: http://localhost:8787/admin');
      console.log('- 默认登录账号: admin / admin123');
    } else {
      console.log('✗ 开发服务器响应异常');
    }
  } catch (error) {
    console.log(`✗ 连接失败: ${error.message}`);
    console.log('\n请确保开发服务器正在运行:');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 等待服务器完全启动');
    console.log('3. 然后再次运行此测试');
  }
}

testConnection().catch(console.error);