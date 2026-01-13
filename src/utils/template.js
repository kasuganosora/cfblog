// 简单的模板渲染工具
import { inlineCSS, inlineJS } from './inline-css.js';

/**
 * 简单的 Handlebars 风格模板渲染器
 * @param {string} template - 模板字符串
 * @param {Object} data - 数据对象
 * @returns {string} - 渲染后的 HTML
 */
export function renderTemplate(template, data = {}) {
  let html = template;
  
  // 处理 {{> base}} 这样的 partial 引用
  html = html.replace(/\{\{>\s*(\w+)\s*\}\}/g, (match, partialName) => {
    // 这里应该加载对应的 partial 模板
    // 暂时返回空字符串，实际使用时需要实现 partial 加载逻辑
    return '';
  });
  
  // 处理条件语句 {{#if condition}}...{{/if}}
  html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, condition, content) => {
    if (data[condition]) {
      return renderTemplate(content, data);
    }
    return '';
  });
  
  // 处理否定条件 {{^condition}}...{{/condition}}
  html = html.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, condition, content) => {
    if (!data[condition]) {
      return renderTemplate(content, data);
    }
    return '';
  });
  
  // 处理循环 {{#each items}}...{{/each}}
  html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
    const array = data[arrayName];
    if (Array.isArray(array)) {
      return array.map(item => renderTemplate(content, { ...data, ...item })).join('');
    }
    return '';
  });
  
  // 处理简单的变量替换 {{variable}}
  html = html.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return data[varName] || '';
  });
  
  // 处理三重大括号（不转义HTML） {{{variable}}}
  html = html.replace(/\{\{\{(\w+)\}\}\}/g, (match, varName) => {
    return data[varName] || '';
  });
  
  return html;
}

/**
 * 从文件系统加载模板文件
 * @param {string} templateName - 模板名称
 * @param {Object} env - Cloudflare Workers 环境
 * @returns {Promise<string>} - 模板内容
 */
export async function loadTemplate(templateName, env) {
  try {
    // 在 Cloudflare Workers 中，我们需要将模板内容预先包含在代码中
    // 或者存储在 KV 中，这里我们返回预定义的模板
    return getTemplateContent(templateName);
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    return '';
  }
}

/**
 * 获取预定义的模板内容
 * @param {string} templateName - 模板名称
 * @returns {string} - 模板内容
 */
function getTemplateContent(templateName) {
  const templates = {
    base: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{blogTitle}} - {{pageTitle}}</title>
    <meta name="description" content="{{metaDescription}}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="icon" type="image/x-icon" href="/static/images/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>${inlineCSS}</style>
</head>
<body>
    <div class="site-container">
        <!-- 侧边栏 -->
        <aside class="sidebar">
            <div class="sidebar-content">
                <header class="site-header">
                    <h1 class="site-title">
                        <a href="/">{{blogTitle}}</a>
                    </h1>
                    <p class="site-description">{{blogDescription}}</p>
                </header>

                <nav class="main-nav">
                    <ul class="nav-list">
                        <li><a href="/" {{#isHome}}class="active"{{/isHome}}>首页</a></li>
                        <li><a href="/category/all" {{#isCategory}}class="active"{{/isCategory}}>分类</a></li>
                        <li><a href="/tag/all" {{#isTags}}class="active"{{/isTags}}>标签</a></li>
                        <li><a href="/feedback" {{#isFeedback}}class="active"{{/isFeedback}}>留言板</a></li>
                        <li><a href="/search">搜索</a></li>
                        {{#isLoggedIn}}
                        <li><a href="/admin">管理后台</a></li>
                        <li><a href="/api/user/logout">退出</a></li>
                        {{/isLoggedIn}}
                        {{^isLoggedIn}}
                        <li><a href="/login">登录</a></li>
                        {{/isLoggedIn}}
                    </ul>
                </nav>

                <div class="sidebar-about">
                    <h3>关于</h3>
                    <p>记录生活中的美好瞬间，分享摄影与生活的点点滴滴。</p>
                </div>

                <div class="sidebar-social">
                    <a href="#" class="social-link" title="Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="social-link" title="Instagram">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="#" class="social-link" title="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                </div>

                <div class="sidebar-footer">
                    <p>&copy; {{currentYear}} {{blogTitle}}</p>
                </div>
            </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
            <div class="content-wrapper">
                {{{content}}}
            </div>
        </main>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-toggle" id="mobile-menu-toggle">
            <i class="fas fa-bars"></i>
        </button>
    </div>

    <script>${inlineJS}</script>
</body>
</html>`,

    home: `<div class="posts-container">
    {{#hasPosts}}
        {{#each posts}}
        <article class="post-preview">
            {{#featuredImage}}
            <div class="post-featured-image">
                <a href="/post/{{slug}}">
                    <img src="{{featuredImage}}" alt="{{title}}" loading="lazy">
                </a>
            </div>
            {{/featuredImage}}
            
            <div class="post-preview-content">
                <header class="post-preview-header">
                    <h2 class="post-preview-title">
                        <a href="/post/{{slug}}">{{title}}</a>
                    </h2>
                    <div class="post-preview-meta">
                        <time datetime="{{createdAt}}">{{formattedDate}}</time>
                        {{#category}}
                        <span class="post-category-link">
                            <a href="/category/{{slug}}">{{name}}</a>
                        </span>
                        {{/category}}
                    </div>
                </header>
                
                <div class="post-preview-excerpt">
                    <p>{{excerpt}}</p>
                </div>
                
                {{#tags}}
                <div class="post-preview-tags">
                    {{#each .}}
                    <a href="/tag/{{slug}}" class="tag-link">#{{name}}</a>
                    {{/each}}
                </div>
                {{/tags}}
                
                <div class="post-preview-footer">
                    <a href="/post/{{slug}}" class="read-more-link">继续阅读</a>
                    <span class="comments-count">{{commentsCount}} 条评论</span>
                </div>
            </div>
        </article>
        {{/each}}
        
        {{#hasMorePosts}}
        <div class="pagination-wrapper">
            <div class="pagination">
                {{#hasPrevPage}}
                <a href="?page={{prevPage}}" class="pagination-link pagination-prev">
                    <i class="fas fa-chevron-left"></i> 上一页
                </a>
                {{/hasPrevPage}}
                
                <span class="pagination-info">第 {{currentPage}} 页，共 {{totalPages}} 页</span>
                
                {{#hasNextPage}}
                <a href="?page={{nextPage}}" class="pagination-link pagination-next">
                    下一页 <i class="fas fa-chevron-right"></i>
                </a>
                {{/hasNextPage}}
            </div>
        </div>
        {{/hasMorePosts}}
    {{/hasPosts}}
    
    {{^hasPosts}}
    <div class="no-posts-message">
        <div class="no-posts-content">
            <i class="fas fa-pen-nib"></i>
            <h3>还没有发布任何文章</h3>
            <p>这里将展示最新的文章内容，敬请期待。</p>
        </div>
    </div>
    {{/hasPosts}}
</div>`,

    post: `<article class="post-single">
    {{#featuredImage}}
    <div class="post-featured-image">
        <img src="{{featuredImage}}" alt="{{title}}" loading="lazy">
    </div>
    {{/featuredImage}}
    
    <header class="post-single-header">
        <h1 class="post-single-title">{{title}}</h1>
        <div class="post-single-meta">
            <time datetime="{{createdAt}}">{{formattedDate}}</time>
            {{#category}}
            <span class="post-single-category">
                <a href="/category/{{slug}}">{{name}}</a>
            </span>
            {{/category}}
            {{#author}}
            <span class="post-single-author">作者: <strong>{{username}}</strong></span>
            {{/author}}
        </div>
    </header>

    <div class="post-single-content">
        {{{content}}}
    </div>

    {{#hasAttachments}}
    <div class="post-attachments">
        <h3>附件下载</h3>
        <ul class="attachments-list">
            {{#each attachments}}
            <li class="attachment-item">
                <a href="/api/attachment/{{id}}" download="{{filename}}" target="_blank" class="attachment-link">
                    <i class="fas fa-download"></i>
                    <span class="attachment-name">{{filename}}</span>
                    <span class="attachment-size">({{formatFileSize size}})</span>
                </a>
            </li>
            {{/each}}
        </ul>
    </div>
    {{/hasAttachments}}

    {{#tags}}
    <div class="post-single-tags">
        <h3>标签</h3>
        <div class="tags-list">
            {{#each .}}
            <a href="/tag/{{slug}}" class="tag-link">#{{name}}</a>
            {{/each}}
        </div>
    </div>
    {{/tags}}

    <nav class="post-navigation">
        {{#prevPost}}
        <div class="post-nav-item post-nav-prev">
            <a href="/post/{{slug}}" class="post-nav-link">
                <i class="fas fa-chevron-left"></i>
                <div class="post-nav-content">
                    <span class="post-nav-label">上一篇</span>
                    <span class="post-nav-title">{{title}}</span>
                </div>
            </a>
        </div>
        {{/prevPost}}
        
        {{#nextPost}}
        <div class="post-nav-item post-nav-next">
            <a href="/post/{{slug}}" class="post-nav-link">
                <div class="post-nav-content">
                    <span class="post-nav-label">下一篇</span>
                    <span class="post-nav-title">{{title}}</span>
                </div>
                <i class="fas fa-chevron-right"></i>
            </a>
        </div>
        {{/nextPost}}
    </nav>

    <section class="comments-section" id="comments">
        <h3 class="comments-title">
            <i class="fas fa-comments"></i>
            {{commentsCount}} 条评论
        </h3>
        
        {{#isLoggedIn}}
        <div class="comment-form-wrapper">
            <h4 class="comment-form-title">发表评论</h4>
            <form action="/api/comment" method="POST" class="comment-form">
                <input type="hidden" name="postId" value="{{id}}">
                <input type="hidden" name="parentId" value="" id="parent-id">
                
                <div class="form-group">
                    <textarea name="content" placeholder="写下你的评论..." required class="comment-textarea"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="submit" id="submit-comment" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        发表评论
                    </button>
                    <button type="button" id="cancel-reply" class="btn btn-secondary" style="display: none;">
                        <i class="fas fa-times"></i>
                        取消回复
                    </button>
                </div>
            </form>
        </div>
        {{/isLoggedIn}}
        
        {{^isLoggedIn}}
        <div class="login-prompt">
            <div class="login-prompt-content">
                <i class="fas fa-user-circle"></i>
                <p><a href="/login" class="login-link">登录</a>后发表评论</p>
            </div>
        </div>
        {{/isLoggedIn}}

        <div class="comments-list">
            {{#hasComments}}
                {{{commentsHtml}}}
            {{/hasComments}}
            {{^hasComments}}
                <div class="no-comments">
                    <div class="no-comments-content">
                        <i class="fas fa-comment-dots"></i>
                        <p>还没有评论，来说点什么吧？</p>
                    </div>
                </div>
            {{/hasComments}}
        </div>
    </section>
</article>`
  };
  
  return templates[templateName] || '';
}

/**
 * 渲染完整页面
 * @param {string} templateName - 模板名称
 * @param {Object} data - 数据对象
 * @returns {string} - 渲染后的完整 HTML
 */
export function renderPage(templateName, data = {}) {
  const baseTemplate = getTemplateContent('base');
  const contentTemplate = getTemplateContent(templateName);
  
  // 渲染内容模板
  const content = renderTemplate(contentTemplate, data);
  
  // 渲染基础模板，将内容插入其中
  const fullData = {
    ...data,
    content
  };
  
  return renderTemplate(baseTemplate, fullData);
}