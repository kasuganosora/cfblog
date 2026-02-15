/**
 * Admin Routes - Hono Version
 * 管理后台所有页面
 */

import { Hono } from 'hono';
import { requireAdmin } from './base.js';

const adminRoutes = new Hono();

// ============================================================
// Shared layout helper
// ============================================================
function adminLayout(title, activePage, bodyContent) {
  const navItems = [
    { key: 'dashboard', label: '仪表板', icon: '&#9632;', href: '/admin' },
    { key: 'posts', label: '文章管理', icon: '&#9998;', href: '/admin/posts' },
    { key: 'categories', label: '分类管理', icon: '&#9776;', href: '/admin/categories' },
    { key: 'tags', label: '标签管理', icon: '&#9830;', href: '/admin/tags' },
    { key: 'comments', label: '评论管理', icon: '&#9993;', href: '/admin/comments' },
    { key: 'feedback', label: '留言管理', icon: '&#9733;', href: '/admin/feedback' },
    { key: 'users', label: '用户管理', icon: '&#9786;', href: '/admin/users' },
    { key: 'settings', label: '系统设置', icon: '&#9881;', href: '/admin/settings' },
  ];

  const navHtml = navItems.map(item => {
    const activeClass = item.key === activePage ? ' active' : '';
    return `<a href="${item.href}" class="nav-item${activeClass}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
  }).join('\n          ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - CFBlog Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; color: #333; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 220px; background: #1a1a2e; color: #fff; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }
    .sidebar-header { padding: 1.5rem 1rem; border-bottom: 1px solid #2a2a4a; }
    .sidebar-header h2 { font-size: 1.1rem; }
    .sidebar-header a { color: #fff; text-decoration: none; }
    .sidebar-nav { padding: 0.5rem 0; }
    .nav-item { display: flex; align-items: center; padding: 0.75rem 1.25rem; color: #a0a0b8; text-decoration: none; transition: all 0.2s; font-size: 0.9rem; }
    .nav-item:hover { background: #2a2a4a; color: #fff; }
    .nav-item.active { background: #16213e; color: #4fc3f7; border-left: 3px solid #4fc3f7; }
    .nav-icon { margin-right: 0.75rem; font-size: 1rem; width: 1.2rem; text-align: center; }
    .sidebar-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; border-top: 1px solid #2a2a4a; }
    .sidebar-footer a { color: #a0a0b8; text-decoration: none; font-size: 0.85rem; }
    .sidebar-footer a:hover { color: #fff; }
    .main { margin-left: 220px; flex: 1; }
    .topbar { background: #fff; padding: 1rem 2rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
    .topbar h1 { font-size: 1.25rem; font-weight: 600; }
    .topbar-actions a { color: #666; text-decoration: none; margin-left: 1rem; font-size: 0.9rem; }
    .topbar-actions a:hover { color: #333; }
    .content { padding: 1.5rem 2rem; }

    /* Cards */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #fff; padding: 1.25rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-card .label { font-size: 0.85rem; color: #888; margin-bottom: 0.25rem; }
    .stat-card .value { font-size: 1.75rem; font-weight: 700; }
    .stat-card.blue .value { color: #1976d2; }
    .stat-card.green .value { color: #388e3c; }
    .stat-card.orange .value { color: #f57c00; }
    .stat-card.purple .value { color: #7b1fa2; }

    /* Tables */
    .card { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; }
    .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { font-size: 1rem; font-weight: 600; }
    .card-body { padding: 0; }
    .card-body.padded { padding: 1.25rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.75rem 1rem; background: #fafafa; font-size: 0.85rem; color: #666; font-weight: 600; border-bottom: 1px solid #eee; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; vertical-align: middle; }
    tr:hover td { background: #f8f9fa; }
    tr:last-child td { border-bottom: none; }

    /* Badges */
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .badge-yellow { background: #fff8e1; color: #f57f17; }
    .badge-red { background: #fbe9e7; color: #c62828; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-gray { background: #f5f5f5; color: #616161; }

    /* Buttons */
    .btn { display: inline-block; padding: 0.4rem 1rem; border: none; border-radius: 4px; font-size: 0.85rem; cursor: pointer; text-decoration: none; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-success { background: #388e3c; color: #fff; }
    .btn-danger { background: #d32f2f; color: #fff; }
    .btn-secondary { background: #757575; color: #fff; }
    .btn-sm { padding: 0.25rem 0.6rem; font-size: 0.8rem; }

    /* Forms */
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.4rem; font-size: 0.9rem; font-weight: 500; color: #555; }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;
      font-family: inherit; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
      outline: none; border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15);
    }
    .form-group textarea { resize: vertical; min-height: 120px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }

    /* Pagination */
    .pagination { display: flex; gap: 0.25rem; justify-content: center; padding: 1rem; }
    .pagination a, .pagination span { display: inline-block; padding: 0.4rem 0.75rem; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #333; font-size: 0.85rem; }
    .pagination a:hover { background: #f0f0f0; }
    .pagination .active { background: #1976d2; color: #fff; border-color: #1976d2; }

    /* Modal */
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }
    .modal-overlay.show { display: flex; }
    .modal { background: #fff; border-radius: 8px; padding: 1.5rem; width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto; }
    .modal h3 { margin-bottom: 1rem; }

    /* Toast */
    .toast { position: fixed; top: 1rem; right: 1rem; padding: 0.75rem 1.25rem; border-radius: 4px; color: #fff; font-size: 0.9rem; z-index: 2000; display: none; }
    .toast.success { background: #388e3c; }
    .toast.error { background: #d32f2f; }
    .toast.show { display: block; }

    /* Empty state */
    .empty-state { text-align: center; padding: 3rem; color: #888; }

    /* Checkbox/radio inline */
    .form-check { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .form-check input { width: auto; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2><a href="/admin">CFBlog Admin</a></h2>
      </div>
      <nav class="sidebar-nav">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <a href="/" target="_blank">查看网站</a> | <a href="#" onclick="logout()">退出登录</a>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <h1>${escapeHtml(title)}</h1>
        <div class="topbar-actions">
          <a href="/" target="_blank">查看网站</a>
        </div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
    </div>
  </div>
  <div class="toast" id="toast"></div>
  <script>
    const API = '/api';

    function showToast(msg, type) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast ' + type + ' show';
      setTimeout(() => { t.className = 'toast'; }, 3000);
    }

    async function apiCall(url, options) {
      try {
        const res = await fetch(API + url, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
      } catch (e) {
        showToast(e.message, 'error');
        throw e;
      }
    }

    function logout() {
      fetch(API + '/user/logout', { method: 'POST' })
        .then(() => { window.location.href = '/login'; })
        .catch(() => { window.location.href = '/login'; });
    }

    function escapeHtml(t) {
      if (!t) return '';
      const d = document.createElement('div');
      d.textContent = t;
      return d.innerHTML;
    }

    function truncate(str, len) {
      if (!str) return '';
      return str.length > len ? str.substring(0, len) + '...' : str;
    }

    function formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('zh-CN');
    }
  </script>
</body>
</html>`;
}

// HTML escape helper (server-side)
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// Dashboard
// ============================================================
adminRoutes.get('/', requireAdmin, (c) => {
  return c.html(adminLayout('仪表板', 'dashboard', `
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card blue"><div class="label">文章总数</div><div class="value" id="stat-posts">-</div></div>
      <div class="stat-card green"><div class="label">评论总数</div><div class="value" id="stat-comments">-</div></div>
      <div class="stat-card orange"><div class="label">用户总数</div><div class="value" id="stat-users">-</div></div>
      <div class="stat-card purple"><div class="label">留言总数</div><div class="value" id="stat-feedback">-</div></div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      <div class="card">
        <div class="card-header"><h3>最新文章</h3></div>
        <div class="card-body">
          <table><thead><tr><th>标题</th><th>状态</th><th>日期</th></tr></thead><tbody id="recent-posts"></tbody></table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>最新评论</h3></div>
        <div class="card-body">
          <table><thead><tr><th>作者</th><th>内容</th><th>日期</th></tr></thead><tbody id="recent-comments"></tbody></table>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', async function() {
        try {
          const [posts, comments, users, feedback] = await Promise.all([
            apiCall('/post/list?limit=5'),
            apiCall('/comment/list?limit=5'),
            apiCall('/user/list?limit=5'),
            apiCall('/feedback/list?limit=5')
          ]);

          document.getElementById('stat-posts').textContent = posts.pagination?.total || 0;
          document.getElementById('stat-comments').textContent = comments.pagination?.total || 0;
          document.getElementById('stat-users').textContent = users.pagination?.total || 0;
          document.getElementById('stat-feedback').textContent = feedback.pagination?.total || 0;

          const postsBody = document.getElementById('recent-posts');
          if (posts.data && posts.data.length > 0) {
            posts.data.forEach(function(p) {
              const status = p.status === 1 ? '<span class="badge badge-green">已发布</span>' : '<span class="badge badge-yellow">草稿</span>';
              postsBody.innerHTML += '<tr><td>' + escapeHtml(truncate(p.title, 30)) + '</td><td>' + status + '</td><td>' + formatDate(p.created_at) + '</td></tr>';
            });
          } else {
            postsBody.innerHTML = '<tr><td colspan="3" class="empty-state">暂无文章</td></tr>';
          }

          const commentsBody = document.getElementById('recent-comments');
          if (comments.data && comments.data.length > 0) {
            comments.data.forEach(function(cm) {
              commentsBody.innerHTML += '<tr><td>' + escapeHtml(cm.author_name) + '</td><td>' + escapeHtml(truncate(cm.content, 40)) + '</td><td>' + formatDate(cm.created_at) + '</td></tr>';
            });
          } else {
            commentsBody.innerHTML = '<tr><td colspan="3" class="empty-state">暂无评论</td></tr>';
          }
        } catch(e) {
          console.error('Dashboard load error:', e);
        }
      });
    </script>
  `));
});

// ============================================================
// Posts Management
// ============================================================
adminRoutes.get('/posts', requireAdmin, (c) => {
  return c.html(adminLayout('文章管理', 'posts', `
    <div class="card">
      <div class="card-header">
        <h3>文章列表</h3>
        <a href="/admin/posts/new" class="btn btn-primary">新建文章</a>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>标题</th><th>作者</th><th>状态</th><th>浏览</th><th>日期</th><th>操作</th></tr></thead>
          <tbody id="posts-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="posts-pagination"></div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() {
        loadPosts(1);
      });

      async function loadPosts(page) {
        currentPage = page;
        try {
          const data = await apiCall('/post/list?page=' + page + '&limit=15');
          const tbody = document.getElementById('posts-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(p) {
              const status = p.status === 1
                ? '<span class="badge badge-green">已发布</span>'
                : '<span class="badge badge-yellow">草稿</span>';
              const featured = p.featured ? ' <span class="badge badge-blue">推荐</span>' : '';
              tbody.innerHTML += '<tr>' +
                '<td><a href="/admin/posts/edit/' + p.id + '">' + escapeHtml(truncate(p.title, 40)) + '</a>' + featured + '</td>' +
                '<td>' + escapeHtml(p.author_name || p.username || '-') + '</td>' +
                '<td>' + status + '</td>' +
                '<td>' + (p.view_count || 0) + '</td>' +
                '<td>' + formatDate(p.created_at) + '</td>' +
                '<td><a href="/admin/posts/edit/' + p.id + '" class="btn btn-sm btn-secondary">编辑</a> ' +
                '<button class="btn btn-sm btn-danger" onclick="deletePost(' + p.id + ')">删除</button></td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无文章</td></tr>';
          }

          renderPagination(data.pagination, 'posts-pagination', 'loadPosts');
        } catch(e) { console.error(e); }
      }

      async function deletePost(id) {
        if (!confirm('确定要删除这篇文章吗？')) return;
        try {
          await apiCall('/post/' + id + '/delete', { method: 'DELETE' });
          showToast('文章已删除', 'success');
          loadPosts(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) return;
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// New Post
adminRoutes.get('/posts/new', requireAdmin, (c) => {
  return c.html(adminLayout('新建文章', 'posts', `
    <div class="card">
      <div class="card-header"><h3>新建文章</h3></div>
      <div class="card-body padded">
        <form id="post-form">
          <div class="form-group">
            <label>标题</label>
            <input type="text" id="title" required>
          </div>
          <div class="form-group">
            <label>摘要</label>
            <textarea id="excerpt" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea id="content" rows="15"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select id="categories" multiple style="height: 120px;"></select>
            </div>
            <div class="form-group">
              <label>标签</label>
              <select id="tags" multiple style="height: 120px;"></select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select id="status">
                <option value="0">草稿</option>
                <option value="1">发布</option>
              </select>
            </div>
            <div class="form-group">
              <label>选项</label>
              <div class="form-check"><input type="checkbox" id="featured"> <label for="featured">推荐文章</label></div>
              <div class="form-check"><input type="checkbox" id="comment_status" checked> <label for="comment_status">允许评论</label></div>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存文章</button>
            <a href="/admin/posts" class="btn btn-secondary">返回列表</a>
          </div>
        </form>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', async function() {
        // Load categories and tags for select options
        try {
          const [cats, tags] = await Promise.all([
            apiCall('/category/list?limit=100'),
            apiCall('/tag/list?limit=100')
          ]);

          const catSelect = document.getElementById('categories');
          if (cats.data) cats.data.forEach(function(c) {
            catSelect.innerHTML += '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>';
          });

          const tagSelect = document.getElementById('tags');
          if (tags.data) tags.data.forEach(function(t) {
            tagSelect.innerHTML += '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>';
          });
        } catch(e) { console.error(e); }
      });

      document.getElementById('post-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const catSelect = document.getElementById('categories');
        const tagSelect = document.getElementById('tags');
        const selectedCats = Array.from(catSelect.selectedOptions).map(function(o) { return parseInt(o.value); });
        const selectedTags = Array.from(tagSelect.selectedOptions).map(function(o) { return parseInt(o.value); });

        const body = {
          title: document.getElementById('title').value,
          excerpt: document.getElementById('excerpt').value,
          content: document.getElementById('content').value,
          status: parseInt(document.getElementById('status').value),
          featured: document.getElementById('featured').checked ? 1 : 0,
          commentStatus: document.getElementById('comment_status').checked ? 1 : 0,
          categoryIds: selectedCats,
          tagIds: selectedTags,
          author_id: 1
        };

        if (!body.title) { showToast('请输入标题', 'error'); return; }

        try {
          await apiCall('/post/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          showToast('文章创建成功', 'success');
          setTimeout(function() { window.location.href = '/admin/posts'; }, 1000);
        } catch(e) { console.error(e); }
      });
    </script>
  `));
});

// Edit Post
adminRoutes.get('/posts/edit/:id', requireAdmin, (c) => {
  const postId = c.req.param('id');
  return c.html(adminLayout('编辑文章', 'posts', `
    <div class="card">
      <div class="card-header"><h3>编辑文章</h3></div>
      <div class="card-body padded">
        <form id="post-form">
          <div class="form-group">
            <label>标题</label>
            <input type="text" id="title" required>
          </div>
          <div class="form-group">
            <label>摘要</label>
            <textarea id="excerpt" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea id="content" rows="15"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select id="categories" multiple style="height: 120px;"></select>
            </div>
            <div class="form-group">
              <label>标签</label>
              <select id="tags" multiple style="height: 120px;"></select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select id="status">
                <option value="0">草稿</option>
                <option value="1">发布</option>
              </select>
            </div>
            <div class="form-group">
              <label>选项</label>
              <div class="form-check"><input type="checkbox" id="featured"> <label for="featured">推荐文章</label></div>
              <div class="form-check"><input type="checkbox" id="comment_status" checked> <label for="comment_status">允许评论</label></div>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存更改</button>
            <a href="/admin/posts" class="btn btn-secondary">返回列表</a>
          </div>
        </form>
      </div>
    </div>

    <script>
      const postId = ${escapeHtml(postId)};

      document.addEventListener('DOMContentLoaded', async function() {
        try {
          const [post, cats, tags] = await Promise.all([
            apiCall('/post/' + postId),
            apiCall('/category/list?limit=100'),
            apiCall('/tag/list?limit=100')
          ]);

          // Fill form fields
          document.getElementById('title').value = post.title || '';
          document.getElementById('excerpt').value = post.excerpt || '';
          document.getElementById('content').value = post.content || '';
          document.getElementById('status').value = post.status || 0;
          document.getElementById('featured').checked = !!post.featured;
          document.getElementById('comment_status').checked = post.comment_status !== 0;

          // Build category options
          const catSelect = document.getElementById('categories');
          const postCatIds = (post.categories || []).map(function(c) { return c.id; });
          if (cats.data) cats.data.forEach(function(c) {
            const selected = postCatIds.includes(c.id) ? ' selected' : '';
            catSelect.innerHTML += '<option value="' + c.id + '"' + selected + '>' + escapeHtml(c.name) + '</option>';
          });

          // Build tag options
          const tagSelect = document.getElementById('tags');
          const postTagIds = (post.tags || []).map(function(t) { return t.id; });
          if (tags.data) tags.data.forEach(function(t) {
            const selected = postTagIds.includes(t.id) ? ' selected' : '';
            tagSelect.innerHTML += '<option value="' + t.id + '"' + selected + '>' + escapeHtml(t.name) + '</option>';
          });
        } catch(e) {
          showToast('加载文章失败', 'error');
        }
      });

      document.getElementById('post-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const catSelect = document.getElementById('categories');
        const tagSelect = document.getElementById('tags');
        const selectedCats = Array.from(catSelect.selectedOptions).map(function(o) { return parseInt(o.value); });
        const selectedTags = Array.from(tagSelect.selectedOptions).map(function(o) { return parseInt(o.value); });

        const body = {
          title: document.getElementById('title').value,
          excerpt: document.getElementById('excerpt').value,
          content: document.getElementById('content').value,
          status: parseInt(document.getElementById('status').value),
          featured: document.getElementById('featured').checked ? 1 : 0,
          commentStatus: document.getElementById('comment_status').checked ? 1 : 0,
          categoryIds: selectedCats,
          tagIds: selectedTags
        };

        if (!body.title) { showToast('请输入标题', 'error'); return; }

        try {
          await apiCall('/post/' + postId + '/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          showToast('文章更新成功', 'success');
        } catch(e) { console.error(e); }
      });
    </script>
  `));
});

// ============================================================
// Categories Management
// ============================================================
adminRoutes.get('/categories', requireAdmin, (c) => {
  return c.html(adminLayout('分类管理', 'categories', `
    <div class="card">
      <div class="card-header">
        <h3>分类列表</h3>
        <button class="btn btn-primary" onclick="showCreateModal()">新建分类</button>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>名称</th><th>Slug</th><th>描述</th><th>日期</th><th>操作</th></tr></thead>
          <tbody id="categories-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="categories-pagination"></div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="modal">
      <div class="modal">
        <h3 id="modal-title">新建分类</h3>
        <form id="category-form">
          <input type="hidden" id="edit-id">
          <div class="form-group">
            <label>名称</label>
            <input type="text" id="cat-name" required>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea id="cat-description" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() { loadCategories(1); });

      async function loadCategories(page) {
        currentPage = page;
        try {
          const data = await apiCall('/category/list?page=' + page + '&limit=20');
          const tbody = document.getElementById('categories-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(c) {
              tbody.innerHTML += '<tr>' +
                '<td>' + escapeHtml(c.name) + '</td>' +
                '<td><code>' + escapeHtml(c.slug) + '</code></td>' +
                '<td>' + escapeHtml(truncate(c.description || '-', 40)) + '</td>' +
                '<td>' + formatDate(c.created_at) + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-secondary" onclick="editCategory(' + c.id + ',\\'' + escapeHtml(c.name).replace(/'/g, "\\\\'") + '\\',\\'' + escapeHtml(c.description || '').replace(/'/g, "\\\\'") + '\\')">编辑</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteCategory(' + c.id + ')">删除</button>' +
                '</td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无分类</td></tr>';
          }

          renderPagination(data.pagination, 'categories-pagination', 'loadCategories');
        } catch(e) { console.error(e); }
      }

      function showCreateModal() {
        document.getElementById('modal-title').textContent = '新建分类';
        document.getElementById('edit-id').value = '';
        document.getElementById('cat-name').value = '';
        document.getElementById('cat-description').value = '';
        document.getElementById('modal').classList.add('show');
      }

      function editCategory(id, name, desc) {
        document.getElementById('modal-title').textContent = '编辑分类';
        document.getElementById('edit-id').value = id;
        document.getElementById('cat-name').value = name;
        document.getElementById('cat-description').value = desc;
        document.getElementById('modal').classList.add('show');
      }

      function closeModal() { document.getElementById('modal').classList.remove('show'); }

      document.getElementById('category-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const body = {
          name: document.getElementById('cat-name').value,
          description: document.getElementById('cat-description').value
        };

        try {
          if (id) {
            await apiCall('/category/' + id + '/update', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            showToast('分类已更新', 'success');
          } else {
            await apiCall('/category/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            showToast('分类已创建', 'success');
          }
          closeModal();
          loadCategories(currentPage);
        } catch(e) { console.error(e); }
      });

      async function deleteCategory(id) {
        if (!confirm('确定要删除这个分类吗？')) return;
        try {
          await apiCall('/category/' + id + '/delete', { method: 'DELETE' });
          showToast('分类已删除', 'success');
          loadCategories(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) { document.getElementById(containerId).innerHTML = ''; return; }
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// ============================================================
// Tags Management
// ============================================================
adminRoutes.get('/tags', requireAdmin, (c) => {
  return c.html(adminLayout('标签管理', 'tags', `
    <div class="card">
      <div class="card-header">
        <h3>标签列表</h3>
        <button class="btn btn-primary" onclick="showCreateModal()">新建标签</button>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>名称</th><th>Slug</th><th>日期</th><th>操作</th></tr></thead>
          <tbody id="tags-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="tags-pagination"></div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="modal">
      <div class="modal">
        <h3 id="modal-title">新建标签</h3>
        <form id="tag-form">
          <input type="hidden" id="edit-id">
          <div class="form-group">
            <label>名称</label>
            <input type="text" id="tag-name" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() { loadTags(1); });

      async function loadTags(page) {
        currentPage = page;
        try {
          const data = await apiCall('/tag/list?page=' + page + '&limit=20');
          const tbody = document.getElementById('tags-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(t) {
              tbody.innerHTML += '<tr>' +
                '<td>' + escapeHtml(t.name) + '</td>' +
                '<td><code>' + escapeHtml(t.slug) + '</code></td>' +
                '<td>' + formatDate(t.created_at) + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-secondary" onclick="editTag(' + t.id + ',\\'' + escapeHtml(t.name).replace(/'/g, "\\\\'") + '\\')">编辑</button> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteTag(' + t.id + ')">删除</button>' +
                '</td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无标签</td></tr>';
          }

          renderPagination(data.pagination, 'tags-pagination', 'loadTags');
        } catch(e) { console.error(e); }
      }

      function showCreateModal() {
        document.getElementById('modal-title').textContent = '新建标签';
        document.getElementById('edit-id').value = '';
        document.getElementById('tag-name').value = '';
        document.getElementById('modal').classList.add('show');
      }

      function editTag(id, name) {
        document.getElementById('modal-title').textContent = '编辑标签';
        document.getElementById('edit-id').value = id;
        document.getElementById('tag-name').value = name;
        document.getElementById('modal').classList.add('show');
      }

      function closeModal() { document.getElementById('modal').classList.remove('show'); }

      document.getElementById('tag-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const body = { name: document.getElementById('tag-name').value };

        try {
          if (id) {
            await apiCall('/tag/' + id + '/update', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            showToast('标签已更新', 'success');
          } else {
            await apiCall('/tag/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            showToast('标签已创建', 'success');
          }
          closeModal();
          loadTags(currentPage);
        } catch(e) { console.error(e); }
      });

      async function deleteTag(id) {
        if (!confirm('确定要删除这个标签吗？')) return;
        try {
          await apiCall('/tag/' + id + '/delete', { method: 'DELETE' });
          showToast('标签已删除', 'success');
          loadTags(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) { document.getElementById(containerId).innerHTML = ''; return; }
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// ============================================================
// Comments Management
// ============================================================
adminRoutes.get('/comments', requireAdmin, (c) => {
  return c.html(adminLayout('评论管理', 'comments', `
    <div class="card">
      <div class="card-header">
        <h3>评论列表</h3>
        <div>
          <select id="status-filter" onchange="loadComments(1)" style="padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">全部状态</option>
            <option value="1">已通过</option>
            <option value="0">待审核</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>作者</th><th>内容</th><th>文章</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
          <tbody id="comments-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="comments-pagination"></div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() { loadComments(1); });

      async function loadComments(page) {
        currentPage = page;
        const statusFilter = document.getElementById('status-filter').value;
        let url = '/comment/list?page=' + page + '&limit=20';
        if (statusFilter !== '') url += '&status=' + statusFilter;

        try {
          const data = await apiCall(url);
          const tbody = document.getElementById('comments-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(cm) {
              const status = cm.status === 1
                ? '<span class="badge badge-green">已通过</span>'
                : '<span class="badge badge-yellow">待审核</span>';
              const toggleBtn = cm.status === 1
                ? '<button class="btn btn-sm btn-secondary" onclick="toggleStatus(' + cm.id + ', 0)">拒绝</button>'
                : '<button class="btn btn-sm btn-success" onclick="toggleStatus(' + cm.id + ', 1)">通过</button>';

              tbody.innerHTML += '<tr>' +
                '<td>' + escapeHtml(cm.author_name) + '</td>' +
                '<td>' + escapeHtml(truncate(cm.content, 50)) + '</td>' +
                '<td>' + escapeHtml(truncate(cm.post_title || '-', 25)) + '</td>' +
                '<td>' + status + '</td>' +
                '<td>' + formatDate(cm.created_at) + '</td>' +
                '<td>' + toggleBtn + ' <button class="btn btn-sm btn-danger" onclick="deleteComment(' + cm.id + ')">删除</button></td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无评论</td></tr>';
          }

          renderPagination(data.pagination, 'comments-pagination', 'loadComments');
        } catch(e) { console.error(e); }
      }

      async function toggleStatus(id, newStatus) {
        try {
          await apiCall('/comment/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          showToast('评论状态已更新', 'success');
          loadComments(currentPage);
        } catch(e) { console.error(e); }
      }

      async function deleteComment(id) {
        if (!confirm('确定要删除这条评论吗？')) return;
        try {
          await apiCall('/comment/' + id + '/delete', { method: 'DELETE' });
          showToast('评论已删除', 'success');
          loadComments(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) { document.getElementById(containerId).innerHTML = ''; return; }
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// ============================================================
// Feedback Management
// ============================================================
adminRoutes.get('/feedback', requireAdmin, (c) => {
  return c.html(adminLayout('留言管理', 'feedback', `
    <div class="card">
      <div class="card-header">
        <h3>留言列表</h3>
        <div>
          <select id="status-filter" onchange="loadFeedback(1)" style="padding: 0.4rem; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">全部状态</option>
            <option value="1">已处理</option>
            <option value="0">待处理</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>姓名</th><th>邮箱</th><th>内容</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
          <tbody id="feedback-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="feedback-pagination"></div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" id="detail-modal">
      <div class="modal">
        <h3>留言详情</h3>
        <div id="detail-content" style="margin-bottom: 1rem;"></div>
        <button class="btn btn-secondary" onclick="document.getElementById('detail-modal').classList.remove('show')">关闭</button>
      </div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() { loadFeedback(1); });

      async function loadFeedback(page) {
        currentPage = page;
        const statusFilter = document.getElementById('status-filter').value;
        let url = '/feedback/list?page=' + page + '&limit=20';
        if (statusFilter !== '') url += '&status=' + statusFilter;

        try {
          const data = await apiCall(url);
          const tbody = document.getElementById('feedback-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(fb) {
              const status = fb.status === 1
                ? '<span class="badge badge-green">已处理</span>'
                : '<span class="badge badge-yellow">待处理</span>';
              const toggleBtn = fb.status === 1
                ? '<button class="btn btn-sm btn-secondary" onclick="toggleStatus(' + fb.id + ', 0)">标记未处理</button>'
                : '<button class="btn btn-sm btn-success" onclick="toggleStatus(' + fb.id + ', 1)">标记已处理</button>';

              tbody.innerHTML += '<tr>' +
                '<td>' + escapeHtml(fb.name) + '</td>' +
                '<td>' + escapeHtml(fb.email || '-') + '</td>' +
                '<td><a href="#" onclick="showDetail(' + fb.id + ');return false;">' + escapeHtml(truncate(fb.content, 40)) + '</a></td>' +
                '<td>' + status + '</td>' +
                '<td>' + formatDate(fb.created_at) + '</td>' +
                '<td>' + toggleBtn + ' <button class="btn btn-sm btn-danger" onclick="deleteFeedback(' + fb.id + ')">删除</button></td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无留言</td></tr>';
          }

          renderPagination(data.pagination, 'feedback-pagination', 'loadFeedback');
        } catch(e) { console.error(e); }
      }

      async function showDetail(id) {
        try {
          const fb = await apiCall('/feedback/' + id);
          document.getElementById('detail-content').innerHTML =
            '<p><strong>姓名:</strong> ' + escapeHtml(fb.name) + '</p>' +
            '<p><strong>邮箱:</strong> ' + escapeHtml(fb.email || '-') + '</p>' +
            '<p><strong>日期:</strong> ' + formatDate(fb.created_at) + '</p>' +
            '<p><strong>内容:</strong></p><p style="white-space:pre-wrap;background:#f5f5f5;padding:1rem;border-radius:4px;">' + escapeHtml(fb.content) + '</p>';
          document.getElementById('detail-modal').classList.add('show');
        } catch(e) { console.error(e); }
      }

      async function toggleStatus(id, newStatus) {
        try {
          await apiCall('/feedback/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          showToast('留言状态已更新', 'success');
          loadFeedback(currentPage);
        } catch(e) { console.error(e); }
      }

      async function deleteFeedback(id) {
        if (!confirm('确定要删除这条留言吗？')) return;
        try {
          await apiCall('/feedback/' + id + '/delete', { method: 'DELETE' });
          showToast('留言已删除', 'success');
          loadFeedback(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) { document.getElementById(containerId).innerHTML = ''; return; }
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// ============================================================
// Users Management
// ============================================================
adminRoutes.get('/users', requireAdmin, (c) => {
  return c.html(adminLayout('用户管理', 'users', `
    <div class="card">
      <div class="card-header">
        <h3>用户列表</h3>
        <button class="btn btn-primary" onclick="showCreateModal()">新建用户</button>
      </div>
      <div class="card-body">
        <table>
          <thead><tr><th>用户名</th><th>显示名</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册日期</th><th>操作</th></tr></thead>
          <tbody id="users-table"></tbody>
        </table>
      </div>
      <div class="pagination" id="users-pagination"></div>
    </div>

    <!-- Create User Modal -->
    <div class="modal-overlay" id="create-modal">
      <div class="modal">
        <h3>新建用户</h3>
        <form id="create-form">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" id="new-username" required>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" id="new-email" required>
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" id="new-password" required>
          </div>
          <div class="form-group">
            <label>显示名</label>
            <input type="text" id="new-displayName">
          </div>
          <div class="form-group">
            <label>角色</label>
            <select id="new-role">
              <option value="member">普通用户</option>
              <option value="contributor">贡献者</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">创建</button>
            <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">取消</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let currentPage = 1;

      document.addEventListener('DOMContentLoaded', function() { loadUsers(1); });

      async function loadUsers(page) {
        currentPage = page;
        try {
          const data = await apiCall('/user/list?page=' + page + '&limit=20');
          const tbody = document.getElementById('users-table');
          tbody.innerHTML = '';

          if (data.data && data.data.length > 0) {
            data.data.forEach(function(u) {
              const roleBadge = u.role === 'admin' ? '<span class="badge badge-blue">管理员</span>'
                : u.role === 'contributor' ? '<span class="badge badge-green">贡献者</span>'
                : '<span class="badge badge-gray">用户</span>';
              const statusBadge = u.status === 1
                ? '<span class="badge badge-green">正常</span>'
                : '<span class="badge badge-red">禁用</span>';
              const toggleStatusBtn = u.status === 1
                ? '<button class="btn btn-sm btn-secondary" onclick="toggleStatus(' + u.id + ', 0)">禁用</button>'
                : '<button class="btn btn-sm btn-success" onclick="toggleStatus(' + u.id + ', 1)">启用</button>';

              tbody.innerHTML += '<tr>' +
                '<td>' + escapeHtml(u.username) + '</td>' +
                '<td>' + escapeHtml(u.display_name || '-') + '</td>' +
                '<td>' + escapeHtml(u.email || '-') + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + formatDate(u.created_at) + '</td>' +
                '<td>' + toggleStatusBtn + ' ' +
                '<select onchange="changeRole(' + u.id + ', this.value)" style="padding:0.2rem;font-size:0.8rem;border:1px solid #ddd;border-radius:3px;">' +
                  '<option value="" disabled selected>角色</option>' +
                  '<option value="member">用户</option>' +
                  '<option value="contributor">贡献者</option>' +
                  '<option value="admin">管理员</option>' +
                '</select> ' +
                '<button class="btn btn-sm btn-danger" onclick="deleteUser(' + u.id + ')">删除</button></td></tr>';
            });
          } else {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无用户</td></tr>';
          }

          renderPagination(data.pagination, 'users-pagination', 'loadUsers');
        } catch(e) { console.error(e); }
      }

      function showCreateModal() { document.getElementById('create-modal').classList.add('show'); }
      function closeCreateModal() { document.getElementById('create-modal').classList.remove('show'); }

      document.getElementById('create-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const body = {
          username: document.getElementById('new-username').value,
          email: document.getElementById('new-email').value,
          password: document.getElementById('new-password').value,
          displayName: document.getElementById('new-displayName').value,
          role: document.getElementById('new-role').value
        };

        try {
          await apiCall('/user/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          showToast('用户已创建', 'success');
          closeCreateModal();
          loadUsers(currentPage);
        } catch(e) { console.error(e); }
      });

      async function toggleStatus(id, newStatus) {
        try {
          await apiCall('/user/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          showToast('用户状态已更新', 'success');
          loadUsers(currentPage);
        } catch(e) { console.error(e); }
      }

      async function changeRole(id, newRole) {
        if (!newRole) return;
        try {
          await apiCall('/user/' + id + '/role', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
          });
          showToast('用户角色已更新', 'success');
          loadUsers(currentPage);
        } catch(e) { console.error(e); }
      }

      async function deleteUser(id) {
        if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) return;
        try {
          await apiCall('/user/' + id, { method: 'DELETE' });
          showToast('用户已删除', 'success');
          loadUsers(currentPage);
        } catch(e) { console.error(e); }
      }

      function renderPagination(pg, containerId, fnName) {
        if (!pg || pg.totalPages <= 1) { document.getElementById(containerId).innerHTML = ''; return; }
        const c = document.getElementById(containerId);
        let html = '';
        if (pg.page > 1) html += '<a href="#" onclick="' + fnName + '(' + (pg.page - 1) + ');return false;">上一页</a>';
        for (let i = 1; i <= pg.totalPages; i++) {
          if (i === pg.page) html += '<span class="active">' + i + '</span>';
          else html += '<a href="#" onclick="' + fnName + '(' + i + ');return false;">' + i + '</a>';
        }
        if (pg.page < pg.totalPages) html += '<a href="#" onclick="' + fnName + '(' + (pg.page + 1) + ');return false;">下一页</a>';
        c.innerHTML = html;
      }
    </script>
  `));
});

// ============================================================
// Settings
// ============================================================
adminRoutes.get('/settings', requireAdmin, (c) => {
  return c.html(adminLayout('系统设置', 'settings', `
    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
      <button class="btn btn-primary" onclick="showSection('blog')" id="tab-blog">博客信息</button>
      <button class="btn btn-secondary" onclick="showSection('display')" id="tab-display">显示设置</button>
      <button class="btn btn-secondary" onclick="showSection('comments')" id="tab-comments">评论设置</button>
      <button class="btn btn-secondary" onclick="showSection('upload')" id="tab-upload">上传设置</button>
      <button class="btn btn-secondary" onclick="showSection('seo')" id="tab-seo">SEO设置</button>
    </div>

    <!-- Blog Info -->
    <div class="card section-card" id="section-blog">
      <div class="card-header"><h3>博客信息</h3></div>
      <div class="card-body padded">
        <form id="blog-form">
          <div class="form-group">
            <label>博客标题</label>
            <input type="text" id="blog-title">
          </div>
          <div class="form-group">
            <label>博客副标题</label>
            <input type="text" id="blog-subtitle">
          </div>
          <div class="form-group">
            <label>博客描述</label>
            <textarea id="blog-description" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Display Settings -->
    <div class="card section-card" id="section-display" style="display:none;">
      <div class="card-header"><h3>显示设置</h3></div>
      <div class="card-body padded">
        <form id="display-form">
          <div class="form-group">
            <label>每页文章数</label>
            <input type="number" id="posts-per-page" min="1" max="50">
          </div>
          <div class="form-group">
            <label>分页样式</label>
            <select id="pagination-style">
              <option value="numeric">数字分页</option>
              <option value="simple">简单分页</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Comment Settings -->
    <div class="card section-card" id="section-comments" style="display:none;">
      <div class="card-header"><h3>评论设置</h3></div>
      <div class="card-body padded">
        <form id="comments-form">
          <div class="form-group">
            <label>评论审核</label>
            <select id="comment-moderation">
              <option value="0">无需审核</option>
              <option value="1">需要审核</option>
            </select>
          </div>
          <div class="form-group">
            <label>评论权限</label>
            <select id="comment-permission">
              <option value="all">所有人</option>
              <option value="registered">注册用户</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Upload Settings -->
    <div class="card section-card" id="section-upload" style="display:none;">
      <div class="card-header"><h3>上传设置</h3></div>
      <div class="card-body padded">
        <form id="upload-form">
          <div class="form-group">
            <label>允许的文件类型</label>
            <input type="text" id="upload-types" placeholder="jpg,jpeg,png,gif,pdf">
          </div>
          <div class="form-group">
            <label>最大文件大小 (bytes)</label>
            <input type="number" id="upload-max-size" min="1024">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- SEO Settings -->
    <div class="card section-card" id="section-seo" style="display:none;">
      <div class="card-header"><h3>SEO设置</h3></div>
      <div class="card-body padded">
        <form id="seo-form">
          <div class="form-group">
            <label>Meta Description</label>
            <textarea id="meta-description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Meta Keywords</label>
            <input type="text" id="meta-keywords" placeholder="blog,cloudflare,workers">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let activeSection = 'blog';

      function showSection(name) {
        document.querySelectorAll('.section-card').forEach(function(el) { el.style.display = 'none'; });
        document.getElementById('section-' + name).style.display = 'block';

        document.querySelectorAll('[id^="tab-"]').forEach(function(el) {
          el.className = 'btn btn-secondary';
        });
        document.getElementById('tab-' + name).className = 'btn btn-primary';
        activeSection = name;
      }

      document.addEventListener('DOMContentLoaded', async function() {
        try {
          // Load all settings
          const [blog, display, comments, upload, seo] = await Promise.all([
            apiCall('/settings/blog'),
            apiCall('/settings/display'),
            apiCall('/settings/comments'),
            apiCall('/settings/upload'),
            apiCall('/settings/seo')
          ]);

          // Blog info
          document.getElementById('blog-title').value = blog.title || '';
          document.getElementById('blog-subtitle').value = blog.subtitle || '';
          document.getElementById('blog-description').value = blog.description || '';

          // Display
          document.getElementById('posts-per-page').value = display.postsPerPage || 10;
          document.getElementById('pagination-style').value = display.paginationStyle || 'numeric';

          // Comments
          document.getElementById('comment-moderation').value = comments.moderation || 0;
          document.getElementById('comment-permission').value = comments.permission || 'all';

          // Upload
          document.getElementById('upload-types').value = upload.allowedTypes || '';
          document.getElementById('upload-max-size').value = upload.maxSize || 5242880;

          // SEO
          document.getElementById('meta-description').value = seo.description || '';
          document.getElementById('meta-keywords').value = seo.keywords || '';
        } catch(e) { console.error(e); }
      });

      // Blog form
      document.getElementById('blog-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          await apiCall('/settings/blog', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: document.getElementById('blog-title').value,
              subtitle: document.getElementById('blog-subtitle').value,
              description: document.getElementById('blog-description').value
            })
          });
          showToast('博客信息已保存', 'success');
        } catch(e) { console.error(e); }
      });

      // Display form
      document.getElementById('display-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          await apiCall('/settings/display', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postsPerPage: parseInt(document.getElementById('posts-per-page').value),
              paginationStyle: document.getElementById('pagination-style').value
            })
          });
          showToast('显示设置已保存', 'success');
        } catch(e) { console.error(e); }
      });

      // Comments form
      document.getElementById('comments-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          await apiCall('/settings/comments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moderation: parseInt(document.getElementById('comment-moderation').value),
              permission: document.getElementById('comment-permission').value
            })
          });
          showToast('评论设置已保存', 'success');
        } catch(e) { console.error(e); }
      });

      // Upload form
      document.getElementById('upload-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          await apiCall('/settings/upload', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              allowedTypes: document.getElementById('upload-types').value,
              maxSize: parseInt(document.getElementById('upload-max-size').value)
            })
          });
          showToast('上传设置已保存', 'success');
        } catch(e) { console.error(e); }
      });

      // SEO form
      document.getElementById('seo-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          await apiCall('/settings/seo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: document.getElementById('meta-description').value,
              keywords: document.getElementById('meta-keywords').value
            })
          });
          showToast('SEO设置已保存', 'success');
        } catch(e) { console.error(e); }
      });
    </script>
  `));
});

export { adminRoutes };
