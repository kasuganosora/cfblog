// 前台交互逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 搜索表单切换
    const searchToggle = document.querySelector('.search-toggle');
    const searchForm = document.getElementById('search-form');
    
    if (searchToggle && searchForm) {
        searchToggle.addEventListener('click', function() {
            searchForm.style.display = searchForm.style.display === 'block' ? 'none' : 'block';
            if (searchForm.style.display === 'block') {
                searchForm.querySelector('input').focus();
            }
        });
    }
    
    // 评论回复功能
    const replyBtns = document.querySelectorAll('.reply-btn');
    const parentIdInput = document.getElementById('parent-id');
    const cancelReplyBtn = document.getElementById('cancel-reply');
    const commentForm = document.querySelector('.comment-form-element');
    const submitCommentBtn = document.getElementById('submit-comment');
    
    replyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const commentText = this.closest('.comment').querySelector('.comment-content p').textContent;
            
            if (parentIdInput) {
                parentIdInput.value = commentId;
            }
            
            if (submitCommentBtn) {
                submitCommentBtn.textContent = `回复 #${commentId.substring(0, 8)}`;
            }
            
            if (cancelReplyBtn) {
                cancelReplyBtn.style.display = 'inline-block';
            }
            
            // 滚动到评论表单
            if (commentForm) {
                commentForm.scrollIntoView({ behavior: 'smooth' });
                commentForm.querySelector('textarea').focus();
            }
        });
    });
    
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', function() {
            if (parentIdInput) {
                parentIdInput.value = '';
            }
            
            if (submitCommentBtn) {
                submitCommentBtn.textContent = '发表评论';
            }
            
            cancelReplyBtn.style.display = 'none';
        });
    }
    
    // 处理评论表单提交
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            // 发送评论
            fetch('/api/comment', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 显示成功消息
                    showMessage('评论发表成功！', 'success');
                    
                    // 重新加载页面以显示新评论
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showMessage(data.message || '评论发表失败，请稍后再试', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
    
    // 处理留言表单提交
    const feedbackForm = document.querySelector('.feedback-form-element');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
            
            // 发送留言
            fetch('/api/feedback', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 显示成功消息
                    showMessage('留言发表成功！', 'success');
                    
                    // 清空表单
                    this.reset();
                    
                    // 重新加载页面以显示新留言
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showMessage(data.message || '留言发表失败，请稍后再试', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
    
    // 处理登录表单提交
    const loginForm = document.querySelector('.login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.textContent = '登录中...';
            
            // 发送登录请求
            fetch('/api/user/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 显示成功消息
                    showMessage('登录成功！', 'success');
                    
                    // 重定向到管理后台或首页
                    setTimeout(() => {
                        window.location.href = data.redirect || '/admin';
                    }, 1000);
                } else {
                    showMessage(data.message || '登录失败，请检查用户名和密码', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    }
});

// 显示消息提示
function showMessage(message, type = 'info') {
    // 检查是否已有消息容器
    let messageContainer = document.querySelector('.message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.style.cssText = `
        background-color: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe'};
        color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af'};
        padding: 12px 16px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 0.3s, transform 0.3s;
    `;
    messageEl.textContent = message;
    
    // 添加到容器
    messageContainer.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateY(0)';
    }, 10);
    
    // 3秒后自动消失
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(-10px)';
        
        // 移除元素
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}