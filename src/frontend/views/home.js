/**
 * Home Page View
 */

import {
  renderArticleCards,
  renderPager,
  renderTermLinks,
  renderWidgets,
} from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderHome({
  blogTitle,
  siteUrl,
  description,
  posts = null,
  pagination = null,
  categories = null,
  tags = null,
  widgets = [],
  page = 1,
}) {
  const listHtml = posts == null
    ? '<div class="empty">加载中...</div>'
    : renderArticleCards(posts);
  const ssr = posts == null ? '' : ' data-ssr="1"';
  const canonicalUrl = siteUrl
    ? (page > 1 ? `${siteUrl}/?page=${page}` : `${siteUrl}/`)
    : undefined;

  return renderLayout({
    title: '首页',
    blogTitle,
    activePage: 'home',
    pageScript: 'home.js',
    seo: {
      canonicalUrl,
      siteUrl,
      description: description || blogTitle,
    },
    content: `
<div class="page with-sidebar">
  <div class="content">
    <div id="posts-list"${ssr}>${listHtml}</div>
    <div class="pager" id="pagination" data-testid="pagination">${renderPager(pagination)}</div>
  </div>
  <aside class="sidebar">
    <div class="widget" data-testid="categories-list">
      <h3>分类</h3>
      <ul class="widget-cats" id="categories">${categories == null ? '' : renderTermLinks(categories, { kind: 'category' })}</ul>
    </div>
    <div class="widget" data-testid="tags-list">
      <h3>标签</h3>
      <div class="widget-tags" id="tags">${tags == null ? '' : renderTermLinks(tags, { kind: 'tag' })}</div>
    </div>
    <div id="custom-widgets">${renderWidgets(widgets)}</div>
  </aside>
</div>`
  });
}
