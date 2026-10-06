/**
 * Category Detail View
 */

import { esc } from '../utils/helpers.js';
import { renderArticleCards } from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderCategory({ blogTitle, slug, category = null, posts = null, pagination = null, siteUrl, missing = false }) {
  const name = category?.name || slug;
  const canonicalUrl = siteUrl ? `${siteUrl}/category/${encodeURIComponent(slug)}` : undefined;
  const found = Boolean(category) && posts != null;
  const description = category?.description
    ? `<p>${esc(category.description)}</p>`
    : '';
  const count = pagination?.total ?? 0;
  const list = missing
    ? '<p class="empty">分类不存在</p>'
    : !found
      ? '<p style="color:var(--muted)">加载中...</p>'
      : `${description}<p style="color:var(--muted);font-size:.9rem;margin-bottom:1.5rem">共 ${Number(count) || 0} 篇文章</p><div id="article-list">${renderArticleCards(posts, { emptyText: '该分类下暂无文章' })}</div>`;

  return renderLayout({
    title: `分类: ${name}`,
    blogTitle,
    activePage: 'categories',
    pageData: { slug },
    pageScript: 'category.js',
    seo: {
      canonicalUrl,
      siteUrl,
      description: category?.description || name,
      noindex: missing,
    },
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类: ${esc(name)}</h1>
    <div id="posts-list"${found ? ' data-ssr="1"' : ''}>${list}</div>
  </div>
</div>`
  });
}
