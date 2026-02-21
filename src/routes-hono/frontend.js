/**
 * Frontend Routes - Controller Layer
 * Thin routing: fetch data → call view → return HTML
 */

import { Hono } from 'hono';
import { esc, getSettings, getCurrentUser } from '../frontend/utils/helpers.js';
import { renderHome } from '../frontend/views/home.js';
import { renderPost } from '../frontend/views/post.js';
import { renderSearch } from '../frontend/views/search.js';
import { renderFeedback } from '../frontend/views/feedback.js';
import { renderCategories } from '../frontend/views/categories.js';
import { renderCategory } from '../frontend/views/category.js';
import { renderTags } from '../frontend/views/tags.js';
import { renderTag } from '../frontend/views/tag.js';

const frontendRoutes = new Hono();

// ═════════════════════════════════════════════════════════════
// Homepage
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/', async (c) => {
  const settings = await getSettings(c);
  return c.html(renderHome({ blogTitle: settings.blog_title || 'CFBlog' }));
});

// ═════════════════════════════════════════════════════════════
// Post detail
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/post/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  const currentUser = await getCurrentUser(c);
  return c.html(renderPost({
    blogTitle: settings.blog_title || 'CFBlog',
    slug,
    currentUser,
  }));
});

// ═════════════════════════════════════════════════════════════
// Login (keep Vue/TDesign - not part of MVC refactor)
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/login', async (c) => {
  // If already logged in, redirect to admin
  try {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    if (sessionId) {
      const { validateSessionId } = await import('../utils/auth.js');
      const session = await validateSessionId(sessionId, c.env?.SESSION_SECRET);
      if (session?.userId) return c.redirect('/admin');
    }
  } catch {}

  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录 - ${esc(blogTitle)}</title>
<link rel="stylesheet" href="/static/admin-bundle.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
[v-cloak]{display:none}
.login-wrap{width:100%;max-width:380px;padding:0 20px}
.login-card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:36px 32px 28px}
.login-title{text-align:center;font-size:20px;font-weight:600;color:#333;margin-bottom:24px}
.login-card .t-form__item,.login-card .t-form__controls,.login-card .t-form__controls-content{margin-left:0!important;width:100%!important;max-width:100%!important}
.login-actions{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:4px;width:100%}
.login-actions .home-link{color:#666;text-decoration:none;font-size:13px;white-space:nowrap;transition:color .2s}
.login-actions .home-link:hover{color:#0052d9}
</style>
</head>
<body>
<div id="app" v-cloak>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title">${esc(blogTitle)}</div>
      <t-form data-testid="login-form" @submit="onSubmit">
        <t-form-item name="username">
          <t-input v-model="form.username" placeholder="用户名" data-testid="username-input"></t-input>
        </t-form-item>
        <t-form-item name="password">
          <t-input v-model="form.password" type="password" placeholder="密码" data-testid="password-input"></t-input>
        </t-form-item>
        <t-form-item>
          <div class="login-actions">
            <t-button theme="primary" type="submit" :loading="loading" data-testid="login-button">登录</t-button>
            <a class="home-link" href="/">返回首页</a>
          </div>
        </t-form-item>
      </t-form>
    </div>
  </div>
</div>
<script src="/static/admin-bundle.js"></script>
<script>
var{createApp,ref,reactive}=Vue;
var{MessagePlugin}=TDesign;
var app=createApp({
  setup:function(){
    var form=reactive({username:'',password:''});
    var loading=ref(false);
    async function onSubmit(){
      if(!form.username||!form.password){MessagePlugin.warning('请输入用户名和密码');return}
      loading.value=true;
      try{
        var res=await fetch('/api/user/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username,password:form.password})});
        var data=await res.json();
        if(data.success){MessagePlugin.success('登录成功');setTimeout(function(){window.location.href='/admin'},500)}
        else MessagePlugin.error(data.message||'登录失败');
      }catch(e){MessagePlugin.error('网络错误')}
      loading.value=false;
    }
    return{form,loading,onSubmit};
  }
});
app.use(TDesign);app.mount('#app');
</script>
</body>
</html>`);
});

// ═════════════════════════════════════════════════════════════
// Search
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/search', async (c) => {
  const keyword = c.req.query('keyword') || '';
  const settings = await getSettings(c);
  return c.html(renderSearch({
    blogTitle: settings.blog_title || 'CFBlog',
    keyword,
  }));
});

// ═════════════════════════════════════════════════════════════
// Feedback
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/feedback', async (c) => {
  const settings = await getSettings(c);
  const currentUser = await getCurrentUser(c);
  return c.html(renderFeedback({
    blogTitle: settings.blog_title || 'CFBlog',
    currentUser,
  }));
});

// ═════════════════════════════════════════════════════════════
// Categories list
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/categories', async (c) => {
  const settings = await getSettings(c);
  return c.html(renderCategories({ blogTitle: settings.blog_title || 'CFBlog' }));
});

// ═════════════════════════════════════════════════════════════
// Category detail
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/category/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  return c.html(renderCategory({
    blogTitle: settings.blog_title || 'CFBlog',
    slug,
  }));
});

// ═════════════════════════════════════════════════════════════
// Tags list
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/tags', async (c) => {
  const settings = await getSettings(c);
  return c.html(renderTags({ blogTitle: settings.blog_title || 'CFBlog' }));
});

// ═════════════════════════════════════════════════════════════
// Tag detail
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/tag/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  return c.html(renderTag({
    blogTitle: settings.blog_title || 'CFBlog',
    slug,
  }));
});

// ═════════════════════════════════════════════════════════════
// RSS
// ═════════════════════════════════════════════════════════════

async function handleRSS(c) {
  const bucket = c.env?.BUCKET;
  const db = c.env?.DB;

  if (db) {
    try {
      const { Post } = await import('../models/Post.js');
      const { Settings } = await import('../models/Settings.js');
      const settingsModel = new Settings(db);
      const postModel = new Post(db);

      const settings = await settingsModel.getAllSettings();
      const blogTitle = settings.blog_title || 'CFBlog';
      const blogDesc = settings.blog_description || '';
      const url = new URL(c.req.url).origin;

      const result = await postModel.getPostList({ page: 1, limit: 20, status: 1 });
      const posts = result.data || [];

      const escXml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const toRFC822 = (d) => new Date(d).toUTCString();

      const items = posts.map(p => `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(url)}/post/${escXml(p.slug)}</link>
      <description>${escXml(p.excerpt || '')}</description>
      <pubDate>${toRFC822(p.published_at || p.created_at)}</pubDate>
      <guid isPermaLink="true">${escXml(url)}/post/${escXml(p.slug)}</guid>
    </item>`).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(blogTitle)}</title>
    <link>${escXml(url)}</link>
    <description>${escXml(blogDesc)}</description>
    <language>zh-CN</language>
    <atom:link href="${escXml(url)}/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

      if (bucket) {
        bucket.put('cache/rss.xml', xml, {
          httpMetadata: { contentType: 'application/xml; charset=utf-8' }
        }).catch(() => {});
      }

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=600'
        }
      });
    } catch (e) {
      console.error('Generate RSS error:', e);
    }
  }

  if (bucket) {
    const { getCachedRSS } = await import('../utils/cache.js');
    const xml = await getCachedRSS(bucket);
    if (xml) {
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=600'
        }
      });
    }
  }

  return c.text('RSS feed not available', 500);
}

frontendRoutes.get('/rss', handleRSS);
frontendRoutes.get('/feed', handleRSS);

export { frontendRoutes };
