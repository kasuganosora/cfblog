import { getCache, setCache } from '../utils/cache.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { renderPage, renderTemplate } from '../utils/template.js';
import { addFeaturedImagesToPosts, addFeaturedImageToPost } from '../utils/image.js';
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

    // 分类列表页面
    if (path === '/categories') {
      return await handleCategoriesList(request, env);
    }
    
    // 标签页面
    if (path.startsWith('/tag/')) {
      return await handleTagPosts(request, env);
    }

    // 标签列表页面
    if (path === '/tags') {
      return await handleTagsList(request, env);
    }

    // 留言/反馈页面
    if (path === '/feedback') {
      return await handleFeedbackPage(request, env);
    }

    // 登录页面
    if (path === '/login') {
      return await handleLoginPage(request, env);
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
    
    // 为文章添加题图信息
    const postsWithImages = addFeaturedImagesToPosts(postsResult.success ? postsResult.data : []);
    
    // 渲染页面
    const html = renderPage('home', {
      posts: postsWithImages,
      hasPosts: postsWithImages.length > 0,
      pagination: postsResult.success ? postsResult.pagination : null,
      hasMorePosts: postsResult.success && postsResult.pagination && (postsResult.pagination.totalPages > 1),
      hasPrevPage: postsResult.success && postsResult.pagination && postsResult.pagination.page > 1,
      hasNextPage: postsResult.success && postsResult.pagination && postsResult.pagination.page < postsResult.pagination.totalPages,
      prevPage: postsResult.success && postsResult.pagination ? postsResult.pagination.page - 1 : null,
      nextPage: postsResult.success && postsResult.pagination ? postsResult.pagination.page + 1 : null,
      currentPage: page,
      totalPages: postsResult.success && postsResult.pagination ? postsResult.pagination.totalPages : 1,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      blogTitle: settings.site_title || 'Retrospect',
      blogDescription: settings.site_description || '记录生活中的美好瞬间，分享摄影与生活的点点滴滴。',
      pageTitle: '首页',
      metaDescription: settings.site_description || 'A blog built with Cloudflare Workers',
      currentYear: new Date().getFullYear(),
      isHome: true
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
    
    // 为文章添加题图信息
    const postWithImage = addFeaturedImageToPost(post);
    
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
    
    // 格式化日期
    const formattedDate = new Date(postWithImage.published_at || postWithImage.created_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 渲染页面
    const html = renderPage('post', {
      ...postWithImage,
      formattedDate,
      createdAt: postWithImage.published_at || postWithImage.created_at,
      hasComments: commentsResult.success && commentsResult.data.length > 0,
      commentsCount: commentsResult.success ? commentsResult.data.length : 0,
      commentsHtml: commentsResult.success ? renderCommentsHtml(commentsResult.data) : '',
      hasAttachments: postWithImage.attachments && postWithImage.attachments.length > 0,
      categories: categoriesResult.success ? categoriesResult.data : [],
      tags: tagsResult.success ? tagsResult.data : [],
      blogTitle: settings.site_title || 'Retrospect',
      blogDescription: settings.site_description || '记录生活中的美好瞬间，分享摄影与生活的点点滴滴。',
      pageTitle: postWithImage.title,
      metaDescription: postWithImage.excerpt || postWithImage.title,
      currentYear: new Date().getFullYear(),
      isPost: true
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

// 其他路由处理函数（简化版本）
async function handleCategoryPosts(request, env) {
  // TODO: 实现分类页面
  return await handleNotFound(request, env);
}

async function handleTagPosts(request, env) {
  // TODO: 实现标签页面
  return await handleNotFound(request, env);
}

async function handleSearch(request, env) {
  // TODO: 实现搜索页面
  return await handleNotFound(request, env);
}

async function handleAbout(request, env) {
  // TODO: 实现关于页面
  return await handleNotFound(request, env);
}

async function handleContact(request, env) {
  // TODO: 实现联系页面
  return await handleNotFound(request, env);
}

async function handleSubmitFeedback(request, env) {
  // TODO: 实现反馈提交
  return await handleNotFound(request, env);
}

async function handleStaticResource(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 移除 /static 前缀
  const filePath = path.replace('/static/', '');
  
  try {
    // 在 Cloudflare Workers 中，静态文件通过 site 配置自动处理
    // 这里我们返回一个简单的重定向或者让 Workers 的静态资源处理器处理
    return new Response(null, {
      status: 404,
      statusText: 'Static resource not found'
    });
  } catch (error) {
    console.error('Static resource error:', error);
    return new Response('Static resource error', { status: 500 });
  }
}

async function handleCategoriesList(request, env) {
  // TODO: 实现分类列表页面
  return await handleNotFound(request, env);
}

async function handleTagsList(request, env) {
  // TODO: 实现标签列表页面
  return await handleNotFound(request, env);
}

async function handleFeedbackPage(request, env) {
  // TODO: 实现留言板页面
  return await handleNotFound(request, env);
}

async function handleLoginPage(request, env) {
  // TODO: 实现登录页面
  return await handleNotFound(request, env);
}

// 404 页面
async function handleNotFound(request, env) {
  const settings = await getSiteSettings(env);
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面未找到 - ${settings.site_title || 'Retrospect'}</title>
</head>
<body>
  <h1>404 - 页面未找到</h1>
  <p>抱歉，您访问的页面不存在。</p>
  <p><a href="/">返回首页</a></p>
</body>
</html>`;
  
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html',
    }
  });
}

// 服务器错误页面
async function handleServerError(request, env) {
  const settings = await getSiteSettings(env);
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>服务器错误 - ${settings.site_title || 'Retrospect'}</title>
</head>
<body>
  <h1>500 - 服务器错误</h1>
  <p>抱歉，服务器出现了错误。</p>
  <p><a href="/">返回首页</a></p>
</body>
</html>`;
  
  return new Response(html, {
    status: 500,
    headers: {
      'Content-Type': 'text/html',
    }
  });
}

// 获取网站设置
async function getSiteSettings(env) {
  // 这里应该从数据库或配置中获取网站设置
  // 暂时返回默认设置
  return {
    site_title: 'Retrospect',
    site_description: '记录生活中的美好瞬间，分享摄影与生活的点点滴滴。'
  };
}

// 渲染评论 HTML
function renderCommentsHtml(comments) {
  if (!Array.isArray(comments) || comments.length === 0) {
    return '';
  }
  
  return comments.map(comment => `
    <div class="comment" id="comment-${comment.id}">
      <div class="comment-header">
        <div class="comment-author">
          <div class="author-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <strong>${comment.author_name || comment.author_display_name || '匿名用户'}</strong>
        </div>
        <time datetime="${comment.created_at}">
          ${new Date(comment.created_at).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </time>
      </div>
      <div class="comment-content">
        <p>${comment.content}</p>
      </div>
      <div class="comment-actions">
        <button class="reply-btn" data-comment-id="${comment.id}">回复</button>
      </div>
      ${comment.replies && comment.replies.length > 0 ? `
        <div class="comment-replies">
          ${renderCommentsHtml(comment.replies)}
        </div>
      ` : ''}
    </div>
  `).join('');
}