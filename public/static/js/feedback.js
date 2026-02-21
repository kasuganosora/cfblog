var API='/api';
var pageData=window.__PAGE_DATA__||{};
var currentUser=pageData.currentUser||null;

document.getElementById('feedback-form').addEventListener('submit',async function(e){
  e.preventDefault();
  var name,email;
  if(currentUser){
    name=currentUser.displayName;
    email=currentUser.email||'';
  }else{
    name=document.getElementById('name').value;
    email=document.getElementById('email').value;
  }
  var content=document.getElementById('content').value;
  if(!name||!content){showMessage('请填写姓名和内容','error');return}
  try{
    var res=await fetch(API+'/feedback/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,email:email,content:content})});
    var result=await res.json();
    if(res.ok){showMessage('留言提交成功！','success');document.getElementById('content').value=''}
    else showMessage(result.message||'提交失败','error');
  }catch(e){console.error(e);showMessage('提交失败','error')}
});

function showMessage(text,type){
  var el=document.getElementById('message');
  el.textContent=text;el.className=type;
  setTimeout(function(){el.style.display='none';el.className=''},5000);
}
