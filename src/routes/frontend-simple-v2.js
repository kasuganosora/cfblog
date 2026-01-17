/**
 * Simple Frontend Routes v2
 * Returns HTML directly without API dependencies
 */

import { Router } from 'itty-router';

const frontendRouter = Router();

/**
 * Generate HTML page
 */
function generateHtml(title, content, options = {}) {
  const { lang = 'zh-cn' } = options;
  
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
    .search-input-wrapper { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .search-input { flex: 1; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; }
    .search-button { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
    .sidebar-title { margin-bottom: 1rem; color: #2563eb; }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tag-cloud a { transition: background 0.3s; }
    .tag-cloud a:hover { background: #2563eb; color: white; }
  </style>
  <script>
    (function() {
      const savedLang = localStorage.getItem('userLanguage') || 'zh-cn';
      const savedTheme = localStorage.getItem('userTheme') || 'default';

      if (savedLang) {
        document.documentElement.lang = savedLang;
      }

      if (savedTheme === 'dark') {
        document.body.style.backgroundColor = '#1e293b';
        document.body.style.color = '#f9fafb';
        document.documentElement.style.setProperty('--bg-color', '#1e293b');
        document.documentElement.style.setProperty('--text-color', '#f9fafb');
      }

      // 语言切换器
      const langSwitcher = document.getElementById('language-switcher');
      if (langSwitcher) {
        langSwitcher.addEventListener('click', function() {
          const currentLang = localStorage.getItem('userLanguage') || 'zh-cn';
          const newLang = currentLang === 'zh-cn' ? 'en-us' : 'zh-cn';
          localStorage.setItem('userLanguage', newLang);
          document.documentElement.lang = newLang;
          langSwitcher.textContent = newLang === 'zh-cn' ? '🌐 中文' : '🌐 English';
        });
      }

      // 主题切换器
      const themeSwitcher = document.getElementById('theme-switcher');
      if (themeSwitcher) {
        themeSwitcher.addEventListener('click', function() {
          const currentTheme = localStorage.getItem('userTheme') || 'default';
          const newTheme = currentTheme === 'default' ? 'dark' : 'default';
          localStorage.setItem('userTheme', newTheme);

          if (newTheme === 'dark') {
            document.body.style.backgroundColor = '#1e293b';
            document.body.style.color = '#f9fafb';
            document.documentElement.style.setProperty('--bg-color', '#1e293b');
            document.documentElement.style.setProperty('--text-color', '#f9fafb');
          } else {
            document.body.style.backgroundColor = '';
            document.body.style.color = '#333';
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
            document.documentElement.style.setProperty('--text-color', '#333333');
          }
        });
      }
    })();
  </script>
</head>
<body>
  <header>
    <div class="container">
      <nav role="navigation" aria-label="主导航">
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/search">搜索</a></li>
          <li><a href="/feedback">留言板</a></li>
        </ul>
      </nav>
      <div style="margin-left: auto; display: flex; gap: 1rem;">
        <button id="language-switcher" data-testid="language-switcher" style="background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer;">
          🌐 中文
        </button>
        <button id="theme-switcher" data-testid="theme-switcher" style="background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; cursor: pointer;">
          🎨 主题
        </button>
      </div>
    </div>
  </header>

  <main class="container" id="main-content">
    ${content}
  </main>

  <footer role="contentinfo">
    <div class="container">
      <p>&copy; 2026 CFBlog. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
}

// GET / - Home page
export async function homePage(request) {
  const content = `
    <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
      <main style="flex: 1;">
        <h1 class="section-title" data-testid="page-title">📝 欢迎来到 CFBlog</h1>
        <div class="posts-section" data-testid="posts-section">
          <article class="post-card" data-testid="post-card">
            <h2><a href="/post/getting-started" data-testid="post-link">开始使用 Cloudflare Workers</a></h2>
            <p>Cloudflare Workers 是一个强大的边缘计算平台，可以让你在全球范围内运行 JavaScript 代码...</p>
            <p style="color: #666; font-size: 0.9rem;" data-testid="post-meta">👤 Admin | 📅 2026-01-17 | 👁 123</p>
          </article>
          <article class="post-card" data-testid="post-card">
            <h2><a href="/post/building-first-app" data-testid="post-link">构建你的第一个应用</a></h2>
            <p>在本教程中，我们将学习如何使用 CFBlog 构建一个功能完整的博客应用...</p>
            <p style="color: #666; font-size: 0.9rem;" data-testid="post-meta">👤 Admin | 📅 2026-01-16 | 👁 89</p>
          </article>
          <article class="post-card" data-testid="post-card">
            <h2><a href="/post/d1-database-guide" data-testid="post-link">D1 数据库入门指南</a></h2>
            <p>Cloudflare D1 是一个基于 SQLite 的无服务器数据库，提供了简单而强大的数据存储方案...</p>
            <p style="color: #666; font-size: 0.9rem;" data-testid="post-meta">👤 Admin | 📅 2026-01-15 | 👁 67</p>
          </article>
        </div>
      </main>
      <aside style="width: 300px; background: #f9fafb; padding: 1.5rem; border-radius: 0.5rem;" data-testid="sidebar">
        <h3 class="sidebar-title" data-testid="sidebar-title">分类</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 0.5rem;"><a href="/category/technology" style="color: #2563eb; text-decoration: none;">技术</a></li>
          <li style="margin-bottom: 0.5rem;"><a href="/category/tutorial" style="color: #2563eb; text-decoration: none;">教程</a></li>
          <li style="margin-bottom: 0.5rem;"><a href="/category/life" style="color: #2563eb; text-decoration: none;">生活</a></li>
        </ul>
        <h3 class="sidebar-title" style="margin-top: 2rem;" data-testid="sidebar-title">标签</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;" data-testid="tag-cloud">
          <a href="/tag/cloudflare" style="background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; text-decoration: none; font-size: 0.85rem;">Cloudflare</a>
          <a href="/tag/workers" style="background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; text-decoration: none; font-size: 0.85rem;">Workers</a>
          <a href="/tag/d1" style="background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; text-decoration: none; font-size: 0.85rem;">D1</a>
          <a href="/tag/tutorial" style="background: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 0.25rem; text-decoration: none; font-size: 0.85rem;">教程</a>
        </div>
      </aside>
    </div>
  `;

  return new Response(generateHtml('首页', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// GET /post/:slug - Post detail
export async function postPage(request) {
  const slug = request.params.slug;
  
  const content = `
    <h1 class="section-title" data-testid="post-title">开始使用 Cloudflare Workers</h1>
    <article style="max-width: 800px; margin: 0 auto; line-height: 1.8;">
      <p>Cloudflare Workers 是一个强大的边缘计算平台，可以让你在全球范围内运行 JavaScript 代码。</p>
      <p>主要特点：</p>
      <ul style="margin: 1rem 0; padding-left: 2rem;">
        <li>全球边缘部署</li>
        <li>超低延迟</li>
        <li>无服务器架构</li>
        <li>免费额度慷慨</li>
      </ul>
      <p>开始使用非常简单，只需几分钟即可部署你的第一个 Worker。</p>
    </article>

    <h2 class="section-title" style="margin-top: 3rem;">💬 评论</h2>
    <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;" data-testid="comments-list">
      <p>暂无评论，快来发表第一条评论吧！</p>
    </div>

    <h3 class="section-title" style="font-size: 1.2rem;">发表评论</h3>
      <form action="/api/comment" method="POST" style="max-width: 600px;" data-testid="comment-form">
      <div class="form-group">
        <label class="form-label" for="comment-author">姓名</label>
        <input type="text" id="comment-author" name="author" class="form-input" required data-testid="comment-author">
      </div>
      <div class="form-group">
        <label class="form-label" for="comment-email">邮箱</label>
        <input type="email" id="comment-email" name="email" class="form-input" required data-testid="comment-email">
      </div>
      <div class="form-group">
        <label class="form-label" for="comment-content">评论内容</label>
        <textarea id="comment-content" name="content" class="form-textarea" required data-testid="comment-content"></textarea>
      </div>
      <button type="submit" class="form-submit" data-testid="submit-comment">提交评论</button>
    </form>
  `;

  return new Response(generateHtml('文章详情', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// GET /login - Login page
export async function loginPage(request) {
  const content = `
    <div style="max-width: 400px; margin: 2rem auto;" data-testid="login-page">
      <h1 class="section-title">登录</h1>
      <form action="/api/user/login" method="POST" style="background: #f9fafb; padding: 2rem; border-radius: 0.5rem;" data-testid="login-form">
        <div id="error-message" data-testid="error-message" style="display: none; background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.25rem; margin-bottom: 1rem;"></div>
        <div class="form-group">
          <label class="form-label" for="login-username">用户名</label>
          <input type="text" id="login-username" name="username" class="form-input" required data-testid="login-username">
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">密码</label>
          <input type="password" id="login-password" name="password" class="form-input" required data-testid="login-password">
        </div>
        <button type="submit" class="form-submit" style="width: 100%;" data-testid="login-submit">登录</button>
      </form>
      <p style="text-align: center; margin-top: 1rem; color: #666;">
        还没有账号？<a href="/register" data-testid="register-link" style="color: #2563eb;">注册</a>
      </p>
      <p style="text-align: center; margin-top: 0.5rem; color: #666;">
        <a href="/forgot-password" data-testid="forgot-password-link" style="color: #2563eb;">忘记密码？</a>
      </p>
      <p style="text-align: center; margin-top: 1.5rem;">
        <a href="/" data-testid="home-link" style="color: #2563eb;">返回首页</a>
      </p>
    </div>
  `;

  return new Response(generateHtml('登录', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// GET /search - Search page
export async function searchPage(request) {
  const content = `
    <h1 class="section-title">🔍 搜索</h1>
    <form action="/search" method="GET" data-testid="search-form">
      <div class="search-input-wrapper">
        <input type="text" name="q" class="search-input" placeholder="搜索文章..." autofocus data-testid="search-input">
        <button type="submit" class="search-button" data-testid="search-button">搜索</button>
      </div>
    </form>
    <p style="text-align: center; color: #666; padding: 2rem 0;">输入关键词搜索文章</p>
  `;

  return new Response(generateHtml('搜索', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// GET /feedback - Feedback page
export async function feedbackPage(request) {
  const content = `
    <div style="max-width: 600px; margin: 0 auto;">
      <h1 class="section-title">💬 留言板</h1>
      <form action="/api/feedback" method="POST" style="background: #f9fafb; padding: 2rem; border-radius: 0.5rem;">
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input type="email" name="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">留言内容</label>
          <textarea name="message" class="form-textarea" rows="5" required></textarea>
        </div>
        <button type="submit" class="form-submit" style="width: 100%;">提交留言</button>
      </form>
    </div>
  `;

  return new Response(generateHtml('留言板', content), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// 404 handler
export async function notFoundPage(request) {
  const content = `
    <div class="error-page">
      <h1>404 - 页面不存在</h1>
      <p>您访问的页面不存在或已被删除。</p>
      <p style="margin-top: 2rem;">
        <a href="/" style="color: #2563eb; text-decoration: underline;">返回首页</a>
      </p>
    </div>
  `;

  return new Response(generateHtml('页面不存在', content), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// Export router
const frontendSimpleRoutes = {
  homePage,
  postPage,
  loginPage,
  searchPage,
  feedbackPage,
  notFoundPage
};

export default frontendSimpleRoutes;
