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
