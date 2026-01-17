/**
 * Frontend Routes - Hono Version
 */

import { Hono } from 'hono';

const frontendRoutes = new Hono();

// GET / - 首页
frontendRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CFBlog</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        header { background: #333; color: white; padding: 1rem 2rem; }
        nav ul { display: flex; gap: 1rem; list-style: none; }
        nav a { color: white; text-decoration: none; }
        nav a:hover { text-decoration: underline; }
        main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        aside { float: right; width: 300px; margin-left: 2rem; }
        footer { background: #333; color: white; padding: 2rem; text-align: center; clear: both; }
        .post-card { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        .post-card h2 { margin-bottom: 0.5rem; }
        .post-card a { color: #333; text-decoration: none; }
        .post-card a:hover { text-decoration: underline; }
        .pagination { margin-top: 2rem; text-align: center; }
        .pagination a { padding: 0.5rem 1rem; margin: 0 0.25rem; border: 1px solid #ddd; text-decoration: none; }
        .pagination a.active { background: #333; color: white; }
        .sidebar-section { margin-bottom: 2rem; }
        .sidebar-section h3 { margin-bottom: 0.5rem; }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .tag-cloud a { padding: 0.25rem 0.75rem; background: #f0f0f0; border-radius: 4px; text-decoration: none; }

        /* 响应式设计 */
        @media (max-width: 768px) {
          [data-testid=\"desktop-navigation\"] {
            display: none;
          }
          [data-testid=\"mobile-menu-button\"] {
            display: inline-block !important;
          }
          aside {
            float: none;
            width: 100%;
            margin-left: 0;
          }
        }
      </style>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation" data-testid="desktop-navigation">
          <ul>
            <li><a href="/">首页</a></li>
            <li><a href="/categories">分类</a></li>
            <li><a href="/tags">标签</a></li>
            <li><a href="/feedback">留言</a></li>
          </ul>
        </nav>
        <div style="margin-top: 1rem;">
          <form action="/search" method="GET" data-testid="search-form" style="display: inline;">
            <input type="text" name="keyword" placeholder="搜索" data-testid="search-input" style="padding: 0.5rem; width: 200px;">
            <button type="submit" style="padding: 0.5rem;">搜索</button>
          </form>
        </div>
        <button data-testid="mobile-menu-button" style="display: none;">菜单</button>
      </header>

      <main data-testid="main">
        <aside>
          <div class="sidebar-section" data-testid="categories-list">
            <h3>分类</h3>
            <div id="categories"></div>
          </div>
          <div class="sidebar-section" data-testid="tags-list">
            <h3>标签云</h3>
            <div id="tags" class="tag-cloud"></div>
          </div>
          <div class="sidebar-section">
            <h3>主题切换</h3>
            <button data-testid="theme-switcher">切换主题</button>
          </div>
          <div class="sidebar-section">
            <h3>语言切换</h3>
            <button data-testid="language-switcher">切换语言</button>
          </div>
        </aside>

        <section id="posts">
          <h1>最新文章</h1>
          <div id="posts-list"></div>
        </section>

        <div class="pagination" id="pagination" data-testid="pagination"></div>
      </main>

      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog. All rights reserved. | <a href="/login">登录</a></p>
      </footer>

      <script>
        const API_BASE = '/api';

        // 获取数据并渲染页面
        document.addEventListener('DOMContentLoaded', async () => {
          console.log('DOM Content Loaded');
          try {
            await loadPosts();
            await loadCategories();
            await loadTags();
            console.log('All data loaded');
          } catch (error) {
            console.error('Error loading data:', error);
          }
        });

        // 获取文章列表
        async function loadPosts() {
          try {
            console.log('Loading posts from:', API_BASE + '/post/list');
            const response = await fetch(API_BASE + '/post/list');
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Posts result:', result);

            // API返回格式: {data: [...], pagination: {...}}
            if (result.data && Array.isArray(result.data)) {
              renderPosts(result.data, result.pagination);
            } else {
              console.error('Failed to load posts:', result);
            }
          } catch (error) {
            console.error('Failed to load posts:', error);
          }
        }

        // 渲染文章
        function renderPosts(posts, pagination) {
          const container = document.getElementById('posts-list');
          if (!container) {
            console.error('Posts container not found');
            return;
          }

          if (posts.length === 0) {
            container.innerHTML = '<p>暂无文章</p>';
            return;
          }

          // Clear existing content
          container.innerHTML = '';

          // Create post cards using DOM methods
          posts.forEach(function(post) {
            const card = document.createElement('article');
            card.className = 'post-card';
            card.setAttribute('data-testid', 'post-card');
            // Use slug if available, otherwise skip (no link)
            card.setAttribute('data-slug', post.slug || post.id);

            const title = document.createElement('h2');
            title.setAttribute('data-testid', 'post-title');

            // 文章链接:优先使用slug,否则使用ID
            const titleLink = document.createElement('a');
            if (post.slug) {
              titleLink.href = '/post/' + post.slug;
            } else {
              titleLink.href = '/post/' + post.id;
            }
            titleLink.textContent = post.title;
            title.appendChild(titleLink);
            card.appendChild(title);

            const excerpt = document.createElement('p');
            excerpt.setAttribute('data-testid', 'post-excerpt');
            excerpt.textContent = post.excerpt || '暂无摘要';
            card.appendChild(excerpt);

            const meta = document.createElement('small');
            meta.textContent = '作者: ' + escapeHtml(post.author_name || 'Unknown') + ' | ' +
              '发布于: ' + new Date(post.created_at).toLocaleDateString('zh-CN') + ' | ' +
              '浏览: ' + (post.view_count || 0);
            card.appendChild(meta);

            container.appendChild(card);
          });

          console.log('Posts rendered:', posts.length);

          // 渲染分页
          if (pagination) {
            renderPagination(pagination);
          }
        }

        // 获取分类列表
        async function loadCategories() {
          try {
            console.log('Loading categories from:', API_BASE + '/category/list');
            const response = await fetch(API_BASE + '/category/list');
            const result = await response.json();
            console.log('Categories result:', result);

            // API返回格式: {data: [...], pagination: {...}}
            if (result.data && Array.isArray(result.data)) {
              renderCategories(result.data);
            } else {
              console.error('Unexpected categories format:', result);
            }
          } catch (error) {
            console.error('Failed to load categories:', error);
          }
        }

        // 渲染分类
        function renderCategories(categories) {
          const container = document.getElementById('categories');
          if (!container) return;

          if (categories.length === 0) {
            container.innerHTML = '<p>暂无分类</p>';
            return;
          }

          container.innerHTML = '';

          categories.forEach(function(cat) {
            console.log('Category data:', cat); // Debug: 查看分类数据
            const p = document.createElement('p');
            const a = document.createElement('a');
            // 优先使用slug，如果slug不存在则使用ID
            const linkParam = cat.slug ? cat.slug : cat.id;
            a.href = '/category/' + linkParam;
            a.setAttribute('data-testid', 'category-link');
            a.setAttribute('data-slug', linkParam);
            a.textContent = cat.name + ' (' + (cat.post_count || 0) + ')';
            p.appendChild(a);
            container.appendChild(p);
          });

          console.log('Categories rendered:', categories.length);
        }

        // 获取标签列表
        async function loadTags() {
          try {
            console.log('Loading tags from:', API_BASE + '/tag/list');
            const response = await fetch(API_BASE + '/tag/list');
            const result = await response.json();
            console.log('Tags result:', result);

            // API返回格式: {data: [...], pagination: {...}}
            if (result.data && Array.isArray(result.data)) {
              renderTags(result.data);
            } else {
              console.error('Unexpected tags format:', result);
            }
          } catch (error) {
            console.error('Failed to load tags:', error);
          }
        }

        // 渲染标签
        function renderTags(tags) {
          const container = document.getElementById('tags');
          if (!container) return;

          if (tags.length === 0) {
            container.innerHTML = '<p>暂无标签</p>';
            return;
          }

          container.innerHTML = '';

          tags.forEach(function(tag) {
            console.log('Tag data:', tag); // Debug: 查看标签数据
            const a = document.createElement('a');
            // 优先使用slug，如果slug不存在则使用ID
            const linkParam = tag.slug ? tag.slug : tag.id;
            a.href = '/tag/' + linkParam;
            a.setAttribute('data-testid', 'tag-link');
            a.setAttribute('data-slug', linkParam);
            a.textContent = tag.name + ' (' + (tag.post_count || 0) + ')';
            container.appendChild(a);
          });

          console.log('Tags rendered:', tags.length);
        }

        // 渲染分页
        function renderPagination(pagination) {
          const container = document.getElementById('pagination');
          if (!container) return;

          const page = pagination.page;
          const totalPages = pagination.totalPages;
          let html = '';

          // 上一页
          if (page > 1) {
            html += '<a href="?page=' + (page - 1) + '" data-page="' + (page - 1) + '">上一页</a>';
          }

          // 页码
          for (let i = 1; i <= totalPages; i++) {
            const active = i === page ? ' active' : '';
            html += '<a href="?page=' + i + '" data-page="' + i + '" class="' + active + '">' + i + '</a>';
          }

          // 下一页
          if (page < totalPages) {
            html += '<a href="?page=' + (page + 1) + '" data-page="' + (page + 1) + '">下一页</a>';
          }

          container.innerHTML = html;
        }

        // HTML转义
        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        // 主题切换
        document.querySelector('[data-testid="theme-switcher"]')?.addEventListener('click', function() {
          const currentTheme = localStorage.getItem('userTheme') || 'default';
          const newTheme = currentTheme === 'default' ? 'dark' : 'default';
          localStorage.setItem('userTheme', newTheme);
          document.body.setAttribute('data-theme', newTheme);
          console.log('Theme switched to:', newTheme);
        });

        // 语言切换
        document.querySelector('[data-testid="language-switcher"]')?.addEventListener('click', function() {
          const currentLang = localStorage.getItem('userLanguage') || 'zh-cn';
          const newLang = currentLang === 'zh-cn' ? 'en-us' : 'zh-cn';
          localStorage.setItem('userLanguage', newLang);
          document.documentElement.lang = newLang;
          console.log('Language switched to:', newLang);
        });
      </script>
    </body>
    </html>
  `);
});

// GET /post/:slug - 文章详情
frontendRoutes.get('/post/:slug', (c) => {
  const slug = c.req.param('slug');
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>文章详情 - CFBlog</title>
      <style>
        main { max-width: 900px; margin: 2rem auto; padding: 0 2rem; }
        article { margin-bottom: 3rem; }
        .post-meta { color: #666; margin: 1rem 0; }
        .post-content { line-height: 1.8; color: #333; }
        .comments-section { margin-top: 3rem; border-top: 2px solid #ddd; padding-top: 2rem; }
        .comment-form { background: #f9f9f9; padding: 1.5rem; border-radius: 4px; margin-bottom: 2rem; }
        .comment-form div { margin-bottom: 1rem; }
        .comment-form label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        .comment-form input, .comment-form textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
        .comment-form button { padding: 0.75rem 2rem; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .comment-form button:hover { background: #555; }
        .comments-list { margin-top: 2rem; }
        .comment-item { padding: 1.5rem; border-bottom: 1px solid #ddd; }
        .comment-item:last-child { border-bottom: none; }
        .comment-author { font-weight: bold; color: #333; margin-bottom: 0.5rem; }
        .comment-content { color: #555; line-height: 1.6; }
        .comment-date { color: #999; font-size: 0.85rem; margin-top: 0.5rem; }
        #comment-message { margin-bottom: 1rem; padding: 1rem; border-radius: 4px; display: none; }
        #comment-message.success { background: #d4edda; color: #155724; }
        #comment-message.error { background: #f8d7da; color: #721c24; }
        .comments-disabled { background: #fff3cd; padding: 1.5rem; border-radius: 4px; color: #856404; text-align: center; }
      </style>
    </head>
    <body data-testid="post-detail">
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main data-testid="main">
        <article data-testid="post-article">
          <h1 data-testid="post-title">加载中...</h1>
          <div data-testid="post-meta" class="post-meta"></div>
          <div data-testid="post-content" class="post-content">
            <p>内容加载中...</p>
          </div>
        </article>
        <div id="comments-container"></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog</p>
      </footer>
      <script>
        const API_BASE = '/api';
        const postParam = '${slug}';
        let currentPost = null;

        document.addEventListener('DOMContentLoaded', async function() {
          try {
            // 判断参数是ID还是slug
            const isNumeric = !isNaN(parseInt(postParam));
            let apiUrl;

            if (isNumeric) {
              // 如果是数字,通过ID查询
              apiUrl = API_BASE + '/post/' + postParam;
            } else {
              // 如果是slug,通过slug查询
              apiUrl = API_BASE + '/post/slug/' + postParam;
            }

            const response = await fetch(apiUrl);
            const result = await response.json();

            // API直接返回文章对象，不包装在success/data中
            if (result && result.id) {
              currentPost = result;
              document.querySelector('[data-testid="post-title"]').textContent = result.title;
              document.querySelector('[data-testid="post-content"]').innerHTML = result.excerpt || '<p>暂无内容</p>';

              // 显示文章元数据
              const metaHtml = '<p>作者: ' + escapeHtml(result.author_name || 'Unknown') + '</p>' +
                '<p>发布于: ' + new Date(result.created_at).toLocaleDateString('zh-CN') + '</p>' +
                '<p>浏览: ' + (result.view_count || 0) + '</p>';
              document.querySelector('[data-testid="post-meta"]').innerHTML = metaHtml;

              // 根据评论状态显示或隐藏评论区域
              if (result.comment_status === 0) {
                document.getElementById('comments-container').innerHTML = '<div class="comments-disabled">本文已关闭评论</div>';
              } else {
                // 显示评论区域
                renderCommentsSection(result.id);
              }
            } else {
              document.querySelector('[data-testid="post-title"]').textContent = '文章不存在';
              document.querySelector('[data-testid="post-content"]').innerHTML = '';
            }
          } catch (error) {
            console.error('Failed to load post:', error);
            document.querySelector('[data-testid="post-content"]').innerHTML = '<p>加载失败</p>';
          }
        });

        function renderCommentsSection(postId) {
          const container = document.getElementById('comments-container');
          container.innerHTML = '<section class="comments-section" data-testid="comments-section">' +
            '<h2>评论</h2>' +
            '<div id="comment-message"></div>' +
            '<form class="comment-form" id="comment-form">' +
              '<div>' +
                '<label for="author">昵称</label>' +
                '<input type="text" id="author" name="author" required>' +
              '</div>' +
              '<div>' +
                '<label for="email">邮箱 (可选)</label>' +
                '<input type="email" id="email" name="email">' +
              '</div>' +
              '<div>' +
                '<label for="comment-content">评论内容</label>' +
                '<textarea id="comment-content" name="content" rows="4" required></textarea>' +
              '</div>' +
              '<button type="submit">发表评论</button>' +
            '</form>' +
            '<div class="comments-list" id="comments"></div>' +
            '</section>';

          // 加载评论列表
          loadComments(postId);

          // 绑定表单提交事件
          document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);
        }

        async function loadComments(postId) {
          try {
            const response = await fetch(API_BASE + '/comment/post/' + postId);
            const result = await response.json();

            console.log('Comments API response:', result);

            // 评论API返回格式: {data: [...], pagination: {...}}
            // 每个comment可能包含replies数组
            if (result.data && Array.isArray(result.data)) {
              renderComments(result.data);
            } else {
              renderComments([]);
            }
          } catch (error) {
            console.error('Failed to load comments:', error);
            const container = document.getElementById('comments');
            if (container) {
              container.innerHTML = '<p>加载评论失败</p>';
            }
          }
        }

        function renderComments(comments) {
          const container = document.getElementById('comments');
          if (!container) return;

          if (comments.length === 0) {
            container.innerHTML = '<p>暂无评论，快来抢沙发吧！</p>';
            return;
          }

          container.innerHTML = '';

          // 渲染评论（包括回复）
          comments.forEach(function(comment) {
            // 渲染主评论
            renderSingleComment(container, comment, 0);

            // 渲染回复
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.forEach(function(reply) {
                renderSingleComment(container, reply, 1);
              });
            }
          });
        }

        function renderSingleComment(container, comment, level) {
          const div = document.createElement('div');
          div.className = 'comment-item';
          // 根据嵌套层级添加左边距
          if (level > 0) {
            div.style.marginLeft = (level * 2) + 'rem';
            div.style.paddingLeft = '1.5rem';
            div.style.borderLeft = '3px solid #e0e0e0';
            div.style.backgroundColor = '#fafafa';
          }
          div.innerHTML = '<div class="comment-author">' + escapeHtml(comment.author_name) +
            '</div><div class="comment-content">' + escapeHtml(comment.content) +
            '</div><div class="comment-date">' + new Date(comment.created_at).toLocaleString('zh-CN') + '</div>';
          container.appendChild(div);
        }

        async function handleCommentSubmit(e) {
          e.preventDefault();

          const author = document.getElementById('author').value.trim();
          const email = document.getElementById('email').value.trim();
          const content = document.getElementById('comment-content').value.trim();
          const messageDiv = document.getElementById('comment-message');

          // 验证
          if (!author || !content) {
            showCommentMessage('请填写昵称和评论内容', 'error');
            return;
          }

          try {
            const response = await fetch(API_BASE + '/comment/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                post_id: currentPost.id,
                author_name: author,
                author_email: email,
                content: content
              })
            });

            const result = await response.json();

            if (response.ok) {
              showCommentMessage('评论发表成功！', 'success');
              document.getElementById('comment-form').reset();
              // 重新加载评论列表
              loadComments(currentPost.id);
            } else {
              showCommentMessage(result.message || '评论发表失败，请稍后重试', 'error');
            }
          } catch (error) {
            console.error('Submit comment error:', error);
            showCommentMessage('评论发表失败，请稍后重试', 'error');
          }
        }

        function showCommentMessage(text, type) {
          const messageDiv = document.getElementById('comment-message');
          messageDiv.textContent = text;
          messageDiv.className = type;
          messageDiv.style.display = 'block';

          setTimeout(() => {
            messageDiv.style.display = 'none';
          }, 5000);
        }

        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
      </script>
    </body>
    </html>
  `);
});

// GET /login - 登录页
frontendRoutes.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>登录 - CFBlog</title>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main>
        <h1>登录</h1>
        <form data-testid="login-form" method="POST" action="/api/user/login">
          <div>
            <label for="username">用户名</label>
            <input type="text" id="username" name="username" required data-testid="username-input">
          </div>
          <div>
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required data-testid="password-input">
          </div>
          <button type="submit" data-testid="login-button">登录</button>
        </form>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog</p>
      </footer>
    </body>
    </html>
  `);
});

// GET /search - 搜索页
frontendRoutes.get('/search', (c) => {
  const keyword = c.req.query('keyword') || '';
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>搜索 - CFBlog</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        header { background: #333; color: white; padding: 1rem 2rem; }
        nav a { color: white; text-decoration: none; }
        main { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .result-item { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        .result-item h2 { margin-bottom: 0.5rem; }
        .result-item a { color: #333; text-decoration: none; }
        .result-item a:hover { text-decoration: underline; }
        footer { background: #333; color: white; padding: 2rem; text-align: center; }
      </style>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main>
        <h1>搜索</h1>
        <form data-testid="search-form" method="GET" action="/search">
          <input type="text" name="keyword" value="${escapeHtml(keyword)}" placeholder="输入关键词" data-testid="search-input" style="padding: 0.5rem; width: 300px;">
          <button type="submit" data-testid="search-button" style="padding: 0.5rem;">搜索</button>
        </form>
        <div data-testid="search-results" id="results"></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog</p>
      </footer>
      <script>
        const API_BASE = '/api';
        const initialKeyword = '${escapeHtml(keyword)}';

        document.addEventListener('DOMContentLoaded', function() {
          if (initialKeyword) {
            performSearch(initialKeyword);
          }
        });

        async function performSearch(keyword) {
          if (!keyword.trim()) {
            document.getElementById('results').innerHTML = '<p>请输入关键词</p>';
            return;
          }

          try {
            const response = await fetch(API_BASE + '/post/search?keyword=' + encodeURIComponent(keyword));
            const result = await response.json();

            console.log('Search result:', result);

            // 搜索API返回格式: {results: [...], pagination: {...}}
            const posts = result.results || result.data || [];

            if (Array.isArray(posts)) {
              renderResults(posts, keyword);
            } else {
              document.getElementById('results').innerHTML = '<p>未找到相关文章</p>';
            }
          } catch (error) {
            console.error('Search error:', error);
            document.getElementById('results').innerHTML = '<p>搜索失败，请稍后重试</p>';
          }
        }

        function renderResults(posts, keyword) {
          const container = document.getElementById('results');

          if (posts.length === 0) {
            container.innerHTML = '<p>未找到包含 "' + escapeHtml(keyword) + '" 的文章</p>';
            return;
          }

          let html = '<p>找到 ' + posts.length + ' 篇相关文章</p>';
          posts.forEach(function(post) {
            const postUrl = post.slug ? '/post/' + post.slug : '/post/' + post.id;
            html += '<div class="result-item">';
            html += '<h2><a href="' + postUrl + '">' + escapeHtml(post.title) + '</a></h2>';
            html += '<p>' + escapeHtml(post.excerpt || '暂无摘要') + '</p>';
            html += '<small>发布于: ' + new Date(post.created_at).toLocaleDateString('zh-CN') + '</small>';
            html += '</div>';
          });

          container.innerHTML = html;
        }

        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
      </script>
    </body>
    </html>
  `);
});

// GET /feedback - 反馈页
frontendRoutes.get('/feedback', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>留言板 - CFBlog</title>
      <style>
        main { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
        h2 { margin-top: 2rem; }
        form { display: flex; flex-direction: column; gap: 1rem; }
        div { display: flex; flex-direction: column; gap: 0.5rem; }
        label { font-weight: bold; }
        input, textarea { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 0.75rem 1.5rem; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #555; }
        #message { margin-top: 1rem; padding: 1rem; border-radius: 4px; display: none; }
        #message.success { background: #d4edda; color: #155724; }
        #message.error { background: #f8d7da; color: #721c24; }
        #feedback-list { margin-top: 2rem; }
        .feedback-item { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; background: #f9f9f9; }
        .feedback-item h3 { margin: 0 0 0.5rem 0; color: #333; }
        .feedback-item .email { color: #666; font-size: 0.9rem; }
        .feedback-item .content { margin-top: 0.5rem; color: #444; }
        .feedback-item .date { margin-top: 0.5rem; color: #999; font-size: 0.85rem; }
      </style>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main>
        <h1>留言板</h1>
        <div id="message"></div>
        <form data-testid="feedback-form" id="feedback-form">
          <div>
            <label for="name">姓名</label>
            <input type="text" id="name" name="name" required data-testid="feedback-name-input">
          </div>
          <div>
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" data-testid="feedback-email-input">
          </div>
          <div>
            <label for="content">内容</label>
            <textarea id="content" name="content" required data-testid="feedback-content-input" rows="5"></textarea>
          </div>
          <button type="submit" data-testid="feedback-submit-button">提交</button>
        </form>
        <h2>最新留言</h2>
        <div id="feedback-list"><p>加载中...</p></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog</p>
      </footer>
      <script>
        const API_BASE = '/api';

        // Load feedback list on page load
        document.addEventListener('DOMContentLoaded', loadFeedbackList);

        // Load feedback list
        async function loadFeedbackList() {
          try {
            const response = await fetch(API_BASE + '/feedback/list');
            const result = await response.json();

            if (result.data && Array.isArray(result.data)) {
              renderFeedbackList(result.data);
            } else {
              document.getElementById('feedback-list').innerHTML = '<p>暂无留言</p>';
            }
          } catch (error) {
            console.error('Load feedback error:', error);
            document.getElementById('feedback-list').innerHTML = '<p>加载失败</p>';
          }
        }

        // Render feedback list
        function renderFeedbackList(feedbacks) {
          const container = document.getElementById('feedback-list');

          if (feedbacks.length === 0) {
            container.innerHTML = '<p>暂无留言</p>';
            return;
          }

          container.innerHTML = '';
          feedbacks.forEach(function(fb) {
            const div = document.createElement('div');
            div.className = 'feedback-item';
            div.innerHTML = '<h3>' + escapeHtml(fb.name) + '</h3>' +
              (fb.email ? '<p class="email">' + escapeHtml(fb.email) + '</p>' : '') +
              '<p class="content">' + escapeHtml(fb.content) + '</p>' +
              '<p class="date">发布于: ' + new Date(fb.created_at).toLocaleString('zh-CN') + '</p>';
            container.appendChild(div);
          });
        }

        // Submit feedback form
        document.getElementById('feedback-form').addEventListener('submit', async function(e) {
          e.preventDefault();

          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          const content = document.getElementById('content').value;
          const messageDiv = document.getElementById('message');

          // Validate
          if (!name || !content) {
            showMessage('请填写姓名和内容', 'error');
            return;
          }

          try {
            const response = await fetch(API_BASE + '/feedback/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, email, content })
            });

            const result = await response.json();

            if (response.ok) {
              showMessage('留言提交成功！', 'success');
              document.getElementById('feedback-form').reset();
              // Reload feedback list
              loadFeedbackList();
            } else {
              showMessage(result.message || '提交失败，请稍后重试', 'error');
            }
          } catch (error) {
            console.error('Submit feedback error:', error);
            showMessage('提交失败，请稍后重试', 'error');
          }
        });

        // Show message
        function showMessage(text, type) {
          const messageDiv = document.getElementById('message');
          messageDiv.textContent = text;
          messageDiv.className = type;
          messageDiv.style.display = 'block';

          // Auto hide after 5 seconds
          setTimeout(() => {
            messageDiv.style.display = 'none';
          }, 5000);
        }

        // Escape HTML
        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
      </script>
    </body>
    </html>
  `);
});

// GET /categories - 分类列表页
frontendRoutes.get('/categories', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>分类 - CFBlog</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        header { background: #333; color: white; padding: 1rem 2rem; }
        nav a { color: white; text-decoration: none; margin-right: 1rem; }
        main { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .category-item { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
        .category-item h2 { margin-bottom: 0.5rem; }
        .category-item a { color: #333; text-decoration: none; }
        .category-item a:hover { text-decoration: underline; }
        footer { background: #333; color: white; padding: 2rem; text-align: center; margin-top: 2rem; }
      </style>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">首页</a>
          <a href="/categories">分类</a>
          <a href="/tags">标签</a>
        </nav>
      </header>
      <main data-testid="main">
        <h1>分类列表</h1>
        <div id="categories-list"></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog. All rights reserved. | <a href="/login">登录</a></p>
      </footer>
      <script>
        const API_BASE = '/api';

        async function loadCategories() {
          try {
            const response = await fetch(API_BASE + '/category/list');
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
              renderCategories(result.data);
            }
          } catch (error) {
            console.error('Failed to load categories:', error);
          }
        }

        function renderCategories(categories) {
          const container = document.getElementById('categories-list');
          if (!container) return;

          if (categories.length === 0) {
            container.innerHTML = '<p>暂无分类</p>';
            return;
          }

          container.innerHTML = categories.map(cat => {
            const linkParam = cat.slug ? cat.slug : cat.id;
            return \`<div class="category-item">
              <h2>
                <a href="/category/\${linkParam}">\${escapeHtml(cat.name)}</a>
              </h2>
              <p>\${escapeHtml(cat.description || '暂无描述')}</p>
              <small>文章数: \${cat.post_count || 0}</small>
            </div>\`;
          }).join('');
        }

        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        document.addEventListener('DOMContentLoaded', loadCategories);
      </script>
    </body>
    </html>
  `);
});

// GET /category/:slug - 分类详情页
frontendRoutes.get('/category/:slug', (c) => {
  const slug = c.req.param('slug');
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>分类详情 - CFBlog</title>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main data-testid="main">
        <h1>分类: ${escapeHtml(slug)}</h1>
        <div id="posts-list"><p>加载中...</p></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog. All rights reserved. | <a href="/login">登录</a></p>
      </footer>
      <script>
        const API_BASE = '/api';
        const categoryParam = '${slug}';

        document.addEventListener('DOMContentLoaded', async function() {
          try {
            // 判断参数是ID还是slug
            const isNumeric = !isNaN(parseInt(categoryParam));
            let apiUrl;

            if (isNumeric) {
              apiUrl = API_BASE + '/category/' + categoryParam;
            } else {
              apiUrl = API_BASE + '/category/slug/' + categoryParam;
            }

            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result && result.id) {
              document.querySelector('h1').textContent = '分类: ' + result.name;
              document.getElementById('posts-list').innerHTML = '<p>分类描述: ' + (result.description || '暂无描述') + '</p><p>文章数: ' + (result.post_count || 0) + '</p>';
            } else {
              document.getElementById('posts-list').innerHTML = '<p>分类不存在</p>';
            }
          } catch (error) {
            console.error('Failed to load category:', error);
            document.getElementById('posts-list').innerHTML = '<p>加载失败</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// GET /tags - 标签列表页
frontendRoutes.get('/tags', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>标签 - CFBlog</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        header { background: #333; color: white; padding: 1rem 2rem; }
        nav a { color: white; text-decoration: none; margin-right: 1rem; }
        main { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .tag-cloud a { padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333; }
        .tag-cloud a:hover { background: #e0e0e0; }
        footer { background: #333; color: white; padding: 2rem; text-align: center; margin-top: 2rem; }
      </style>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">首页</a>
          <a href="/categories">分类</a>
          <a href="/tags">标签</a>
        </nav>
      </header>
      <main data-testid="main">
        <h1>标签列表</h1>
        <div class="tag-cloud" id="tags-list"></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog. All rights reserved. | <a href="/login">登录</a></p>
      </footer>
      <script>
        const API_BASE = '/api';

        async function loadTags() {
          try {
            const response = await fetch(API_BASE + '/tag/list');
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
              renderTags(result.data);
            }
          } catch (error) {
            console.error('Failed to load tags:', error);
          }
        }

        function renderTags(tags) {
          const container = document.getElementById('tags-list');
          if (!container) return;

          if (tags.length === 0) {
            container.innerHTML = '<p>暂无标签</p>';
            return;
          }

          container.innerHTML = '';
          tags.forEach(function(tag) {
            console.log('Tag data (tags page):', tag);
            const a = document.createElement('a');
            const linkParam = tag.slug ? tag.slug : tag.id;
            a.href = '/tag/' + linkParam;
            a.textContent = tag.name + ' (' + (tag.post_count || 0) + ')';
            container.appendChild(a);
          });
        }

        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        document.addEventListener('DOMContentLoaded', loadTags);
      </script>
    </body>
    </html>
  `);
});

// GET /tag/:slug - 标签详情页
frontendRoutes.get('/tag/:slug', (c) => {
  const slug = c.req.param('slug');
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>标签 - CFBlog</title>
    </head>
    <body>
      <header data-testid="header">
        <nav data-testid="navigation">
          <a href="/">返回首页</a>
        </nav>
      </header>
      <main data-testid="main">
        <h1>标签: ${escapeHtml(slug)}</h1>
        <div id="posts-list"><p>加载中...</p></div>
      </main>
      <footer data-testid="footer">
        <p>&copy; 2024 CFBlog. All rights reserved. | <a href="/login">登录</a></p>
      </footer>
      <script>
        const API_BASE = '/api';
        const tagParam = '${slug}';

        document.addEventListener('DOMContentLoaded', async function() {
          try {
            // 判断参数是ID还是slug
            const isNumeric = !isNaN(parseInt(tagParam));
            let apiUrl;

            if (isNumeric) {
              apiUrl = API_BASE + '/tag/' + tagParam;
            } else {
              apiUrl = API_BASE + '/tag/slug/' + tagParam;
            }

            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result && result.id) {
              document.querySelector('h1').textContent = '标签: ' + result.name;
              document.getElementById('posts-list').innerHTML = '<p>文章数: ' + (result.post_count || 0) + '</p>';
            } else {
              document.getElementById('posts-list').innerHTML = '<p>标签不存在</p>';
            }
          } catch (error) {
            console.error('Failed to load tag:', error);
            document.getElementById('posts-list').innerHTML = '<p>加载失败</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { frontendRoutes };
