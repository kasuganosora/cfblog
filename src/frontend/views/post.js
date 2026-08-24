/**
 * Post Detail View
 */

import { renderLayout } from './layout.js';

export function renderPost({ blogTitle, slug, currentUser, post, siteUrl }) {
  // If post data is available from SSR, build SEO params
  const seo = {};
  if (post) {
    seo.description = post.excerpt || (post.content || '').replace(/[#*`>\[\]!<]/g, '').slice(0, 160).trim();
    seo.canonicalUrl = `${siteUrl}/post/${slug}`;
    seo.ogType = 'article';
    seo.siteUrl = siteUrl;
    if (post.cover_image) seo.ogImage = post.cover_image;
    if (post.published_at) seo.publishedTime = post.published_at;
    if (post.updated_at) seo.modifiedTime = post.updated_at;
    if (post.author_name) seo.author = post.author_name;
    // JSON-LD Article schema
    seo.jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      author: { '@type': 'Person', name: post.author_name || blogTitle },
      publisher: { '@type': 'Organization', name: blogTitle },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/post/${slug}` },
    };
    if (post.excerpt) seo.jsonLd.description = post.excerpt;
    if (post.cover_image) seo.jsonLd.image = post.cover_image;
  } else {
    seo.siteUrl = siteUrl;
    seo.canonicalUrl = `${siteUrl}/post/${slug}`;
  }

  const postTitle = post?.title || '文章详情';

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
        <h1 data-testid="post-title">加载中...</h1>
        <div data-testid="post-meta" class="article-meta"></div>
      </div>
      <div data-testid="post-content" class="post-body"><p>内容加载中...</p></div>
      <div id="post-tags-area"></div>
    </article>
    <div id="comments-container" role="region" aria-label="评论区"></div>
  </div>
</div>`
  });
}
