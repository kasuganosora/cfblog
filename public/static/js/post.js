var API='/api';
var pageData=window.__PAGE_DATA__||{};
var postParam=pageData.slug||'';
var currentPostId=null;
var currentUser=pageData.currentUser||null;
var postAuthorName=null;
var blogTitle=pageData.blogTitle||'CFBlog';

document.addEventListener('DOMContentLoaded',async function(){
  try{
    var isNum=!isNaN(parseInt(postParam))&&String(parseInt(postParam))===postParam;
    var url=isNum?API+'/post/'+postParam:API+'/post/slug/'+postParam;
    var res=await fetch(url);var result=await res.json();
    if(result&&result.id){
      currentPostId=result.id;
      postAuthorName=result.author_name||null;
      document.querySelector('[data-testid="post-title"]').textContent=result.title;
      document.title=escapeHtml(result.title)+' - '+blogTitle;

      // Meta
      var date=result.published_at||result.created_at;
      var dateStr=date?new Date(date).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):'';
      var metaHtml='<span>'+dateStr+'</span>';
      if(result.author_name)metaHtml+='<span>'+escapeHtml(result.author_name)+'</span>';
      metaHtml+='<span>'+readTime(result.content)+'</span>';
      metaHtml+='<span>阅读 '+(result.view_count||0)+'</span>';
      document.querySelector('[data-testid="post-meta"]').innerHTML=metaHtml;

      // Content - parse markdown to HTML
      var contentEl=document.querySelector('[data-testid="post-content"]');
      contentEl.innerHTML=renderMd(result.content)||'<p>暂无内容</p>';
      if(typeof hljs!=='undefined')hljs.highlightAll();

      // Hero image: if first img >= 320px, show as hero and hide it in content
      var imgSrc=getFirstImg(result.content);
      if(imgSrc){
        var heroEl=document.getElementById('hero');
        var probe=new Image();
        probe.onload=function(){
          if(probe.naturalWidth>=320){
            heroEl.src=imgSrc;heroEl.style.display='';
            var firstImg=contentEl.querySelector('img');
            if(firstImg)firstImg.style.display='none';
          }
        };
        probe.src=imgSrc;
      }

      // Image lightbox
      function openLightbox(src){
        var box=document.createElement('div');box.className='img-lightbox';
        var img=document.createElement('img');img.src=src;img.alt='';
        box.appendChild(img);document.body.appendChild(box);
        requestAnimationFrame(function(){box.classList.add('show')});
        function close(){box.classList.remove('show');setTimeout(function(){box.remove()},200)}
        box.addEventListener('click',close);
        document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey)}});
      }
      contentEl.querySelectorAll('img').forEach(function(img){img.addEventListener('click',function(){openLightbox(img.src)})});
      if(document.getElementById('hero').src)document.getElementById('hero').addEventListener('click',function(){openLightbox(this.src)});

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

var replyToId=null;

function renderCommentsSection(pid){
  var c=document.getElementById('comments-container');
  var formFields='';
  if(currentUser){
    formFields='<div class="cmt-user-info">以 <b>'+escapeHtml(currentUser.displayName)+'</b> 身份评论</div>';
  }else{
    formFields='<div class="cmt-row-inline">'+
      '<div class="cmt-row" style="flex:1"><label for="author">昵称</label><input type="text" id="author" name="author" required></div>'+
      '<div class="cmt-row" style="flex:1"><label for="email">邮箱 (可选)</label><input type="email" id="email" name="email"></div>'+
    '</div>';
  }
  c.innerHTML='<section class="comments" data-testid="comments-section">'+
    '<h2>评论</h2><div id="comment-message"></div>'+
    '<div id="reply-hint" style="display:none"></div>'+
    '<form class="cmt-form" id="comment-form">'+
      formFields+
      '<div class="cmt-row"><label for="comment-content">评论内容</label><textarea id="comment-content" name="content" rows="4" required></textarea></div>'+
      '<button type="submit" class="cmt-btn">发表评论</button>'+
    '</form>'+
    '<div id="comments"></div>'+
  '</section>';
  loadComments(pid);
  document.getElementById('comment-form').addEventListener('submit',handleComment);
}

function setReply(id,name){
  replyToId=id;
  var h=document.getElementById('reply-hint');
  h.style.display='flex';
  h.innerHTML='<span>回复 <b>'+escapeHtml(name)+'</b></span><a class="cancel-reply" href="javascript:void(0)" style="margin-left:auto;color:var(--accent);font-size:.8rem">取消回复</a>';
  h.querySelector('.cancel-reply').addEventListener('click',cancelReply);
  document.getElementById('comment-content').focus();
  document.getElementById('comment-form').scrollIntoView({behavior:'smooth',block:'center'});
}

function cancelReply(){
  replyToId=null;
  var h=document.getElementById('reply-hint');
  h.style.display='none';h.innerHTML='';
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
  var isAuthor=postAuthorName&&cm.author_name===postAuthorName;
  var authorHtml=isAuthor?'<div class="cmt-author cmt-author-is-poster">'+escapeHtml(cm.author_name)+'</div>':'<div class="cmt-author">'+escapeHtml(cm.author_name)+'</div>';
  var html=authorHtml+
    '<div class="cmt-text">'+escapeHtml(cm.content)+'</div>'+
    '<div class="cmt-footer"><span class="cmt-date">'+new Date(cm.created_at).toLocaleString('zh-CN')+'</span>';
  if(!isReply)html+='<a class="cmt-reply-btn" href="javascript:void(0)">回复</a>';
  html+='</div>';
  d.innerHTML=html;
  if(!isReply){var btn=d.querySelector('.cmt-reply-btn');if(btn)btn.addEventListener('click',function(){setReply(cm.id,cm.author_name)})}
  container.appendChild(d);
}

async function handleComment(e){
  e.preventDefault();
  var author,email;
  if(currentUser){
    author=currentUser.displayName;
    email=currentUser.email||'';
  }else{
    author=document.getElementById('author').value.trim();
    email=document.getElementById('email').value.trim();
  }
  var content=document.getElementById('comment-content').value.trim();
  if(!author||!content){showMsg('请填写昵称和评论内容','error');return}
  try{
    var payload={post_id:currentPostId,author_name:author,author_email:email,content:content};
    if(replyToId)payload.parent_id=replyToId;
    var res=await fetch(API+'/comment/create',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    var result=await res.json();
    if(res.ok){showMsg('评论发表成功！','success');document.getElementById('comment-content').value='';cancelReply();loadComments(currentPostId)}
    else showMsg(result.message||'评论发表失败','error');
  }catch(e){console.error(e);showMsg('评论发表失败','error')}
}

function showMsg(text,type){
  var el=document.getElementById('comment-message');
  el.textContent=text;el.className=type;
  setTimeout(function(){el.style.display='none';el.className=''},5000);
}
