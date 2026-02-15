/**
 * Admin Routes - Hono Version
 * Vue 3 + TDesign Vue Next
 */

import { Hono } from 'hono';
import { requireAdmin } from './base.js';

const adminRoutes = new Hono();

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function adminLayout(title, activePage, templateHtml, scriptContent, options = {}) {
  const navItems = [
    { key: 'dashboard', label: '仪表板', icon: '&#9632;', href: '/admin' },
    { key: 'posts', label: '文章管理', icon: '&#9998;', href: '/admin/posts' },
    { key: 'categories', label: '分类管理', icon: '&#9776;', href: '/admin/categories' },
    { key: 'tags', label: '标签管理', icon: '&#9830;', href: '/admin/tags' },
    { key: 'comments', label: '评论管理', icon: '&#9993;', href: '/admin/comments' },
    { key: 'feedback', label: '留言管理', icon: '&#9733;', href: '/admin/feedback' },
    { key: 'attachments', label: '附件管理', icon: '&#128206;', href: '/admin/attachments' },
    { key: 'users', label: '用户管理', icon: '&#9786;', href: '/admin/users' },
    { key: 'settings', label: '系统设置', icon: '&#9881;', href: '/admin/settings' },
  ];
  const navHtml = navItems.map(item => {
    const cls = item.key === activePage ? ' active' : '';
    return `<a href="${item.href}" class="nav-item${cls}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
  }).join('\n');

  const isModule = options.module === true;

  const moduleHeadCss = isModule
    ? '\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/md-editor-v3@5/lib/style.css">'
    : '';

  const scriptsHtml = isModule
    ? `<script type="importmap">
{
  "imports": {
    "vue": "https://esm.sh/vue@3",
    "tdesign-vue-next": "https://esm.sh/tdesign-vue-next@1?bundle&external=vue",
    "md-editor-v3": "https://esm.sh/md-editor-v3@5?bundle&external=vue"
  }
}
</script>
<script type="module">
${scriptContent}
</script>`
    : `<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tdesign-vue-next/dist/tdesign.min.js"></script>
<script>
${scriptContent}
</script>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - CFBlog Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tdesign-vue-next/dist/tdesign.min.css">${moduleHeadCss}
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f0f2f5; }
    .admin-layout { display:flex; min-height:100vh; }
    .admin-sidebar { width:232px; background:#001529; color:#fff; position:fixed; top:0; left:0; bottom:0; overflow-y:auto; z-index:100; }
    .sidebar-logo { padding:20px 24px; border-bottom:1px solid #0d2137; }
    .sidebar-logo a { color:#fff; text-decoration:none; font-size:16px; font-weight:600; }
    .sidebar-nav { padding:8px 0; }
    .nav-item { display:flex; align-items:center; padding:10px 24px; color:rgba(255,255,255,0.65); text-decoration:none; font-size:14px; transition:all 0.2s; }
    .nav-item:hover { color:#fff; background:rgba(255,255,255,0.08); }
    .nav-item.active { color:#fff; background:#0052d9; }
    .nav-icon { margin-right:10px; width:16px; text-align:center; }
    .sidebar-footer { position:absolute; bottom:0; left:0; right:0; padding:16px 24px; border-top:1px solid #0d2137; display:flex; gap:16px; }
    .sidebar-footer a { color:rgba(255,255,255,0.45); text-decoration:none; font-size:13px; }
    .sidebar-footer a:hover { color:#fff; }
    .admin-main { margin-left:232px; flex:1; min-width:0; }
    .admin-topbar { background:#fff; padding:16px 24px; border-bottom:1px solid #e7e7e7; }
    .admin-topbar h1 { font-size:18px; font-weight:600; color:#000; }
    .admin-content { padding:24px; }
    [v-cloak] { display:none; }
  </style>
</head>
<body>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-logo"><a href="/admin">CFBlog Admin</a></div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <a href="/" target="_blank">查看网站</a>
        <a href="#" id="logout-btn">退出登录</a>
      </div>
    </aside>
    <div class="admin-main">
      <div class="admin-topbar"><h1>${escapeHtml(title)}</h1></div>
      <div class="admin-content" id="app" v-cloak>${templateHtml}</div>
    </div>
  </div>
  <script>
    var API='/api';
    async function apiCall(url,opts){
      opts=opts||{};
      var res=await fetch(API+url,opts);
      var data=await res.json();
      if(!res.ok) throw new Error(data.message||'Request failed');
      return data;
    }
    function fmtDate(d){if(!d)return '-';return new Date(d).toLocaleDateString('zh-CN');}
    function fmtSize(bytes){if(!bytes)return '0 B';var k=1024;var sizes=['B','KB','MB','GB'];var i=Math.floor(Math.log(bytes)/Math.log(k));return parseFloat((bytes/Math.pow(k,i)).toFixed(1))+' '+sizes[i];}
    document.getElementById('logout-btn').addEventListener('click',function(e){
      e.preventDefault();
      fetch(API+'/user/logout',{method:'POST'}).then(function(){window.location.href='/login';}).catch(function(){window.location.href='/login';});
    });
  </script>
  ${scriptsHtml}
</body>
</html>`;
}

// ============================================================
// Dashboard
// ============================================================
adminRoutes.get('/', requireAdmin, (c) => {
  return c.html(adminLayout('仪表板', 'dashboard', `
    <t-row :gutter="[16,16]">
      <t-col :span="3" v-for="s in stats" :key="s.title">
        <t-card :bordered="true" hover-shadow>
          <div style="text-align:center">
            <div style="color:#888;font-size:14px;margin-bottom:4px">{{ s.title }}</div>
            <div style="font-size:28px;font-weight:700" :style="{color:s.color}">{{ s.value }}</div>
          </div>
        </t-card>
      </t-col>
    </t-row>
    <t-row :gutter="[16,16]" style="margin-top:16px">
      <t-col :span="6">
        <t-card title="最新文章" :bordered="true" hover-shadow>
          <t-table :data="recentPosts" :columns="postCols" row-key="id" size="small" :hover="true">
            <template #title="{ row }">
              <a :href="'/admin/posts/edit/'+row.id" style="color:#0052d9;text-decoration:none">{{ row.title }}</a>
            </template>
            <template #status="{ row }">
              <t-tag :theme="row.status===1?'success':'warning'" variant="light" size="small">{{ row.status===1?'已发布':'草稿' }}</t-tag>
            </template>
            <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
          </t-table>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card title="最新评论" :bordered="true" hover-shadow>
          <t-table :data="recentComments" :columns="commentCols" row-key="id" size="small" :hover="true">
            <template #content="{ row }">{{ (row.content||'').substring(0,40) }}</template>
            <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
          </t-table>
        </t-card>
      </t-col>
    </t-row>
  `, `
    var { createApp, ref, onMounted } = Vue;
    var app = createApp({
      setup: function() {
        var stats = ref([
          { title:'文章总数', value:'-', color:'#0052d9' },
          { title:'评论总数', value:'-', color:'#2ba471' },
          { title:'用户总数', value:'-', color:'#e37318' },
          { title:'留言总数', value:'-', color:'#7b2cbf' }
        ]);
        var recentPosts = ref([]);
        var recentComments = ref([]);
        var postCols = [
          { colKey:'title', title:'标题', ellipsis:true },
          { colKey:'status', title:'状态', width:80 },
          { colKey:'created_at', title:'日期', width:110 }
        ];
        var commentCols = [
          { colKey:'author_name', title:'作者', width:100 },
          { colKey:'content', title:'内容', ellipsis:true },
          { colKey:'created_at', title:'日期', width:110 }
        ];
        onMounted(async function() {
          try {
            var results = await Promise.all([
              apiCall('/post/list?limit=5'), apiCall('/comment/list?limit=5'),
              apiCall('/user/list?limit=5'), apiCall('/feedback/list?limit=5')
            ]);
            stats.value[0].value = results[0].pagination?.total ?? 0;
            stats.value[1].value = results[1].pagination?.total ?? 0;
            stats.value[2].value = results[2].pagination?.total ?? 0;
            stats.value[3].value = results[3].pagination?.total ?? 0;
            recentPosts.value = results[0].data || [];
            recentComments.value = results[1].data || [];
          } catch(e) { console.error(e); }
        });
        return { stats, recentPosts, recentComments, postCols, commentCols, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Posts List
// ============================================================
adminRoutes.get('/posts', requireAdmin, (c) => {
  return c.html(adminLayout('文章管理', 'posts', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-button theme="primary" @click="goCreate">新建文章</t-button>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #title="{ row }">
          <a :href="'/admin/posts/edit/'+row.id" style="color:#0052d9;text-decoration:none">{{ row.title }}</a>
          <t-tag v-if="row.featured" size="small" theme="primary" variant="light" style="margin-left:4px">推荐</t-tag>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status===1?'success':'warning'" variant="light" size="small">{{ row.status===1?'已发布':'草稿' }}</t-tag>
        </template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" :href="'/admin/posts/edit/'+row.id">编辑</t-link>
            <t-popconfirm content="确定要删除这篇文章吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
  `, `
    var { createApp, ref, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]);
        var loading = ref(false);
        var page = ref(1);
        var total = ref(0);
        var pageSize = 15;
        var columns = [
          { colKey:'title', title:'标题', ellipsis:true },
          { colKey:'author_name', title:'作者', width:100 },
          { colKey:'status', title:'状态', width:80 },
          { colKey:'view_count', title:'浏览', width:70 },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:120 }
        ];
        async function loadData() {
          loading.value = true;
          try {
            var data = await apiCall('/post/list?page='+page.value+'&limit='+pageSize);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) { console.error(e); }
          loading.value = false;
        }
        async function del(id) {
          try {
            await apiCall('/post/'+id+'/delete', { method:'DELETE' });
            MessagePlugin.success('文章已删除');
            loadData();
          } catch(e) {}
        }
        function goCreate() { window.location.href='/admin/posts/new'; }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, columns, loadData, goCreate, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// New Post (md-editor-v3 + import map)
// ============================================================
adminRoutes.get('/posts/new', requireAdmin, (c) => {
  return c.html(adminLayout('新建文章', 'posts', `
    <t-card :bordered="true">
      <t-form label-width="80px">
        <t-form-item label="标题">
          <t-input v-model="form.title" placeholder="请输入文章标题"></t-input>
        </t-form-item>
        <t-form-item label="摘要">
          <t-textarea v-model="form.excerpt" placeholder="请输入文章摘要" :autosize="{minRows:2,maxRows:4}"></t-textarea>
        </t-form-item>
        <t-form-item label="内容">
          <md-editor v-model="form.content" language="zh-CN" style="height:500px" @on-upload-img="onUploadImg"></md-editor>
        </t-form-item>
        <t-row :gutter="[24,0]">
          <t-col :span="6">
            <t-form-item label="分类">
              <t-select v-model="form.categoryIds" multiple placeholder="选择分类" :loading="selectLoading">
                <t-option v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name"></t-option>
              </t-select>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="标签">
              <t-tag-input v-model="form.tagNames" v-model:input-value="tagInput" placeholder="输入标签 按空格或回车添加" @enter="onTagEnter" @input-change="onTagInputChange"></t-tag-input>
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="[24,0]">
          <t-col :span="6">
            <t-form-item label="状态">
              <t-radio-group v-model="form.status">
                <t-radio :value="0">草稿</t-radio>
                <t-radio :value="1">发布</t-radio>
              </t-radio-group>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="选项">
              <t-checkbox v-model="form.featured" style="margin-right:16px">推荐文章</t-checkbox>
              <t-checkbox v-model="form.commentStatus">允许评论</t-checkbox>
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item>
          <t-space>
            <t-button theme="primary" :loading="saving" @click="save">保存文章</t-button>
            <t-button variant="outline" @click="goBack">返回列表</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  `, `
    import { createApp, ref, reactive, onMounted } from 'vue';
    import TDesign, { MessagePlugin } from 'tdesign-vue-next';
    import { MdEditor } from 'md-editor-v3';
    const app = createApp({
      components: { MdEditor },
      setup() {
        const form = reactive({ title:'', excerpt:'', content:'', categoryIds:[], tagNames:[], status:0, featured:false, commentStatus:true });
        const tagInput = ref('');
        const categories = ref([]);
        const allTags = ref([]);
        const selectLoading = ref(true);
        const saving = ref(false);
        async function onUploadImg(files, callback) {
          const urls = [];
          for (const file of files) {
            try {
              const fd = new FormData();
              fd.append('file', file);
              const res = await fetch('/api/upload', { method:'POST', body:fd });
              const data = await res.json();
              if (data.success && data.data?.url) urls.push(data.data.url);
            } catch(e) { console.error('Upload failed:', e); }
          }
          callback(urls);
        }
        function onTagEnter() {
          const t = tagInput.value.trim();
          if (t && !form.tagNames.includes(t)) form.tagNames.push(t);
          tagInput.value = '';
        }
        function onTagInputChange(val) {
          if (val && val.includes(' ')) {
            val.split(/\\s+/).filter(s => s).forEach(s => {
              if (!form.tagNames.includes(s)) form.tagNames.push(s);
            });
            tagInput.value = '';
          }
        }
        async function resolveTagIds(names) {
          const ids = [];
          for (const name of names) {
            const found = allTags.value.find(t => t.name === name);
            if (found) { ids.push(found.id); }
            else {
              try {
                const created = await apiCall('/tag/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
                if (created.id) { ids.push(created.id); allTags.value.push(created); }
              } catch(e) { console.error('Tag create failed:', name); }
            }
          }
          return ids;
        }
        async function save() {
          if (!form.title) { MessagePlugin.warning('请输入标题'); return; }
          saving.value = true;
          try {
            const tagIds = await resolveTagIds(form.tagNames);
            await apiCall('/post/create',{
              method:'POST', headers:{'Content-Type':'application/json'},
              body:JSON.stringify({
                title:form.title, excerpt:form.excerpt, content:form.content,
                status:form.status, featured:form.featured?1:0,
                commentStatus:form.commentStatus?1:0,
                categoryIds:form.categoryIds, tagIds, author_id:1
              })
            });
            MessagePlugin.success('文章创建成功');
            setTimeout(() => { window.location.href='/admin/posts'; }, 800);
          } catch(e) { console.error(e); }
          saving.value = false;
        }
        function goBack() { window.location.href='/admin/posts'; }
        onMounted(async () => {
          try {
            const results = await Promise.all([apiCall('/category/list?limit=100'), apiCall('/tag/list?limit=100')]);
            categories.value = results[0].data || [];
            allTags.value = results[1].data || [];
          } catch(e) {}
          selectLoading.value = false;
        });
        return { form, tagInput, categories, selectLoading, saving, onUploadImg, onTagEnter, onTagInputChange, save, goBack };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `, { module: true }));
});

// ============================================================
// Edit Post (md-editor-v3 + import map)
// ============================================================
adminRoutes.get('/posts/edit/:id', requireAdmin, (c) => {
  const postId = c.req.param('id');
  return c.html(adminLayout('编辑文章', 'posts', `
    <t-card :bordered="true" :loading="pageLoading">
      <t-form label-width="80px">
        <t-form-item label="标题">
          <t-input v-model="form.title" placeholder="请输入文章标题"></t-input>
        </t-form-item>
        <t-form-item label="摘要">
          <t-textarea v-model="form.excerpt" placeholder="请输入文章摘要" :autosize="{minRows:2,maxRows:4}"></t-textarea>
        </t-form-item>
        <t-form-item label="内容">
          <md-editor v-model="form.content" language="zh-CN" style="height:500px" @on-upload-img="onUploadImg"></md-editor>
        </t-form-item>
        <t-row :gutter="[24,0]">
          <t-col :span="6">
            <t-form-item label="分类">
              <t-select v-model="form.categoryIds" multiple placeholder="选择分类" :loading="selectLoading">
                <t-option v-for="cat in categories" :key="cat.id" :value="cat.id" :label="cat.name"></t-option>
              </t-select>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="标签">
              <t-tag-input v-model="form.tagNames" v-model:input-value="tagInput" placeholder="输入标签 按空格或回车添加" @enter="onTagEnter" @input-change="onTagInputChange"></t-tag-input>
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="[24,0]">
          <t-col :span="6">
            <t-form-item label="状态">
              <t-radio-group v-model="form.status">
                <t-radio :value="0">草稿</t-radio>
                <t-radio :value="1">发布</t-radio>
              </t-radio-group>
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="选项">
              <t-checkbox v-model="form.featured" style="margin-right:16px">推荐文章</t-checkbox>
              <t-checkbox v-model="form.commentStatus">允许评论</t-checkbox>
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item>
          <t-space>
            <t-button theme="primary" :loading="saving" @click="save">保存更改</t-button>
            <t-button variant="outline" @click="goBack">返回列表</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  `, `
    import { createApp, ref, reactive, onMounted } from 'vue';
    import TDesign, { MessagePlugin } from 'tdesign-vue-next';
    import { MdEditor } from 'md-editor-v3';
    const postId = ${escapeHtml(postId)};
    const app = createApp({
      components: { MdEditor },
      setup() {
        const form = reactive({ title:'', excerpt:'', content:'', categoryIds:[], tagNames:[], status:0, featured:false, commentStatus:true });
        const tagInput = ref('');
        const categories = ref([]);
        const allTags = ref([]);
        const selectLoading = ref(true);
        const pageLoading = ref(true);
        const saving = ref(false);
        async function onUploadImg(files, callback) {
          const urls = [];
          for (const file of files) {
            try {
              const fd = new FormData();
              fd.append('file', file);
              const res = await fetch('/api/upload', { method:'POST', body:fd });
              const data = await res.json();
              if (data.success && data.data?.url) urls.push(data.data.url);
            } catch(e) { console.error('Upload failed:', e); }
          }
          callback(urls);
        }
        function onTagEnter() {
          const t = tagInput.value.trim();
          if (t && !form.tagNames.includes(t)) form.tagNames.push(t);
          tagInput.value = '';
        }
        function onTagInputChange(val) {
          if (val && val.includes(' ')) {
            val.split(/\\s+/).filter(s => s).forEach(s => {
              if (!form.tagNames.includes(s)) form.tagNames.push(s);
            });
            tagInput.value = '';
          }
        }
        async function resolveTagIds(names) {
          const ids = [];
          for (const name of names) {
            const found = allTags.value.find(t => t.name === name);
            if (found) { ids.push(found.id); }
            else {
              try {
                const created = await apiCall('/tag/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
                if (created.id) { ids.push(created.id); allTags.value.push(created); }
              } catch(e) { console.error('Tag create failed:', name); }
            }
          }
          return ids;
        }
        async function save() {
          if (!form.title) { MessagePlugin.warning('请输入标题'); return; }
          saving.value = true;
          try {
            const tagIds = await resolveTagIds(form.tagNames);
            await apiCall('/post/'+postId+'/update',{
              method:'PUT', headers:{'Content-Type':'application/json'},
              body:JSON.stringify({
                title:form.title, excerpt:form.excerpt, content:form.content,
                status:form.status, featured:form.featured?1:0,
                commentStatus:form.commentStatus?1:0,
                categoryIds:form.categoryIds, tagIds
              })
            });
            MessagePlugin.success('文章更新成功');
          } catch(e) { console.error(e); }
          saving.value = false;
        }
        function goBack() { window.location.href='/admin/posts'; }
        onMounted(async () => {
          try {
            const results = await Promise.all([
              apiCall('/post/'+postId), apiCall('/category/list?limit=100'), apiCall('/tag/list?limit=100')
            ]);
            const post = results[0];
            form.title = post.title || '';
            form.excerpt = post.excerpt || '';
            form.content = post.content || '';
            form.status = post.status || 0;
            form.featured = !!post.featured;
            form.commentStatus = post.comment_status !== 0;
            form.categoryIds = (post.categories||[]).map(c => c.id);
            form.tagNames = (post.tags||[]).map(t => t.name);
            categories.value = results[1].data || [];
            allTags.value = results[2].data || [];
          } catch(e) { MessagePlugin.error('加载文章失败'); }
          selectLoading.value = false;
          pageLoading.value = false;
        });
        return { form, tagInput, categories, selectLoading, pageLoading, saving, onUploadImg, onTagEnter, onTagInputChange, save, goBack };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `, { module: true }));
});

// ============================================================
// Categories Management
// ============================================================
adminRoutes.get('/categories', requireAdmin, (c) => {
  return c.html(adminLayout('分类管理', 'categories', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-button theme="primary" @click="showModal(null)">新建分类</t-button>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #description="{ row }">{{ (row.description||'-').substring(0,40) }}</template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" @click="showModal(row)">编辑</t-link>
            <t-popconfirm content="确定要删除这个分类吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
    <t-dialog v-model:visible="dialogVisible" :header="editId?'编辑分类':'新建分类'" :confirm-btn="{content:'保存',loading:saving}" @confirm="save" @close="dialogVisible=false">
      <t-form label-width="60px">
        <t-form-item label="名称">
          <t-input v-model="form.name" placeholder="分类名称"></t-input>
        </t-form-item>
        <t-form-item label="描述">
          <t-textarea v-model="form.description" placeholder="分类描述" :autosize="{minRows:2,maxRows:4}"></t-textarea>
        </t-form-item>
      </t-form>
    </t-dialog>
  `, `
    var { createApp, ref, reactive, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var columns = [
          { colKey:'name', title:'名称', width:200 },
          { colKey:'slug', title:'Slug', width:200 },
          { colKey:'description', title:'描述', ellipsis:true },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:120 }
        ];
        var dialogVisible = ref(false);
        var editId = ref(null);
        var form = reactive({ name:'', description:'' });
        var saving = ref(false);
        async function loadData() {
          loading.value = true;
          try {
            var data = await apiCall('/category/list?page='+page.value+'&limit='+pageSize);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) {}
          loading.value = false;
        }
        function showModal(row) {
          if (row) { editId.value=row.id; form.name=row.name; form.description=row.description||''; }
          else { editId.value=null; form.name=''; form.description=''; }
          dialogVisible.value = true;
        }
        async function save() {
          if (!form.name) { MessagePlugin.warning('请输入名称'); return; }
          saving.value = true;
          try {
            var body = { name:form.name, description:form.description };
            if (editId.value) {
              await apiCall('/category/'+editId.value+'/update',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
              MessagePlugin.success('分类已更新');
            } else {
              await apiCall('/category/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
              MessagePlugin.success('分类已创建');
            }
            dialogVisible.value = false;
            loadData();
          } catch(e) {}
          saving.value = false;
        }
        async function del(id) {
          try {
            await apiCall('/category/'+id+'/delete',{method:'DELETE'});
            MessagePlugin.success('分类已删除');
            loadData();
          } catch(e) {}
        }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, columns, dialogVisible, editId, form, saving, loadData, showModal, save, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Tags Management
// ============================================================
adminRoutes.get('/tags', requireAdmin, (c) => {
  return c.html(adminLayout('标签管理', 'tags', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-button theme="primary" @click="showModal(null)">新建标签</t-button>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" @click="showModal(row)">编辑</t-link>
            <t-popconfirm content="确定要删除这个标签吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
    <t-dialog v-model:visible="dialogVisible" :header="editId?'编辑标签':'新建标签'" :confirm-btn="{content:'保存',loading:saving}" @confirm="save" @close="dialogVisible=false">
      <t-form label-width="60px">
        <t-form-item label="名称">
          <t-input v-model="form.name" placeholder="标签名称"></t-input>
        </t-form-item>
      </t-form>
    </t-dialog>
  `, `
    var { createApp, ref, reactive, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var columns = [
          { colKey:'name', title:'名称', width:200 },
          { colKey:'slug', title:'Slug', width:200 },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:120 }
        ];
        var dialogVisible = ref(false);
        var editId = ref(null);
        var form = reactive({ name:'' });
        var saving = ref(false);
        async function loadData() {
          loading.value = true;
          try {
            var data = await apiCall('/tag/list?page='+page.value+'&limit='+pageSize);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) {}
          loading.value = false;
        }
        function showModal(row) {
          if (row) { editId.value=row.id; form.name=row.name; }
          else { editId.value=null; form.name=''; }
          dialogVisible.value = true;
        }
        async function save() {
          if (!form.name) { MessagePlugin.warning('请输入名称'); return; }
          saving.value = true;
          try {
            if (editId.value) {
              await apiCall('/tag/'+editId.value+'/update',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name})});
              MessagePlugin.success('标签已更新');
            } else {
              await apiCall('/tag/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name})});
              MessagePlugin.success('标签已创建');
            }
            dialogVisible.value = false;
            loadData();
          } catch(e) {}
          saving.value = false;
        }
        async function del(id) {
          try {
            await apiCall('/tag/'+id+'/delete',{method:'DELETE'});
            MessagePlugin.success('标签已删除');
            loadData();
          } catch(e) {}
        }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, columns, dialogVisible, editId, form, saving, loadData, showModal, save, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Comments Management
// ============================================================
adminRoutes.get('/comments', requireAdmin, (c) => {
  return c.html(adminLayout('评论管理', 'comments', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-select v-model="statusFilter" placeholder="全部状态" :clearable="true" style="width:150px" @change="onFilterChange">
        <t-option :value="1" label="已通过"></t-option>
        <t-option :value="0" label="待审核"></t-option>
      </t-select>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #content="{ row }">{{ (row.content||'').substring(0,50) }}</template>
        <template #post_title="{ row }">{{ (row.post_title||'-').substring(0,25) }}</template>
        <template #status="{ row }">
          <t-tag :theme="row.status===1?'success':'warning'" variant="light" size="small">{{ row.status===1?'已通过':'待审核' }}</t-tag>
        </template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link v-if="row.status!==1" theme="success" @click="toggleStatus(row.id,1)">通过</t-link>
            <t-link v-if="row.status===1" @click="toggleStatus(row.id,0)">拒绝</t-link>
            <t-popconfirm content="确定要删除这条评论吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
  `, `
    var { createApp, ref, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var statusFilter = ref(null);
        var columns = [
          { colKey:'author_name', title:'作者', width:100 },
          { colKey:'content', title:'内容', ellipsis:true },
          { colKey:'post_title', title:'文章', width:180 },
          { colKey:'status', title:'状态', width:80 },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:120 }
        ];
        async function loadData() {
          loading.value = true;
          try {
            var url = '/comment/list?page='+page.value+'&limit='+pageSize;
            if (statusFilter.value !== null && statusFilter.value !== undefined) url += '&status='+statusFilter.value;
            var data = await apiCall(url);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) {}
          loading.value = false;
        }
        function onFilterChange() { page.value=1; loadData(); }
        async function toggleStatus(id, s) {
          try {
            await apiCall('/comment/'+id+'/status',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});
            MessagePlugin.success('评论状态已更新');
            loadData();
          } catch(e) {}
        }
        async function del(id) {
          try {
            await apiCall('/comment/'+id+'/delete',{method:'DELETE'});
            MessagePlugin.success('评论已删除');
            loadData();
          } catch(e) {}
        }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, statusFilter, columns, loadData, onFilterChange, toggleStatus, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Feedback Management
// ============================================================
adminRoutes.get('/feedback', requireAdmin, (c) => {
  return c.html(adminLayout('留言管理', 'feedback', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-select v-model="statusFilter" placeholder="全部状态" :clearable="true" style="width:150px" @change="onFilterChange">
        <t-option :value="1" label="已处理"></t-option>
        <t-option :value="0" label="待处理"></t-option>
      </t-select>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #content="{ row }">
          <t-link theme="primary" @click="showDetail(row)">{{ (row.content||'').substring(0,40) }}</t-link>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status===1?'success':'warning'" variant="light" size="small">{{ row.status===1?'已处理':'待处理' }}</t-tag>
        </template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link v-if="row.status!==1" theme="success" @click="toggleStatus(row.id,1)">标记已处理</t-link>
            <t-link v-if="row.status===1" @click="toggleStatus(row.id,0)">标记未处理</t-link>
            <t-popconfirm content="确定要删除这条留言吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
    <t-dialog v-model:visible="detailVisible" header="留言详情" :footer="false" width="600px">
      <div v-if="detailItem">
        <p><strong>姓名：</strong>{{ detailItem.name }}</p>
        <p><strong>邮箱：</strong>{{ detailItem.email || '-' }}</p>
        <p><strong>日期：</strong>{{ fmtDate(detailItem.created_at) }}</p>
        <p style="margin-top:12px"><strong>内容：</strong></p>
        <div style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;margin-top:8px">{{ detailItem.content }}</div>
      </div>
    </t-dialog>
  `, `
    var { createApp, ref, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var statusFilter = ref(null);
        var detailVisible = ref(false);
        var detailItem = ref(null);
        var columns = [
          { colKey:'name', title:'姓名', width:100 },
          { colKey:'email', title:'邮箱', width:180, ellipsis:true },
          { colKey:'content', title:'内容', ellipsis:true },
          { colKey:'status', title:'状态', width:80 },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:180 }
        ];
        async function loadData() {
          loading.value = true;
          try {
            var url = '/feedback/list?page='+page.value+'&limit='+pageSize;
            if (statusFilter.value !== null && statusFilter.value !== undefined) url += '&status='+statusFilter.value;
            var data = await apiCall(url);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) {}
          loading.value = false;
        }
        function onFilterChange() { page.value=1; loadData(); }
        async function showDetail(row) {
          try {
            var fb = await apiCall('/feedback/'+row.id);
            detailItem.value = fb;
            detailVisible.value = true;
          } catch(e) {}
        }
        async function toggleStatus(id, s) {
          try {
            await apiCall('/feedback/'+id+'/status',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});
            MessagePlugin.success('留言状态已更新');
            loadData();
          } catch(e) {}
        }
        async function del(id) {
          try {
            await apiCall('/feedback/'+id+'/delete',{method:'DELETE'});
            MessagePlugin.success('留言已删除');
            loadData();
          } catch(e) {}
        }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, statusFilter, columns, detailVisible, detailItem, loadData, onFilterChange, showDetail, toggleStatus, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Attachments Management
// ============================================================
adminRoutes.get('/attachments', requireAdmin, (c) => {
  return c.html(adminLayout('附件管理', 'attachments', `
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <t-space>
        <t-select v-model="typeFilter" placeholder="全部类型" :clearable="true" style="width:150px" @change="onFilterChange">
          <t-option value="image" label="图片"></t-option>
          <t-option value="application/pdf" label="PDF"></t-option>
          <t-option value="text" label="文本"></t-option>
        </t-select>
      </t-space>
      <t-button theme="primary" @click="showUploadDialog">上传文件</t-button>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #original_name="{ row }">
          <div style="display:flex;align-items:center;gap:8px">
            <img v-if="row.mime_type && row.mime_type.startsWith('image/')" :src="row.url"
              style="width:40px;height:40px;object-fit:cover;border-radius:4px;cursor:pointer"
              @click="previewImage(row.url)">
            <span>{{ row.original_name }}</span>
          </div>
        </template>
        <template #file_size="{ row }">{{ fmtSize(row.file_size) }}</template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" @click="copyUrl(row.url)">复制链接</t-link>
            <t-popconfirm content="确定要删除这个附件吗？" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
    <t-dialog v-model:visible="uploadVisible" header="上传文件" :footer="false" width="500px">
      <div style="text-align:center;padding:20px">
        <input type="file" id="fileInput" @change="handleFileSelect" style="display:none" multiple>
        <t-button theme="primary" variant="outline" @click="document.getElementById('fileInput').click()" :loading="uploading">
          {{ uploading ? '上传中...' : '选择文件' }}
        </t-button>
        <p style="margin-top:12px;color:#888;font-size:13px">支持 jpg, png, gif, webp, pdf, zip 等格式，最大 10MB</p>
        <div v-if="uploadResults.length" style="margin-top:16px;text-align:left">
          <div v-for="(r,i) in uploadResults" :key="i" style="padding:4px 0;font-size:13px">
            <span :style="{color: r.success ? '#2ba471' : '#e34d59'}">{{ r.success ? '&#10003;' : '&#10007;' }}</span>
            {{ r.name }} {{ r.success ? '' : '- ' + r.error }}
          </div>
        </div>
      </div>
    </t-dialog>
    <t-dialog v-model:visible="previewVisible" header="图片预览" :footer="false" width="auto" style="max-width:90vw">
      <img :src="previewUrl" style="max-width:100%;max-height:80vh">
    </t-dialog>
  `, `
    var { createApp, ref, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var typeFilter = ref(null);
        var uploadVisible = ref(false);
        var uploading = ref(false);
        var uploadResults = ref([]);
        var previewVisible = ref(false);
        var previewUrl = ref('');
        var columns = [
          { colKey:'original_name', title:'文件名', ellipsis:true },
          { colKey:'mime_type', title:'类型', width:130 },
          { colKey:'file_size', title:'大小', width:100 },
          { colKey:'uploader_name', title:'上传者', width:100 },
          { colKey:'created_at', title:'日期', width:110 },
          { colKey:'op', title:'操作', width:140 }
        ];
        async function loadData() {
          loading.value = true;
          try {
            var url = '/upload/list?page=' + page.value + '&limit=' + pageSize;
            if (typeFilter.value) url += '&type=' + typeFilter.value;
            var data = await apiCall(url);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) { console.error(e); }
          loading.value = false;
        }
        function onFilterChange() { page.value = 1; loadData(); }
        function showUploadDialog() { uploadResults.value = []; uploadVisible.value = true; }
        async function handleFileSelect(e) {
          var files = e.target.files;
          if (!files || !files.length) return;
          uploading.value = true;
          uploadResults.value = [];
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            try {
              var fd = new FormData();
              fd.append('file', file);
              var res = await fetch(API + '/upload', { method:'POST', body:fd });
              var data = await res.json();
              if (data.success) {
                uploadResults.value.push({ name:file.name, success:true });
              } else {
                uploadResults.value.push({ name:file.name, success:false, error:data.message });
              }
            } catch(err) {
              uploadResults.value.push({ name:file.name, success:false, error:'Upload failed' });
            }
          }
          uploading.value = false;
          e.target.value = '';
          loadData();
        }
        async function del(id) {
          try {
            await apiCall('/upload/' + id, { method:'DELETE' });
            MessagePlugin.success('附件已删除');
            loadData();
          } catch(e) { console.error(e); }
        }
        function copyUrl(url) {
          var fullUrl = window.location.origin + url;
          navigator.clipboard.writeText(fullUrl).then(function() {
            MessagePlugin.success('链接已复制');
          }).catch(function() { MessagePlugin.info(fullUrl); });
        }
        function previewImage(url) {
          previewUrl.value = url;
          previewVisible.value = true;
        }
        onMounted(loadData);
        return {
          list, loading, page, total, pageSize, typeFilter, columns,
          uploadVisible, uploading, uploadResults,
          previewVisible, previewUrl,
          loadData, onFilterChange, showUploadDialog, handleFileSelect,
          del, copyUrl, previewImage, fmtDate, fmtSize
        };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Users Management
// ============================================================
adminRoutes.get('/users', requireAdmin, (c) => {
  return c.html(adminLayout('用户管理', 'users', `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <t-button theme="primary" @click="showCreateModal">新建用户</t-button>
    </div>
    <t-card :bordered="true">
      <t-table :data="list" :columns="columns" row-key="id" :loading="loading" :hover="true" :stripe="true">
        <template #role="{ row }">
          <t-tag :theme="row.role==='admin'?'primary':row.role==='contributor'?'success':'default'" variant="light" size="small">
            {{ row.role==='admin'?'管理员':row.role==='contributor'?'贡献者':'用户' }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status===1?'success':'danger'" variant="light" size="small">{{ row.status===1?'正常':'禁用' }}</t-tag>
        </template>
        <template #created_at="{ row }">{{ fmtDate(row.created_at) }}</template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link v-if="row.status===1" @click="toggleStatus(row.id,0)">禁用</t-link>
            <t-link v-if="row.status!==1" theme="success" @click="toggleStatus(row.id,1)">启用</t-link>
            <t-select :value="row.role" size="small" style="width:90px" @change="function(v){changeRole(row.id,v)}">
              <t-option value="member" label="用户"></t-option>
              <t-option value="contributor" label="贡献者"></t-option>
              <t-option value="admin" label="管理员"></t-option>
            </t-select>
            <t-popconfirm content="确定要删除这个用户吗？此操作不可恢复！" @confirm="del(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
      <div style="display:flex;justify-content:flex-end;padding:16px" v-if="total>pageSize">
        <t-pagination v-model:current="page" :total="total" :page-size="pageSize" @current-change="loadData"></t-pagination>
      </div>
    </t-card>
    <t-dialog v-model:visible="createVisible" header="新建用户" :confirm-btn="{content:'创建',loading:saving}" @confirm="createUser" @close="createVisible=false">
      <t-form label-width="70px">
        <t-form-item label="用户名">
          <t-input v-model="newUser.username" placeholder="用户名"></t-input>
        </t-form-item>
        <t-form-item label="邮箱">
          <t-input v-model="newUser.email" placeholder="邮箱"></t-input>
        </t-form-item>
        <t-form-item label="密码">
          <t-input v-model="newUser.password" type="password" placeholder="密码"></t-input>
        </t-form-item>
        <t-form-item label="显示名">
          <t-input v-model="newUser.displayName" placeholder="显示名称"></t-input>
        </t-form-item>
        <t-form-item label="角色">
          <t-select v-model="newUser.role">
            <t-option value="member" label="普通用户"></t-option>
            <t-option value="contributor" label="贡献者"></t-option>
            <t-option value="admin" label="管理员"></t-option>
          </t-select>
        </t-form-item>
      </t-form>
    </t-dialog>
  `, `
    var { createApp, ref, reactive, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var list = ref([]); var loading = ref(false);
        var page = ref(1); var total = ref(0); var pageSize = 20;
        var createVisible = ref(false);
        var saving = ref(false);
        var newUser = reactive({ username:'', email:'', password:'', displayName:'', role:'member' });
        var columns = [
          { colKey:'username', title:'用户名', width:120 },
          { colKey:'display_name', title:'显示名', width:120 },
          { colKey:'email', title:'邮箱', width:180, ellipsis:true },
          { colKey:'role', title:'角色', width:90 },
          { colKey:'status', title:'状态', width:70 },
          { colKey:'created_at', title:'注册日期', width:110 },
          { colKey:'op', title:'操作', width:260 }
        ];
        async function loadData() {
          loading.value = true;
          try {
            var data = await apiCall('/user/list?page='+page.value+'&limit='+pageSize);
            list.value = data.data || [];
            total.value = data.pagination?.total || 0;
          } catch(e) {}
          loading.value = false;
        }
        function showCreateModal() {
          newUser.username=''; newUser.email=''; newUser.password=''; newUser.displayName=''; newUser.role='member';
          createVisible.value = true;
        }
        async function createUser() {
          if (!newUser.username || !newUser.email || !newUser.password) { MessagePlugin.warning('请填写必填项'); return; }
          saving.value = true;
          try {
            await apiCall('/user/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newUser)});
            MessagePlugin.success('用户已创建');
            createVisible.value = false;
            loadData();
          } catch(e) {}
          saving.value = false;
        }
        async function toggleStatus(id, s) {
          try {
            await apiCall('/user/'+id+'/status',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});
            MessagePlugin.success('用户状态已更新');
            loadData();
          } catch(e) {}
        }
        async function changeRole(id, role) {
          try {
            await apiCall('/user/'+id+'/role',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:role})});
            MessagePlugin.success('用户角色已更新');
            loadData();
          } catch(e) {}
        }
        async function del(id) {
          try {
            await apiCall('/user/'+id,{method:'DELETE'});
            MessagePlugin.success('用户已删除');
            loadData();
          } catch(e) {}
        }
        onMounted(loadData);
        return { list, loading, page, total, pageSize, columns, createVisible, saving, newUser, loadData, showCreateModal, createUser, toggleStatus, changeRole, del, fmtDate };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

// ============================================================
// Settings
// ============================================================
adminRoutes.get('/settings', requireAdmin, (c) => {
  return c.html(adminLayout('系统设置', 'settings', `
    <t-card :bordered="true">
      <t-tabs v-model="activeTab">
        <t-tab-panel value="blog" label="博客信息">
          <div style="padding:16px 0">
            <t-form label-width="100px">
              <t-form-item label="博客标题">
                <t-input v-model="blog.title" placeholder="博客标题"></t-input>
              </t-form-item>
              <t-form-item label="博客副标题">
                <t-input v-model="blog.subtitle" placeholder="博客副标题"></t-input>
              </t-form-item>
              <t-form-item label="博客描述">
                <t-textarea v-model="blog.description" placeholder="博客描述" :autosize="{minRows:3}"></t-textarea>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" :loading="saving.blog" @click="saveBlog">保存</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
        <t-tab-panel value="display" label="显示设置">
          <div style="padding:16px 0">
            <t-form label-width="100px">
              <t-form-item label="每页文章数">
                <t-input-number v-model="display.postsPerPage" :min="1" :max="50" theme="normal"></t-input-number>
              </t-form-item>
              <t-form-item label="分页样式">
                <t-select v-model="display.paginationStyle">
                  <t-option value="numeric" label="数字分页"></t-option>
                  <t-option value="simple" label="简单分页"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" :loading="saving.display" @click="saveDisplay">保存</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
        <t-tab-panel value="comments" label="评论设置">
          <div style="padding:16px 0">
            <t-form label-width="100px">
              <t-form-item label="评论审核">
                <t-select v-model="comments.moderation">
                  <t-option :value="0" label="无需审核"></t-option>
                  <t-option :value="1" label="需要审核"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item label="评论权限">
                <t-select v-model="comments.permission">
                  <t-option value="all" label="所有人"></t-option>
                  <t-option value="registered" label="注册用户"></t-option>
                </t-select>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" :loading="saving.comments" @click="saveComments">保存</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
        <t-tab-panel value="upload" label="上传设置">
          <div style="padding:16px 0">
            <t-form label-width="120px">
              <t-form-item label="允许的文件类型">
                <t-input v-model="upload.allowedTypes" placeholder="jpg,jpeg,png,gif,pdf"></t-input>
              </t-form-item>
              <t-form-item label="最大文件大小">
                <t-input-number v-model="upload.maxSize" :min="1024" theme="normal" suffix="bytes"></t-input-number>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" :loading="saving.upload" @click="saveUpload">保存</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
        <t-tab-panel value="seo" label="SEO设置">
          <div style="padding:16px 0">
            <t-form label-width="120px">
              <t-form-item label="Meta Description">
                <t-textarea v-model="seo.description" placeholder="网站描述" :autosize="{minRows:3}"></t-textarea>
              </t-form-item>
              <t-form-item label="Meta Keywords">
                <t-input v-model="seo.keywords" placeholder="blog,cloudflare,workers"></t-input>
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" :loading="saving.seo" @click="saveSeo">保存</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
      </t-tabs>
    </t-card>
  `, `
    var { createApp, ref, reactive, onMounted } = Vue;
    var { MessagePlugin } = TDesign;
    var app = createApp({
      setup: function() {
        var activeTab = ref('blog');
        var blog = reactive({ title:'', subtitle:'', description:'' });
        var display = reactive({ postsPerPage:10, paginationStyle:'numeric' });
        var comments = reactive({ moderation:0, permission:'all' });
        var upload = reactive({ allowedTypes:'', maxSize:5242880 });
        var seo = reactive({ description:'', keywords:'' });
        var saving = reactive({ blog:false, display:false, comments:false, upload:false, seo:false });
        onMounted(async function() {
          try {
            var results = await Promise.all([
              apiCall('/settings/blog'), apiCall('/settings/display'),
              apiCall('/settings/comments'), apiCall('/settings/upload'), apiCall('/settings/seo')
            ]);
            blog.title=results[0].title||''; blog.subtitle=results[0].subtitle||''; blog.description=results[0].description||'';
            display.postsPerPage=results[1].postsPerPage||10; display.paginationStyle=results[1].paginationStyle||'numeric';
            comments.moderation=results[2].moderation||0; comments.permission=results[2].permission||'all';
            upload.allowedTypes=results[3].allowedTypes||''; upload.maxSize=results[3].maxSize||5242880;
            seo.description=results[4].description||''; seo.keywords=results[4].keywords||'';
          } catch(e) { console.error(e); }
        });
        async function saveSetting(key, data) {
          saving[key] = true;
          try {
            await apiCall('/settings/'+key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            MessagePlugin.success('设置已保存');
          } catch(e) {}
          saving[key] = false;
        }
        function saveBlog() { saveSetting('blog', { title:blog.title, subtitle:blog.subtitle, description:blog.description }); }
        function saveDisplay() { saveSetting('display', { postsPerPage:display.postsPerPage, paginationStyle:display.paginationStyle }); }
        function saveComments() { saveSetting('comments', { moderation:comments.moderation, permission:comments.permission }); }
        function saveUpload() { saveSetting('upload', { allowedTypes:upload.allowedTypes, maxSize:upload.maxSize }); }
        function saveSeo() { saveSetting('seo', { description:seo.description, keywords:seo.keywords }); }
        return { activeTab, blog, display, comments, upload, seo, saving, saveBlog, saveDisplay, saveComments, saveUpload, saveSeo };
      }
    });
    app.use(TDesign);
    app.mount('#app');
  `));
});

export { adminRoutes };
