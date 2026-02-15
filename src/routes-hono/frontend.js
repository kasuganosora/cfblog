/**
 * Frontend Routes - Minos-inspired clean blog theme
 */

import { Hono } from 'hono';

const frontendRoutes = new Hono();

// ── Helpers ──────────────────────────────────────────────────

function esc(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escJs(text) {
  if (!text) return '';
  return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/</g, '\\x3c').replace(/>/g, '\\x3e');
}

async function getSettings(c) {
  try {
    const { getCachedSettings } = await import('../utils/cache.js');
    return await getCachedSettings(c.env?.BUCKET, c.env?.DB);
  } catch { return {}; }
}

// ── CSS ──────────────────────────────────────────────────────

const CSS = `
:root {
  --bg:#fff; --bg2:#f6f8fa; --text:#24292f; --text2:#57606a;
  --muted:#8b949e; --accent:#0969da; --accent2:#0550ae;
  --border:#d0d7de; --border2:#d8dee4;
  --tag-bg:#ddf4ff; --tag-c:#0969da;
  --ok-bg:#dafbe1; --ok-c:#1a7f37;
  --err-bg:#ffebe9; --err-c:#cf222e;
  --warn-bg:#fff8c5; --warn-c:#9a6700;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","PingFang SC",sans-serif;
  --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
  --nav-h:52px; --max-w:960px; --side-w:240px;
}
body[data-theme="dark"] {
  --bg:#0d1117; --bg2:#161b22; --text:#e6edf3; --text2:#8b949e;
  --muted:#6e7681; --accent:#58a6ff; --accent2:#79b8ff;
  --border:#30363d; --border2:#21262d;
  --tag-bg:#1f2937; --tag-c:#58a6ff;
  --ok-bg:#0d1f0d; --ok-c:#3fb950;
  --err-bg:#1f0d0d; --err-c:#f85149;
  --warn-bg:#1f1d0d; --warn-c:#d29922;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--font);color:var(--text);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none;transition:color .15s}
a:hover{color:var(--accent2)}
img{max-width:100%;height:auto}

/* ── Navbar ── */
.navbar{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:var(--bg);border-bottom:1px solid var(--border2);z-index:1000}
.navbar>.wrap{max-width:var(--max-w);margin:0 auto;height:100%;display:flex;align-items:center;padding:0 1.5rem;gap:1rem}
.brand{font-size:1.15rem;font-weight:700;color:var(--text);white-space:nowrap}
.brand:hover{color:var(--accent)}
.nav-links{display:flex;list-style:none;gap:2px;flex:1}
.nav-links a{color:var(--text2);padding:.375rem .75rem;font-size:.875rem;border-radius:6px;transition:all .12s}
.nav-links a:hover,.nav-links a.active{color:var(--accent);background:var(--bg2)}
.nav-end{display:flex;align-items:center;gap:.5rem;margin-left:auto}
.nav-search input{width:160px;padding:.3rem .65rem;border:1px solid var(--border2);border-radius:6px;font-size:.8rem;background:var(--bg2);color:var(--text);transition:all .2s}
.nav-search input:focus{outline:none;border-color:var(--accent);width:220px}
.nav-search input::placeholder{color:var(--muted)}
.mobile-btn{display:none;background:none;border:1px solid var(--border2);color:var(--text);padding:.2rem .5rem;border-radius:6px;font-size:1rem;cursor:pointer}

/* ── Layout ── */
.page{max-width:var(--max-w);margin:0 auto;padding:calc(var(--nav-h) + 2rem) 1.5rem 2rem;min-height:calc(100vh - 80px)}
.page.with-sidebar{display:flex;gap:3rem}
.content{flex:1;min-width:0}
.sidebar{width:var(--side-w);flex-shrink:0}
.page.narrow{max-width:780px}

/* ── Article list ── */
.article{padding-bottom:2rem;margin-bottom:2rem;border-bottom:1px solid var(--border2)}
.article:last-child{border-bottom:none;margin-bottom:0}
.article-thumb{width:100%;border-radius:8px;margin-bottom:1rem;object-fit:cover;max-height:300px}
.article-title{font-size:1.4rem;font-weight:600;line-height:1.35;margin-bottom:.4rem}
.article-title a{color:var(--text)}.article-title a:hover{color:var(--accent)}
.article-meta{font-size:.8rem;color:var(--muted);margin-bottom:.6rem;display:flex;flex-wrap:wrap;gap:.75rem}
.article-meta span{display:inline-flex;align-items:center;gap:.2rem}
.article-excerpt{color:var(--text2);line-height:1.7;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:.6rem}
.read-more{color:var(--accent);font-size:.875rem}
.read-more:hover{text-decoration:underline}

/* ── Post detail ── */
.post-hero{width:100%;border-radius:8px;margin-bottom:1.5rem;max-height:420px;object-fit:cover}
.post-header{margin-bottom:2rem}
.post-header h1{font-size:1.8rem;font-weight:700;line-height:1.3;margin-bottom:.5rem}
.post-body{line-height:1.85;font-size:1.025rem}
.post-body h1,.post-body h2,.post-body h3,.post-body h4{margin:1.5em 0 .6em;font-weight:600;line-height:1.35}
.post-body h2{font-size:1.35rem;padding-bottom:.25em;border-bottom:1px solid var(--border2)}
.post-body h3{font-size:1.15rem}
.post-body p{margin-bottom:1em}
.post-body ul,.post-body ol{padding-left:2em;margin-bottom:1em}
.post-body li{margin-bottom:.25em}
.post-body p{margin:0 0 1em}
.post-body h1,.post-body h2,.post-body h3,.post-body h4,.post-body h5,.post-body h6{margin:1.6em 0 .6em;font-weight:600;line-height:1.3}
.post-body h1{font-size:1.5rem;padding-bottom:.3em;border-bottom:1px solid var(--border2)}
.post-body h2{font-size:1.3rem;padding-bottom:.3em;border-bottom:1px solid var(--border2)}
.post-body h3{font-size:1.15rem}
.post-body h4{font-size:1rem}
.post-body ul,.post-body ol{margin:0 0 1em;padding-left:2em}
.post-body li{margin-bottom:.25em}
.post-body li>ul,.post-body li>ol{margin-top:.25em;margin-bottom:0}
.post-body blockquote{margin:1em 0;padding:.6rem 1rem;border-left:3px solid var(--accent);background:var(--bg2);color:var(--text2);border-radius:0 6px 6px 0}
.post-body blockquote p:last-child{margin-bottom:0}
.post-body pre{background:var(--bg2);border:1px solid var(--border2);border-radius:6px;padding:1rem;overflow-x:auto;margin:1em 0;font-family:var(--mono);font-size:.85rem;line-height:1.5}
.post-body code{font-family:var(--mono);font-size:.85em;background:var(--bg2);padding:.15em .35em;border-radius:4px}
.post-body pre code{background:none;padding:0;font-size:inherit}
.post-body img{max-width:100%;height:auto;border-radius:6px;margin:1em 0}
.post-body a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
.post-body a:hover{color:var(--accent2)}
.post-body table{width:100%;border-collapse:collapse;margin:1em 0}
.post-body th,.post-body td{padding:.45rem .8rem;border:1px solid var(--border2);text-align:left}
.post-body th{background:var(--bg2);font-weight:600}
.post-body hr{border:none;border-top:1px solid var(--border2);margin:2em 0}
.post-body input[type="checkbox"]{margin-right:.4em}
.post-tags{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--border2);display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.post-tags .label{font-size:.8rem;color:var(--muted);margin-right:.25rem}
.post-tag-link{display:inline-block;padding:.15rem .55rem;background:var(--tag-bg);color:var(--tag-c);border-radius:4px;font-size:.8rem;transition:all .12s}
.post-tag-link:hover{opacity:.8}

/* ── Comments ── */
.comments{margin-top:2.5rem;padding-top:2rem;border-top:2px solid var(--border2)}
.comments h2{font-size:1.15rem;margin-bottom:1.5rem}
.cmt-form{margin-bottom:2rem}
.cmt-row{margin-bottom:.75rem}
.cmt-row-inline{display:flex;gap:1rem}
.cmt-form label{display:block;font-size:.8rem;font-weight:500;color:var(--text2);margin-bottom:.2rem}
.cmt-form input,.cmt-form textarea{width:100%;padding:.45rem .65rem;border:1px solid var(--border2);border-radius:6px;font-size:.875rem;font-family:var(--font);background:var(--bg);color:var(--text)}
.cmt-form input:focus,.cmt-form textarea:focus{outline:none;border-color:var(--accent)}
.cmt-form textarea{min-height:90px;resize:vertical}
.cmt-btn{padding:.45rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.875rem;cursor:pointer;transition:background .15s}
.cmt-btn:hover{background:var(--accent2)}
.cmt-item,.comment-item{padding:.75rem 0;border-bottom:1px solid var(--border2)}
.cmt-item:last-child,.comment-item:last-child{border-bottom:none}
.cmt-author{font-weight:600;font-size:.9rem;margin-bottom:.15rem}
.cmt-text{color:var(--text2);line-height:1.6;font-size:.9rem}
.cmt-date{font-size:.75rem;color:var(--muted);margin-top:.15rem}
.cmt-reply{margin-left:1.5rem;padding-left:1rem;border-left:2px solid var(--border2)}
#comment-message{padding:.65rem .85rem;border-radius:6px;margin-bottom:.75rem;display:none;font-size:.875rem}
#comment-message.success{display:block;background:var(--ok-bg);color:var(--ok-c)}
#comment-message.error{display:block;background:var(--err-bg);color:var(--err-c)}
.comments-disabled{padding:1.25rem;background:var(--warn-bg);border-radius:6px;color:var(--warn-c);text-align:center;font-size:.9rem}

/* ── Sidebar widgets ── */
.widget{margin-bottom:1.75rem}
.widget h3{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:.65rem;padding-bottom:.45rem;border-bottom:1px solid var(--border2)}
.widget-cats{list-style:none}
.widget-cats li{margin-bottom:2px}
.widget-cats a{color:var(--text2);font-size:.875rem;padding:.2rem 0;display:flex;justify-content:space-between}
.widget-cats a:hover{color:var(--accent)}
.widget-cats .cnt{color:var(--muted);font-size:.75rem}
.widget-tags{display:flex;flex-wrap:wrap;gap:.3rem}
.widget-tags a{display:inline-block;padding:.12rem .5rem;background:var(--bg2);color:var(--text2);border-radius:4px;font-size:.75rem;transition:all .12s}
.widget-tags a:hover{background:var(--tag-bg);color:var(--tag-c)}
.widget-ctrl{display:flex;flex-direction:column;gap:.35rem}
.widget-ctrl button{padding:.3rem .6rem;background:var(--bg2);border:1px solid var(--border2);color:var(--text2);border-radius:4px;font-size:.75rem;cursor:pointer;text-align:left;transition:all .12s}
.widget-ctrl button:hover{border-color:var(--accent);color:var(--accent)}

/* ── Pagination ── */
.pager{display:flex;align-items:center;justify-content:center;gap:4px;padding:2rem 0 0}
.pager a,.pager span{display:inline-flex;align-items:center;justify-content:center;min-width:2rem;height:2rem;padding:0 .45rem;border:1px solid var(--border2);border-radius:6px;color:var(--text2);font-size:.85rem;transition:all .12s}
.pager a:hover{border-color:var(--accent);color:var(--accent)}
.pager .active{background:var(--accent);border-color:var(--accent);color:#fff}

/* ── Category & Tag pages ── */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
.cat-card{padding:1.15rem;border:1px solid var(--border2);border-radius:8px;transition:all .15s}
.cat-card:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.cat-card h2{font-size:1.05rem;margin-bottom:.2rem}
.cat-card h2 a{color:var(--text)}.cat-card h2 a:hover{color:var(--accent)}
.cat-card p{color:var(--text2);font-size:.85rem}
.cat-card small{color:var(--muted);font-size:.8rem}
.tag-page{display:flex;flex-wrap:wrap;gap:.5rem}
.tag-page a{display:inline-block;padding:.4rem .9rem;background:var(--bg2);color:var(--text2);border-radius:6px;font-size:.875rem;transition:all .12s;border:1px solid var(--border2)}
.tag-page a:hover{background:var(--accent);color:#fff;border-color:var(--accent)}

/* ── Search ── */
.search-box{display:flex;gap:.5rem;margin-bottom:1.5rem}
.search-box input{flex:1;padding:.55rem .85rem;border:1px solid var(--border2);border-radius:6px;font-size:.95rem;background:var(--bg);color:var(--text)}
.search-box input:focus{outline:none;border-color:var(--accent)}
.search-box button{padding:.55rem 1.15rem;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.875rem}
.search-box button:hover{background:var(--accent2)}
.result-item{padding:.85rem 0;border-bottom:1px solid var(--border2)}
.result-item:last-child{border-bottom:none}
.result-item h2{font-size:1.05rem;margin-bottom:.15rem}
.result-item h2 a{color:var(--text)}.result-item h2 a:hover{color:var(--accent)}
.result-item p{color:var(--text2);font-size:.875rem}
.result-item small{color:var(--muted);font-size:.8rem}

/* ── Feedback ── */
.fb-form{max-width:560px}
.fb-row{margin-bottom:.85rem}
.fb-form label{display:block;font-size:.8rem;font-weight:500;color:var(--text2);margin-bottom:.2rem}
.fb-form input,.fb-form textarea{width:100%;padding:.45rem .65rem;border:1px solid var(--border2);border-radius:6px;font-size:.875rem;font-family:var(--font);background:var(--bg);color:var(--text)}
.fb-form input:focus,.fb-form textarea:focus{outline:none;border-color:var(--accent)}
.fb-form textarea{min-height:120px;resize:vertical}
.fb-btn{padding:.45rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.875rem}
.fb-btn:hover{background:var(--accent2)}
#message{padding:.65rem .85rem;border-radius:6px;margin-bottom:.85rem;display:none;font-size:.875rem}
#message.success{display:block;background:var(--ok-bg);color:var(--ok-c)}
#message.error{display:block;background:var(--err-bg);color:var(--err-c)}

/* ── Misc ── */
.pg-title{font-size:1.4rem;font-weight:700;margin-bottom:1.5rem;padding-bottom:.6rem;border-bottom:2px solid var(--border2)}
.empty{padding:2rem;text-align:center;color:var(--muted)}
.footer{margin-top:3rem;padding:1.25rem 0;border-top:1px solid var(--border2);text-align:center;font-size:.8rem;color:var(--muted)}
.footer a{color:var(--muted);margin:0 .35rem}.footer a:hover{color:var(--accent)}

/* ── Responsive ── */
@media(max-width:768px){
  .nav-links{display:none}
  .nav-links.open{display:flex;flex-direction:column;position:absolute;top:var(--nav-h);left:0;right:0;background:var(--bg);border-bottom:1px solid var(--border);padding:.5rem;box-shadow:0 4px 12px rgba(0,0,0,.08);gap:0}
  .nav-links.open a{padding:.65rem 1rem}
  .mobile-btn{display:block}
  .nav-search input{width:100px}.nav-search input:focus{width:140px}
  .page.with-sidebar{flex-direction:column;gap:2rem}
  .sidebar{width:100%}
  .article-title{font-size:1.2rem}
  .post-header h1{font-size:1.4rem}
  .cmt-row-inline{flex-direction:column;gap:.75rem}
  .cat-grid{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){*{transition-duration:.01ms!important}}
`;

// ── Shared client-side JS ────────────────────────────────────

const BASE_JS = `
function escapeHtml(t){if(!t)return'';var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function getFirstImg(text){if(!text)return null;var m=text.match(/<img[^>]+src=["']([^"']+)["']/i);if(m)return m[1];var md=text.match(/!\[[^\]]*\\]\\(([^)]+)\\)/);return md?md[1]:null}
function checkThumb(el,src){
  if(!src){el.style.display='none';return}
  var img=new Image();
  img.onload=function(){if(img.naturalWidth>=320){el.src=src;el.style.display=''}else el.style.display='none'};
  img.onerror=function(){el.style.display='none'};
  img.src=src;
}
function readTime(text){if(!text)return'1 min';var t=text.replace(/<[^>]+>/g,'').replace(/[#*_~>|\\[\\]()-]/g,'');return Math.max(1,Math.ceil(t.length/500))+' min'}
function renderMd(s){return typeof marked!=='undefined'?marked.parse(s||''):s||''}
(function(){
  var t=localStorage.getItem('userTheme')||'default';
  document.body.setAttribute('data-theme',t);
  var l=localStorage.getItem('userLanguage')||'zh-cn';
  document.documentElement.lang=l;
})();
`;

// ── Layout function ──────────────────────────────────────────

function layout({ title, blogTitle = 'CFBlog', content, script = '', activePage = '', bodyAttrs = '' }) {
  const y = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - ${esc(blogTitle)}</title>
<style>${CSS}</style>
<script src="/static/marked.min.js"></script>
</head>
<body${bodyAttrs}>
<header class="navbar" data-testid="header">
<div class="wrap">
  <a class="brand" href="/">${esc(blogTitle)}</a>
  <nav data-testid="navigation">
    <div data-testid="desktop-navigation">
      <ul class="nav-links">
        <li><a href="/"${activePage === 'home' ? ' class="active"' : ''}>首页</a></li>
        <li><a href="/categories"${activePage === 'categories' ? ' class="active"' : ''}>分类</a></li>
        <li><a href="/tags"${activePage === 'tags' ? ' class="active"' : ''}>标签</a></li>
        <li><a href="/feedback"${activePage === 'feedback' ? ' class="active"' : ''}>留言</a></li>
      </ul>
    </div>
  </nav>
  <div class="nav-end">
    <form class="nav-search" action="/search" method="GET" data-testid="search-form">
      <input type="text" name="keyword" placeholder="搜索..." data-testid="search-input">
    </form>
  </div>
  <button class="mobile-btn" data-testid="mobile-menu-button" onclick="document.querySelector('.nav-links').classList.toggle('open')">&#9776;</button>
</div>
</header>

<main data-testid="main">
${content}
</main>

<footer class="footer" data-testid="footer">
<p>&copy; ${y} ${esc(blogTitle)} &middot; <a href="/rss">RSS</a> &middot; <a href="/login">登录</a></p>
</footer>

<script>
${BASE_JS}
${script}
</script>
</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════
// Homepage
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/', async (c) => {
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '首页',
    blogTitle,
    activePage: 'home',
    content: `
<div class="page with-sidebar">
  <div class="content">
    <div id="posts-list"><div class="empty">加载中...</div></div>
    <div class="pager" id="pagination" data-testid="pagination"></div>
  </div>
  <aside class="sidebar">
    <div class="widget" data-testid="categories-list">
      <h3>分类</h3>
      <ul class="widget-cats" id="categories"></ul>
    </div>
    <div class="widget" data-testid="tags-list">
      <h3>标签</h3>
      <div class="widget-tags" id="tags"></div>
    </div>
    <div class="widget">
      <h3>设置</h3>
      <div class="widget-ctrl">
        <button data-testid="theme-switcher" onclick="toggleTheme()">切换主题</button>
        <button data-testid="language-switcher" onclick="toggleLang()">切换语言</button>
      </div>
    </div>
  </aside>
</div>`,
    script: `
var API='/api';
function toggleTheme(){var t=localStorage.getItem('userTheme')||'default';var n=t==='default'?'dark':'default';localStorage.setItem('userTheme',n);document.body.setAttribute('data-theme',n)}
function toggleLang(){var l=localStorage.getItem('userLanguage')||'zh-cn';var n=l==='zh-cn'?'en-us':'zh-cn';localStorage.setItem('userLanguage',n);document.documentElement.lang=n}

document.addEventListener('DOMContentLoaded',async function(){
  try{await Promise.all([loadPosts(),loadCategories(),loadTags()])}catch(e){console.error(e)}
});

async function loadPosts(){
  try{
    var params=new URLSearchParams(window.location.search);
    var url=API+'/post/list';
    if(params.toString())url+='?'+params.toString();
    var res=await fetch(url);var data=await res.json();
    if(data.data&&Array.isArray(data.data))renderPosts(data.data,data.pagination);
  }catch(e){console.error('Load posts:',e)}
}

function renderPosts(posts,pagination){
  var c=document.getElementById('posts-list');
  if(!posts.length){c.innerHTML='<div class="empty">暂无文章</div>';return}
  c.innerHTML='';
  posts.forEach(function(p,i){
    var el=document.createElement('article');
    el.className='article';
    el.setAttribute('data-testid','post-card');
    el.setAttribute('data-slug',p.slug||p.id);
    var imgSrc=getFirstImg(p.content);
    var href=p.slug?'/post/'+p.slug:'/post/'+p.id;
    var date=p.published_at||p.created_at;
    var dateStr=date?new Date(date).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):'';
    var html='';
    if(imgSrc)html+='<img class="article-thumb" id="thumb-'+i+'" style="display:none" alt="">';
    html+='<h2 class="article-title" data-testid="post-title"><a href="'+href+'">'+escapeHtml(p.title)+'</a></h2>';
    html+='<div class="article-meta"><span>'+dateStr+'</span>';
    if(p.author_name)html+='<span>'+escapeHtml(p.author_name)+'</span>';
    html+='<span>'+readTime(p.content)+'</span>';
    html+='<span>阅读 '+(p.view_count||0)+'</span></div>';
    var excerptSrc=p.excerpt||(p.content?p.content.replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/<[^>]+>/g,'').substring(0,200)+'...':'暂无摘要');
    html+='<div class="article-excerpt" data-testid="post-excerpt">'+renderMd(excerptSrc)+'</div>';
    html+='<a class="read-more" href="'+href+'">阅读全文 &rarr;</a>';
    el.innerHTML=html;
    c.appendChild(el);
    if(imgSrc)checkThumb(document.getElementById('thumb-'+i),imgSrc);
  });
  if(pagination)renderPager(pagination);
}

function renderPager(p){
  var c=document.getElementById('pagination');
  if(!p||p.totalPages<=1){c.innerHTML='';return}
  var h='';
  if(p.page>1)h+='<a href="?page='+(p.page-1)+'" data-page="'+(p.page-1)+'">&laquo;</a>';
  for(var i=1;i<=p.totalPages;i++){
    if(i===p.page)h+='<span class="active">'+i+'</span>';
    else h+='<a href="?page='+i+'" data-page="'+i+'">'+i+'</a>';
  }
  if(p.page<p.totalPages)h+='<a href="?page='+(p.page+1)+'" data-page="'+(p.page+1)+'">&raquo;</a>';
  c.innerHTML=h;
}

async function loadCategories(){
  try{
    var res=await fetch(API+'/category/list');var data=await res.json();
    if(data.data&&Array.isArray(data.data)){
      var c=document.getElementById('categories');
      if(!data.data.length){c.innerHTML='<li>暂无分类</li>';return}
      c.innerHTML='';
      data.data.forEach(function(cat){
        var li=document.createElement('li');var a=document.createElement('a');
        var slug=cat.slug||cat.id;
        a.href='/category/'+slug;
        a.setAttribute('data-testid','category-link');
        a.setAttribute('data-slug',slug);
        a.innerHTML='<span>'+escapeHtml(cat.name)+'</span><span class="cnt">'+(cat.post_count||0)+'</span>';
        li.appendChild(a);c.appendChild(li);
      });
    }
  }catch(e){console.error('Load categories:',e)}
}

async function loadTags(){
  try{
    var res=await fetch(API+'/tag/list');var data=await res.json();
    if(data.data&&Array.isArray(data.data)){
      var c=document.getElementById('tags');
      if(!data.data.length){c.innerHTML='<span>暂无标签</span>';return}
      c.innerHTML='';
      data.data.forEach(function(tag){
        var a=document.createElement('a');
        var slug=tag.slug||tag.id;
        a.href='/tag/'+slug;
        a.setAttribute('data-testid','tag-link');
        a.setAttribute('data-slug',slug);
        a.textContent=tag.name;
        c.appendChild(a);
      });
    }
  }catch(e){console.error('Load tags:',e)}
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Post detail (client-side rendered)
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/post/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '文章详情',
    blogTitle,
    bodyAttrs: ' data-testid="post-detail"',
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
    <div id="comments-container"></div>
  </div>
</div>`,
    script: `
var API='/api';
var postParam='${escJs(slug)}';
var currentPostId=null;

document.addEventListener('DOMContentLoaded',async function(){
  try{
    var isNum=!isNaN(parseInt(postParam))&&String(parseInt(postParam))===postParam;
    var url=isNum?API+'/post/'+postParam:API+'/post/slug/'+postParam;
    var res=await fetch(url);var result=await res.json();
    if(result&&result.id){
      currentPostId=result.id;
      document.querySelector('[data-testid="post-title"]').textContent=result.title;
      document.title=escapeHtml(result.title)+' - ${escJs(blogTitle)}';

      // Hero image
      var imgSrc=getFirstImg(result.content);
      if(imgSrc)checkThumb(document.getElementById('hero'),imgSrc);

      // Meta
      var date=result.published_at||result.created_at;
      var dateStr=date?new Date(date).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):'';
      var metaHtml='<span>'+dateStr+'</span>';
      if(result.author_name)metaHtml+='<span>'+escapeHtml(result.author_name)+'</span>';
      metaHtml+='<span>'+readTime(result.content)+'</span>';
      metaHtml+='<span>阅读 '+(result.view_count||0)+'</span>';
      document.querySelector('[data-testid="post-meta"]').innerHTML=metaHtml;

      // Content - parse markdown to HTML
      document.querySelector('[data-testid="post-content"]').innerHTML=renderMd(result.content)||'<p>暂无内容</p>';

      // Tags
      if(result.tags&&result.tags.length){
        var tagsHtml='<div class="post-tags"><span class="label">标签:</span>';
        result.tags.forEach(function(t){
          var s=t.slug||t.id;
          tagsHtml+='<a class="post-tag-link" href="/tag/'+s+'">'+escapeHtml(t.name)+'</a>';
        });
        tagsHtml+='</div>';
        document.getElementById('post-tags-area').innerHTML=tagsHtml;
      }

      // Comments
      if(result.comment_status===0){
        document.getElementById('comments-container').innerHTML='<div class="comments-disabled">本文已关闭评论</div>';
      }else{
        renderCommentsSection(result.id);
      }
    }else{
      document.querySelector('[data-testid="post-title"]').textContent='文章不存在';
      document.querySelector('[data-testid="post-content"]').innerHTML='';
    }
  }catch(e){
    console.error('Load post:',e);
    document.querySelector('[data-testid="post-content"]').innerHTML='<p>加载失败</p>';
  }
});

function renderCommentsSection(pid){
  var c=document.getElementById('comments-container');
  c.innerHTML='<section class="comments" data-testid="comments-section">'+
    '<h2>评论</h2><div id="comment-message"></div>'+
    '<form class="cmt-form" id="comment-form">'+
      '<div class="cmt-row-inline">'+
        '<div class="cmt-row" style="flex:1"><label for="author">昵称</label><input type="text" id="author" name="author" required></div>'+
        '<div class="cmt-row" style="flex:1"><label for="email">邮箱 (可选)</label><input type="email" id="email" name="email"></div>'+
      '</div>'+
      '<div class="cmt-row"><label for="comment-content">评论内容</label><textarea id="comment-content" name="content" rows="4" required></textarea></div>'+
      '<button type="submit" class="cmt-btn">发表评论</button>'+
    '</form>'+
    '<div id="comments"></div>'+
  '</section>';
  loadComments(pid);
  document.getElementById('comment-form').addEventListener('submit',handleComment);
}

async function loadComments(pid){
  try{
    var res=await fetch(API+'/comment/post/'+pid);var result=await res.json();
    if(result.data&&Array.isArray(result.data))renderComments(result.data);
    else renderComments([]);
  }catch(e){
    console.error('Load comments:',e);
    var el=document.getElementById('comments');
    if(el)el.innerHTML='<p>加载评论失败</p>';
  }
}

function renderComments(comments){
  var c=document.getElementById('comments');if(!c)return;
  if(!comments.length){c.innerHTML='<p style="color:var(--muted);padding:1rem 0">暂无评论，快来抢沙发吧！</p>';return}
  c.innerHTML='';
  comments.forEach(function(cm){
    addComment(c,cm,false);
    if(cm.replies&&cm.replies.length){
      cm.replies.forEach(function(r){addComment(c,r,true)});
    }
  });
}

function addComment(container,cm,isReply){
  var d=document.createElement('div');
  d.className='comment-item'+(isReply?' cmt-reply':'');
  d.innerHTML='<div class="cmt-author">'+escapeHtml(cm.author_name)+'</div>'+
    '<div class="cmt-text">'+escapeHtml(cm.content)+'</div>'+
    '<div class="cmt-date">'+new Date(cm.created_at).toLocaleString('zh-CN')+'</div>';
  container.appendChild(d);
}

async function handleComment(e){
  e.preventDefault();
  var author=document.getElementById('author').value.trim();
  var email=document.getElementById('email').value.trim();
  var content=document.getElementById('comment-content').value.trim();
  if(!author||!content){showMsg('请填写昵称和评论内容','error');return}
  try{
    var res=await fetch(API+'/comment/create',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({post_id:currentPostId,author_name:author,author_email:email,content:content})
    });
    var result=await res.json();
    if(res.ok){showMsg('评论发表成功！','success');document.getElementById('comment-form').reset();loadComments(currentPostId)}
    else showMsg(result.message||'评论发表失败','error');
  }catch(e){console.error(e);showMsg('评论发表失败','error')}
}

function showMsg(text,type){
  var el=document.getElementById('comment-message');
  el.textContent=text;el.className=type;
  setTimeout(function(){el.style.display='none';el.className=''},5000);
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Login (keep Vue/TDesign)
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/login', async (c) => {
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
body{margin:0;background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.login-card{width:400px}
.login-title{text-align:center;margin-bottom:24px;font-size:24px;color:#333}
.login-footer{text-align:center;margin-top:16px;font-size:13px;color:#999}
.login-footer a{color:#0052d9;text-decoration:none}
</style>
</head>
<body>
<div id="app" v-cloak>
  <t-card class="login-card" :bordered="true">
    <div class="login-title">${esc(blogTitle)} 登录</div>
    <t-form data-testid="login-form" @submit="onSubmit">
      <t-form-item label="用户名" name="username">
        <t-input v-model="form.username" placeholder="请输入用户名" data-testid="username-input"></t-input>
      </t-form-item>
      <t-form-item label="密码" name="password">
        <t-input v-model="form.password" type="password" placeholder="请输入密码" data-testid="password-input"></t-input>
      </t-form-item>
      <t-form-item>
        <t-button theme="primary" type="submit" block :loading="loading" data-testid="login-button">登录</t-button>
      </t-form-item>
    </t-form>
    <div class="login-footer"><a href="/">返回首页</a></div>
  </t-card>
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
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '搜索',
    blogTitle,
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">搜索</h1>
    <form class="search-box" data-testid="search-form" method="GET" action="/search">
      <input type="text" name="keyword" value="${esc(keyword)}" placeholder="输入关键词..." data-testid="search-input">
      <button type="submit" data-testid="search-button">搜索</button>
    </form>
    <div data-testid="search-results" id="results"></div>
  </div>
</div>`,
    script: `
var API='/api';
var kw='${escJs(keyword)}';
document.addEventListener('DOMContentLoaded',function(){if(kw)doSearch(kw)});

async function doSearch(keyword){
  if(!keyword.trim()){document.getElementById('results').innerHTML='<p class="empty">请输入关键词</p>';return}
  try{
    var res=await fetch(API+'/search?keyword='+encodeURIComponent(keyword));
    var result=await res.json();
    var posts=result.results||result.data||[];
    if(Array.isArray(posts))renderResults(posts,keyword);
    else document.getElementById('results').innerHTML='<p class="empty">未找到相关文章</p>';
  }catch(e){console.error(e);document.getElementById('results').innerHTML='<p class="empty">搜索失败</p>'}
}

function renderResults(posts,keyword){
  var c=document.getElementById('results');
  if(!posts.length){c.innerHTML='<p class="empty">未找到包含 "'+escapeHtml(keyword)+'" 的文章</p>';return}
  var html='<p style="color:var(--muted);margin-bottom:1rem">找到 '+posts.length+' 篇相关文章</p>';
  posts.forEach(function(p){
    var href=p.slug?'/post/'+p.slug:'/post/'+p.id;
    html+='<div class="result-item"><h2><a href="'+href+'">'+escapeHtml(p.title)+'</a></h2>';
    html+='<p>'+escapeHtml(p.excerpt||'暂无摘要')+'</p>';
    html+='<small>'+new Date(p.created_at).toLocaleDateString('zh-CN')+'</small></div>';
  });
  c.innerHTML=html;
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Feedback
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/feedback', async (c) => {
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '留言板',
    blogTitle,
    activePage: 'feedback',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">留言板</h1>
    <div id="message"></div>
    <form class="fb-form" data-testid="feedback-form" id="feedback-form">
      <div class="fb-row">
        <label for="name">姓名</label>
        <input type="text" id="name" name="name" required data-testid="feedback-name-input">
      </div>
      <div class="fb-row">
        <label for="email">邮箱</label>
        <input type="email" id="email" name="email" data-testid="feedback-email-input">
      </div>
      <div class="fb-row">
        <label for="content">内容</label>
        <textarea id="content" name="content" required data-testid="feedback-content-input" rows="5"></textarea>
      </div>
      <button type="submit" class="fb-btn" data-testid="feedback-submit-button">提交</button>
    </form>
    <h2 style="margin-top:2rem;font-size:1.1rem">最新留言</h2>
    <div id="feedback-list"><p style="color:var(--muted)">留言提交后将由管理员审核</p></div>
  </div>
</div>`,
    script: `
var API='/api';
document.getElementById('feedback-form').addEventListener('submit',async function(e){
  e.preventDefault();
  var name=document.getElementById('name').value;
  var email=document.getElementById('email').value;
  var content=document.getElementById('content').value;
  if(!name||!content){showMessage('请填写姓名和内容','error');return}
  try{
    var res=await fetch(API+'/feedback/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,email:email,content:content})});
    var result=await res.json();
    if(res.ok){showMessage('留言提交成功！','success');document.getElementById('feedback-form').reset()}
    else showMessage(result.message||'提交失败','error');
  }catch(e){console.error(e);showMessage('提交失败','error')}
});

function showMessage(text,type){
  var el=document.getElementById('message');
  el.textContent=text;el.className=type;
  setTimeout(function(){el.style.display='none';el.className=''},5000);
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Categories list
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/categories', async (c) => {
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '分类',
    blogTitle,
    activePage: 'categories',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类列表</h1>
    <div class="cat-grid" id="categories-list"></div>
  </div>
</div>`,
    script: `
var API='/api';
document.addEventListener('DOMContentLoaded',async function(){
  try{
    var res=await fetch(API+'/category/list');var data=await res.json();
    if(data.data&&Array.isArray(data.data))renderCats(data.data);
  }catch(e){console.error(e)}
});

function renderCats(cats){
  var c=document.getElementById('categories-list');
  if(!cats.length){c.innerHTML='<p class="empty">暂无分类</p>';return}
  c.innerHTML='';
  cats.forEach(function(cat){
    var slug=cat.slug||cat.id;
    var d=document.createElement('div');d.className='cat-card category-item';
    d.innerHTML='<h2><a href="/category/'+encodeURIComponent(slug)+'">'+escapeHtml(cat.name)+'</a></h2>'+
      '<p>'+(cat.description?escapeHtml(cat.description):'暂无描述')+'</p>'+
      '<small>文章数: '+(cat.post_count||0)+'</small>';
    c.appendChild(d);
  });
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Category detail
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/category/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '分类: ' + slug,
    blogTitle,
    activePage: 'categories',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">分类: ${esc(slug)}</h1>
    <div id="posts-list"><p style="color:var(--muted)">加载中...</p></div>
  </div>
</div>`,
    script: `
var API='/api';
var param='${escJs(slug)}';

document.addEventListener('DOMContentLoaded',async function(){
  try{
    var isNum=!isNaN(parseInt(param));
    var url=isNum?API+'/category/'+param:API+'/category/slug/'+param;
    var res=await fetch(url);var result=await res.json();
    if(result&&result.id){
      document.querySelector('h1').textContent='分类: '+result.name;
      var c=document.getElementById('posts-list');
      c.innerHTML='<p>'+escapeHtml(result.description||'暂无描述')+'</p><p style="color:var(--muted);font-size:.9rem">文章数: '+(result.post_count||0)+'</p>';
    }else{
      document.getElementById('posts-list').innerHTML='<p class="empty">分类不存在</p>';
    }
  }catch(e){console.error(e);document.getElementById('posts-list').innerHTML='<p class="empty">加载失败</p>'}
});
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Tags list
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/tags', async (c) => {
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '标签',
    blogTitle,
    activePage: 'tags',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签列表</h1>
    <div class="tag-page tag-cloud" id="tags-list"></div>
  </div>
</div>`,
    script: `
var API='/api';
document.addEventListener('DOMContentLoaded',async function(){
  try{
    var res=await fetch(API+'/tag/list');var data=await res.json();
    if(data.data&&Array.isArray(data.data))renderTags(data.data);
  }catch(e){console.error(e)}
});

function renderTags(tags){
  var c=document.getElementById('tags-list');
  if(!tags.length){c.innerHTML='<p class="empty">暂无标签</p>';return}
  c.innerHTML='';
  tags.forEach(function(tag){
    var slug=tag.slug||tag.id;
    var a=document.createElement('a');
    a.href='/tag/'+slug;
    a.textContent=tag.name+' ('+(tag.post_count||0)+')';
    c.appendChild(a);
  });
}
`
  }));
});

// ═════════════════════════════════════════════════════════════
// Tag detail
// ═════════════════════════════════════════════════════════════

frontendRoutes.get('/tag/:slug', async (c) => {
  const slug = c.req.param('slug');
  const settings = await getSettings(c);
  const blogTitle = settings.blog_title || 'CFBlog';

  return c.html(layout({
    title: '标签: ' + slug,
    blogTitle,
    activePage: 'tags',
    content: `
<div class="page narrow">
  <div class="content">
    <h1 class="pg-title">标签: ${esc(slug)}</h1>
    <div id="posts-list"><p style="color:var(--muted)">加载中...</p></div>
  </div>
</div>`,
    script: `
var API='/api';
var param='${escJs(slug)}';

document.addEventListener('DOMContentLoaded',async function(){
  try{
    var isNum=!isNaN(parseInt(param));
    var url=isNum?API+'/tag/'+param:API+'/tag/slug/'+param;
    var res=await fetch(url);var result=await res.json();
    if(result&&result.id){
      document.querySelector('h1').textContent='标签: '+result.name;
      document.getElementById('posts-list').innerHTML='<p style="color:var(--muted);font-size:.9rem">文章数: '+(result.post_count||0)+'</p>';
    }else{
      document.getElementById('posts-list').innerHTML='<p class="empty">标签不存在</p>';
    }
  }catch(e){console.error(e);document.getElementById('posts-list').innerHTML='<p class="empty">加载失败</p>'}
});
`
  }));
});

// ═════════════════════════════════════════════════════════════
// RSS
// ═════════════════════════════════════════════════════════════

async function handleRSS(c) {
  const bucket = c.env?.BUCKET;
  const db = c.env?.DB;
  const { getCachedRSS, refreshRSSCache } = await import('../utils/cache.js');

  let xml = await getCachedRSS(bucket);
  if (!xml && db) {
    const origin = new URL(c.req.url).origin;
    await refreshRSSCache(bucket, db, origin);
    xml = await getCachedRSS(bucket);
  }

  if (!xml) return c.text('RSS feed not available', 500);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

frontendRoutes.get('/rss', handleRSS);
frontendRoutes.get('/feed', handleRSS);

export { frontendRoutes };
