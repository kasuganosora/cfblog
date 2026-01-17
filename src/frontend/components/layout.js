/**
 * Layout Component
 * Provides the base HTML structure with semantic elements
 */

export class Layout {
  constructor(theme, lang) {
    this.theme = theme;
    this.lang = lang;
  }

  /**
   * Generate full HTML page
   * @param {Object} options - Page options
   * @param {string} options.title - Page title
   * @param {string} options.description - Meta description
   * @param {string} options.content - Page content
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

    return `
<!DOCTYPE html>
<html lang="${this.lang}" class="theme-${this.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#2563eb">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
  <title>${title} | CFBlog</title>
  ${extraHead}
</head>
<body class="theme-${this.theme}">
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
  
  <div id="app-data" data-theme="${this.theme}" data-lang="${this.lang}"></div>
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
          <li class="nav-item">
            <a href="/search" class="nav-link">搜索</a>
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
        <a href="/login" class="nav-link nav-link-button">登录</a>
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
          &copy; ${new Date().getFullYear()} CFBlog. 版权所有
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
