/**
 * Post Card Component
 * Renders a blog post card
 */

export class PostCard {
  /**
   * Render a single post card
   * @param {Object} post - Post data
   */
  static render(post) {
    if (!post) return '';
    
    const {
      id,
      title,
      slug,
      excerpt,
      author_name,
      published_at,
      view_count,
      comment_count = 0,
      featured = false,
      category_name,
      tags = [],
    } = post;

    // Format date
    const date = new Date(published_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Tags HTML
    const tagsHtml = tags.length > 0
      ? tags.map(tag => 
          `<a href="/tag/${tag.slug}" class="post-tag" rel="tag">${tag.name}</a>`
        ).join('')
      : '';

    // Featured badge
    const featuredBadge = featured
      ? '<span class="post-badge featured-badge">精选</span>'
      : '';

    return `
<article class="post-card" data-post-id="${id}">
  <div class="post-card-inner">
    ${featuredBadge}
    
    <header class="post-card-header">
      ${category_name 
        ? `<span class="post-category">
            <a href="/category/${category_name}" rel="category tag">${category_name}</a>
           </span>` 
        : ''}
      
      <h2 class="post-card-title">
        <a href="/post/${slug}" rel="bookmark">${title}</a>
      </h2>
    </header>
    
    <div class="post-card-meta">
      <time class="post-date" datetime="${published_at}">
        <span class="icon">📅</span>
        <span>${date}</span>
      </time>
      
      ${author_name 
        ? `<span class="post-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span class="icon">👤</span>
            <span itemprop="name">${author_name}</span>
           </span>` 
        : ''}
      
      <span class="post-views" title="浏览次数">
        <span class="icon">👁</span>
        <span>${view_count || 0}</span>
      </span>
      
      <span class="post-comments" title="评论数">
        <span class="icon">💬</span>
        <span>${comment_count}</span>
      </span>
    </div>
    
    <div class="post-card-excerpt">
      <p>${excerpt || ''}</p>
    </div>
    
    <footer class="post-card-footer">
      <a href="/post/${slug}" class="post-read-more" aria-label="阅读全文: ${title}">
        阅读更多 <span class="arrow">→</span>
      </a>
      
      ${tagsHtml 
        ? `<div class="post-tags">
            <span class="tags-label">标签:</span>
            ${tagsHtml}
           </div>` 
        : ''}
    </footer>
  </div>
</article>`;
  }

  /**
   * Render multiple post cards
   * @param {Array} posts - Array of post objects
   */
  static renderList(posts) {
    if (!posts || posts.length === 0) {
      return `
<section class="posts-empty">
  <div class="empty-state">
    <div class="empty-icon">📝</div>
    <h2 class="empty-title">暂无文章</h2>
    <p class="empty-message">还没有发布任何文章</p>
  </div>
</section>`;
    }

    return `
<section class="posts-grid" aria-label="文章列表">
  ${posts.map(post => this.render(post)).join('\n')}
</section>`;
  }
}
