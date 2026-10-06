/**
 * Categories List View
 */

import { renderCategoryCards } from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderCategories({ blogTitle, categories = null, siteUrl }) {
  const list = categories == null
    ? ''
    : renderCategoryCards(categories);
  const ssr = categories == null ? '' : ' data-ssr="1"';

  return renderLayout({
    title: '分类',
    blogTitle,
    activePage: 'categories',
    pageScript: 'categories.js',
    seo: {
      canonicalUrl: siteUrl ? `${siteUrl}/categories` : undefined,
      siteUrl,
      description: '分类',
    },
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类列表</h1>
    <div class="cat-grid" id="categories-list"${ssr}>${list}</div>
  </div>
</div>`
  });
}
