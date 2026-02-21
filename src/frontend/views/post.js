/**
 * Post Detail View
 */

import { renderLayout } from './layout.js';

export function renderPost({ blogTitle, slug, currentUser }) {
  return renderLayout({
    title: '文章详情',
    blogTitle,
    bodyAttrs: ' data-testid="post-detail"',
    pageData: { slug, currentUser, blogTitle },
    pageScript: 'post.js',
    content: `
<div class="page narrow">
  <div class="content">
    <article data-testid="post-article">
      <img class="post-hero" id="hero" style="display:none" alt="">
      <div class="post-header">
        <h1 data-testid="post-title">加载中...</h1>
        <div data-testid="post-meta" class="article-meta"></div>
      </div>
      <div data-testid="post-content" class="post-body"><p>内容加载中...</p></div>
      <div id="post-tags-area"></div>
    </article>
    <div id="comments-container"></div>
  </div>
</div>`
  });
}
