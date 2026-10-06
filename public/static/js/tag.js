var API='/api';
var pageData=window.__PAGE_DATA__||{};
var param=pageData.slug||'';

document.addEventListener('DOMContentLoaded',async function(){
  try{
    var isNum=!isNaN(parseInt(param));
    var url=isNum?API+'/tag/'+param:API+'/tag/slug/'+param;
    var res=await fetch(url);var result=await res.json();
    if(result&&result.id){
      document.querySelector('h1').textContent='标签: '+result.name;
      var postRes=await fetch(API+'/post/list?tag_id='+result.id+'&status=1&limit=100');
      var postData=await postRes.json();
      var c=document.getElementById('posts-list');
      var total=(postData.pagination&&postData.pagination.total)||result.post_count||0;
      c.innerHTML='<p style="color:var(--muted);font-size:.9rem;margin-bottom:1.5rem">共 '+total+' 篇文章</p><div id="article-list"></div>';
      var listEl=document.getElementById('article-list');
      if(postData.data&&postData.data.length){
        renderArticleList(listEl,postData.data,{prefix:'tag',emptyText:'该标签下暂无文章'});
      }else{
        listEl.innerHTML='<p class="empty">该标签下暂无文章</p>';
      }
    }else if(document.getElementById('posts-list').getAttribute('data-ssr')!=='1'){
      document.getElementById('posts-list').innerHTML='<p class="empty">标签不存在</p>';
    }
  }catch(e){
    console.error(e);
    var el=document.getElementById('posts-list');
    if(el && el.getAttribute('data-ssr')==='1')return;
    if(el)el.innerHTML='<p class="empty">加载失败</p>';
  }
});
