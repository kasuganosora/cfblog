/**
 * Simple Frontend Routes
 * Returns HTML directly without complex template engine
 */

/**
 * Generate HTML page
 */
function generateHtml(title, content, options = {}) {
  const { lang = 'zh-cn', theme = 'default' } = options;
  
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | CFBlog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    header { background: #2563eb; color: white; padding: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    nav ul { display: flex; gap: 2rem; list-style: none; }
    nav a { color: white; text-decoration: none; font-weight: 500; }
    nav a:hover { text-decoration: underline; }
    main { padding: 2rem 0; min-height: calc(100vh - 200px); }
    footer { background: #1e293b; color: white; padding: 2rem 0; text-align: center; }
    .post-card { border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 1rem; border-radius: 0.5rem; transition: box-shadow 0.3s; }
    .post-card:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .post-card h2 { margin-bottom: 0.5rem; color: #2563eb; }
    .post-card a { color: #2563eb; text-decoration: none; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-input { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; font-size: 1rem; }
    .form-textarea { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; font-size: 1rem; min-height: 100px; }
    .form-submit { background: #2563eb; color: white; padding: 0.5rem 2rem; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 1rem; }
    .form-submit:hover { background: #1d4ed8; }
    .error-page { text-align: center; padding: 4rem 0; }
    .section-title { margin-bottom: 1.5rem; color: #2563eb; }
    .sidebar { background: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin-top: 2rem; }
    .sidebar-section { margin-bottom: 1.5rem; }
    .sidebar-title { margin-bottom: 1rem; color: #2563eb; }
    .search-input-wrapper { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .search-input { flex: 1; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; }
    .search-button { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <nav role="navigation" aria-label="Main navigation">
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/categories">分类</a></li>
          <li><a href="/tags">标签</a></li>
          <li><a href="/search">搜索</a></li>
          <li><a href="/feedback">留言板</a></li>
        </ul>
      </nav>
    </div>
  </header>
  
  <main>
    <div class="container">
      ${content}
    </div>
  </main>
  
  <footer>
    <div class="container">
      <p>&copy; 2026 CFBlog. All rights reserved.</p>
    </div>
  </footer>
  
  <script>
    // Initialize theme and language
    (function() {
      const theme = localStorage.getItem('userTheme') || 'default';
      const lang = localStorage.getItem('userLanguage') || 'zh-cn';
      document.documentElement.lang = lang;
    })();
  </script>
</body>
</html>`;
}

// GET / - Home page
export async function homePage(request) {
  try {
    // Fetch posts - use absolute URL
    const url = new URL(request.url);
    const apiUrl = `${url.origin}/api/post/list?status=1&per_page=10`;
    const postsResponse = await fetch(apiUrl);

    // 检查响应状态
    if (!postsResponse.ok) {
      console.error('API request failed:', postsResponse.status, postsResponse.statusText);
      const errorText = await postsResponse.text();
      console.error('Error response:', errorText);
      const content = '<div class="error-page"><h1>加载失败</h1><p>无法加载文章列表，请稍后重试。</p></div>';
      return new Response(generateHtml('首页', content), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const postsData = await postsResponse.json();
    const posts = postsData.data || [];

    const postsHtml = posts.length > 0 
      ? posts.map(post => `
          <article class="post-card">
            <h2><a href="/post/${post.slug}">${post.title}</a></h2>
            <p>${post.excerpt || post.content?.substring(0, 200) || ''}...</p>
            <p style="color: #666; font-size: 0.9rem;">👤 ${post.author_name || 'Unknown'} | 📅 ${new Date(post.published_at).toLocaleDateString('zh-CN')} | 👁 ${post.view_count || 0}</p>
          </article>
        `).join('')
      : '<p>暂无文章</p>';

    const content = `
      <h1 class="section-title">📝 最新文章</h1>
      <div class="posts-section">${postsHtml}</div>
    `;

    return new Response(generateHtml('首页', content), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Home page error:', error);
    const content = '<div class="error-page"><h1>服务器错误</h1><p>加载失败，请稍后再试。</p></div>';
    return new Response(generateHtml('错误', content), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// GET /post/:slug - Post detail
export async function postPage(request) {
  try {
    const slug = request.params.slug;
    const url = new URL(request.url);
    const postResponse = await fetch(`${url.origin}/api/post/slug/${slug}`);
    const postData = await postResponse.json();
    
    if (!postData.success || !postData.data) {
      const content = '<div class="error-page"><h1>页面不存在</h1><p>文章不存在或已被删除。</p><a href="/">返回首页</a></div>';
      return new Response(generateHtml('页面不存在', content), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }


    const post = postData.data;
    const commentsResponse = await fetch(`${url.origin}/api/comment/post/${post.id}`);
    const commentsData = await commentsResponse.json();
    const comments = commentsData.data || [];

    const commentsHtml = comments.length > 0
      ? comments.map(comment => `
          <div class="comment" style="padding: 1rem; margin-bottom: 1rem; background: #f9fafb; border-radius: 0.5rem;">
            <p style="font-weight: 500;">${comment.author_name || 'Anonymous'}</p>
            <p style="color: #666; font-size: 0.85rem;">${new Date(comment.created_at).toLocaleDateString('zh-CN')}</p>
            <p>${comment.content || ''}</p>
          </div>
        `).join('')
      : '<p>暂无评论</p>';

    const content = `
      <article style="padding: 2rem; background: white; border-radius: 0.5rem; margin-bottom: 2rem;">
        <h1 style="margin-bottom: 1rem;">${post.title}</h1>
        <p style="color: #666; margin-bottom: 1rem;">
          👤 ${post.author_name || 'Unknown'} | 📅 ${new Date(post.published_at).toLocaleDateString('zh-CN')} | 👁 ${post.view_count || 0}
        </p>
        <div style="margin-bottom: 1.5rem;">${post.excerpt || ''}</div>
      </article>
      
      <section style="padding: 2rem;">
        <h2 style="margin-bottom: 1rem;">💬 评论 (${comments.length})</h2>
        ${post.comment_status ? `
          <form action="/api/comment/create" method="POST" style="margin-bottom: 2rem;">
            <input type="hidden" name="post_id" value="${post.id}">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input type="text" name="author_name" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">邮箱 (可选)</label>
              <input type="email" name="author_email" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">评论内容</label>
              <textarea name="content" class="form-textarea" required></textarea>
            </div>
            <button type="submit" class="form-submit">提交评论</button>
          </form>
        ` : '<p>此文章已关闭评论功能。</p>'}
        
        <div class="comments-list">${commentsHtml}</div>
      </section>
    `;

    return new Response(generateHtml(post.title, content), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Post page error:', error);
    const content = '<div class="error-page"><h1>服务器错误</h1><p>加载失败，请稍后再试。</p></div>';
    return new Response(generateHtml('错误', content), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// GET /login - Login page
export function loginPage() {
  const content = `
    <div style="max-width: 400px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="margin-bottom: 1rem; text-align: center;">🔐 登录</h1>
      <p style="text-align: center; margin-bottom: 1.5rem; color: #666;">登录到CFBlog后台管理</p>
      <form action="/api/user/login" method="POST">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input type="text" name="username" class="form-input" required autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input type="password" name="password" class="form-input" required>
        </div>
        <button type="submit" class="form-submit" style="width: 100%;">登录</button>
      </form>
      <p style="text-align: center; margin-top: 1rem;"><a href="/">返回首页</a></p>
    </div>
  `;

  return new Response(generateHtml('登录', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// GET /search - Search page
export async function searchPage(request) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('q') || '';

    if (!keyword) {
      const content = `
        <h1 class="section-title">🔍 搜索</h1>
        <form action="/search" method="GET">
          <div class="search-input-wrapper">
            <input type="text" name="q" class="search-input" placeholder="搜索文章..." autofocus>
            <button type="submit" class="search-button">搜索</button>
          </div>
        </form>
      `;

      return new Response(generateHtml('搜索', content), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    const resultsResponse = await fetch(`${url.origin}/api/search?q=${encodeURIComponent(keyword)}&per_page=10`);
    const resultsData = await resultsResponse.json();
    const results = resultsData.data || [];

    const resultsHtml = results.length > 0
      ? results.map(post => `
          <article class="post-card">
            <h2><a href="/post/${post.slug}">${post.title}</a></h2>
            <p>${post.excerpt || post.content?.substring(0, 200) || ''}...</p>
          </article>
        `).join('')
      : '<p>未找到相关内容</p>';

    const content = `
      <h1 class="section-title">🔍 搜索结果: "${keyword}"</h1>
      <p style="margin-bottom: 1rem;">找到 ${results.length} 条结果</p>
      <div class="posts-section">${resultsHtml}</div>
    `;

    return new Response(generateHtml(`搜索: ${keyword}`, content), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Search page error:', error);
    const content = '<div class="error-page"><h1>服务器错误</h1></div>';
    return new Response(generateHtml('错误', content), { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

// GET /feedback - Feedback page
export function feedbackPage() {
  const content = `
    <h1 class="section-title">📝 留言板</h1>
    <div style="max-width: 600px;">
      <form action="/api/feedback/create" method="POST" style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">邮箱 (可选)</label>
          <input type="email" name="email" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">留言内容</label>
          <textarea name="content" class="form-textarea" rows="5" required></textarea>
        </div>
        <button type="submit" class="form-submit">提交留言</button>
      </form>
    </div>
  `;

  return new Response(generateHtml('留言板', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 404 page
export function notFoundPage() {
  const content = '<div class="error-page"><h1>页面不存在</h1><p>您访问的页面不存在。</p><a href="/">返回首页</a></div>';
  return new Response(generateHtml('页面不存在', content), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Export all route handlers
export const frontendSimpleRoutes = {
  'GET /': homePage,
  'GET /post/:slug': postPage,
  'GET /login': loginPage,
  'GET /search': searchPage,
  'GET /feedback': feedbackPage,
  'ALL *': notFoundPage
};
