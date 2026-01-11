// 简单的测试脚本
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Cloudflare Blog is working!',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};