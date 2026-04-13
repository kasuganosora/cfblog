/**
 * Layout View - Main HTML page wrapper
 */

import { esc } from '../utils/helpers.js';

/**
 * Escape a string for safe insertion inside a <script> block.
 * Prevents </script> breakout by encoding < and > as Unicode escapes.
 */
function escapeJsString(json) {
  return JSON.stringify(json).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function renderLayout({ title, blogTitle = 'CFBlog', content, pageData, pageScript, activePage = '', bodyAttrs = '' }) {
  const y = new Date().getFullYear();
  const pageDataScript = pageData ? `<script>window.__PAGE_DATA__=${escapeJsString(pageData)};</script>\n` : '';
  const pageJsTag = pageScript ? `<script src="/static/js/${pageScript}"></script>\n` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - ${esc(blogTitle)}</title>
<link rel="stylesheet" href="/static/css/blog.css">
<link rel="stylesheet" href="/static/hljs-github-dark.css">
<script src="/static/marked.min.js"></script>
<script src="/static/highlight.min.js"></script>
<script>marked.setOptions({breaks:true,gfm:true});</script>
</head>
<body${bodyAttrs}>
<header class="navbar" data-testid="header">
<div class="wrap">
  <a class="brand" href="/">${esc(blogTitle)}</a>
  <nav data-testid="navigation">
    <div data-testid="desktop-navigation">
      <ul class="nav-links">
        <li><a href="/"${activePage === 'home' ? ' class="active"' : ''}>首页</a></li>
        <li><a href="/categories"${activePage === 'categories' ? ' class="active"' : ''}>分类</a></li>
        <li><a href="/tags"${activePage === 'tags' ? ' class="active"' : ''}>标签</a></li>
        <li><a href="/feedback"${activePage === 'feedback' ? ' class="active"' : ''}>留言</a></li>
      </ul>
    </div>
  </nav>
  <div class="nav-end">
    <form class="nav-search" action="/search" method="GET" data-testid="search-form">
      <input type="text" name="keyword" placeholder="搜索..." data-testid="search-input">
    </form>
  </div>
  <button class="mobile-btn" data-testid="mobile-menu-button" onclick="document.querySelector('.nav-links').classList.toggle('open')">&#9776;</button>
</div>
</header>

<main data-testid="main">
${content}
</main>

<footer class="footer" data-testid="footer">
<p>&copy; ${y} ${esc(blogTitle)} &middot; <a href="/rss">RSS</a> &middot; <a href="/login">登录</a></p>
</footer>

<script src="/static/js/base.js"></script>
${pageDataScript}${pageJsTag}</body>
</html>`;
}
