import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { verifyToken } from '../utils/auth.js';

// 处理管理后台路由
export async function handleAdminRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const env = request.env;

  try {
    // 登录页面和API不需要验证
    if (path === '/admin/login' || path === '/admin/login/api') {
      return await handleLogin(request, env);
    }

    // 验证用户令牌
    let token = null;
    
    // 尝试从 Authorization 头获取
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 尝试从 cookie 获取
    if (!token) {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.substring(6);
        }
      }
    }
    
    if (!token) {
      return unauthorizedResponse();
    }
    
    try {
      const payload = await verifyToken(token, env.JWT_SECRET);
      request.user = payload;
    } catch (error) {
      return unauthorizedResponse();
    }
    
    // 管理后台首页
    if (path === '/admin' || path === '/admin/') {
      return await handleDashboard(request, env);
    }
    
    // 文章管理页面
    if (path.startsWith('/admin/posts')) {
      return await handlePostsManagement(request, env);
    }
    
    // 分类管理页面
    if (path.startsWith('/admin/categories')) {
      return await handleCategoriesManagement(request, env);
    }
    
    // 标签管理页面
    if (path.startsWith('/admin/tags')) {
      return await handleTagsManagement(request, env);
    }
    
    // 评论管理页面
    if (path.startsWith('/admin/comments')) {
      return await handleCommentsManagement(request, env);
    }
    
    // 用户管理页面
    if (path.startsWith('/admin/users')) {
      return await handleUsersManagement(request, env);
    }
    
    // 反馈管理页面
    if (path.startsWith('/admin/feedback')) {
      return await handleFeedbackManagement(request, env);
    }
    
    // 附件管理页面
    if (path.startsWith('/admin/attachments')) {
      return await handleAttachmentsManagement(request, env);
    }
    
    // 设置页面
    if (path.startsWith('/admin/settings')) {
      return await handleSettingsManagement(request, env);
    }
    
    return errorResponse('未找到对应的后台页面', 404);
  } catch (err) {
    console.error('Admin error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 登录
async function handleLogin(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  
  // 返回登录页面
  if (method === 'GET') {
    const html = renderLoginPage();
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });
  }
  
  // 处理登录请求
  if (method === 'POST' && path === '/admin/login/api') {
    try {
      const { username, password } = await request.json();
      
      if (!username || !password) {
        return errorResponse('用户名和密码不能为空', 400);
      }
      
      // 调用登录API
      const response = await fetch(`${url.origin}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      console.error('Admin login error:', err);
      return errorResponse('登录失败', 500);
    }
  }
  
  return errorResponse('无效的请求', 400);
}

// 管理后台首页
async function handleDashboard(request, env) {
  try {
    // 获取统计数据
    const stats = await getDashboardStats(env);
    
    // 渲染页面
    const html = renderDashboardPage({
      user: request.user,
      stats
    });
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse('获取仪表板数据失败', 500);
  }
}

// 文章管理
async function handlePostsManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 文章列表页面
  if (path === '/admin/posts' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;
      
      // 获取文章列表
      const postsResponse = await fetch(`${url.origin}/api/post/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const postsData = await postsResponse.json();
      
      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const categoriesData = await categoriesResponse.json();
      
      // 渲染页面
      const html = renderPostsPage({
        user: request.user,
        posts: postsData.data,
        pagination: postsData.pagination,
        categories: categoriesData.data,
        currentStatus: status
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Posts management error:', err);
      return errorResponse('获取文章列表失败', 500);
    }
  }
  
  // 文章编辑页面
  if (path.startsWith('/admin/posts/edit/') && method === 'GET') {
    try {
      const postId = path.split('/')[4];
      const isNew = postId === 'new';
      
      let post = null;
      if (!isNew) {
        // 获取文章详情
        const postResponse = await fetch(`${url.origin}/api/post/${postId}`, {
          headers: {
            'Authorization': request.headers.get('Authorization'),
          }
        });
        
        if (postResponse.ok) {
          post = await postResponse.json();
        }
      }
      
      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const categoriesData = await categoriesResponse.json();
      
      // 获取标签列表
      const tagsResponse = await fetch(`${url.origin}/api/tag/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const tagsData = await tagsResponse.json();
      
      // 渲染页面
      const html = renderPostEditPage({
        user: request.user,
        post,
        categories: categoriesData.data,
        tags: tagsData.data,
        isNew
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Post edit error:', err);
      return errorResponse('获取文章详情失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 分类管理
async function handleCategoriesManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 分类列表页面
  if (path === '/admin/categories' && method === 'GET') {
    try {
      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const categoriesData = await categoriesResponse.json();
      
      // 渲染页面
      const html = renderCategoriesPage({
        user: request.user,
        categories: categoriesData.data
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Categories management error:', err);
      return errorResponse('获取分类列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 标签管理
async function handleTagsManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 标签列表页面
  if (path === '/admin/tags' && method === 'GET') {
    try {
      // 获取标签列表
      const tagsResponse = await fetch(`${url.origin}/api/tag/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const tagsData = await tagsResponse.json();
      
      // 渲染页面
      const html = renderTagsPage({
        user: request.user,
        tags: tagsData.data
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Tags management error:', err);
      return errorResponse('获取标签列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 评论管理
async function handleCommentsManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 评论列表页面
  if (path === '/admin/comments' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;
      
      // 获取评论列表
      const commentsResponse = await fetch(`${url.origin}/api/comment/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const commentsData = await commentsResponse.json();
      
      // 渲染页面
      const html = renderCommentsPage({
        user: request.user,
        comments: commentsData.data,
        pagination: commentsData.pagination,
        currentStatus: status
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Comments management error:', err);
      return errorResponse('获取评论列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 用户管理
async function handleUsersManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 用户列表页面
  if (path === '/admin/users' && method === 'GET') {
    // 只有管理员可以访问用户管理
    if (request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }
    
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const role = url.searchParams.get('role');
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;
      
      // 获取用户列表
      const usersResponse = await fetch(`${url.origin}/api/user/list?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const usersData = await usersResponse.json();
      
      // 渲染页面
      const html = renderUsersPage({
        user: request.user,
        users: usersData.data,
        pagination: usersData.pagination,
        currentRole: role,
        currentStatus: status
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Users management error:', err);
      return errorResponse('获取用户列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 反馈管理
async function handleFeedbackManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 反馈列表页面
  if (path === '/admin/feedback' && method === 'GET') {
    // 只有管理员可以访问反馈管理
    if (request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }
    
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;
      
      // 获取反馈列表
      const feedbackResponse = await fetch(`${url.origin}/api/feedback/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const feedbackData = await feedbackResponse.json();
      
      // 渲染页面
      const html = renderFeedbackPage({
        user: request.user,
        feedback: feedbackData.data,
        pagination: feedbackData.pagination,
        currentStatus: status
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Feedback management error:', err);
      return errorResponse('获取反馈列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 附件管理
async function handleAttachmentsManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 附件列表页面
  if (path === '/admin/attachments' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      
      // 获取附件列表
      const attachmentsResponse = await fetch(`${url.origin}/api/upload/list?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      const attachmentsData = await attachmentsResponse.json();
      
      // 渲染页面
      const html = renderAttachmentsPage({
        user: request.user,
        attachments: attachmentsData.data,
        pagination: attachmentsData.pagination
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Attachments management error:', err);
      return errorResponse('获取附件列表失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 设置管理
async function handleSettingsManagement(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // 设置页面
  if (path === '/admin/settings' && method === 'GET') {
    // 只有管理员可以访问设置管理
    if (request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }
    
    try {
      // 获取设置
      const settingsResponse = await fetch(`${url.origin}/api/settings/list`, {
        headers: {
          'Authorization': request.headers.get('Authorization'),
        }
      });
      
      let settingsData = {};
      if (settingsResponse.ok) {
        settingsData = await settingsResponse.json();
      }
      
      // 渲染页面
      const html = renderSettingsPage({
        user: request.user,
        settings: settingsData.data || []
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Settings management error:', err);
      return errorResponse('获取设置失败', 500);
    }
  }
  
  return errorResponse('未找到对应的后台页面', 404);
}

// 获取仪表板统计数据
async function getDashboardStats(env) {
  try {
    const stats = {};
    
    // 文章统计
    const postsQuery = `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 1 THEN 1 END) as published,
      COUNT(CASE WHEN status = 0 THEN 1 END) as draft,
      COUNT(CASE WHERE DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM posts`;
    const postsResult = await env.DB.prepare(postsQuery).first();
    stats.posts = postsResult;
    
    // 评论统计
    const commentsQuery = `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 1 THEN 1 END) as approved,
      COUNT(CASE WHEN status = 0 THEN 1 END) as pending,
      COUNT(CASE WHERE DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM comments`;
    const commentsResult = await env.DB.prepare(commentsQuery).first();
    stats.comments = commentsResult;
    
    // 用户统计
    const usersQuery = `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin,
      COUNT(CASE WHERE DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM users`;
    const usersResult = await env.DB.prepare(usersQuery).first();
    stats.users = usersResult;
    
    // 反馈统计
    const feedbackQuery = `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 0 THEN 1 END) as unread,
      COUNT(CASE WHERE DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM feedback`;
    const feedbackResult = await env.DB.prepare(feedbackQuery).first();
    stats.feedback = feedbackResult;
    
    // 最近文章
    const recentPostsQuery = `SELECT id, title, slug, created_at FROM posts ORDER BY created_at DESC LIMIT 5`;
    const recentPostsResult = await env.DB.prepare(recentPostsQuery).all();
    stats.recentPosts = recentPostsResult.results || [];
    
    // 最近评论
    const recentCommentsQuery = `SELECT c.id, c.content, c.created_at, p.title, p.slug 
      FROM comments c 
      JOIN posts p ON c.post_id = p.id 
      ORDER BY c.created_at DESC LIMIT 5`;
    const recentCommentsResult = await env.DB.prepare(recentCommentsQuery).all();
    stats.recentComments = recentCommentsResult.results || [];
    
    return stats;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return {};
  }
}

// 页面渲染函数（简化版，实际项目中应该使用模板引擎）
function renderLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台登录</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .login-form {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      margin-top: 0;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #007cba;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #005a87;
    }
    .message {
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 4px;
      display: none;
    }
    .error {
      background-color: #ffebee;
      color: #d32f2f;
    }
    .success {
      background-color: #e8f5e9;
      color: #388e3c;
    }
  </style>
</head>
<body>
  <div class="login-form">
    <h1>管理后台登录</h1>
    <div id="message" class="message"></div>
    <form id="loginForm">
      <div class="form-group">
        <label for="username">用户名</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">登录</button>
    </form>
  </div>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const messageDiv = document.getElementById('message');
      
      try {
        const response = await fetch('/admin/login/api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          messageDiv.textContent = '登录成功，正在跳转...';
          messageDiv.className = 'message success';
          messageDiv.style.display = 'block';
          
          // 保存令牌
          localStorage.setItem('auth_token', result.data.token);
          
          // 跳转到管理后台首页
          setTimeout(() => {
            window.location.href = '/admin';
          }, 1000);
        } else {
          messageDiv.textContent = result.message || '登录失败';
          messageDiv.className = 'message error';
          messageDiv.style.display = 'block';
        }
      } catch (error) {
        messageDiv.textContent = '登录失败，请稍后重试';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function renderDashboardPage(data) {
  const { user, stats } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 仪表板</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 250px;
      background-color: #333;
      color: #fff;
      padding: 20px 0;
    }
    .sidebar h2 {
      text-align: center;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .sidebar nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar nav li {
      margin-bottom: 5px;
    }
    .sidebar nav a {
      display: block;
      padding: 10px 20px;
      color: #fff;
      text-decoration: none;
    }
    .sidebar nav a:hover {
      background-color: #444;
    }
    .sidebar nav a.active {
      background-color: #007cba;
    }
    .main-content {
      flex: 1;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #fff;
      padding: 10px 20px;
      margin-bottom: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #007cba;
      margin-bottom: 10px;
    }
    .stat-details {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #666;
    }
    .recent-section {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .recent-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }
    .recent-list {
      list-style: none;
      padding: 0;
    }
    .recent-item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .recent-item:last-child {
      border-bottom: none;
    }
    .recent-item a {
      color: #007cba;
      text-decoration: none;
    }
    .recent-item a:hover {
      text-decoration: underline;
    }
    .recent-meta {
      font-size: 12px;
      color: #666;
    }
    .logout {
      background-color: #d32f2f;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .logout:hover {
      background-color: #b71c1c;
    }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <h2>管理后台</h2>
      <nav>
        <ul>
          <li><a href="/admin" class="active">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments">评论管理</a></li>
          <li><a href="/admin/users">用户管理</a></li>
          <li><a href="/admin/feedback">反馈管理</a></li>
          <li><a href="/admin/attachments">附件管理</a></li>
          <li><a href="/admin/settings">系统设置</a></li>
        </ul>
      </nav>
    </aside>
    
    <main class="main-content">
      <div class="header">
        <h1>仪表板</h1>
        <div>
          <span>欢迎, ${user.display_name || user.username}</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>文章</h3>
          <div class="stat-number">${stats.posts?.published || 0}</div>
          <div class="stat-details">
            <span>总计: ${stats.posts?.total || 0}</span>
            <span>草稿: ${stats.posts?.draft || 0}</span>
            <span>今日: ${stats.posts?.today || 0}</span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>评论</h3>
          <div class="stat-number">${stats.comments?.approved || 0}</div>
          <div class="stat-details">
            <span>总计: ${stats.comments?.total || 0}</span>
            <span>待审核: ${stats.comments?.pending || 0}</span>
            <span>今日: ${stats.comments?.today || 0}</span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>用户</h3>
          <div class="stat-number">${stats.users?.total || 0}</div>
          <div class="stat-details">
            <span>管理员: ${stats.users?.admin || 0}</span>
            <span>今日: ${stats.users?.today || 0}</span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>反馈</h3>
          <div class="stat-number">${stats.feedback?.total || 0}</div>
          <div class="stat-details">
            <span>未读: ${stats.feedback?.unread || 0}</span>
            <span>今日: ${stats.feedback?.today || 0}</span>
          </div>
        </div>
      </div>
      
      <div class="recent-section">
        <h3>最近文章</h3>
        <ul class="recent-list">
          ${stats.recentPosts?.map(post => `
            <li class="recent-item">
              <a href="/admin/posts/edit/${post.id}">${post.title}</a>
              <div class="recent-meta">${new Date(post.created_at).toLocaleDateString()}</div>
            </li>
          `).join('') || '<li>暂无文章</li>'}
        </ul>
      </div>
      
      <div class="recent-section">
        <h3>最近评论</h3>
        <ul class="recent-list">
          ${stats.recentComments?.map(comment => `
            <li class="recent-item">
              <a href="/post/${comment.slug}">${comment.content.substring(0, 50)}...</a>
              <div class="recent-meta">${comment.title} - ${new Date(comment.created_at).toLocaleDateString()}</div>
            </li>
          `).join('') || '<li>暂无评论</li>'}
        </ul>
      </div>
    </main>
  </div>
  
  <script>
    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }
    
    // 在每个请求中添加认证头
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (args[1]) {
        args[1].headers = args[1].headers || {};
        args[1].headers.Authorization = 'Bearer ' + localStorage.getItem('auth_token');
      } else {
        args[1] = {
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('auth_token')
          }
        };
      }
      return originalFetch.apply(this, args);
    };
  </script>
</body>
</html>`;
}

function renderPostsPage(data) {
  const { user, posts, pagination, categories, currentStatus } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 文章管理</title>
  <style>
    /* 简化样式，实际项目中应该更完善 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      margin-bottom: 20px;
    }
    .filters select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .status-published {
      color: #388e3c;
    }
    .status-draft {
      color: #f57c00;
    }
    .pagination {
      margin-top: 20px;
      text-align: center;
    }
    .pagination a {
      display: inline-block;
      padding: 8px 16px;
      margin: 0 4px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-decoration: none;
    }
    .pagination a.active {
      background-color: #007cba;
      color: #fff;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
    .action-buttons {
      display: flex;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>文章管理</h1>
      <a href="/admin/posts/edit/new" class="btn btn-primary">新建文章</a>
    </div>
    
    <div class="filters">
      <select id="statusFilter" onchange="filterByStatus()">
        <option value="">所有状态</option>
        <option value="1" ${currentStatus === 1 ? 'selected' : ''}>已发布</option>
        <option value="0" ${currentStatus === 0 ? 'selected' : ''}>草稿</option>
      </select>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>作者</th>
          <th>分类</th>
          <th>状态</th>
          <th>浏览量</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${posts.map(post => `
          <tr>
            <td>${post.id}</td>
            <td><a href="/post/${post.slug}" target="_blank">${post.title}</a></td>
            <td>${post.author_name}</td>
            <td>${post.categories.map(cat => cat.name).join(', ')}</td>
            <td class="${post.status === 1 ? 'status-published' : 'status-draft'}">${post.status === 1 ? '已发布' : '草稿'}</td>
            <td>${post.view_count}</td>
            <td>${new Date(post.created_at).toLocaleDateString()}</td>
            <td>
              <div class="action-buttons">
                <a href="/admin/posts/edit/${post.id}" class="btn btn-primary">编辑</a>
                <button class="btn btn-danger" onclick="deletePost(${post.id})">删除</button>
              </div>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="8">暂无文章</td></tr>'}
      </tbody>
    </table>
    
    ${pagination ? `
    <div class="pagination">
      ${pagination.page > 1 ? `<a href="?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ''}">上一页</a>` : ''}
      <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
      ${pagination.page < pagination.totalPages ? `<a href="?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ''}">下一页</a>` : ''}
    </div>
    ` : ''}
  </div>
  
  <script>
    function filterByStatus() {
      const status = document.getElementById('statusFilter').value;
      let url = '/admin/posts';
      
      if (status) {
        url += '?status=' + status;
      }
      
      window.location.href = url;
    }
    
    function deletePost(id) {
      if (confirm('确定要删除这篇文章吗？')) {
        fetch('/api/post/' + id + '/delete', {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('文章删除成功');
            window.location.reload();
          } else {
            alert(data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('删除失败，请稍后重试');
        });
      }
    }
  </script>
</body>
</html>`;
}

function renderPostEditPage(data) {
  const { user, post, categories, tags, isNew } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - ${isNew ? '新建文章' : '编辑文章'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="text"], textarea, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    textarea {
      min-height: 300px;
      resize: vertical;
    }
    .checkbox-group {
      display: flex;
      gap: 20px;
    }
    .checkbox-group label {
      display: flex;
      align-items: center;
      font-weight: normal;
    }
    .checkbox-group input {
      margin-right: 5px;
    }
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${isNew ? '新建文章' : '编辑文章'}</h1>
    
    <form id="postForm">
      <div class="form-group">
        <label for="title">标题</label>
        <input type="text" id="title" name="title" value="${post ? post.title : ''}" required>
      </div>
      
      <div class="form-group">
        <label for="slug">URL 别名</label>
        <input type="text" id="slug" name="slug" value="${post ? post.slug : ''}">
      </div>
      
      <div class="form-group">
        <label for="excerpt">摘要</label>
        <textarea id="excerpt" name="excerpt">${post ? post.excerpt : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="content">内容</label>
        <textarea id="content" name="content" required>${post ? post.content : ''}</textarea>
      </div>
      
      <div class="form-group">
        <label for="categoryId">分类</label>
        <select id="categoryId" name="categoryId">
          <option value="">请选择分类</option>
          ${categories.map(cat => `
            <option value="${cat.id}" ${post && post.categories.some(c => c.id === cat.id) ? 'selected' : ''}>${cat.name}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label>标签</label>
        <div id="tagsContainer">
          ${post && post.tags.map(tag => `
            <span class="tag">${tag.name}</span>
          `).join('') || ''}
        </div>
        <input type="text" id="tagInput" placeholder="输入标签后按回车添加">
      </div>
      
      <div class="form-group">
        <div class="checkbox-group">
          <label>
            <input type="checkbox" id="status" name="status" value="1" ${post && post.status === 1 ? 'checked' : ''}>
            发布文章
          </label>
          <label>
            <input type="checkbox" id="featured" name="featured" value="1" ${post && post.featured === 1 ? 'checked' : ''}>
            设为精选
          </label>
          <label>
            <input type="checkbox" id="commentStatus" name="commentStatus" value="1" ${post && post.comment_status === 1 ? 'checked' : ''}>
            允许评论
          </label>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${isNew ? '发布文章' : '更新文章'}</button>
        <a href="/admin/posts" class="btn btn-secondary">取消</a>
      </div>
    </form>
  </div>
  
  <script>
    // 标签管理
    const tags = ${post && post.tags ? JSON.stringify(post.tags) : '[]'};
    const tagsContainer = document.getElementById('tagsContainer');
    const tagInput = document.getElementById('tagInput');
    
    function renderTags() {
      tagsContainer.innerHTML = tags.map(tag =>
        '<span class="tag">' + tag.name + ' <button type="button" onclick="removeTag(' + tag.id + ')">&times;</button></span>'
      ).join('');
    }
    
    function addTag(tagName) {
      // 检查标签是否已存在
      if (tags.some(tag => tag.name === tagName)) {
        return;
      }
      
      // 添加标签
      tags.push({ name: tagName });
      renderTags();
      tagInput.value = '';
    }
    
    function removeTag(tagId) {
      const index = tags.findIndex(tag => tag.id === tagId);
      if (index !== -1) {
        tags.splice(index, 1);
        renderTags();
      }
    }
    
    tagInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tagName = this.value.trim();
        if (tagName) {
          addTag(tagName);
        }
      }
    });
    
    // 表单提交
    document.getElementById('postForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        title: document.getElementById('title').value,
        slug: document.getElementById('slug').value,
        excerpt: document.getElementById('excerpt').value,
        content: document.getElementById('content').value,
        categoryId: parseInt(document.getElementById('categoryId').value),
        tagNames: tags.map(tag => tag.name),
        status: document.getElementById('status').checked ? 1 : 0,
        featured: document.getElementById('featured').checked ? 1 : 0,
        commentStatus: document.getElementById('commentStatus').checked ? 1 : 0
      };
      
      const url = isNew ? '/api/post/create' : '/api/post/' + post.id + '/update';
      const method = isNew ? 'POST' : 'PUT';
      
      fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(isNew ? '文章创建成功' : '文章更新成功');
          window.location.href = '/admin/posts';
        } else {
          alert(data.message || '${isNew ? '创建失败' : '更新失败'}');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('${isNew ? '创建失败，请稍后重试' : '更新失败，请稍后重试'}');
      });
    });
  </script>
</body>
</html>`;
}

// 其他页面的渲染函数可以类似地实现...

function renderCategoriesPage(data) {
  // 分类管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 分类管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>分类管理</h1>
      <button class="btn btn-primary">新建分类</button>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>URL 别名</th>
          <th>文章数</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.categories.map(cat => `
          <tr>
            <td>${cat.id}</td>
            <td>${cat.name}</td>
            <td>${cat.slug}</td>
            <td>${cat.post_count || 0}</td>
            <td>${new Date(cat.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary">编辑</button>
              <button class="btn btn-danger">删除</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="6">暂无分类</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

function renderTagsPage(data) {
  // 标签管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 标签管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>标签管理</h1>
      <button class="btn btn-primary">新建标签</button>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>URL 别名</th>
          <th>文章数</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.tags.map(tag => `
          <tr>
            <td>${tag.id}</td>
            <td>${tag.name}</td>
            <td>${tag.slug}</td>
            <td>${tag.post_count || 0}</td>
            <td>${new Date(tag.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary">编辑</button>
              <button class="btn btn-danger">删除</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="6">暂无标签</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

function renderCommentsPage(data) {
  // 评论管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 评论管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      margin-bottom: 20px;
    }
    .filters select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .status-pending {
      color: #f57c00;
    }
    .status-approved {
      color: #388e3c;
    }
    .status-rejected {
      color: #d32f2f;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-success {
      background-color: #388e3c;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>评论管理</h1>
    </div>
    
    <div class="filters">
      <select id="statusFilter" onchange="filterByStatus()">
        <option value="">所有状态</option>
        <option value="0" ${data.currentStatus === 0 ? 'selected' : ''}>待审核</option>
        <option value="1" ${data.currentStatus === 1 ? 'selected' : ''}>已批准</option>
        <option value="2" ${data.currentStatus === 2 ? 'selected' : ''}>已拒绝</option>
      </select>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>作者</th>
          <th>内容</th>
          <th>文章</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.comments.map(comment => `
          <tr>
            <td>${comment.id}</td>
            <td>${comment.author_display_name}</td>
            <td>${comment.content.substring(0, 50)}...</td>
            <td><a href="/post/${comment.post_slug}" target="_blank">${comment.post_title || '未知'}</a></td>
            <td class="status-${comment.status === 0 ? 'pending' : comment.status === 1 ? 'approved' : 'rejected'}">${
              comment.status === 0 ? '待审核' : comment.status === 1 ? '已批准' : '已拒绝'
            }</td>
            <td>${new Date(comment.created_at).toLocaleDateString()}</td>
            <td>
              ${comment.status === 0 ? `<button class="btn btn-success" onclick="approveComment(${comment.id})">批准</button>` : ''}
              ${comment.status === 0 ? `<button class="btn btn-danger" onclick="rejectComment(${comment.id})">拒绝</button>` : ''}
              <button class="btn btn-danger" onclick="deleteComment(${comment.id})">删除</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="7">暂无评论</td></tr>'}
      </tbody>
    </table>
  </div>
  
  <script>
    function filterByStatus() {
      const status = document.getElementById('statusFilter').value;
      let url = '/admin/comments';
      
      if (status) {
        url += '?status=' + status;
      }
      
      window.location.href = url;
    }
    
    function approveComment(id) {
      fetch('/api/comment/' + id + '/approve', {
        method: 'PUT'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('评论批准成功');
          window.location.reload();
        } else {
          alert(data.message || '操作失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('操作失败，请稍后重试');
      });
    }
    
    function rejectComment(id) {
      if (confirm('确定要拒绝这条评论吗？')) {
        fetch('/api/comment/' + id + '/reject', {
          method: 'PUT'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('评论拒绝成功');
            window.location.reload();
          } else {
            alert(data.message || '操作失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('操作失败，请稍后重试');
        });
      }
    }
    
    function deleteComment(id) {
      if (confirm('确定要删除这条评论吗？')) {
        fetch('/api/comment/' + id + '/delete', {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('评论删除成功');
            window.location.reload();
          } else {
            alert(data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('删除失败，请稍后重试');
        });
      }
    }
  </script>
</body>
</html>`;
}

function renderUsersPage(data) {
  // 用户管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 用户管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    .filters select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .role-admin {
      color: #d32f2f;
      font-weight: bold;
    }
    .status-active {
      color: #388e3c;
    }
    .status-inactive {
      color: #f57c00;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>用户管理</h1>
      <button class="btn btn-primary">新建用户</button>
    </div>
    
    <div class="filters">
      <select id="roleFilter" onchange="filterUsers()">
        <option value="">所有角色</option>
        <option value="admin" ${data.currentRole === 'admin' ? 'selected' : ''}>管理员</option>
        <option value="contributor" ${data.currentRole === 'contributor' ? 'selected' : ''}>投稿者</option>
      </select>
      <select id="statusFilter" onchange="filterUsers()">
        <option value="">所有状态</option>
        <option value="1" ${data.currentStatus === 1 ? 'selected' : ''}>活跃</option>
        <option value="0" ${data.currentStatus === 0 ? 'selected' : ''}>禁用</option>
      </select>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>显示名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.display_name}</td>
            <td>${user.email}</td>
            <td class="${user.role === 'admin' ? 'role-admin' : ''}">${
              user.role === 'admin' ? '管理员' : '投稿者'
            }</td>
            <td class="${user.status === 1 ? 'status-active' : 'status-inactive'}">${
              user.status === 1 ? '活跃' : '禁用'
            }</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary">编辑</button>
              ${user.id !== data.user.id ? `<button class="btn btn-danger" onclick="deleteUser(${user.id})">删除</button>` : ''}
            </td>
          </tr>
        `).join('') || '<tr><td colspan="8">暂无用户</td></tr>'}
      </tbody>
    </table>
  </div>
  
  <script>
    function filterUsers() {
      const role = document.getElementById('roleFilter').value;
      const status = document.getElementById('statusFilter').value;
      
      let url = '/admin/users';
      const params = new URLSearchParams();
      
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      window.location.href = url;
    }
    
    function deleteUser(id) {
      if (confirm('确定要删除这个用户吗？')) {
        fetch('/api/user/' + id, {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('用户删除成功');
            window.location.reload();
          } else {
            alert(data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('删除失败，请稍后重试');
        });
      }
    }
  </script>
</body>
</html>`;
}

function renderFeedbackPage(data) {
  // 反馈管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 反馈管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      margin-bottom: 20px;
    }
    .filters select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .status-unread {
      color: #f57c00;
      font-weight: bold;
    }
    .status-read {
      color: #007cba;
    }
    .status-replied {
      color: #388e3c;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-success {
      background-color: #388e3c;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>反馈管理</h1>
    </div>
    
    <div class="filters">
      <select id="statusFilter" onchange="filterFeedbacks()">
        <option value="">所有状态</option>
        <option value="0" ${data.currentStatus === 0 ? 'selected' : ''}>未读</option>
        <option value="1" ${data.currentStatus === 1 ? 'selected' : ''}>已读</option>
        <option value="2" ${data.currentStatus === 2 ? 'selected' : ''}>已回复</option>
      </select>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>姓名</th>
          <th>邮箱</th>
          <th>主题</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.feedback.map(item => `
          <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.subject}</td>
            <td class="status-${
              item.status === 0 ? 'unread' : item.status === 1 ? 'read' : 'replied'
            }">${
              item.status === 0 ? '未读' : item.status === 1 ? '已读' : '已回复'
            }</td>
            <td>${new Date(item.created_at).toLocaleDateString()}</td>
            <td>
              ${item.status === 0 ? `<button class="btn btn-success" onclick="markAsRead(${item.id})">标记已读</button>` : ''}
              ${item.status === 1 ? `<button class="btn btn-primary" onclick="markAsReplied(${item.id})">标记已回复</button>` : ''}
              <button class="btn btn-danger" onclick="deleteFeedback(${item.id})">删除</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="7">暂无反馈</td></tr>'}
      </tbody>
    </table>
  </div>
  
  <script>
    function filterFeedbacks() {
      const status = document.getElementById('statusFilter').value;
      let url = '/admin/feedback';
      
      if (status) {
        url += '?status=' + status;
      }
      
      window.location.href = url;
    }
    
    function markAsRead(id) {
      fetch('/api/feedback/' + id + '/read', {
        method: 'PUT'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('反馈已标记为已读');
          window.location.reload();
        } else {
          alert(data.message || '操作失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('操作失败，请稍后重试');
      });
    }
    
    function markAsReplied(id) {
      fetch('/api/feedback/' + id + '/reply', {
        method: 'PUT'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('反馈已标记为已回复');
          window.location.reload();
        } else {
          alert(data.message || '操作失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('操作失败，请稍后重试');
      });
    }
    
    function deleteFeedback(id) {
      if (confirm('确定要删除这条反馈吗？')) {
        fetch('/api/feedback/' + id + '/delete', {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('反馈删除成功');
            window.location.reload();
          } else {
            alert(data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('删除失败，请稍后重试');
        });
      }
    }
  </script>
</body>
</html>`;
}

function renderAttachmentsPage(data) {
  // 附件管理页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 附件管理</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .upload-area {
      border: 2px dashed #ddd;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    .upload-area.dragover {
      border-color: #007cba;
      background-color: #f0f7ff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f5f5f5;
    }
    .file-icon {
      width: 20px;
      height: 20px;
      margin-right: 5px;
    }
    .file-size {
      color: #666;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      margin-right: 8px;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .btn-danger {
      background-color: #d32f2f;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>附件管理</h1>
      <button class="btn btn-primary">上传文件</button>
    </div>
    
    <div class="upload-area" id="uploadArea">
      <p>拖拽文件到这里或点击上传按钮选择文件</p>
      <input type="file" id="fileInput" multiple style="display: none;">
    </div>
    
    <table>
      <thead>
        <tr>
          <th>文件名</th>
          <th>类型</th>
          <th>大小</th>
          <th>下载次数</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.attachments.map(att => `
          <tr>
            <td>
              ${getFileIcon(att.mime_type)}
              <a href="/api/upload/${att.id}/download" target="_blank">${att.original_name}</a>
            </td>
            <td>${att.mime_type}</td>
            <td class="file-size">${formatFileSize(att.file_size)}</td>
            <td>${att.download_count}</td>
            <td>${new Date(att.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary">编辑</button>
              <button class="btn btn-danger" onclick="deleteAttachment(${att.id})">删除</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="6">暂无附件</td></tr>'}
      </tbody>
    </table>
  </div>
  
  <script>
    function getFileIcon(mimeType) {
      // 根据MIME类型返回对应的图标
      if (mimeType.startsWith('image/')) {
        return '<span class="file-icon">🖼️</span>';
      } else if (mimeType.startsWith('video/')) {
        return '<span class="file-icon">🎥</span>';
      } else if (mimeType.startsWith('audio/')) {
        return '<span class="file-icon">🎵</span>';
      } else if (mimeType.includes('pdf')) {
        return '<span class="file-icon">📄</span>';
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return '<span class="file-icon">📝</span>';
      } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
        return '<span class="file-icon">📊</span>';
      } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
        return '<span class="file-icon">📦</span>';
      } else {
        return '<span class="file-icon">📎</span>';
      }
    }
    
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function deleteAttachment(id) {
      if (confirm('确定要删除这个附件吗？')) {
        fetch('/api/upload/' + id, {
          method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('附件删除成功');
            window.location.reload();
          } else {
            alert(data.message || '删除失败');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('删除失败，请稍后重试');
        });
      }
    }
    
    // 文件上传功能（简化版）
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', function() {
      fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function() {
      this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      handleFiles(files);
    });
    
    fileInput.addEventListener('change', function() {
      const files = this.files;
      handleFiles(files);
    });
    
    function handleFiles(files) {
      if (files.length === 0) return;
      
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
      }
      
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('文件上传成功');
          window.location.reload();
        } else {
          alert(data.message || '上传失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('上传失败，请稍后重试');
      });
    }
  </script>
</body>
</html>`;
}

function renderSettingsPage(data) {
  // 设置页面实现
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 系统设置</title>
  <style>
    /* 简化样式 */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="text"], input[type="email"], input[type="number"], textarea, select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    textarea {
      min-height: 100px;
      resize: vertical;
    }
    .form-actions {
      margin-top: 30px;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #007cba;
      color: #fff;
    }
    .setting-section {
      margin-bottom: 30px;
    }
    .setting-section h3 {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>系统设置</h1>
    </div>
    
    <form id="settingsForm">
      <div class="setting-section">
        <h3>基本设置</h3>
        <div class="form-group">
          <label for="site_title">网站标题</label>
          <input type="text" id="site_title" name="site_title" value="${
            data.settings.find(s => s.key === 'site_title')?.value || ''
          }">
        </div>
        <div class="form-group">
          <label for="site_description">网站描述</label>
          <textarea id="site_description" name="site_description">${
            data.settings.find(s => s.key === 'site_description')?.value || ''
          }</textarea>
        </div>
        <div class="form-group">
          <label for="site_keywords">网站关键词</label>
          <input type="text" id="site_keywords" name="site_keywords" value="${
            data.settings.find(s => s.key === 'site_keywords')?.value || ''
          }">
        </div>
        <div class="form-group">
          <label for="site_url">网站URL</label>
          <input type="text" id="site_url" name="site_url" value="${
            data.settings.find(s => s.key === 'site_url')?.value || ''
          }">
        </div>
        <div class="form-group">
          <label for="admin_email">管理员邮箱</label>
          <input type="email" id="admin_email" name="admin_email" value="${
            data.settings.find(s => s.key === 'admin_email')?.value || ''
          }">
        </div>
      </div>
      
      <div class="setting-section">
        <h3>文章设置</h3>
        <div class="form-group">
          <label for="posts_per_page">每页显示文章数</label>
          <input type="number" id="posts_per_page" name="posts_per_page" value="${
            data.settings.find(s => s.key === 'posts_per_page')?.value || 10
          }" min="1" max="100">
        </div>
      </div>
      
      <div class="setting-section">
        <h3>评论设置</h3>
        <div class="form-group">
          <label>
            <input type="checkbox" id="comment_moderation" name="comment_moderation" value="1" ${
              data.settings.find(s => s.key === 'comment_moderation')?.value === '1' ? 'checked' : ''
            }>
            评论审核（开启后新评论需要管理员批准）
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="allow_comments" name="allow_comments" value="1" ${
              data.settings.find(s => s.key === 'allow_comments')?.value === '1' ? 'checked' : ''
            }>
            允许评论
          </label>
        </div>
      </div>
      
      <div class="setting-section">
        <h3>用户设置</h3>
        <div class="form-group">
          <label>
            <input type="checkbox" id="allow_registration" name="allow_registration" value="1" ${
              data.settings.find(s => s.key === 'allow_registration')?.value === '1' ? 'checked' : ''
            }>
            允许用户注册
          </label>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">保存设置</button>
      </div>
    </form>
  </div>
  
  <script>
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const settings = {};
      
      for (const [key, value] of formData.entries()) {
        if (key.endsWith('_moderation') || key.endsWith('_comments') || key.endsWith('_registration')) {
          settings[key] = value;
        } else {
          settings[key] = value;
        }
      }
      
      // 这里应该调用更新设置的API
      // 由于我们没有实现这个API，这里只是一个示例
      alert('设置保存功能未实现');
    });
  </script>
</body>
</html>`;
}