/**
 * Pagination Component
 * Renders pagination controls
 */

export class Pagination {
  /**
   * Render pagination
   * @param {Object} options - Pagination options
   * @param {number} options.currentPage - Current page number (1-based)
   * @param {number} options.totalPages - Total number of pages
   * @param {number} options.totalItems - Total number of items
   * @param {number} options.itemsPerPage - Items per page
   * @param {string} options.basePath - Base URL path
   */
  static render(options = {}) {
    const {
      currentPage = 1,
      totalPages = 1,
      totalItems = 0,
      itemsPerPage = 10,
      basePath = '/',
    } = options;

    // Don't render pagination if only 1 page
    if (totalPages <= 1) {
      return '';
    }

    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    return `
<nav class="pagination" role="navigation" aria-label="分页导航">
  <div class="pagination-info">
    <span class="pagination-text">
      显示 ${this.getItemRange(currentPage, itemsPerPage, totalItems)}
    </span>
    <span class="pagination-divider">|</span>
    <span class="pagination-text">
      共 ${totalItems} 条
    </span>
  </div>
  
  <div class="pagination-controls">
    <div class="pagination-btn-group">
      ${prevPage 
        ? `<a href="${basePath}${this.buildQueryString({ page: prevPage })}" 
                 class="pagination-btn pagination-btn-prev"
                 rel="prev"
                 aria-label="上一页">
            <span class="icon">←</span>
            <span class="text">上一页</span>
           </a>` 
        : `<button class="pagination-btn pagination-btn-prev" disabled
                        aria-label="上一页">
            <span class="icon">←</span>
            <span class="text">上一页</span>
           </button>`}
    </div>
    
    <div class="pagination-numbers">
      ${this.renderPageNumbers(currentPage, totalPages, basePath)}
    </div>
    
    <div class="pagination-btn-group">
      ${nextPage 
        ? `<a href="${basePath}${this.buildQueryString({ page: nextPage })}" 
                 class="pagination-btn pagination-btn-next"
                 rel="next"
                 aria-label="下一页">
            <span class="text">下一页</span>
            <span class="icon">→</span>
           </a>` 
        : `<button class="pagination-btn pagination-btn-next" disabled
                        aria-label="下一页">
            <span class="text">下一页</span>
            <span class="icon">→</span>
           </button>`}
    </div>
  </div>
</nav>`;
  }

  /**
   * Render page numbers
   */
  static renderPageNumbers(current, total, basePath) {
    const pages = [];
    const showEllipsis = total > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and around current
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }

    return pages.map(page => {
      if (page === '...') {
        return `<span class="pagination-ellipsis">...</span>`;
      }
      
      if (page === current) {
        return `<span class="pagination-number pagination-current"
                       aria-current="page"
                       aria-label="当前页 ${page}">${page}</span>`;
      }
      
      return `<a href="${basePath}${this.buildQueryString({ page })}" 
                class="pagination-number"
                aria-label="第 ${page} 页">
               ${page}
             </a>`;
    }).join('\n');
  }

  /**
   * Get item range text
   */
  static getItemRange(page, perPage, total) {
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    return `${start} - ${end}`;
  }

  /**
   * Build query string
   */
  static buildQueryString(params) {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return query ? `?${query}` : '';
  }
}
