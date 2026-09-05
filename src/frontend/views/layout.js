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

export function renderLayout({ title, blogTitle = 'CFBlog', content, pageData, pageScript, activePage = '', bodyAttrs = '', seo = {} }) {
  const y = new Date().getFullYear();
  const pageDataScript = pageData ? `<script>window.__PAGE_DATA__=${escapeJsString(pageData)};</script>\n` : '';
  const pageJsTag = pageScript ? `<script src="/static/js/${pageScript}"></script>\n` : '';

  // SEO meta tags
  const { description, canonicalUrl, ogType, ogImage, publishedTime, modifiedTime, author, noindex, jsonLd, siteUrl } = seo;
  let metaTags = '';
  if (noindex) {
    metaTags += '<meta name="robots" content="noindex, nofollow">\n';
  }
  if (description) {
    metaTags += `<meta name="description" content="${esc(description)}">\n`;
    metaTags += `<meta property="og:description" content="${esc(description)}">\n`;
    metaTags += `<meta name="twitter:description" content="${esc(description)}">\n`;
  }
  metaTags += `<meta property="og:title" content="${esc(title)} - ${esc(blogTitle)}">\n`;
  metaTags += `<meta property="og:type" content="${ogType || 'website'}">\n`;
  metaTags += '<meta name="twitter:card" content="summary_large_image">\n';
  metaTags += `<meta name="twitter:title" content="${esc(title)} - ${esc(blogTitle)}">\n`;
  if (ogImage) {
    metaTags += `<meta property="og:image" content="${esc(ogImage)}">\n`;
    metaTags += `<meta name="twitter:image" content="${esc(ogImage)}">\n`;
  }
  if (publishedTime) {
    metaTags += `<meta property="article:published_time" content="${esc(publishedTime)}">\n`;
  }
  if (modifiedTime) {
    metaTags += `<meta property="article:modified_time" content="${esc(modifiedTime)}">\n`;
  }
  if (author) {
    metaTags += `<meta property="article:author" content="${esc(author)}">\n`;
  }
  let linkTags = '';
  if (canonicalUrl) {
    linkTags += `<link rel="canonical" href="${esc(canonicalUrl)}">\n`;
    metaTags += `<meta property="og:url" content="${esc(canonicalUrl)}">\n`;
  }
  // RSS auto-discovery
  const rssBase = siteUrl || canonicalUrl?.replace(/\/[^/]*$/, '') || '';
  if (rssBase) {
    linkTags += `<link rel="alternate" type="application/rss+xml" title="${esc(blogTitle)} RSS" href="${esc(rssBase)}/rss">\n`;
  }
  // JSON-LD structured data — escape like __PAGE_DATA__ so </script> cannot break out
  const jsonLdScript = jsonLd ? `<script type="application/ld+json">${escapeJsString(jsonLd)}</script>\n` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - ${esc(blogTitle)}</title>
${metaTags}${linkTags}${jsonLdScript}<link rel="stylesheet" href="/static/css/blog.css">
<link rel="stylesheet" href="/static/hljs-github-dark.css">
<script src="/static/marked.min.js"></script>
<script src="/static/purify.min.js"></script>
<script src="/static/highlight.min.js"></script>
<script>marked.setOptions({breaks:true,gfm:true});</script>
</head>
<body${bodyAttrs}>
<a class="skip-link" href="#main-content">跳到主要内容</a>
<header class="navbar" data-testid="header" role="banner">
<div class="wrap">
  <a class="brand" href="/">${esc(blogTitle)}</a>
  <nav id="main-navigation" data-testid="navigation" aria-label="主导航">
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
      <input type="text" name="keyword" placeholder="搜索..." aria-label="搜索博客" data-testid="search-input">
    </form>
  </div>
  <button class="mobile-btn" aria-label="打开菜单" aria-expanded="false" aria-controls="main-navigation" data-testid="mobile-menu-button" onclick="var nl=document.querySelector('.nav-links');nl.classList.toggle('open');this.setAttribute('aria-expanded',nl.classList.contains('open'))">&#9776;</button>
</div>
</header>

<main id="main-content" data-testid="main" role="main">
${content}
</main>

<footer class="footer" data-testid="footer" role="contentinfo">
<p>&copy; ${y} ${esc(blogTitle)} &middot; <a href="/rss">RSS</a> &middot; <a href="/login">登录</a></p>
</footer>

<script src="/static/js/base.js"></script>
${pageDataScript}${pageJsTag}</body>
</html>`;
}
