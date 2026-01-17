/**
 * Simple Template Generator
 * Directly generates HTML without complex template engine
 */

export function generateLayout(options = {}) {
  const {
    title = 'CFBlog',
    description = '基于Cloudflare的现代化博客平台',
    content = '',
    lang = 'zh-cn',
    theme = 'default',
  } = options;

  return `<!DOCTYPE html>
<html lang="${lang}" class="theme-${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#2563eb">
  <title>${title} | CFBlog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    header { background: #2563eb; color: white; padding: 1rem 0; }
    nav ul { display: flex; gap: 2rem; list-style: none; }
    nav a { color: white; text-decoration: none; }
    nav a:hover { text-decoration: underline; }
    main { padding: 2rem 0; }
    footer { background: #1e293b; color: white; padding: 2rem 0; margin-top: 4rem; }
    .post-card { border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 1rem; border-radius: 0.5rem; }
    .post-card h2 { margin-bottom: 0.5rem; }
    .post-card a { color: #2563eb; text-decoration: none; }
    .form-group { margin-bottom: 1rem; }
    .form-input { width: 100%; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.25rem; }
    .form-submit { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
    .form-submit:hover { background: #1d4ed8; }
    .error-page { text-align: center; padding: 4rem 0; }
    .section-title { margin-bottom: 1.5rem; }
  </style>
</head>
<body class="theme-${theme}">
  <header role="banner">
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
    ${content}
  </main>
  
  <footer role="contentinfo">
    <div class="container">
      <p>&copy; 2026 CFBlog. All rights reserved.</p>
    </div>
  </footer>
  
  <script>
    // Theme and Language Switching
    function setTheme(theme) {
      document.documentElement.className = 'theme-' + theme;
      localStorage.setItem('userTheme', theme);
    }
    
    function setLanguage(lang) {
      localStorage.setItem('userLanguage', lang);
      location.reload();
    }
    
    // Initialize
    (function() {
      const savedTheme = localStorage.getItem('userTheme') || 'default';
      setTheme(savedTheme);
    })();
  </script>
</body>
</html>`;
}

export function generateErrorPage(status = 404) {
  const content = `
    <div class="error-page">
      <h1>${status === 404 ? '页面不存在' : '服务器错误'}</h1>
      <p>${status === 404 ? '您访问的页面不存在。' : '服务器遇到了问题。'}</p>
      <a href="/">返回首页</a>
    </div>
  `;
  
  return generateLayout({
    title: status === 404 ? '页面不存在' : '服务器错误',
    content,
  });
}
