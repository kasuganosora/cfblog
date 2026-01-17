/**
 * Frontend Routes
 * Handles all frontend page rendering with themes and i18n
 */

import { Router } from 'itty-router';

// Import utilities and components
import Layout from '../frontend/components/layout.js';
import { PostCard } from '../frontend/components/post-card.js';
import { Pagination } from '../frontend/components/pagination.js';
import TemplateEngine from '../frontend/template-engine.js';
import { initI18n, t } from '../frontend/utils/i18n.js';
import { initTheme, DEFAULT_THEME, AVAILABLE_THEMES } from '../frontend/utils/theme.js';

const frontendRouter = Router();

// Initialize systems
let templateEngine = null;
let currentTheme = DEFAULT_THEME;
let currentLang = 'zh-cn';

/**
 * Initialize frontend systems
 */
async function initFrontend() {
  // Initialize i18n
  const langPack = await initI18n();
  currentLang = langPack;
  
  // Initialize theme
  currentTheme = await initTheme('local');
  
  // Initialize template engine
  templateEngine = new TemplateEngine('local');
  
  console.log(`Frontend initialized: theme=${currentTheme}, lang=${currentLang}`);
}

/**
 * Fetch data from API
 */
async function fetchAPI(endpoint) {
  const response = await fetch(`/api${endpoint}`);
  if (!response.ok) {
    console.error(`API Error: ${response.status} ${endpoint}`);
    return null;
  }
  return await response.json();
}

/**
 * Render page with layout
 */
async function renderPage(options) {
  if (!templateEngine) {
    await initFrontend();
  }

  const {
    title = '',
    description = 'CFBlog - 基于Cloudflare的现代化博客平台',
    content = '',
    canonical = '',
  } = options;

  const layout = new Layout(currentTheme, currentLang);
  return layout.render({
    title,
    description,
    content,
    canonical,
    extraHead: `
      <link rel="stylesheet" href="/assets/css/themes/${currentTheme}/style.css">
      <script type="module">
        window.CFBlogTheme = ${JSON.stringify(AVAILABLE_THEMES)};
        window.CFBlogI18n = {
          current: '${currentLang}',
          default: 'zh-cn'
        };
      </script>
    `,
  });
}

/**
 * Render error page
 */
async function renderError(status = 404) {
  const content = `
<section class="error-page" aria-labelledby="error-title">
  <div class="error-container">
    <div class="error-icon">${status === 404 ? '😕' : '😞'}</div>
    <h1 id="error-title" class="error-title">
      ${status === 404 ? '页面不存在' : '服务器错误'}
    </h1>
    <p class="error-message">
      ${status === 404 ? '您访问的页面不存在或已被删除。' : '服务器遇到了一些问题，请稍后再试。'}
    </p>
    <a href="/" class="error-btn" aria-label="返回首页">
      返回首页
    </a>
  </div>
</section>`;
  
  return renderPage({
    title: status === 404 ? '页面不存在' : '服务器错误',
    content,
  });
}

// === Page Routes ===

// GET / - Home page
frontendRouter.get('/', async (request) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = 10;

    // Fetch latest posts
    const postsData = await fetchAPI(`/post/list?page=${page}&per_page=${perPage}&status=1`);
    
    if (!postsData || !postsData.success) {
      return renderPage({
        title: '首页',
        content: '<div class="loading">加载中...</div>',
      });
    }

    const { data: posts = [], pagination: pag = {} } = postsData;

    // Render post cards
    const postsHtml = posts.length > 0 
      ? PostCard.renderList(posts)
      : `<div class="posts-empty">
          <div class="empty-icon">📝</div>
          <h2 class="empty-title">暂无文章</h2>
          <p class="empty-message">还没有发布任何文章</p>
         </div>`;

    // Render pagination
    const paginationHtml = Pagination.render({
      currentPage: pag.page || page,
      totalPages: pag.total_pages || 1,
      totalItems: pag.total || 0,
      itemsPerPage: perPage,
      basePath: '/',
    });

    // Fetch sidebar data
    const featuredData = await fetchAPI('/post/list?featured=1&per_page=5');
    const categoriesData = await fetchAPI('/category/list');
    const tagsData = await fetchAPI('/tag/popular?per_page=10');

    const sidebarContent = `
<aside class="sidebar">
  <section class="sidebar-section" aria-labelledby="featured-heading">
    <h2 id="featured-heading" class="sidebar-title">
      <span class="icon">⭐</span> 精选文章
    </h2>
    <div class="featured-posts">
      ${featuredData?.data?.slice(0, 5).map(post => PostCard.render(post)).join('')}
    </div>
  </section>

  <section class="sidebar-section" aria-labelledby="tags-heading">
    <h2 id="tags-heading" class="sidebar-title">
      <span class="icon">🏷️</span> 热门标签
    </h2>
    <div class="popular-tags">
      ${tagsData?.data?.slice(0, 10).map(tag => 
        `<a href="/tag/${tag.slug}" class="tag-link" rel="tag">${tag.name}</a>`
      ).join('') || '<p>暂无标签</p>'}
    </div>
  </section>

  <section class="sidebar-section" aria-labelledby="categories-heading">
    <h2 id="categories-heading" class="sidebar-title">
      <span class="icon">📂</span> 分类
    </h2>
    <nav class="categories-nav" aria-label="分类导航">
      <ul class="categories-list">
        ${categoriesData?.data?.map(cat => 
          `<li class="category-item">
            <a href="/category/${cat.slug}" class="category-link" rel="category">
              <span class="category-icon">📁</span>
              <span class="category-name">${cat.name}</span>
              <span class="category-count">${cat.post_count || 0}</span>
            </a>
           </li>`
        ).join('') || '<li class="category-item">暂无分类</li>'}
      </ul>
    </nav>
  </section>
</aside>`;

    return renderPage({
      title: '首页',
      content: `
<div class="main-wrapper">
  <div class="content-primary">
    <section class="posts-section" aria-label="最新文章">
      <h1 class="section-title">
        <span class="icon">📝</span> 最新文章
      </h1>
      ${postsHtml}
      ${paginationHtml}
    </section>
  </div>
  ${sidebarContent}
</div>`,
    });
  } catch (error) {
    console.error('Home page error:', error);
    return renderError(500);
  }
});

// GET /post/:slug - Post detail page
frontendRouter.get('/post/:slug', async (request) => {
  try {
    const slug = request.params.slug;

    // Fetch post data
    const postData = await fetchAPI(`/post/slug/${slug}`);
    
    if (!postData || !postData.success || !postData.data) {
      return renderError(404);
    }

    const post = postData.data;

    // Fetch comments
    const commentsData = await fetchAPI(`/comment/post/${post.id}`);

    // Format date
    const publishedDate = new Date(post.published_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
<article class="post-detail" aria-labelledby="post-title">
  <header class="post-header">
    <div class="post-meta-top">
      ${post.category_name 
        ? `<a href="/category/${post.category_slug || ''}" class="post-category" rel="category tag">
            <span class="icon">📁</span>
            ${post.category_name}
           </a>` 
        : ''}
      
      <time class="post-date" datetime="${post.published_at}">
        <span class="icon">📅</span>
        ${publishedDate}
      </time>
    </div>

    <h1 id="post-title" class="post-title">${post.title}</h1>

    <div class="post-meta-bottom">
      <div class="post-author" itemscope itemtype="https://schema.org/Person">
        <span class="icon">👤</span>
        <span itemprop="name">${post.author_name || post.display_name || 'Unknown'}</span>
      </div>
      
      <span class="post-views" title="浏览次数">
        <span class="icon">👁</span>
        ${post.view_count || 0}
      </span>
    </div>
  </header>

  <div class="post-content">
    <p class="post-excerpt">${post.excerpt || ''}</p>
  </div>

  <footer class="post-footer">
    <div class="post-tags-section">
      <span class="tags-label">标签:</span>
      ${post.tags?.length > 0 
        ? post.tags.map(tag => 
            `<a href="/tag/${tag.slug}" class="post-tag" rel="tag">${tag.name}</a>`
          ).join('')
        : '<span class="no-tags">暂无标签</span>'}
    </div>

    <div class="post-share">
      <button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href)">
        <span class="icon">📤</span> 分享
      </button>
    </div>
  </footer>
</article>

<section class="comments-section" aria-labelledby="comments-title">
  <h2 id="comments-title" class="comments-title">
    <span class="icon">💬</span> 
    评论 (${commentsData?.data?.length || 0})
  </h2>

  ${post.comment_status 
    ? `<form class="comment-form" action="/api/comment/create" method="POST">
          <input type="hidden" name="post_id" value="${post.id}">
          
          <div class="form-group">
            <label for="author_name" class="form-label">姓名</label>
            <input type="text" 
                   id="author_name" 
                   name="author_name" 
                   class="form-input" 
                   required
                   aria-required="true">
          </div>
          
          <div class="form-group">
            <label for="author_email" class="form-label">邮箱</label>
            <input type="email" 
                   id="author_email" 
                   name="author_email" 
                   class="form-input"
                   aria-required="false">
          </div>
          
          <div class="form-group">
            <label for="content" class="form-label">评论内容</label>
            <textarea id="content" 
                      name="content" 
                      class="form-textarea" 
                      rows="4"
                      required
                      aria-required="true"></textarea>
          </div>
          
          <button type="submit" class="form-submit">提交评论</button>
        </form>`
    : '<p class="comments-disabled">此文章已关闭评论功能。</p>'}

  <div class="comments-list">
    ${commentsData?.data?.map(comment => 
      `<div class="comment" data-comment-id="${comment.id}">
        <header class="comment-header">
          <span class="comment-author">${comment.author_name || 'Anonymous'}</span>
          <time class="comment-date" datetime="${comment.created_at}">
            ${new Date(comment.created_at).toLocaleDateString('zh-CN')}
          </time>
        </header>
        <div class="comment-content">${comment.content || ''}</div>
       </div>`
    ).join('') || '<p class="no-comments">暂无评论</p>'}
  </div>
</section>`;

    return renderPage({
      title: post.title,
      description: post.excerpt || post.title,
      content,
      canonical: `/post/${slug}`,
    });
  } catch (error) {
    console.error('Post page error:', error);
    return renderError(500);
  }
});

// GET /category/:slug - Category page
frontendRouter.get('/category/:slug', async (request) => {
  try {
    const slug = request.params.slug;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    // Fetch category and posts
    const catData = await fetchAPI(`/category/${slug}`);
    const postsData = await fetchAPI(`/post/list?category_id=${catData?.data?.id || 0}&page=${page}&per_page=10&status=1`);

    if (!catData?.success || !catData?.data) {
      return renderError(404);
    }

    const category = catData.data;
    const { data: posts = [], pagination: pag = {} } = postsData;

    const content = `
<section class="category-page" aria-labelledby="category-title">
  <div class="category-header">
    <h1 id="category-title" class="category-title">
      <span class="icon">📁</span> 
      ${category.name}
    </h1>
    <p class="category-description">${category.description || ''}</p>
  </div>

  <div class="posts-grid">
    ${posts.map(post => PostCard.render(post)).join('')}
  </div>

  ${Pagination.render({
    currentPage: pag.page || page,
    totalPages: pag.total_pages || 1,
    totalItems: pag.total || 0,
    itemsPerPage: 10,
    basePath: `/category/${slug}`,
  })}
</section>`;

    return renderPage({
      title: category.name,
      description: category.description || '',
      content,
      canonical: `/category/${slug}`,
    });
  } catch (error) {
    console.error('Category page error:', error);
    return renderError(500);
  }
});

// GET /categories - All categories page
frontendRouter.get('/categories', async () => {
  try {
    const data = await fetchAPI('/category/list');

    if (!data?.success || !data?.data) {
      return renderPage({
        title: '分类',
        content: '<div class="loading">加载中...</div>',
      });
    }

    const categories = data.data;

    const content = `
<section class="categories-page" aria-labelledby="categories-title">
  <h1 id="categories-title" class="page-title">
    <span class="icon">📂</span> 全部分类
  </h1>
  
  <div class="categories-grid">
    ${categories.map(cat => 
      `<a href="/category/${cat.slug}" class="category-card" rel="category">
        <div class="category-card-icon">📁</div>
        <div class="category-card-content">
          <h2 class="category-card-title">${cat.name}</h2>
          <p class="category-card-description">${cat.description || ''}</p>
          <span class="category-card-count">${cat.post_count || 0} 篇文章</span>
        </div>
       </a>`
    ).join('')}
  </div>
</section>`;

    return renderPage({
      title: '分类',
      content,
    });
  } catch (error) {
    console.error('Categories page error:', error);
    return renderError(500);
  }
});

// GET /tag/:slug - Tag page
frontendRouter.get('/tag/:slug', async (request) => {
  try {
    const slug = request.params.slug;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    // Fetch tag and posts
    const tagData = await fetchAPI(`/tag/${slug}`);
    const postsData = await fetchAPI(`/post/list?tag_id=${tagData?.data?.id || 0}&page=${page}&per_page=10&status=1`);

    if (!tagData?.success || !tagData?.data) {
      return renderError(404);
    }

    const tag = tagData.data;
    const { data: posts = [], pagination: pag = {} } = postsData;

    const content = `
<section class="tag-page" aria-labelledby="tag-title">
  <div class="tag-header">
    <h1 id="tag-title" class="tag-title">
      <span class="icon">🏷️</span> 
      ${tag.name}
    </h1>
    <p class="tag-count">${pag.total || 0} 篇文章</p>
  </div>

  <div class="posts-grid">
    ${posts.map(post => PostCard.render(post)).join('')}
  </div>

  ${Pagination.render({
    currentPage: pag.page || page,
    totalPages: pag.total_pages || 1,
    totalItems: pag.total || 0,
    itemsPerPage: 10,
    basePath: `/tag/${slug}`,
  })}
</section>`;

    return renderPage({
      title: `标签: ${tag.name}`,
      content,
      canonical: `/tag/${slug}`,
    });
  } catch (error) {
    console.error('Tag page error:', error);
    return renderError(500);
  }
});

// GET /tags - All tags page
frontendRouter.get('/tags', async () => {
  try {
    const data = await fetchAPI('/tag/list');

    if (!data?.success || !data?.data) {
      return renderPage({
        title: '标签',
        content: '<div class="loading">加载中...</div>',
      });
    }

    const tags = data.data;

    const content = `
<section class="tags-page" aria-labelledby="tags-title">
  <h1 id="tags-title" class="page-title">
    <span class="icon">🏷️</span> 全部标签
  </h1>
  
  <div class="tags-cloud">
    ${tags.map(tag => 
      `<a href="/tag/${tag.slug}" class="tag-cloud-item" rel="tag" style="font-size: ${1 + Math.random() * 1}rem">
        ${tag.name}
        <span class="tag-count">${tag.post_count || 0}</span>
       </a>`
    ).join('')}
  </div>
</section>`;

    return renderPage({
      title: '标签',
      content,
    });
  } catch (error) {
    console.error('Tags page error:', error);
    return renderError(500);
  }
});

// GET /search - Search page
frontendRouter.get('/search', async (request) => {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');

    if (!keyword) {
      return renderPage({
        title: '搜索',
        content: `
<section class="search-page" aria-labelledby="search-title">
  <h1 id="search-title" class="page-title">
    <span class="icon">🔍</span> 搜索
  </h1>
  
  <form action="/search" method="GET" class="search-form">
    <div class="search-input-wrapper">
      <input type="text" 
             name="q" 
             class="search-input" 
             placeholder="搜索文章、标签、分类..." 
             value="${keyword}"
             aria-label="搜索内容"
             autofocus>
      <button type="submit" class="search-button">搜索</button>
    </div>
  </form>
</section>`,
      });
    }

    // Perform search
    const results = await fetchAPI(`/search?q=${encodeURIComponent(keyword)}&page=${page}&per_page=10`);

    const content = `
<section class="search-results" aria-labelledby="results-title">
  <div class="search-header">
    <h1 id="results-title" class="page-title">
      <span class="icon">🔍</span> 搜索结果: "${keyword}"
    </h1>
    <p class="search-info">找到 ${results?.pagination?.total || 0} 条结果</p>
  </div>

  ${results?.data && results.data.length > 0
    ? `<div class="posts-grid">
         ${results.data.map(result => PostCard.render(result)).join('')}
       </div>
       ${Pagination.render({
         currentPage: page,
         totalPages: results.pagination?.total_pages || 1,
         totalItems: results.pagination?.total || 0,
         itemsPerPage: 10,
         basePath: `/search?q=${encodeURIComponent(keyword)}`,
       })}`
    : `<div class="no-results">
         <div class="empty-icon">🔍</div>
         <h2 class="empty-title">未找到相关内容</h2>
         <p class="empty-message">尝试使用其他关键词搜索</p>
       </div>`}
</section>`;

    return renderPage({
      title: `搜索: ${keyword}`,
      content,
    });
  } catch (error) {
    console.error('Search page error:', error);
    return renderError(500);
  }
});

// GET /feedback - Guestbook page
frontendRouter.get('/feedback', async () => {
  try {
    const data = await fetchAPI('/feedback/list');

    const content = `
<section class="feedback-page" aria-labelledby="feedback-title">
  <h1 id="feedback-title" class="page-title">
    <span class="icon">📝</span> 留言板
  </h1>

  <form action="/api/feedback/create" method="POST" class="feedback-form">
    <div class="form-group">
      <label for="name" class="form-label">姓名</label>
      <input type="text" id="name" name="name" class="form-input" required aria-required="true">
    </div>
    
    <div class="form-group">
      <label for="email" class="form-label">邮箱 (可选)</label>
      <input type="email" id="email" name="email" class="form-input">
    </div>
    
    <div class="form-group">
      <label for="content" class="form-label">留言内容</label>
      <textarea id="content" name="content" class="form-textarea" rows="5" required aria-required="true"></textarea>
    </div>
    
    <button type="submit" class="form-submit">提交留言</button>
  </form>

  <div class="feedback-list">
    <h2 class="feedback-list-title">最近留言</h2>
    ${data?.data?.slice(0, 10).map(item => 
      `<div class="feedback-item">
        <header class="feedback-header">
          <span class="feedback-author">${item.name}</span>
          <time class="feedback-date">${new Date(item.created_at).toLocaleDateString('zh-CN')}</time>
        </header>
        <div class="feedback-content">${item.content || ''}</div>
       </div>`
    ).join('') || '<p class="no-feedbacks">暂无留言</p>'}
  </div>
</section>`;

    return renderPage({
      title: '留言板',
      content,
    });
  } catch (error) {
    console.error('Feedback page error:', error);
    return renderError(500);
  }
});

// GET /login - Login page
frontendRouter.get('/login', async () => {
  const content = `
<section class="login-page" aria-labelledby="login-title">
  <div class="login-container">
    <div class="login-header">
      <h1 id="login-title" class="login-title">
        <span class="icon">🔐</span> 登录
      </h1>
      <p class="login-subtitle">登录到CFBlog后台管理</p>
    </div>

    <form action="/api/user/login" method="POST" class="login-form">
      <div class="form-group">
        <label for="username" class="form-label">用户名</label>
        <input type="text" id="username" name="username" class="form-input" required aria-required="true" autofocus>
      </div>
      
      <div class="form-group">
        <label for="password" class="form-label">密码</label>
        <input type="password" id="password" name="password" class="form-input" required aria-required="true">
      </div>
      
      <button type="submit" class="form-submit form-submit-full">登录</button>
    </form>

    <div class="login-footer">
      <a href="/" class="back-link">返回首页</a>
    </div>
  </div>
</section>`;

  return renderPage({
    title: '登录',
    content,
  });
});

// GET /assets/* - Serve static assets
frontendRouter.get('/assets/*', (request) => {
  const path = request.params['*'];
  return new Response('Asset not found', { status: 404 });
});

// Catch-all 404
frontendRouter.all('*', async () => {
  return renderError(404);
});

export { frontendRouter as frontendRoutes };
