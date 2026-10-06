/**
 * Post Detail View
 */

import { esc } from '../utils/helpers.js';
import {
  formatPostDate,
  readTime,
  renderMarkdown,
  renderPostTags,
  toIsoDate,
} from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderPost({ blogTitle, slug, currentUser, post, siteUrl }) {
  const seo = { siteUrl };
  const canonicalUrl = `${siteUrl}/post/${encodeURIComponent(slug)}`;
  seo.canonicalUrl = canonicalUrl;

  if (post) {
    seo.description = post.excerpt || (post.content || '').replace(/[#*>[\]!<]/g, '').slice(0, 160).trim();
    seo.ogType = 'article';
    if (post.cover_image) seo.ogImage = post.cover_image;
    const published = toIsoDate(post.published_at || post.created_at);
    const modified = toIsoDate(post.updated_at || post.published_at || post.created_at);
    if (published) seo.publishedTime = published;
    if (modified) seo.modifiedTime = modified;
    if (post.author_name) seo.author = post.author_name;
    seo.jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      author: { '@type': 'Person', name: post.author_name || blogTitle },
      publisher: { '@type': 'Organization', name: blogTitle },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    };
    if (published) seo.jsonLd.datePublished = published;
    if (modified) seo.jsonLd.dateModified = modified;
    if (post.excerpt) seo.jsonLd.description = post.excerpt;
    if (post.cover_image) seo.jsonLd.image = post.cover_image;
  } else {
    seo.noindex = true;
  }

  const postTitle = post?.title || '文章不存在';
  const date = post ? formatPostDate(post.published_at || post.created_at) : '';
  const author = post?.author_name ? `<span>${esc(post.author_name)}</span>` : '';
  const body = post
    ? (renderMarkdown(post.content) || '<p>暂无内容</p>')
    : '<p>文章不存在</p>';
  const meta = post
    ? `<span>${esc(date)}</span>${author}<span>${esc(readTime(post.content))}</span><span>阅读 ${Number(post.view_count) || 0}</span>`
    : '';
  const ssr = post ? ' data-ssr="1"' : '';

  return renderLayout({
    title: postTitle,
    blogTitle,
    bodyAttrs: ' data-testid="post-detail"',
    pageData: { slug, currentUser, blogTitle },
    pageScript: 'post.js',
    seo,
    content: `
<div class="page narrow">
  <div class="content">
    <article data-testid="post-article">
      <img class="post-hero" id="hero" style="display:none" alt="">
      <div class="post-header">
        <h1 data-testid="post-title">${esc(postTitle)}</h1>
        <div data-testid="post-meta" class="article-meta">${meta}</div>
      </div>
      <div data-testid="post-content" class="post-body"${ssr}>${body}</div>
      <div id="post-tags-area">${post ? renderPostTags(post.tags) : ''}</div>
    </article>
    <div id="comments-container" role="region" aria-label="评论区"></div>
  </div>
</div>`
  });
}
