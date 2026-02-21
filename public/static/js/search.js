var API='/api';
var pageData=window.__PAGE_DATA__||{};
var kw=pageData.keyword||'';
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
  var header=document.createElement('p');
  header.style.cssText='color:var(--muted);margin-bottom:1rem';
  header.textContent='找到 '+posts.length+' 篇相关文章';
  c.innerHTML='';
  c.appendChild(header);
  var listEl=document.createElement('div');
  c.appendChild(listEl);
  renderArticleList(listEl,posts,{prefix:'search',emptyText:'未找到相关文章'});
}
