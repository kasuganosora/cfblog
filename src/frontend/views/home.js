/**
 * Home Page View
 */

import { renderLayout } from './layout.js';

export function renderHome({ blogTitle }) {
  return renderLayout({
    title: '首页',
    blogTitle,
    activePage: 'home',
    pageScript: 'home.js',
    content: `
<div class="page with-sidebar">
  <div class="content">
    <div id="posts-list"><div class="empty">加载中...</div></div>
    <div class="pager" id="pagination" data-testid="pagination"></div>
  </div>
  <aside class="sidebar">
    <div class="widget" data-testid="categories-list">
      <h3>分类</h3>
      <ul class="widget-cats" id="categories"></ul>
    </div>
    <div class="widget" data-testid="tags-list">
      <h3>标签</h3>
      <div class="widget-tags" id="tags"></div>
    </div>
    <div id="custom-widgets"></div>
  </aside>
</div>`
  });
}
