import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { verifyToken } from '../utils/auth.js';
import { executeOne, executeQuery } from '../utils/db.js';
import { User } from '../models/User.js';



// 处理管理后台路由
export async function handleAdminRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const env = request.env;

  try {
    // 登录页面和API不需要验证
    if (path === '/admin/login') {
      return await handleLogin(request, env);
    }

    const method = request.method;
    const acceptHeader = request.headers.get('Accept') || '';

    // 对于页面请求（GET 且 Accept 包含 text/html），不强制要求认证
    // 页面会在前端 JavaScript 中检查 localStorage 的 token
    // 对于 /admin 路径的 GET 请求，即使没有 Accept 头也当作页面请求
    const isAdminPage = path === '/admin' || path === '/admin/' || path === '/admin/dashboard';
    const isPageRequest = method === 'GET' && (isAdminPage || acceptHeader.includes('text/html'));

    // 尝试获取并验证用户凭证（支持sessionID和JWT token）
    let sessionID = null;
    let token = null;

    // 尝试从 Authorization 头获取（优先）
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const authValue = authHeader.substring(7);
      // 尝试判断是sessionID还是JWT token
      // sessionID通常是随机字符串，JWT token有特定的格式（包含点号）
      if (authValue.includes('.')) {
        token = authValue; // JWT token
      } else {
        sessionID = authValue; // sessionID
      }
    }

    // 尝试从 cookie 获取
    if (!sessionID && !token) {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        // 尝试获取sessionID cookie
        const sessionCookie = cookies.find(c => c.startsWith('sessionID='));
        if (sessionCookie) {
          sessionID = sessionCookie.substring(10);
        } else {
          // 尝试获取旧的token cookie
          const tokenCookie = cookies.find(c => c.startsWith('token='));
          if (tokenCookie) {
            token = tokenCookie.substring(6);
          }
        }
      }
    }

    // API 调用必须认证
    if (!isPageRequest && !sessionID && !token) {
      return unauthorizedResponse();
    }

    // 验证凭证
    if (sessionID) {
      // 使用sessionID验证
      const sessionResult = await validateSessionID(sessionID, env);
      
      if (!sessionResult.success) {
        // 检查是否是session过期
        if (sessionResult.message === 'Session已过期') {
          return errorResponse({ error: 'Session Expired' }, 401);
        }
        // 对于 API 调用，认证失败则拒绝
        if (!isPageRequest) {
          return unauthorizedResponse(sessionResult.message);
        }
        // 对于页面请求，认证失败不影响页面渲染
        request.user = null;
      } else {
        request.user = sessionResult.user;
      }
    } else if (token) {
      // 使用JWT token验证（向后兼容）
      try {
        const payload = await verifyToken(token, env.JWT_SECRET);
        request.user = payload;
      } catch (error) {
        // 对于 API 调用，认证失败则拒绝
        if (!isPageRequest) {
          return unauthorizedResponse();
        }
        // 对于页面请求，认证失败不影响页面渲染
        request.user = null;
      }
    } else {
      request.user = null;
    }
    
    // 管理后台首页
    if (path === '/admin' || path === '/admin/' || path === '/admin/dashboard') {
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
  
  return errorResponse('无效的请求', 400);
}

// 管理后台首页
async function handleDashboard(request, env) {
  try {
    // 获取统计数据
    const stats = await getDashboardStats(env);

    console.log('Dashboard stats:', stats);

    // 渲染页面
    const html = renderDashboardPage({
      user: request.user,
      stats: stats || {}
    });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    // 对于页面请求，返回一个简化页面而不是 JSON 错误
    const html = renderDashboardPage({
      user: request.user,
      stats: { posts: { total: 0, published: 0, draft: 0, today: 0 } }
    });
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });
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

      // 从浏览器请求中获取 Cookie
      const cookieHeader = request.headers.get('Cookie');

      // 获取文章列表
      const postsResponse = await fetch(`${url.origin}/api/post/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const postsData = await postsResponse.json();

      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });

      const categoriesData = await categoriesResponse.json();

      // 提取实际数据（API 返回的格式是 { success, message, data: { success, data, pagination } }）
      const posts = postsData.success && postsData.data ? postsData.data.data || [] : [];
      const pagination = postsData.success && postsData.data ? postsData.data.pagination : null;
      const categories = categoriesData.success && categoriesData.data ? categoriesData.data.data || [] : [];

      // 渲染页面
      const html = renderPostsPage({
        user: request.user,
        posts,
        pagination,
        categories,
        currentStatus: status
      });
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
        }
      });
    } catch (err) {
      console.error('Posts management error:', err);
      // 即使出错也返回一个友好的 HTML 页面
      const errorHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 文章管理</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .error-message {
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      text-align: center;
    }
    .error-message h1 {
      color: #d32f2f;
    }
    .error-message p {
      color: #666;
    }
    .error-message a {
      color: #007cba;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="error-message">
    <h1>错误</h1>
    <p>获取文章列表失败，请稍后重试。</p>
    <p><a href="/admin/dashboard">返回仪表板</a></p>
  </div>
</body>
</html>`;
      return new Response(errorHtml, {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        }
      });
    }
  }
  
  // 文章编辑页面
  if (path.startsWith('/admin/posts/edit/') && method === 'GET') {
    try {
      const postId = path.split('/')[4];
      const isNew = postId === 'new';

      // 从浏览器请求中获取 Cookie
      const cookieHeader = request.headers.get('Cookie');

      let post = null;
      if (!isNew) {
        // 获取文章详情
        const postResponse = await fetch(`${url.origin}/api/post/${postId}`, {
          headers: {
            'Cookie': cookieHeader || '',
          }
        });

        if (postResponse.ok) {
          post = await postResponse.json();
        }
      }

      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });

      const categoriesData = await categoriesResponse.json();

      // 获取标签列表
      const tagsResponse = await fetch(`${url.origin}/api/tag/list`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });

      const tagsData = await tagsResponse.json();

      // 提取实际数据
      const categories = categoriesData.success && categoriesData.data ? categoriesData.data.data || [] : [];
      const tags = tagsData.success && tagsData.data ? tagsData.data.data || [] : [];

      // 渲染页面
      const html = renderPostEditPage({
        user: request.user,
        post: post && post.data ? post.data : null,
        categories,
        tags,
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 分类列表页面
  if (path === '/admin/categories' && method === 'GET') {
    try {
      // 获取分类列表
      const categoriesResponse = await fetch(`${url.origin}/api/category/list`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const categoriesData = await categoriesResponse.json();

      // 提取实际数据
      const categories = categoriesData.success && categoriesData.data ? categoriesData.data.data || [] : [];

      // 渲染页面
      const html = renderCategoriesPage({
        user: request.user,
        categories
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 标签列表页面
  if (path === '/admin/tags' && method === 'GET') {
    try {
      // 获取标签列表
      const tagsResponse = await fetch(`${url.origin}/api/tag/list`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const tagsData = await tagsResponse.json();


      // 提取实际数据
      const tags = tagsData.success && tagsData.data ? tagsData.data.data || [] : [];

      // 渲染页面
      const html = renderTagsPage({
        user: request.user,
        tags
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 评论列表页面
  if (path === '/admin/comments' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;

      // 获取评论列表
      const commentsResponse = await fetch(`${url.origin}/api/comment/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const commentsData = await commentsResponse.json();

      // 提取实际数据
      const comments = commentsData.success && commentsData.data ? commentsData.data.data || [] : [];
      const pagination = commentsData.success && commentsData.data ? commentsData.data.pagination : null;

      // 渲染页面
      const html = renderCommentsPage({
        user: request.user,
        comments,
        pagination,
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 用户列表页面
  if (path === '/admin/users' && method === 'GET') {
    // 只有管理员可以访问用户管理
    if (request.user && request.user.role !== 'admin') {
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
          'Cookie': cookieHeader || '',
        }
      });
      
      const usersData = await usersResponse.json();

      // 提取实际数据
      const users = usersData.success && usersData.data ? usersData.data.data || [] : [];
      const pagination = usersData.success && usersData.data ? usersData.data.pagination : null;

      // 渲染页面
      const html = renderUsersPage({
        user: request.user,
        users,
        pagination,
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 反馈列表页面
  if (path === '/admin/feedback' && method === 'GET') {
    // 只有管理员可以访问反馈管理
    if (request.user && request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }

    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;

      // 获取反馈列表
      const feedbackResponse = await fetch(`${url.origin}/api/feedback/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const feedbackData = await feedbackResponse.json();

      // 提取实际数据
      const feedback = feedbackData.success && feedbackData.data ? feedbackData.data.data || [] : [];
      const pagination = feedbackData.success && feedbackData.data ? feedbackData.data.pagination : null;

      // 渲染页面
      const html = renderFeedbackPage({
        user: request.user,
        feedback,
        pagination,
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 附件列表页面
  if (path === '/admin/attachments' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = 20;

      // 获取附件列表
      const attachmentsResponse = await fetch(`${url.origin}/api/upload/list?page=${page}&limit=${limit}`, {
        headers: {
          'Cookie': cookieHeader || '',
        }
      });
      
      const attachmentsData = await attachmentsResponse.json();

      // 提取实际数据
      const attachments = attachmentsData.success && attachmentsData.data ? attachmentsData.data.data || [] : [];
      const pagination = attachmentsData.success && attachmentsData.data ? attachmentsData.data.pagination : null;

      // 渲染页面
      const html = renderAttachmentsPage({
        user: request.user,
        attachments,
        pagination
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

  // 从浏览器请求中获取 Cookie
  const cookieHeader = request.headers.get('Cookie');

  // 设置页面
  if (path === '/admin/settings' && method === 'GET') {
    // 只有管理员可以访问设置管理
    if (request.user && request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }

    try {
      // 从数据库获取设置
      const settingsQuery = `SELECT * FROM settings ORDER BY id`;
      const settingsResult = await executeQuery(env, settingsQuery);
      const settingsData = settingsResult.success && settingsResult.results ? settingsResult.results : [];

      // 渲染页面
      const html = renderSettingsPage({
        user: request.user,
        settings: settingsData
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

  // API: 保存设置
  if (path === '/api/settings' && method === 'POST') {
    // 只有管理员可以保存设置
    if (request.user && request.user.role !== 'admin') {
      return errorResponse('权限不足', 403);
    }

    try {
      const { settings } = await request.json();

      if (!settings || !Array.isArray(settings)) {
        return errorResponse('设置数据格式错误', 400);
      }

      // 保存每个设置项
      for (const setting of settings) {
        const { key, value } = setting;

        if (!key) continue;

        // 检查设置是否已存在
        const checkQuery = `SELECT id FROM settings WHERE key = ?`;
        const checkResult = await executeOne(env, checkQuery, [key]);

        if (checkResult.success && checkResult.result) {
          // 更新现有设置
          const updateQuery = `UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?`;
          await executeOne(env, updateQuery, [value, key]);
        } else {
          // 插入新设置
          const insertQuery = `INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`;
          await executeOne(env, insertQuery, [key, value]);
        }
      }

      return successResponse(null, '设置保存成功');
    } catch (err) {
      console.error('Save settings error:', err);
      return errorResponse('保存设置失败: ' + err.message, 500);
    }
  }

  // API: 获取设置列表
  if (path === '/api/settings' && method === 'GET') {
    try {
      const settingsQuery = `SELECT * FROM settings ORDER BY id`;
      const settingsResult = await executeQuery(env, settingsQuery);
      const settingsData = settingsResult.success && settingsResult.results ? settingsResult.results : [];

      return successResponse({
        data: settingsData,
        pagination: null
      }, '获取设置成功');
    } catch (err) {
      console.error('Get settings error:', err);
      return errorResponse('获取设置失败', 500);
    }
  }

  return errorResponse('未找到对应的后台页面', 404);
}

// 获取仪表板统计数据
async function getDashboardStats(env) {
  try {
    const stats = {
      posts: { total: 0, published: 0, draft: 0, today: 0 },
      comments: { total: 0, approved: 0, pending: 0, today: 0 },
      users: { total: 0, admin: 0, today: 0 },
      feedback: { total: 0, unread: 0, today: 0 },
      recentPosts: [],
      recentComments: []
    };

    // 文章统计
    const postsQuery = `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 1 THEN 1 END) as published,
      COUNT(CASE WHEN status = 0 THEN 1 END) as draft,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM posts`;
    const postsResult = await executeOne(env, postsQuery);
    if (postsResult.success && postsResult.result) {
      stats.posts = postsResult.result;
    }

    // 评论统计
    const commentsQuery = `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 1 THEN 1 END) as approved,
      COUNT(CASE WHEN status = 0 THEN 1 END) as pending,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM comments`;
    const commentsResult = await executeOne(env, commentsQuery);
    if (commentsResult.success && commentsResult.result) {
      stats.comments = commentsResult.result;
    }

    // 用户统计
    const usersQuery = `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM users`;
    const usersResult = await executeOne(env, usersQuery);
    if (usersResult.success && usersResult.result) {
      stats.users = usersResult.result;
    }

    // 反馈统计
    const feedbackQuery = `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 0 THEN 1 END) as unread,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today
    FROM feedback`;
    const feedbackResult = await executeOne(env, feedbackQuery);
    if (feedbackResult.success && feedbackResult.result) {
      stats.feedback = feedbackResult.result;
    }

    // 最近文章
    const recentPostsQuery = `SELECT id, title, slug, created_at FROM posts ORDER BY created_at DESC LIMIT 5`;
    const recentPostsResult = await executeQuery(env, recentPostsQuery);
    if (recentPostsResult.success) {
      stats.recentPosts = recentPostsResult.results || [];
    }

    // 最近评论
    const recentCommentsQuery = `SELECT c.id, c.content, c.created_at, p.title, p.slug
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC LIMIT 5`;
    const recentCommentsResult = await executeQuery(env, recentCommentsQuery);
    if (recentCommentsResult.success) {
      stats.recentComments = recentCommentsResult.results || [];
    }

    return stats;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return {
      posts: { total: 0, published: 0, draft: 0, today: 0 },
      comments: { total: 0, approved: 0, pending: 0, today: 0 },
      users: { total: 0, admin: 0, today: 0 },
      feedback: { total: 0, unread: 0, today: 0 },
      recentPosts: [],
      recentComments: []
    };
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
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }

    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const messageDiv = document.getElementById('message');
      
      if (!username || !password) {
        messageDiv.textContent = '用户名和密码不能为空';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
      }
      
      try {
        // 生成盐值和时间戳
        const salt = generateSalt();
        const timestamp = Date.now().toString();
        
        // 第一步加密：用户名+密码+盐值+时间戳
        const firstHash = await sha256(username + password + salt + timestamp);
        
        // 第二步加密：拼接盐值和时间戳后再次加密
        const encryptedData = await sha256(firstHash + salt + timestamp);
        
        // 创建FormData格式的数据
        const formData = new FormData();
        formData.append('username', username);
        formData.append('encryptedData', encryptedData);
        formData.append('timestamp', timestamp);
        formData.append('salt', salt);
        
        const response = await fetch('/api/user/login', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          messageDiv.textContent = '登录成功，正在跳转...';
          messageDiv.className = 'message success';
          messageDiv.style.display = 'block';
          
          // 保存sessionID到localStorage
          if (result.data.sessionID) {
            localStorage.setItem('sessionID', result.data.sessionID);
            // 设置过期时间（7天）
            const expirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
            localStorage.setItem('sessionExpiration', expirationTime.toString());
          }
          
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
          <span id="user-welcome-text">加载中...</span>
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
    // 检查登录状态并更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      // 如果有token,获取当前用户信息
      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            // 更新页面上的用户信息显示
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            // token无效,清除并跳转登录
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        // 没有token,重定向到登录页
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    // 在每个请求中添加认证头
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        if (args[1]) {
          args[1].headers = args[1].headers || {};
          args[1].headers.Authorization = 'Bearer ' + authToken;
        } else {
          args[1] = {
            headers: {
              Authorization: 'Bearer ' + authToken
            }
          };
        }
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
    .content-wrapper {
      max-width: 1200px;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts" class="active">文章管理</a></li>
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
        <h1>文章管理</h1>
        <div>
          <span id="user-welcome-text">加载中...</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="content-wrapper">
        <div class="header">
          <h2>文章列表</h2>
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
        ${(posts || []).map(post => `
          <tr>
            <td>${post.id}</td>
            <td><a href="/post/${post.slug}" target="_blank">${post.title}</a></td>
            <td>${post.author_name || '未知'}</td>
            <td>${(post.categories || []).map(cat => cat.name).join(', ') || '-'}</td>
            <td class="${post.status === 1 ? 'status-published' : 'status-draft'}">${post.status === 1 ? '已发布' : '草稿'}</td>
            <td>${post.view_count || 0}</td>
            <td>${post.created_at ? new Date(post.created_at).toLocaleDateString() : '-'}</td>
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
    </main>
  </div>
  
  <script>
    // 检查登录状态并更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      // 如果有token,获取当前用户信息
      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            // 更新页面上的用户信息显示
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            // token无效,清除并跳转登录
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        // 没有token,重定向到登录页
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
    }
    
    // 在每个请求中添加认证头
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
    
    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
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
    .upload-section {
      margin-bottom: 20px;
      padding: 20px;
      border: 2px dashed #ddd;
      border-radius: 5px;
      text-align: center;
    }
    .upload-section.dragover {
      border-color: #007cba;
      background-color: #f0f7ff;
    }
    .upload-section input[type="file"] {
      display: none;
    }
    .upload-button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007cba;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    .upload-button:hover {
      background-color: #005a87;
    }
    .uploaded-files {
      margin-top: 15px;
      text-align: left;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    .file-item a {
      flex: 1;
      color: #007cba;
      text-decoration: none;
      margin-right: 10px;
    }
    .file-item .remove-file {
      color: #d32f2f;
      cursor: pointer;
      text-decoration: none;
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
        <label>附件上传</label>
        <div class="upload-section" id="uploadSection">
          <p>拖拽文件到这里或点击按钮选择文件</p>
          <button type="button" class="upload-button" onclick="document.getElementById('fileInput').click()">选择文件</button>
          <input type="file" id="fileInput" multiple>
          <div class="uploaded-files" id="uploadedFiles"></div>
        </div>
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
    // 新建文章还是编辑文章的标记
    const isNew = ${isNew ? 'true' : 'false'};
    
    // 获取认证 token
    const authToken = localStorage.getItem('auth_token');
    
    // 在每个请求中添加认证头
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options = {}] = args;
      
      if (!options.headers) {
        options.headers = {};
      }
      
      if (!options.headers.Authorization && authToken) {
        options.headers.Authorization = 'Bearer ' + authToken;
      }
      
      return originalFetch.apply(this, args);
    };
    
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
    
    // 文件上传功能
    const uploadSection = document.getElementById('uploadSection');
    const fileInput = document.getElementById('fileInput');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const uploadedFileList = [];
    
    uploadSection.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('dragover');
    });
    
    uploadSection.addEventListener('dragleave', function() {
      this.classList.remove('dragover');
    });
    
    uploadSection.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('dragover');
      const files = e.dataTransfer.files;
      handleFiles(files);
    });
    
    fileInput.addEventListener('change', function() {
      handleFiles(this.files);
    });
    
    function handleFiles(files) {
      if (files.length === 0) return;
      
      for (let i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
    }
    
    function uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          uploadedFileList.push(data.data);
          renderUploadedFiles();
        } else {
          alert(data.message || '上传失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('上传失败，请稍后重试');
      });
    }
    
    function renderUploadedFiles() {
      uploadedFiles.innerHTML = uploadedFileList.map((file, index) => 
        '<div class="file-item">' +
          '<a href="' + file.url + '" target="_blank">' + file.original_name + '</a>' +
          '<a href="javascript:void(0)" class="remove-file" onclick="removeFile(' + index + ')">删除</a>' +
        '</div>'
      ).join('');
    }
    
    function removeFile(index) {
      uploadedFileList.splice(index, 1);
      renderUploadedFiles();
    }
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
    .content-wrapper {
      max-width: 1000px;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories" class="active">分类管理</a></li>
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
        <h1>分类管理</h1>
        <div>
          <span id="user-welcome-text">加载中...</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="content-wrapper">
        <div class="header">
          <h2>分类列表</h2>
          <button class="btn btn-primary" onclick="openAddModal()">新建分类</button>
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
    </main>
  </div>
  
  <!-- 新增分类弹窗 -->
  <div id="addModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000;">
    <div style="position:relative; width:400px; margin:100px auto; background:#fff; padding:20px; border-radius:5px;">
      <h3>新增分类</h3>
      <div class="form-group">
        <label>分类名称</label>
        <input type="text" id="newCategoryName" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
      </div>
      <div class="form-group">
        <label>URL别名</label>
        <input type="text" id="newCategorySlug" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
      </div>
      <div>
        <button class="btn btn-primary" onclick="addCategory()">确定</button>
        <button class="btn btn-secondary" onclick="closeAddModal()" style="background:#6c757d; color:#fff; margin-left:10px;">取消</button>
      </div>
    </div>
  </div>
  
  <script>
    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    function openAddModal() {
      document.getElementById('addModal').style.display = 'block';
    }

    function closeAddModal() {
      document.getElementById('addModal').style.display = 'none';
    }
    
    function addCategory() {
      const name = document.getElementById('newCategoryName').value;
      const slug = document.getElementById('newCategorySlug').value || name;
      
      if (!name) {
        alert('请输入分类名称');
        return;
      }
      
      fetch('/api/category/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('分类创建成功');
          window.location.reload();
        } else {
          alert(data.message || '创建失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('创建失败，请稍后重试');
      });
    }
    
    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
    }
  </script>
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
    .content-wrapper {
      max-width: 1000px;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags" class="active">标签管理</a></li>
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
        <h1>标签管理</h1>
        <div>
          <span id="user-welcome-text">加载中...</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="content-wrapper">
        <div class="header">
          <h2>标签列表</h2>
          <button class="btn btn-primary" onclick="openAddModal()">新建标签</button>
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
    </main>
  </div>
  
  <!-- 新增标签弹窗 -->
  <div id="addModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000;">
    <div style="position:relative; width:400px; margin:100px auto; background:#fff; padding:20px; border-radius:5px;">
      <h3>新增标签</h3>
      <div class="form-group">
        <label>标签名称</label>
        <input type="text" id="newTagName" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
      </div>
      <div class="form-group">
        <label>URL别名</label>
        <input type="text" id="newTagSlug" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
      </div>
      <div>
        <button class="btn btn-primary" onclick="addTag()">确定</button>
        <button class="btn btn-secondary" onclick="closeAddModal()" style="background:#6c757d; color:#fff; margin-left:10px;">取消</button>
      </div>
    </div>
  </div>
  
  <script>
    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    function openAddModal() {
      document.getElementById('addModal').style.display = 'block';
    }

    function closeAddModal() {
      document.getElementById('addModal').style.display = 'none';
    }
    
    function addTag() {
      const name = document.getElementById('newTagName').value;
      const slug = document.getElementById('newTagSlug').value || name;
      
      if (!name) {
        alert('请输入标签名称');
        return;
      }
      
      fetch('/api/tag/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('标签创建成功');
          window.location.reload();
        } else {
          alert(data.message || '创建失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('创建失败，请稍后重试');
      });
    }
    
    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
    }
  </script>
</body>
</html>`;
}

function renderCommentsPage(data) {
  // 评论管理页面实现
  const { user, comments, pagination, currentStatus } = data;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 评论管理</title>
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
      flex-shrink: 0;
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
    .content-wrapper {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments" class="active">评论管理</a></li>
          <li><a href="/admin/users">用户管理</a></li>
          <li><a href="/admin/feedback">反馈管理</a></li>
          <li><a href="/admin/attachments">附件管理</a></li>
          <li><a href="/admin/settings">系统设置</a></li>
        </ul>
      </nav>
    </aside>

    <main class="main-content">
      <div class="header">
        <h1>评论管理</h1>
        <div>
          <span>欢迎, ${user ? (user.display_name || user.username) : '访客'}</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="filters">
          <select id="statusFilter" onchange="filterByStatus()">
            <option value="">所有状态</option>
            <option value="0" ${currentStatus === 0 ? 'selected' : ''}>待审核</option>
            <option value="1" ${currentStatus === 1 ? 'selected' : ''}>已批准</option>
            <option value="2" ${currentStatus === 2 ? 'selected' : ''}>已拒绝</option>
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
            ${comments.map(comment => `
              <tr>
                <td>${comment.id}</td>
                <td>${comment.author_display_name || comment.author_username}</td>
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
    </main>
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

    function logout() {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }

    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });
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
    .content-wrapper {
      max-width: 1000px;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
    .modal {
      display:none;
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:rgba(0,0,0,0.5);
      z-index:1000;
    }
    .modal-content {
      position:relative;
      width:400px;
      margin:100px auto;
      background:#fff;
      padding:20px;
      border-radius:5px;
    }
    .form-group {
      margin-bottom:15px;
    }
    .form-group label {
      display:block;
      margin-bottom:5px;
    }
    .form-group input, .form-group select {
      width:100%;
      padding:8px;
      border:1px solid #ddd;
      border-radius:4px;
      box-sizing:border-box;
    }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <h2>管理后台</h2>
      <nav>
        <ul>
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments">评论管理</a></li>
          <li><a href="/admin/users" class="active">用户管理</a></li>
          <li><a href="/admin/feedback">反馈管理</a></li>
          <li><a href="/admin/attachments">附件管理</a></li>
          <li><a href="/admin/settings">系统设置</a></li>
        </ul>
      </nav>
    </aside>
    
    <main class="main-content">
      <div class="header">
        <h1>用户管理</h1>
        <div>
          <span>欢迎, ${data.user ? (data.user.display_name || data.user.username) : '访客'}</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="content-wrapper">
        <div class="header">
          <h2>用户列表</h2>
          <button class="btn btn-primary" onclick="openAddModal()">新建用户</button>
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
    </main>
  </div>
  
  <!-- 新增用户弹窗 -->
  <div id="addModal" class="modal">
    <div class="modal-content">
      <h3>新增用户</h3>
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="newUsername">
      </div>
      <div class="form-group">
        <label>显示名</label>
        <input type="text" id="newDisplayName">
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input type="email" id="newEmail">
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="newPassword">
      </div>
      <div class="form-group">
        <label>角色</label>
        <select id="newRole">
          <option value="contributor">投稿者</option>
          <option value="admin">管理员</option>
        </select>
      </div>
      <div>
        <button class="btn btn-primary" onclick="addUser()">确定</button>
        <button class="btn btn-secondary" onclick="closeAddModal()" style="background:#6c757d; color:#fff; margin-left:10px;">取消</button>
      </div>
    </div>
  </div>
  
  <script>
    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    function openAddModal() {
      document.getElementById('addModal').style.display = 'block';
    }

    function closeAddModal() {
      document.getElementById('addModal').style.display = 'none';
    }
    
    function addUser() {
      const username = document.getElementById('newUsername').value;
      const displayName = document.getElementById('newDisplayName').value;
      const email = document.getElementById('newEmail').value;
      const password = document.getElementById('newPassword').value;
      const role = document.getElementById('newRole').value;
      
      if (!username || !email || !password) {
        alert('请填写所有必填字段');
        return;
      }
      
      fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, display_name: displayName, email, password, role })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('用户创建成功');
          window.location.reload();
        } else {
          alert(data.message || '创建失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('创建失败，请稍后重试');
      });
    }
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
    
    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
    }
  </script>
</body>
</html>`;
}

function renderFeedbackPage(data) {
  // 反馈管理页面实现
  const { user, feedback, pagination, currentStatus } = data;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 反馈管理</title>
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
      flex-shrink: 0;
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
    .content-wrapper {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments">评论管理</a></li>
          <li><a href="/admin/users">用户管理</a></li>
          <li><a href="/admin/feedback" class="active">反馈管理</a></li>
          <li><a href="/admin/attachments">附件管理</a></li>
          <li><a href="/admin/settings">系统设置</a></li>
        </ul>
      </nav>
    </aside>

    <main class="main-content">
      <div class="header">
        <h1>反馈管理</h1>
        <div>
          <span>欢迎, ${user ? (user.display_name || user.username) : '访客'}</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="filters">
          <select id="statusFilter" onchange="filterFeedbacks()">
            <option value="">所有状态</option>
            <option value="0" ${currentStatus === 0 ? 'selected' : ''}>未读</option>
            <option value="1" ${currentStatus === 1 ? 'selected' : ''}>已读</option>
            <option value="2" ${currentStatus === 2 ? 'selected' : ''}>已回复</option>
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
            ${feedback.map(item => `
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
    </main>
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

    function logout() {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }

    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });
  </script>
</body>
</html>`;
}

function renderAttachmentsPage(data) {
  // 附件管理页面实现
  const { user, attachments } = data;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - 附件管理</title>
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
      flex-shrink: 0;
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
    .content-wrapper {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .upload-area {
      border: 2px dashed #ddd;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 5px;
      cursor: pointer;
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
      font-size: 20px;
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
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments">评论管理</a></li>
          <li><a href="/admin/users">用户管理</a></li>
          <li><a href="/admin/feedback">反馈管理</a></li>
          <li><a href="/admin/attachments" class="active">附件管理</a></li>
          <li><a href="/admin/settings">系统设置</a></li>
        </ul>
      </nav>
    </aside>

    <main class="main-content">
      <div class="header">
        <h1>附件管理</h1>
        <div>
          <span>欢迎, ${user ? (user.display_name || user.username) : '访客'}</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>

      <div class="content-wrapper">
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
            ${attachments && attachments.length > 0 ? attachments.map(att => `
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
            `).join('') : '<tr><td colspan="6">暂无附件</td></tr>'}
          </tbody>
        </table>
      </div>
    </main>
  </div>

  <script>
    function getFileIcon(mimeType) {
      // 根据MIME类型返回对应的图标
      if (mimeType && mimeType.startsWith('image/')) {
        return '<span class="file-icon">🖼️</span>';
      } else if (mimeType && mimeType.startsWith('video/')) {
        return '<span class="file-icon">🎥</span>';
      } else if (mimeType && mimeType.startsWith('audio/')) {
        return '<span class="file-icon">🎵</span>';
      } else if (mimeType && mimeType.includes('pdf')) {
        return '<span class="file-icon">📄</span>';
      } else if (mimeType && (mimeType.includes('word') || mimeType.includes('document'))) {
        return '<span class="file-icon">📝</span>';
      } else if (mimeType && (mimeType.includes('excel') || mimeType.includes('sheet'))) {
        return '<span class="file-icon">📊</span>';
      } else if (mimeType && (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))) {
        return '<span class="file-icon">📦</span>';
      } else {
        return '<span class="file-icon">📎</span>';
      }
    }

    function formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes';

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

    function logout() {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }

    // 在页面加载时更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    // 文件上传功能
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (uploadArea && fileInput) {
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
        if (!files || files.length === 0) return;

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
    }

    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
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
    .content-wrapper {
      max-width: 800px;
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
    <aside class="sidebar">
      <h2>管理后台</h2>
      <nav>
        <ul>
          <li><a href="/admin">仪表板</a></li>
          <li><a href="/admin/posts">文章管理</a></li>
          <li><a href="/admin/categories">分类管理</a></li>
          <li><a href="/admin/tags">标签管理</a></li>
          <li><a href="/admin/comments">评论管理</a></li>
          <li><a href="/admin/users">用户管理</a></li>
          <li><a href="/admin/feedback">反馈管理</a></li>
          <li><a href="/admin/attachments">附件管理</a></li>
          <li><a href="/admin/settings" class="active">系统设置</a></li>
        </ul>
      </nav>
    </aside>
    
    <main class="main-content">
      <div class="header">
        <h1>系统设置</h1>
        <div>
          <span id="user-welcome-text">加载中...</span>
          <button class="logout" onclick="logout()">退出</button>
        </div>
      </div>
      
      <div class="content-wrapper">
    
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
    </main>
  </div>
  
  <script>
    // 检查登录状态并更新用户信息
    document.addEventListener('DOMContentLoaded', function() {
      const authToken = localStorage.getItem('auth_token');

      // 如果有token,获取当前用户信息
      if (authToken) {
        fetch('/api/user/me', {
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            // 更新页面上的用户信息显示
            const userDisplayEl = document.getElementById('user-welcome-text');
            if (userDisplayEl) {
              const displayName = data.data.display_name || data.data.username;
              userDisplayEl.textContent = '欢迎, ' + displayName;
            }
          } else {
            // token无效,清除并跳转登录
            localStorage.removeItem('auth_token');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
        })
        .catch(error => {
          console.error('获取用户信息失败:', error);
        });
      } else {
        // 没有token,重定向到登录页
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    });

    function logout() {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/admin/login';
      }
    }

    // 检查登录状态
    if (!localStorage.getItem('auth_token')) {
      window.location.href = '/admin/login';
    }
    
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const settings = [];

      for (const [key, value] of formData.entries()) {
        settings.push({
          key: key,
          value: value
        });
      }

      // 调用更新设置的API
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('设置保存成功');
        } else {
          alert(data.message || '设置保存失败');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('设置保存失败，请稍后重试');
      });
    });
  </script>
</body>
</html>`;

}



// 验证HMAC-SHA1生成的sessionID
async function validateSessionID(sessionID, env) {
  try {
    // sessionID格式：userId:timestamp:randomHex:signature
    const parts = sessionID.split(':');
    if (parts.length !== 4) {
      return { success: false, message: '无效的sessionID格式' };
    }
    
    const [userId, timestamp, randomHex, signature] = parts;
    
    // 验证时间戳（session过期时间）
    const sessionTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    
    // session有效期为7天
    if (currentTime - sessionTime > 7 * 24 * 60 * 60 * 1000) {
      return { success: false, message: 'Session已过期' };
    }
    
    // 重新计算签名进行验证
    const serverKey = env.SESSION_SECRET || 'default-session-secret-key-change-in-production';
    const data = `${userId}:${timestamp}:${randomHex}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serverKey);
    const messageData = encoder.encode(data);
    
    // 导入密钥
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['verify']
    );
    
    // 将十六进制签名转换为ArrayBuffer
    const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // 验证签名
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      messageData
    );
    
    if (!isValid) {
      return { success: false, message: '无效的session签名' };
    }
    
    // 获取用户信息
    const userModel = new User(env);
    const userResult = await userModel.getById('users', parseInt(userId, 10), 'id, username, email, display_name, avatar, role, bio, status, created_at, updated_at');
    
    if (!userResult.success || !userResult.result) {
      return { success: false, message: '用户不存在' };
    }
    
    const user = userResult.result;
    
    return {
      success: true,
      message: 'Session验证成功',
      user
    };
  } catch (err) {
    console.error('Session验证错误:', err);
    return { success: false, message: 'Session验证失败: ' + err.message };
  }
}