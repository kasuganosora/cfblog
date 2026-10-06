/**
 * Post Detail View
 */

import { esc } from '../utils/helpers.js';
import {
  formatPostDate,
  readTime,
  renderBreadcrumb,
  renderMarkdown,
  renderPostTags,
  renderRelated,
  shareImage,
  toIsoDate,
} from '../utils/content.js';
import { renderLayout } from './layout.js';

export function renderPost({ blogTitle, slug, currentUser, post, siteUrl, category = null, related = [] }) {
  const seo = { siteUrl };
  const canonicalUrl = `${siteUrl}/post/${encodeURIComponent(slug)}`;
  seo.canonicalUrl = canonicalUrl;
  const postTitle = post?.title || '文章不存在';

  if (post) {
    seo.description = post.excerpt || (post.content || '').replace(/[#*>[\]!<]/g, '').slice(0, 160).trim();
    seo.ogType = 'article';
    seo.ogImage = shareImage(post, siteUrl);
    const published = toIsoDate(post.published_at || post.created_at);
    const modified = toIsoDate(post.updated_at || post.published_at || post.created_at);
    if (published) seo.publishedTime = published;
    if (modified) seo.modifiedTime = modified;
    if (post.author_name) seo.author = post.author_name;
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      author: { '@type': 'Person', name: post.author_name || blogTitle },
      publisher: { '@type': 'Organization', name: blogTitle },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      image: seo.ogImage,
    };
    if (published) article.datePublished = published;
    if (modified) article.dateModified = modified;
    if (post.excerpt) article.description = post.excerpt;
    const crumb = renderBreadcrumb({ siteUrl, category, postTitle, canonicalUrl });
    seo.jsonLd = [article, crumb.jsonLd];
    seo.breadcrumbHtml = crumb.html;
  } else {
    seo.noindex = true;
  }

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
    ${seo.breadcrumbHtml || ''}
    <article data-testid="post-article">
      <img class="post-hero" id="hero" style="display:none" alt="">
      <div class="post-header">
        <h1 data-testid="post-title">${esc(postTitle)}</h1>
        <div data-testid="post-meta" class="article-meta">${meta}</div>
      </div>
      <div data-testid="post-content" class="post-body"${ssr}>${body}</div>
      <div id="post-tags-area">${post ? renderPostTags(post.tags) : ''}</div>
    </article>
    ${post ? renderRelated(related) : ''}
    <div id="comments-container" role="region" aria-label="评论区"></div>
  </div>
</div>`
  });
}
