/**
 * Category Detail View
 */

import { esc } from '../utils/helpers.js';
import { renderLayout } from './layout.js';

export function renderCategory({ blogTitle, slug }) {
  return renderLayout({
    title: '分类: ' + slug,
    blogTitle,
    activePage: 'categories',
    pageData: { slug },
    pageScript: 'category.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类: ${esc(slug)}</h1>
    <div id="posts-list"><p style="color:var(--muted)">加载中...</p></div>
  </div>
</div>`
  });
}
