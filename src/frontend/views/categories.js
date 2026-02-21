/**
 * Categories List View
 */

import { renderLayout } from './layout.js';

export function renderCategories({ blogTitle }) {
  return renderLayout({
    title: '分类',
    blogTitle,
    activePage: 'categories',
    pageScript: 'categories.js',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类列表</h1>
    <div class="cat-grid" id="categories-list"></div>
  </div>
</div>`
  });
}
