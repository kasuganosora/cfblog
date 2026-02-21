var API='/api';

document.addEventListener('DOMContentLoaded',async function(){
  try{await Promise.all([loadPosts(),loadCategories(),loadTags(),loadWidgets()])}catch(e){console.error(e)}
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
  renderArticleList(c,posts,{prefix:'home'});
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

async function loadWidgets(){
  try{
    var res=await fetch(API+'/settings/widgets');var data=await res.json();
    if(Array.isArray(data)&&data.length){
      var c=document.getElementById('custom-widgets');
      data.forEach(function(w){
        var div=document.createElement('div');
        div.className='widget';
        div.innerHTML='<h3>'+escapeHtml(w.title||'')+'</h3>'
          +'<div class="widget-custom">'+marked.parse(w.content||'')+'</div>';
        c.appendChild(div);
      });
    }
  }catch(e){console.error('Load widgets:',e)}
}
