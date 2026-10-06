/**
 * Tag Detail View
 */

import { esc } from '../utils/helpers.js';
import { renderArticleCards } from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderTag({ blogTitle, slug, tag = null, posts = null, pagination = null, siteUrl, missing = false }) {
  const name = tag?.name || slug;
  const canonicalUrl = siteUrl ? `${siteUrl}/tag/${encodeURIComponent(slug)}` : undefined;
  const found = Boolean(tag) && posts != null;
  const count = pagination?.total ?? tag?.post_count ?? 0;
  const list = missing
    ? '<p class="empty">标签不存在</p>'
    : !found
      ? '<p style="color:var(--muted)">加载中...</p>'
      : `<p style="color:var(--muted);font-size:.9rem;margin-bottom:1.5rem">共 ${Number(count) || 0} 篇文章</p><div id="article-list">${renderArticleCards(posts, { emptyText: '该标签下暂无文章' })}</div>`;

  return renderLayout({
    title: `标签: ${name}`,
    blogTitle,
    activePage: 'tags',
    pageData: { slug },
    pageScript: 'tag.js',
    seo: {
      canonicalUrl,
      siteUrl,
      description: name,
      noindex: missing || (found && Number(count) < 2),
    },
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签: ${esc(name)}</h1>
    <div id="posts-list"${found ? ' data-ssr="1"' : ''}>${list}</div>
  </div>
</div>`
  });
}
