function escapeHtml(t){if(!t)return'';var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function getFirstImg(text){if(!text)return null;var m=text.match(/<img[^>]+src=["']([^"']+)["']/i);if(m)return m[1];var md=text.match(/!\[[^\]]*\]\(([^)]+)\)/);return md?md[1]:null}
function checkThumb(el,src){
  if(!src){el.style.display='none';return}
  var img=new Image();
  img.onload=function(){if(img.naturalWidth>=320){el.src=src;el.style.display=''}else el.style.display='none'};
  img.onerror=function(){el.style.display='none'};
  img.src=src;
}
function readTime(text){if(!text)return'1 min';var t=text.replace(/<[^>]+>/g,'').replace(/[#*_~>|\\[\]()-]/g,'');return Math.max(1,Math.ceil(t.length/500))+' min'}
function renderMd(s){return typeof marked!=='undefined'?marked.parse(s||''):s||''}
function renderArticleList(container,posts,opts){
  opts=opts||{};
  if(!posts.length){container.innerHTML='<div class="empty">'+(opts.emptyText||'暂无文章')+'</div>';return}
  container.innerHTML='';
  posts.forEach(function(p,i){
    var el=document.createElement('article');
    el.className='article';
    el.setAttribute('data-testid','post-card');
    var imgSrc=getFirstImg(p.content);
    var href=p.slug?'/post/'+p.slug:'/post/'+p.id;
    var date=p.published_at||p.created_at;
    var dateStr=date?new Date(date).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):'';
    var uid=opts.prefix||('' + Math.random()).slice(2,8);
    var html='';
    if(imgSrc)html+='<img class="article-thumb" id="thumb-'+uid+'-'+i+'" style="display:none" alt="">';
    html+='<h2 class="article-title"><a href="'+href+'">'+escapeHtml(p.title)+'</a></h2>';
    html+='<div class="article-meta"><span>'+dateStr+'</span>';
    if(p.author_name)html+='<span>'+escapeHtml(p.author_name)+'</span>';
    html+='<span>'+readTime(p.content)+'</span>';
    html+='<span>阅读 '+(p.view_count||0)+'</span></div>';
    var excerptSrc=p.excerpt||(p.content?p.content.replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/<[^>]+>/g,'').substring(0,200)+'...':'');
    if(excerptSrc)html+='<div class="article-excerpt">'+renderMd(excerptSrc)+'</div>';
    html+='<a class="read-more" href="'+href+'">阅读全文 &rarr;</a>';
    el.innerHTML=html;
    container.appendChild(el);
    if(imgSrc)checkThumb(document.getElementById('thumb-'+uid+'-'+i),imgSrc);
  });
}
