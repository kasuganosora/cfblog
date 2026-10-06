/**
 * Server-rendered article HTML.
 * The first response has to contain the text and links. Client scripts
 * only refresh the same markup after load.
 */

import { Marked } from 'marked';
import { esc } from './helpers.js';

const markdown = new Marked({ gfm: true, breaks: true });

markdown.use({
  renderer: {
    html(html) {
      return esc(html);
    },
    link(href, title, text) {
      const safe = safeUrl(href);
      const titleAttr = title ? ` title="${esc(title)}"` : '';
      return `<a href="${esc(safe)}"${titleAttr}>${text}</a>`;
    },
    image(href, title, text) {
      const safe = safeUrl(href);
      const titleAttr = title ? ` title="${esc(title)}"` : '';
      return `<img src="${esc(safe)}" alt="${esc(text || '')}"${titleAttr}>`;
    },
  },
});

function safeUrl(href) {
  const value = String(href || '').trim();
  if (!value || value.startsWith('//')) return '#';
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) return value;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return '#';
}

/**
 * Database datetimes are UTC stored as "YYYY-MM-DD HH:mm:ss".
 * @returns {string} ISO 8601, or '' when the value cannot be parsed
 */
export function toIsoDate(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasZone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

export function formatPostDate(value) {
  const iso = toIsoDate(value);
  if (!iso) return value ? String(value) : '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Shanghai',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function readTime(text) {
  if (!text) return '1 min';
  const plain = String(text).replace(/<[^>]+>/g, '').replace(/[#*_~>|\\[\]()-]/g, '');
  return `${Math.max(1, Math.ceil(plain.length / 500))} min`;
}

export function renderMarkdown(src) {
  if (!src) return '';
  const html = markdown.parse(String(src));
  return typeof html === 'string' ? html : '';
}

export function postPath(post) {
  const slug = post?.slug ? String(post.slug) : String(post?.id ?? '');
  return `/post/${encodeURIComponent(slug)}`;
}

export function excerptHtml(post) {
  let src = post?.excerpt;
  if (!src && post?.content) {
    const plain = String(post.content)
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/<[^>]+>/g, '');
    src = `${plain.substring(0, 200)}...`;
  }
  if (!src) return '';
  return renderMarkdown(src);
}

export function renderArticleCards(posts, { emptyText = '暂无文章' } = {}) {
  if (!posts?.length) return `<div class="empty">${esc(emptyText)}</div>`;
  return posts.map((post) => {
    const href = postPath(post);
    const date = formatPostDate(post.published_at || post.created_at);
    const author = post.author_name ? `<span>${esc(post.author_name)}</span>` : '';
    const excerpt = excerptHtml(post);
    const excerptBlock = excerpt ? `<div class="article-excerpt">${excerpt}</div>` : '';
    return `<article class="article" data-testid="post-card">
<h2 class="article-title"><a href="${esc(href)}">${esc(post.title)}</a></h2>
<div class="article-meta"><span>${esc(date)}</span>${author}<span>${esc(readTime(post.content || post.excerpt))}</span><span>阅读 ${Number(post.view_count) || 0}</span></div>
${excerptBlock}
<a class="read-more" href="${esc(href)}">阅读全文 &rarr;</a>
</article>`;
  }).join('\n');
}

export function renderPager(pagination) {
  if (!pagination || pagination.totalPages <= 1) return '';
  const page = Number(pagination.page) || 1;
  const total = Number(pagination.totalPages) || 1;
  const href = (n) => (n <= 1 ? '/' : `/?page=${n}`);
  let html = '';
  if (page > 1) {
    html += `<a href="${href(page - 1)}" data-page="${page - 1}" aria-label="上一页">&laquo;</a>`;
  }
  for (let i = 1; i <= total; i += 1) {
    if (i === page) html += `<span class="active" aria-current="page">${i}</span>`;
    else html += `<a href="${href(i)}" data-page="${i}" aria-label="第${i}页">${i}</a>`;
  }
  if (page < total) {
    html += `<a href="${href(page + 1)}" data-page="${page + 1}" aria-label="下一页">&raquo;</a>`;
  }
  return html;
}

export function withPosts(items) {
  return (items || []).filter((item) => item?.post_count == null || Number(item.post_count) > 0);
}

/**
 * Prefer an admin-written description. Otherwise name the categories that actually have posts.
 * @returns {{ text: string, custom: boolean }}
 */
export function homeBlurb({ description, blogTitle, categories }) {
  const text = String(description || '').trim();
  const title = String(blogTitle || '').trim();
  if (text && text !== title) return { text, custom: true };
  const names = withPosts(categories).map((cat) => cat.name).filter(Boolean);
  if (!names.length) return { text: '', custom: false };
  return { text: `${names.join('、')}相关的笔记`, custom: false };
}

export function shareImage(post, siteUrl) {
  const raw = post?.cover_image || firstImageRef(post?.content) || firstImageRef(post?.excerpt);
  return absoluteUrl(raw || '/static/og-default.png', siteUrl);
}

function firstImageRef(text) {
  if (!text) return '';
  const markdown = String(text).match(/!\[[^\]]*\]\(([^)\s]+)\)/);
  if (markdown) return markdown[1];
  const html = String(text).match(/<img[^>]+src=["']([^"']+)["']/i);
  return html ? html[1] : '';
}

export function absoluteUrl(url, siteUrl) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!siteUrl) return url;
  try {
    return new URL(url, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).href;
  } catch {
    return url;
  }
}

export function renderBreadcrumb({ siteUrl, category, postTitle, canonicalUrl }) {
  const items = [{ name: '首页', path: '/' }];
  if (category?.name && (category.slug || category.id)) {
    const slug = category.slug || category.id;
    items.push({ name: category.name, path: `/category/${encodeURIComponent(String(slug))}` });
  }
  items.push({ name: postTitle, path: canonicalUrl });
  const html = `<nav class="crumbs" aria-label="面包屑">${items.map((item, index) => {
    const sep = index ? '<span aria-hidden="true"> / </span>' : '';
    if (index === items.length - 1) return `${sep}<span>${esc(item.name)}</span>`;
    return `${sep}<a href="${esc(item.path)}">${esc(item.name)}</a>`;
  }).join('')}</nav>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${siteUrl}${item.path}`,
    })),
  };
  return { html, jsonLd };
}

export function renderRelated(posts) {
  if (!posts?.length) return '';
  const items = posts.map((post) => `<li><a href="${esc(postPath(post))}">${esc(post.title)}</a></li>`).join('');
  return `<aside class="related" aria-label="相关文章"><h2>相关文章</h2><ul>${items}</ul></aside>`;
}

export function renderTermLinks(items, { kind }) {
  const base = kind === 'tag' ? '/tag/' : '/category/';
  const testId = kind === 'tag' ? 'tag-link' : 'category-link';
  const visible = withPosts(items);
  if (!visible.length) {
    return kind === 'tag' ? '<span>暂无标签</span>' : '<li>暂无分类</li>';
  }
  return visible.map((item) => {
    const slug = item.slug || item.id;
    const href = `${base}${encodeURIComponent(String(slug))}`;
    if (kind === 'tag') {
      return `<a href="${esc(href)}" data-testid="${testId}" data-slug="${esc(slug)}">${esc(item.name)}</a>`;
    }
    return `<li><a href="${esc(href)}" data-testid="${testId}" data-slug="${esc(slug)}"><span>${esc(item.name)}</span><span class="cnt">${Number(item.post_count) || 0}</span></a></li>`;
  }).join('');
}

export function renderCategoryCards(categories) {
  const visible = withPosts(categories);
  if (!visible.length) return '<p class="empty">暂无分类</p>';
  return visible.map((cat) => {
    const slug = cat.slug || cat.id;
    const href = `/category/${encodeURIComponent(String(slug))}`;
    const description = cat.description ? esc(cat.description) : '暂无描述';
    return `<div class="cat-card category-item"><h2><a href="${esc(href)}">${esc(cat.name)}</a></h2><p>${description}</p><small>文章数: ${Number(cat.post_count) || 0}</small></div>`;
  }).join('');
}

export function renderTagCloud(tags) {
  const visible = withPosts(tags);
  if (!visible.length) return '<p class="empty">暂无标签</p>';
  return visible.map((tag) => {
    const slug = tag.slug || tag.id;
    const href = `/tag/${encodeURIComponent(String(slug))}`;
    return `<a href="${esc(href)}">${esc(tag.name)} (${Number(tag.post_count) || 0})</a>`;
  }).join('');
}

export function renderWidgets(widgets) {
  if (!widgets?.length) return '';
  return widgets.map((widget) => `<div class="widget"><h3>${esc(widget.title || '')}</h3><div class="widget-custom">${renderMarkdown(widget.content || '')}</div></div>`).join('');
}

export function parseWidgets(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function renderPostTags(tags) {
  if (!tags?.length) return '';
  const links = tags.map((tag) => {
    const slug = tag.slug || tag.id;
    const href = `/tag/${encodeURIComponent(String(slug))}`;
    return `<a class="post-tag-link" href="${esc(href)}">${esc(tag.name)}</a>`;
  }).join('');
  return `<div class="post-tags"><span class="label">标签:</span>${links}</div>`;
}
