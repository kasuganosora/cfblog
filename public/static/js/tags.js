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
