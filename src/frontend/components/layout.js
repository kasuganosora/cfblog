/**
 * Layout Component
 * Provides the base HTML structure with semantic elements
 */

  /**
   * Escape HTML special characters to prevent XSS
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') return String(text ?? '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  constructor(theme, lang) {
    this.theme = theme;
    this.lang = lang;
  }

  /**
   * Generate full HTML page
   * @param {Object} options - Page options
   * @param {string} options.title - Page title
   * @param {string} options.description - Meta description
   * @param {string} options.content - Page content (trusted HTML)
   * @param {string} options.canonical - Canonical URL
   */
  render(options = {}) {
    const {
      title = 'CFBlog',
      description = 'A modern blog platform',
      content = '',
      canonical = '',
      extraHead = '',
      extraBody = '',
    } = options;

    const e = Layout.escapeHtml;

    return `
<!DOCTYPE html>
<html lang="${e(this.lang)}" class="theme-${e(this.theme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#2563eb">
  ${canonical ? `<link rel="canonical" href="${e(canonical)}">` : ''}
  <title>${e(title)} | CFBlog</title>
  ${extraHead}
</head>
<body class="theme-${e(this.theme)}">
  ${extraBody}
  <header role="banner">
    <div class="container">
      <nav role="navigation" aria-label="Main navigation">
        ${this.renderNavigation()}
      </nav>
    </div>
  </header>

  <main role="main" id="main-content">
    <div class="container">
      ${content}
    </div>
  </main>

  <footer role="contentinfo">
    <div class="container">
      ${this.renderFooter()}
    </div>
  </footer>

  <div id="app-data" data-theme="${e(this.theme)}" data-lang="${e(this.lang)}"></div>
  <script type="module" src="/assets/js/app.js"></script>
</body>
</html>`;
  }

  /**
   * Render navigation menu
   */
  renderNavigation() {
    return `
      <div class="nav-brand">
        <a href="/" class="brand-link" aria-label="Home">
          <span class="brand-icon">📝</span>
          <span class="brand-text">CFBlog</span>
        </a>
      </div>
      
      <div class="nav-menu">
        <ul class="nav-list">
          <li class="nav-item">
            <a href="/" class="nav-link">首页</a>
          </li>
          <li class="nav-item">
            <a href="/categories" class="nav-link">分类</a>
          </li>
          <li class="nav-item">
            <a href="/tags" class="nav-link">标签</a>
          </li>
        </ul>
      </div>
      
      <div class="nav-actions">
        <button id="theme-toggle" class="nav-button nav-icon-button" aria-label="Toggle theme" title="切换主题">
          <span class="icon">🌓</span>
        </button>
        <button id="lang-toggle" class="nav-button nav-icon-button" aria-label="Toggle language" title="切换语言">
          <span class="icon">🌐</span>
        </button>
      </div>
    `;
  }

  /**
   * Render footer
   */
  renderFooter() {
    return `
      <div class="footer-section">
        <p class="footer-copyright">
          &copy; ${new Date().getFullYear()} CFBlog. 版权所有 | <a href="/login">登录</a>
        </p>
      </div>
      
      <div class="footer-section">
        <div class="footer-controls">
          <div class="footer-control">
            <label for="theme-select" class="footer-label">主题</label>
            <select id="theme-select" class="footer-select" aria-label="Select theme">
              <option value="default">默认主题</option>
              <option value="dark">深色主题</option>
            </select>
          </div>
          
          <div class="footer-control">
            <label for="lang-select" class="footer-label">语言</label>
            <select id="lang-select" class="footer-select" aria-label="Select language">
              <option value="zh-cn" ${this.lang === 'zh-cn' ? 'selected' : ''}>简体中文</option>
              <option value="en-us" ${this.lang === 'en-us' ? 'selected' : ''}>English</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="footer-section">
        <p class="footer-powered">
          技术支持: <a href="https://developers.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Workers</a>
        </p>
      </div>
    `;
  }
}
