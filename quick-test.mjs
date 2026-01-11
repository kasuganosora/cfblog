import { fetch } from 'undici';

const API_BASE = 'http://localhost:8787';

async function testConnection() {
  try {
    console.log('Testing server connection...');
    const response = await fetch(API_BASE + '/');
    console.log('Server status:', response.status);

    const text = await response.text();
    console.log('Response length:', text.length);
    console.log('Contains "html"?', text.includes('<html') || text.includes('<!DOCTYPE'));

    // 测试首页
    if (text.includes('html') || text.includes('DOCTYPE')) {
      console.log('✅ Home page is accessible');
    } else {
      console.log('❌ Home page is not valid HTML');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
