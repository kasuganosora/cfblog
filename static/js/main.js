// Retrospect Theme - 前台交互逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // 更新按钮图标
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        // 点击主内容区域时关闭菜单
        document.querySelector('.main-content').addEventListener('click', function() {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
        
        // ESC 键关闭菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                mobileMenuToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
    }
    
    // 评论回复功能
    const replyBtns = document.querySelectorAll('.reply-btn');
    const parentIdInput = document.getElementById('parent-id');
    const cancelReplyBtn = document.getElementById('cancel-reply');
    const commentForm = document.querySelector('.comment-form');
    const submitCommentBtn = document.getElementById('submit-comment');
    
    replyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            const commentText = this.closest('.comment').querySelector('.comment-content p').textContent;
            
            if (parentIdInput) {
                parentIdInput.value = commentId;
            }
            
            if (submitCommentBtn) {
                const icon = submitCommentBtn.querySelector('i');
                submitCommentBtn.innerHTML = `${icon ? icon.outerHTML : '<i class="fas fa-reply"></i>'} 回复 #${commentId.substring(0, 8)}`;
            }
            
            if (cancelReplyBtn) {
                cancelReplyBtn.style.display = 'inline-flex';
            }
            
            // 滚动到评论表单
            if (commentForm) {
                commentForm.scrollIntoView({ behavior: 'smooth' });
                const textarea = commentForm.querySelector('textarea');
                if (textarea) {
                    textarea.focus();
                }
            }
        });
    });
    
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', function() {
            if (parentIdInput) {
                parentIdInput.value = '';
            }
            
            if (submitCommentBtn) {
                submitCommentBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发表评论';
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
            const originalHTML = submitBtn.innerHTML;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            
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
                    submitBtn.innerHTML = originalHTML;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
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
            const originalHTML = submitBtn.innerHTML;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            
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
                    submitBtn.innerHTML = originalHTML;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
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
            const originalHTML = submitBtn.innerHTML;
            
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
            
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
                    submitBtn.innerHTML = originalHTML;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            });
        });
    }
    
    // 图片懒加载
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
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
            max-width: 320px;
            pointer-events: none;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    
    const bgColor = type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#dbeafe';
    const textColor = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
    const borderColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    messageEl.style.cssText = `
        background-color: ${bgColor};
        color: ${textColor};
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-left: 4px solid ${borderColor};
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
    `;
    
    // 添加图标
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    messageEl.innerHTML = `<i class="fas ${icon}" style="margin-right: 8px;"></i>${message}`;
    
    // 添加到容器
    messageContainer.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateX(0)';
    }, 10);
    
    // 4秒后自动消失
    setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateX(100%)';
        
        // 移除元素
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 4000);
    
    // 点击消息可手动关闭
    messageEl.addEventListener('click', function() {
        this.style.opacity = '0';
        this.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    });
}