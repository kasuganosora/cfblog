import { getCache, setCache } from '../utils/cache.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';
import { Comment } from '../models/Comment.js';

// 处理前台路由
export async function handleFrontendRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  const env = request.env;
  
  try {
    // 首页
    if (path === '/' || path === '/index.html') {
      return await handleHome(request, env);
    }
    
    // 文章详情页
    if (path.startsWith('/post/')) {
      return await handlePostDetail(request, env);
    }
    
    // 分类页面
    if (path.startsWith('/category/')) {
      return await handleCategoryPosts(request, env);
    }
    
    // 标签页面
    if (path.startsWith('/tag/')) {
      return await handleTagPosts(request, env);
    }
    
    // 搜索页面
    if (path.startsWith('/search')) {
      return await handleSearch(request, env);
    }
    
    // 关于页面
    if (path === '/about') {
      return await handleAbout(request, env);
    }
    
    // 联系页面
    if (path === '/contact') {
      return await handleContact(request, env);
    }
    
    // 反馈提交
    if (path === '/feedback' && request.method === 'POST') {
      return await handleSubmitFeedback(request, env);
    }
    
    // 静态资源
    if (path.startsWith('/static/')) {
      return await handleStaticResource(request, env);
    }
    
    // 返回 404 页面
    return await handleNotFound(request, env);
  } catch (err) {
    console.error('Frontend error:', err);
    return await handleServerError(request, env);
  }
}

// 首页
async function handleHome(request, env) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = 10;
  
  try {
    // 检查缓存
    const cacheKey = `home:page:${page}`;
    const cachedPage = await getCache(env, cacheKey);
    
    if (cachedPage.success && cachedPage.exists) {
      return new Response(cachedPage.data, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'max-age=300', // 5分钟缓存
        }
      });
    }
    
    // 获取文章列表
    const postModel = new Post(env);
    const postsResult = await postModel.getPosts({ 
      page, 
      limit, 
      status: 1 // 只获取已发布的文章
    });
    
    // 获取热门分类
    const categoryModel = new Category(env);
    const categoriesResult = await categoryModel.getPopularCategories(10);
    
    // 获取热门标签
    const tagModel = new Tag(env);
    const tagsResult = await tagModel.getPopularTags(20);
    
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderHomePage({
      posts: postsResult.success ? postsResult.data : [],
      pagination: postsResult.success ? postsResult.pagination : null,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      settings,
      currentPage: page
    });
    
    // 缓存结果
    await setCache(env, cacheKey, html, 300); // 5分钟缓存
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=300',
      }
    });
  } catch (err) {
    console.error('Home page error:', err);
    return await handleServerError(request, env);
  }
}

// 文章详情页
async function handlePostDetail(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const slug = pathParts[2];
  
  if (!slug) {
    return await handleNotFound(request, env);
  }
  
  try {
    // 检查缓存
    const cacheKey = `post:${slug}`;
    const cachedPage = await getCache(env, cacheKey);
    
    if (cachedPage.success && cachedPage.exists) {
      return new Response(cachedPage.data, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'max-age=600', // 10分钟缓存
        }
      });
    }
    
    // 获取文章详情
    const postModel = new Post(env);
    const postResult = await postModel.getBySlug(slug);
    
    if (!postResult.success || !postResult.result) {
      return await handleNotFound(request, env);
    }
    
    const post = postResult.result;
    
    // 检查文章是否已发布
    if (post.status !== 1) {
      return await handleNotFound(request, env);
    }
    
    // 获取文章评论
    const commentModel = new Comment(env);
    const commentsResult = await commentModel.getComments({
      postId: post.id,
      status: 1, // 只获取已批准的评论
      parentId: null, // 只获取顶级评论
      limit: 100 // 限制评论数量
    });
    
    // 获取热门分类
    const categoryModel = new Category(env);
    const categoriesResult = await categoryModel.getPopularCategories(10);
    
    // 获取热门标签
    const tagModel = new Tag(env);
    const tagsResult = await tagModel.getPopularTags(20);
    
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderPostPage({
      post,
      comments: commentsResult.success ? commentsResult.data : [],
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      settings
    });
    
    // 缓存结果
    await setCache(env, cacheKey, html, 600); // 10分钟缓存
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=600',
      }
    });
  } catch (err) {
    console.error('Post detail page error:', err);
    return await handleServerError(request, env);
  }
}

// 分类页面
async function handleCategoryPosts(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const slug = pathParts[2];
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = 10;
  
  if (!slug) {
    return await handleNotFound(request, env);
  }
  
  try {
    // 获取分类详情
    const categoryModel = new Category(env);
    const categoryResult = await categoryModel.getBySlug(slug);
    
    if (!categoryResult.success || !categoryResult.result) {
      return await handleNotFound(request, env);
    }
    
    // 检查缓存
    const cacheKey = `category:${slug}:page:${page}`;
    const cachedPage = await getCache(env, cacheKey);
    
    if (cachedPage.success && cachedPage.exists) {
      return new Response(cachedPage.data, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'max-age=300', // 5分钟缓存
        }
      });
    }
    
    // 获取分类下的文章
    const postModel = new Post(env);
    const postsResult = await postModel.getPosts({ 
      page, 
      limit, 
      status: 1,
      categoryId: categoryResult.result.id
    });
    
    // 获取热门分类
    const categoriesResult = await categoryModel.getPopularCategories(10);
    
    // 获取热门标签
    const tagModel = new Tag(env);
    const tagsResult = await tagModel.getPopularTags(20);
    
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderCategoryPage({
      category: categoryResult.result,
      posts: postsResult.success ? postsResult.data : [],
      pagination: postsResult.success ? postsResult.pagination : null,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      settings,
      currentPage: page
    });
    
    // 缓存结果
    await setCache(env, cacheKey, html, 300); // 5分钟缓存
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=300',
      }
    });
  } catch (err) {
    console.error('Category page error:', err);
    return await handleServerError(request, env);
  }
}

// 标签页面
async function handleTagPosts(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const slug = pathParts[2];
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = 10;
  
  if (!slug) {
    return await handleNotFound(request, env);
  }
  
  try {
    // 获取标签详情
    const tagModel = new Tag(env);
    const tagResult = await tagModel.getBySlug(slug);
    
    if (!tagResult.success || !tagResult.result) {
      return await handleNotFound(request, env);
    }
    
    // 检查缓存
    const cacheKey = `tag:${slug}:page:${page}`;
    const cachedPage = await getCache(env, cacheKey);
    
    if (cachedPage.success && cachedPage.exists) {
      return new Response(cachedPage.data, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'max-age=300', // 5分钟缓存
        }
      });
    }
    
    // 获取标签下的文章
    const postModel = new Post(env);
    const postsResult = await postModel.getPosts({ 
      page, 
      limit, 
      status: 1,
      tagId: tagResult.result.id
    });
    
    // 获取热门分类
    const categoryModel = new Category(env);
    const categoriesResult = await categoryModel.getPopularCategories(10);
    
    // 获取热门标签
    const tagsResult = await tagModel.getPopularTags(20);
    
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderTagPage({
      tag: tagResult.result,
      posts: postsResult.success ? postsResult.data : [],
      pagination: postsResult.success ? postsResult.pagination : null,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      settings,
      currentPage: page
    });
    
    // 缓存结果
    await setCache(env, cacheKey, html, 300); // 5分钟缓存
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=300',
      }
    });
  } catch (err) {
    console.error('Tag page error:', err);
    return await handleServerError(request, env);
  }
}

// 搜索页面
async function handleSearch(request, env) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = 10;
  
  try {
    // 获取搜索结果
    const postModel = new Post(env);
    const postsResult = keyword 
      ? await postModel.searchPosts(keyword, { page, limit, status: 1 })
      : { success: true, data: [], pagination: null };
    
    // 获取热门分类
    const categoryModel = new Category(env);
    const categoriesResult = await categoryModel.getPopularCategories(10);
    
    // 获取热门标签
    const tagModel = new Tag(env);
    const tagsResult = await tagModel.getPopularTags(20);
    
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderSearchPage({
      keyword,
      posts: postsResult.success ? postsResult.data : [],
      pagination: postsResult.success ? postsResult.pagination : null,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      settings,
      currentPage: page
    });
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=60', // 1分钟缓存，搜索结果更新更频繁
      }
    });
  } catch (err) {
    console.error('Search page error:', err);
    return await handleServerError(request, env);
  }
}

// 关于页面
async function handleAbout(request, env) {
  try {
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderAboutPage({
      settings
    });
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=3600', // 1小时缓存，静态页面
      }
    });
  } catch (err) {
    console.error('About page error:', err);
    return await handleServerError(request, env);
  }
}

// 联系页面
async function handleContact(request, env) {
  try {
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染页面
    const html = renderContactPage({
      settings
    });
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=3600', // 1小时缓存，静态页面
      }
    });
  } catch (err) {
    console.error('Contact page error:', err);
    return await handleServerError(request, env);
  }
}

// 提交反馈
async function handleSubmitFeedback(request, env) {
  try {
    const formData = await request.json();
    
    // 创建反馈
    const response = await fetch(`${url.origin}/api/feedback/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: '提交反馈失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// 静态资源
async function handleStaticResource(request, env) {
  // 这里可以处理静态资源，如 CSS、JS、图片等
  // 为了简化，我们返回一个简单的响应
  return new Response('Static resource not found', { status: 404 });
}

// 404 页面
async function handleNotFound(request, env) {
  try {
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染 404 页面
    const html = renderNotFoundPage({
      settings
    });
    
    return new Response(html, {
      status: 404,
      headers: {
        'Content-Type': 'text/html',
      }
    });
  } catch (err) {
    console.error('404 page error:', err);
    return new Response('页面未找到', { status: 404 });
  }
}

// 服务器错误页面
async function handleServerError(request, env) {
  try {
    // 获取网站设置
    const settings = await getSiteSettings(env);
    
    // 渲染错误页面
    const html = renderErrorPage({
      settings
    });
    
    return new Response(html, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      }
    });
  } catch (err) {
    console.error('500 page error:', err);
    return new Response('服务器内部错误', { status: 500 });
  }
}

// 获取网站设置
async function getSiteSettings(env) {
  try {
    const query = `SELECT key, value FROM settings`;
    const result = await env.DB.prepare(query).all();
    
    if (result.results) {
      const settings = {};
      result.results.forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    }
    
    return {};
  } catch (error) {
    console.error('Get site settings error:', error);
    return {};
  }
}

// 页面渲染函数（简化版，实际项目中应该使用模板引擎）
function renderHomePage(data) {
  const { posts, pagination, categories, tags, settings, currentPage } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.site_title || 'Cloudflare Blog'}</title>
  <meta name="description" content="${settings.site_description || 'A blog built with Cloudflare Workers'}">
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="posts">
      <h2>最新文章</h2>
      ${posts.map(post => `
        <article class="post">
          <h3><a href="/post/${post.slug}">${post.title}</a></h3>
          <div class="post-meta">
            <span>作者: ${post.author_name}</span>
            <span>发布时间: ${new Date(post.published_at).toLocaleDateString()}</span>
            <span>浏览量: ${post.view_count}</span>
          </div>
          ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
          <div class="post-tags">
            ${post.tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
          </div>
        </article>
      `).join('')}
    </section>
    
    ${pagination ? `
    <nav class="pagination">
      ${pagination.page > 1 ? `<a href="/?page=${pagination.page - 1}">上一页</a>` : ''}
      <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
      ${pagination.page < pagination.totalPages ? `<a href="/?page=${pagination.page + 1}">下一页</a>` : ''}
    </nav>
    ` : ''}
    
    <aside>
      <section class="categories">
        <h3>热门分类</h3>
        <ul>
          ${categories.map(category => `
            <li><a href="/category/${category.slug}">${category.name} (${category.post_count || 0})</a></li>
          `).join('')}
        </ul>
      </section>
      
      <section class="tags">
        <h3>热门标签</h3>
        <div class="tag-cloud">
          ${tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
        </div>
      </section>
      
      <section class="search">
        <h3>搜索</h3>
        <form action="/search" method="get">
          <input type="text" name="keyword" placeholder="搜索文章...">
          <button type="submit">搜索</button>
        </form>
      </section>
    </aside>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderPostPage(data) {
  const { post, comments, categories, tags, settings } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} - ${settings.site_title || 'Cloudflare Blog'}</title>
  <meta name="description" content="${post.excerpt || ''}">
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <article class="post-detail">
      <h2>${post.title}</h2>
      <div class="post-meta">
        <span>作者: ${post.author_name}</span>
        <span>发布时间: ${new Date(post.published_at).toLocaleDateString()}</span>
        <span>浏览量: ${post.view_count}</span>
      </div>
      
      <div class="post-content">
        ${post.content || ''}
      </div>
      
      <div class="post-tags">
        ${post.tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
      </div>
    </article>
    
    <section class="comments">
      <h3>评论</h3>
      ${post.comment_status ? `
      <form class="comment-form" action="/api/comment/create" method="post">
        <input type="hidden" name="postId" value="${post.id}">
        <div>
          <label for="authorName">姓名</label>
          <input type="text" id="authorName" name="authorName" required>
        </div>
        <div>
          <label for="authorEmail">邮箱</label>
          <input type="email" id="authorEmail" name="authorEmail" required>
        </div>
        <div>
          <label for="authorUrl">网站</label>
          <input type="url" id="authorUrl" name="authorUrl">
        </div>
        <div>
          <label for="content">评论内容</label>
          <textarea id="content" name="content" required></textarea>
        </div>
        <button type="submit">提交评论</button>
      </form>
      ` : '<p>该文章不允许评论</p>'}
      
      <div class="comments-list">
        ${comments.map(comment => `
        <div class="comment">
          <div class="comment-meta">
            <strong>${comment.author_name || comment.author_display_name}</strong>
            <span>${new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
          <div class="comment-content">
            ${comment.content}
          </div>
        </div>
        `).join('')}
      </div>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderCategoryPage(data) {
  const { category, posts, pagination, categories, tags, settings, currentPage } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${category.name} - ${settings.site_title || 'Cloudflare Blog'}</title>
  <meta name="description" content="${category.description || `分类 ${category.name} 下的文章`}">
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="category">
      <h2>分类: ${category.name}</h2>
      ${category.description ? `<p>${category.description}</p>` : ''}
      
      <div class="posts">
        ${posts.map(post => `
          <article class="post">
            <h3><a href="/post/${post.slug}">${post.title}</a></h3>
            <div class="post-meta">
              <span>作者: ${post.author_name}</span>
              <span>发布时间: ${new Date(post.published_at).toLocaleDateString()}</span>
              <span>浏览量: ${post.view_count}</span>
            </div>
            ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
            <div class="post-tags">
              ${post.tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
    
    ${pagination ? `
    <nav class="pagination">
      ${pagination.page > 1 ? `<a href="/category/${category.slug}?page=${pagination.page - 1}">上一页</a>` : ''}
      <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
      ${pagination.page < pagination.totalPages ? `<a href="/category/${category.slug}?page=${pagination.page + 1}">下一页</a>` : ''}
    </nav>
    ` : ''}
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderTagPage(data) {
  const { tag, posts, pagination, categories, tags, settings, currentPage } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tag.name} - ${settings.site_title || 'Cloudflare Blog'}</title>
  <meta name="description" content="${tag.description || `标签 ${tag.name} 下的文章`}">
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="tag">
      <h2>标签: ${tag.name}</h2>
      ${tag.description ? `<p>${tag.description}</p>` : ''}
      
      <div class="posts">
        ${posts.map(post => `
          <article class="post">
            <h3><a href="/post/${post.slug}">${post.title}</a></h3>
            <div class="post-meta">
              <span>作者: ${post.author_name}</span>
              <span>发布时间: ${new Date(post.published_at).toLocaleDateString()}</span>
              <span>浏览量: ${post.view_count}</span>
            </div>
            ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
            <div class="post-tags">
              ${post.tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
    
    ${pagination ? `
    <nav class="pagination">
      ${pagination.page > 1 ? `<a href="/tag/${tag.slug}?page=${pagination.page - 1}">上一页</a>` : ''}
      <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
      ${pagination.page < pagination.totalPages ? `<a href="/tag/${tag.slug}?page=${pagination.page + 1}">下一页</a>` : ''}
    </nav>
    ` : ''}
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderSearchPage(data) {
  const { keyword, posts, pagination, categories, tags, settings, currentPage } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>搜索: ${keyword} - ${settings.site_title || 'Cloudflare Blog'}</title>
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="search">
      <h2>搜索结果: ${keyword}</h2>
      
      <form action="/search" method="get" class="search-form">
        <input type="text" name="keyword" value="${keyword}" placeholder="搜索文章...">
        <button type="submit">搜索</button>
      </form>
      
      <div class="posts">
        ${posts.map(post => `
          <article class="post">
            <h3><a href="/post/${post.slug}">${post.title}</a></h3>
            <div class="post-meta">
              <span>作者: ${post.author_name}</span>
              <span>发布时间: ${new Date(post.published_at).toLocaleDateString()}</span>
              <span>浏览量: ${post.view_count}</span>
            </div>
            ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
            <div class="post-tags">
              ${post.tags.map(tag => `<a href="/tag/${tag.slug}">${tag.name}</a>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
      
      ${posts.length === 0 ? '<p>没有找到相关文章</p>' : ''}
    </section>
    
    ${pagination ? `
    <nav class="pagination">
      ${pagination.page > 1 ? `<a href="/search?keyword=${encodeURIComponent(keyword)}&page=${pagination.page - 1}">上一页</a>` : ''}
      <span>第 ${pagination.page} 页，共 ${pagination.totalPages} 页</span>
      ${pagination.page < pagination.totalPages ? `<a href="/search?keyword=${encodeURIComponent(keyword)}&page=${pagination.page + 1}">下一页</a>` : ''}
    </nav>
    ` : ''}
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderAboutPage(data) {
  const { settings } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>关于 - ${settings.site_title || 'Cloudflare Blog'}</title>
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="about">
      <h2>关于我们</h2>
      <p>这是一个基于 Cloudflare Workers 构建的博客系统，使用 R2 存储文章内容，D1 存储元数据，KV 进行缓存。</p>
      <p>系统支持多用户、评论、分类、标签、搜索等基本博客功能。</p>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderContactPage(data) {
  const { settings } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>联系 - ${settings.site_title || 'Cloudflare Blog'}</title>
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="contact">
      <h2>联系我们</h2>
      <p>如果您有任何问题或建议，请通过以下表单联系我们：</p>
      
      <form id="feedbackForm">
        <div>
          <label for="name">姓名</label>
          <input type="text" id="name" required>
        </div>
        <div>
          <label for="email">邮箱</label>
          <input type="email" id="email" required>
        </div>
        <div>
          <label for="subject">主题</label>
          <input type="text" id="subject" required>
        </div>
        <div>
          <label for="content">内容</label>
          <textarea id="content" required></textarea>
        </div>
        <button type="submit">提交</button>
      </form>
      
      <div id="feedbackResult" style="display: none;"></div>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
  
  <script>
    document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        content: document.getElementById('content').value
      };
      
      const resultDiv = document.getElementById('feedbackResult');
      resultDiv.style.display = 'block';
      resultDiv.textContent = '正在提交...';
      
      try {
        const response = await fetch('/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          resultDiv.textContent = result.message;
          resultDiv.style.color = 'green';
          document.getElementById('feedbackForm').reset();
        } else {
          resultDiv.textContent = result.message || '提交失败';
          resultDiv.style.color = 'red';
        }
      } catch (error) {
        resultDiv.textContent = '提交失败，请稍后重试';
        resultDiv.style.color = 'red';
      }
    });
  </script>
</body>
</html>`;
}

function renderNotFoundPage(data) {
  const { settings } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面未找到 - ${settings.site_title || 'Cloudflare Blog'}</title>
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="error">
      <h2>404 - 页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被删除。</p>
      <p><a href="/">返回首页</a></p>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}

function renderErrorPage(data) {
  const { settings } = data;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>服务器错误 - ${settings.site_title || 'Cloudflare Blog'}</title>
</head>
<body>
  <header>
    <h1><a href="/">${settings.site_title || 'Cloudflare Blog'}</a></h1>
    <nav>
      <a href="/">首页</a>
      <a href="/about">关于</a>
      <a href="/contact">联系</a>
    </nav>
  </header>
  
  <main>
    <section class="error">
      <h2>500 - 服务器内部错误</h2>
      <p>抱歉，服务器遇到了一些问题，请稍后重试。</p>
      <p><a href="/">返回首页</a></p>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${settings.site_title || 'Cloudflare Blog'}. Powered by Cloudflare Workers.</p>
  </footer>
</body>
</html>`;
}