// 后台管理界面交互逻辑

// 添加fetch拦截器,自动包含Authorization header并处理session过期
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options = {}] = args;

    // 检查session是否过期
    const sessionID = localStorage.getItem('sessionID');
    const expiration = localStorage.getItem('sessionExpiration');
    
    if (sessionID && expiration) {
      const now = Date.now();
      const expirationTime = parseInt(expiration, 10);
      
      if (now > expirationTime) {
        // session已过期，清除并跳转到登录页
        localStorage.removeItem('sessionID');
        localStorage.removeItem('sessionExpiration');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(new Error('Session expired'));
      }
    }

    // 获取sessionID
    const currentSessionID = localStorage.getItem('sessionID');

    if (currentSessionID && url && typeof url === 'string' && url.startsWith('/api/')) {
      // 确保headers对象存在
      if (!options.headers) {
        options.headers = {};
      }

      // 如果还没有Authorization header,则添加
      if (!options.headers.Authorization && !options.headers.authorization) {
        options.headers.Authorization = 'Bearer ' + currentSessionID;
      }
    }

    // 调用原始fetch并处理响应
    return originalFetch.apply(this, [url, options]).then(response => {
      // 检查是否是401错误
      if (response.status === 401) {
        return response.clone().json().then(data => {
          // 检查是否是session过期错误
          if (data.error === 'Session Expired') {
            // 清除localStorage中的sessionID
            localStorage.removeItem('sessionID');
            localStorage.removeItem('sessionExpiration');
            
            // 自动跳转至登录页面
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/admin/login';
            }
          }
          // 返回原始响应
          return response;
        }).catch(() => {
          // 如果无法解析JSON，返回原始响应
          return response;
        });
      }
      return response;
    });
  };
})();

// 初始化时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
  // 检查session是否过期
  const sessionID = localStorage.getItem('sessionID');
  const expiration = localStorage.getItem('sessionExpiration');
  
  if (sessionID && expiration) {
    const now = Date.now();
    const expirationTime = parseInt(expiration, 10);
    
    if (now > expirationTime) {
      // session已过期，清除并跳转到登录页
      localStorage.removeItem('sessionID');
      localStorage.removeItem('sessionExpiration');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
      return;
    }
  }

  // 如果没有sessionID,重定向到登录页
  if (!sessionID && !window.location.pathname.startsWith('/admin/login')) {
    window.location.href = '/admin/login';
    return;
  }

  // 如果有sessionID,获取当前用户信息
  if (sessionID) {
    fetch('/api/user/info', {
      headers: {
        'Authorization': 'Bearer ' + sessionID
      }
    })
    .then(response => {
      if (response.status === 401) {
        // 检查是否是session过期
        return response.json().then(data => {
          if (data.error === 'Session Expired') {
            // session过期，清除并跳转登录
            localStorage.removeItem('sessionID');
            localStorage.removeItem('sessionExpiration');
            if (!window.location.pathname.startsWith('/admin/login')) {
              window.location.href = '/admin/login';
            }
          }
          throw new Error('Unauthorized');
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        // 更新页面上的用户信息
        const usernameEl = document.querySelector('.admin-username');
        const roleEl = document.querySelector('.admin-role');

        if (usernameEl) {
          const displayName = data.data.display_name || data.data.username;
          usernameEl.textContent = displayName || '未知用户';
        }

        if (roleEl) {
          const roleText = data.data.role === 'admin' ? '管理员' : '投稿者';
          roleEl.textContent = roleText;
        }
      } else {
        // session无效,清除并跳转登录
        localStorage.removeItem('sessionID');
        localStorage.removeItem('sessionExpiration');
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    })
    .catch(error => {
      console.error('获取用户信息失败:', error);
    });
  }
    // 标签页切换
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有活动状态
            tabItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前标签的活动状态
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // 文章删除功能
    const deletePostBtns = document.querySelectorAll('.posts-table .delete-btn');
    const deleteModal = document.getElementById('delete-confirm');
    const deleteTitle = document.getElementById('delete-title');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    let currentDeleteId = null;
    let currentDeleteType = null;
    
    deletePostBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-id');
            const postTitle = this.getAttribute('data-title');
            
            currentDeleteId = postId;
            currentDeleteType = 'post';
            
            if (deleteTitle) deleteTitle.textContent = postTitle;
            
            if (deleteModal) deleteModal.style.display = 'flex';
        });
    });
    
    // 分类删除功能
    const deleteCategoryBtns = document.querySelectorAll('.categories-table .delete-btn');
    
    deleteCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            const categoryName = this.getAttribute('data-name');
            
            currentDeleteId = categoryId;
            currentDeleteType = 'category';
            
            if (deleteTitle) deleteTitle.textContent = categoryName;
            
            if (deleteModal) deleteModal.style.display = 'flex';
        });
    });
    
    // 标签删除功能
    const deleteTagBtns = document.querySelectorAll('.tags-table .delete-btn');
    
    deleteTagBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tagId = this.getAttribute('data-id');
            const tagName = this.getAttribute('data-name');
            
            currentDeleteId = tagId;
            currentDeleteType = 'tag';
            
            if (deleteTitle) deleteTitle.textContent = tagName;
            
            if (deleteModal) deleteModal.style.display = 'flex';
        });
    });
    
    // 附件删除功能
    const deleteAttachmentBtns = document.querySelectorAll('.attachments-container .delete-btn');
    
    deleteAttachmentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const attachmentId = this.getAttribute('data-id');
            const attachmentName = this.getAttribute('data-name');
            
            currentDeleteId = attachmentId;
            currentDeleteType = 'attachment';
            
            if (deleteTitle) deleteTitle.textContent = attachmentName;
            
            if (deleteModal) deleteModal.style.display = 'flex';
        });
    });
    
    // 处理删除确认
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (!currentDeleteId || !currentDeleteType) return;
            
            const apiEndpoint = `/api/${currentDeleteType}/${currentDeleteId}`;
            
            fetch(apiEndpoint, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 关闭模态框
                    if (deleteModal) deleteModal.style.display = 'none';
                    
                    // 显示成功消息
                    showMessage('删除成功', 'success');
                    
                    // 刷新页面
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage(data.message || '删除失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    }
    
    // 分类表单
    const addCategoryBtn = document.getElementById('add-category');
    const categoryFormModal = document.getElementById('category-form');
    const categoryFormTitle = document.getElementById('category-form-title');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('category-name');
    const categoryDescInput = document.getElementById('category-description');
    const saveCategoryBtn = document.getElementById('save-category');
    
    // 打开分类表单
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            if (categoryFormTitle) categoryFormTitle.textContent = '添加分类';
            if (categoryIdInput) categoryIdInput.value = '';
            if (categoryNameInput) categoryNameInput.value = '';
            if (categoryDescInput) categoryDescInput.value = '';
            
            if (categoryFormModal) categoryFormModal.style.display = 'flex';
        });
    }
    
    // 编辑分类
    const editCategoryBtns = document.querySelectorAll('.categories-table .edit-btn');
    
    editCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            const categoryName = this.getAttribute('data-name');
            const categoryDescription = this.getAttribute('data-description');
            
            if (categoryFormTitle) categoryFormTitle.textContent = '编辑分类';
            if (categoryIdInput) categoryIdInput.value = categoryId;
            if (categoryNameInput) categoryNameInput.value = categoryName;
            if (categoryDescInput) categoryDescInput.value = categoryDescription;
            
            if (categoryFormModal) categoryFormModal.style.display = 'flex';
        });
    });
    
    // 保存分类
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', function() {
            const form = document.getElementById('category-form-element');
            const formData = new FormData(form);
            
            fetch('/api/category', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (categoryFormModal) categoryFormModal.style.display = 'none';
                    showMessage(data.message || '保存成功', 'success');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage(data.message || '保存失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    }
    
    // 标签表单
    const addTagBtn = document.getElementById('add-tag');
    const tagFormModal = document.getElementById('tag-form');
    const tagNameInput = document.getElementById('tag-name');
    const saveTagBtn = document.getElementById('save-tag');
    
    // 打开标签表单
    if (addTagBtn) {
        addTagBtn.addEventListener('click', function() {
            if (tagNameInput) tagNameInput.value = '';
            
            if (tagFormModal) tagFormModal.style.display = 'flex';
        });
    }
    
    // 保存标签
    if (saveTagBtn) {
        saveTagBtn.addEventListener('click', function() {
            const form = document.getElementById('tag-form-element');
            const formData = new FormData(form);
            
            fetch('/api/tag', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (tagFormModal) tagFormModal.style.display = 'none';
                    showMessage(data.message || '保存成功', 'success');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage(data.message || '保存失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    }
    
    // 评论编辑
    const editCommentBtns = document.querySelectorAll('.comments-table .edit-btn');
    const commentFormModal = document.getElementById('comment-form');
    const commentIdInput = document.getElementById('comment-id');
    const commentContentInput = document.getElementById('comment-content');
    const commentStatusInput = document.getElementById('comment-status');
    const saveCommentBtn = document.getElementById('save-comment');
    
    editCommentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-id');
            
            // 加载评论数据
            fetch(`/api/comment/${commentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.comment) {
                    if (commentIdInput) commentIdInput.value = data.comment.id;
                    if (commentContentInput) commentContentInput.value = data.comment.content;
                    if (commentStatusInput) commentStatusInput.value = data.comment.status;
                    
                    if (commentFormModal) commentFormModal.style.display = 'flex';
                } else {
                    showMessage(data.message || '加载评论失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    });
    
    // 保存评论
    if (saveCommentBtn) {
        saveCommentBtn.addEventListener('click', function() {
            const form = document.getElementById('comment-form-element');
            const formData = new FormData(form);
            
            fetch('/api/comment', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (commentFormModal) commentFormModal.style.display = 'none';
                    showMessage(data.message || '保存成功', 'success');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage(data.message || '保存失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    }
    
    // 评论状态更改
    const approveCommentBtns = document.querySelectorAll('.approve-btn');
    approveCommentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-id');
            updateCommentStatus(commentId, 'approved');
        });
    });
    
    const spamCommentBtns = document.querySelectorAll('.spam-btn');
    spamCommentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-id');
            updateCommentStatus(commentId, 'spam');
        });
    });
    
    function updateCommentStatus(commentId, status) {
        fetch(`/api/comment/${commentId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage(data.message || '操作成功', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showMessage(data.message || '操作失败', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('发生错误，请稍后再试', 'error');
        });
    }
    
    // 留言状态更改
    const resolveFeedbackBtns = document.querySelectorAll('.resolve-btn');
    resolveFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.getAttribute('data-id');
            updateFeedbackStatus(feedbackId, 'resolved');
        });
    });
    
    const closeFeedbackBtns = document.querySelectorAll('.close-btn');
    closeFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.getAttribute('data-id');
            updateFeedbackStatus(feedbackId, 'closed');
        });
    });
    
    function updateFeedbackStatus(feedbackId, status) {
        fetch(`/api/feedback/${feedbackId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage(data.message || '操作成功', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showMessage(data.message || '操作失败', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('发生错误，请稍后再试', 'error');
        });
    }
    
    // 留言详情和回复
    const viewFeedbackBtns = document.querySelectorAll('.view-btn');
    const feedbackDetailModal = document.getElementById('feedback-detail');
    const feedbackIdInput = document.getElementById('feedback-id');
    const replyContentInput = document.getElementById('reply-content');
    const saveReplyBtn = document.getElementById('save-reply');
    
    viewFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackId = this.getAttribute('data-id');
            
            // 加载留言数据
            fetch(`/api/feedback/${feedbackId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.feedback) {
                    const feedback = data.feedback;
                    const feedbackDetailContent = document.querySelector('.feedback-detail-content');
                    
                    if (feedbackDetailContent) {
                        feedbackDetailContent.innerHTML = `
                            <div class="feedback-item">
                                <div class="feedback-header">
                                    <div class="feedback-author">
                                        ${feedback.author.avatar ? `<img src="${feedback.author.avatar}" alt="${feedback.author.username}" class="author-avatar">` : ''}
                                        <strong>${feedback.author.username}</strong>
                                    </div>
                                    <time datetime="${feedback.createdAt}">${new Date(feedback.createdAt).toLocaleString('zh-CN')}</time>
                                </div>
                                <div class="feedback-content">
                                    <p>${feedback.content}</p>
                                </div>
                            </div>
                            
                            <div class="reply-section" id="reply-section">
                                <h4>回复</h4>
                                <form id="reply-form" action="/api/feedback/reply" method="POST">
                                    <input type="hidden" name="feedbackId" value="${feedback.id}">
                                    
                                    <div class="form-group">
                                        <textarea id="reply-content" name="content" rows="5" placeholder="回复留言..." required>${feedback.reply ? feedback.reply.content : ''}</textarea>
                                    </div>
                                </form>
                            </div>
                        `;
                    }
                    
                    if (feedbackDetailModal) feedbackDetailModal.style.display = 'flex';
                } else {
                    showMessage(data.message || '加载留言失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    });
    
    // 保存回复
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'save-reply') {
            const form = document.getElementById('reply-form');
            if (form) {
                const formData = new FormData(form);
                
                fetch('/api/feedback/reply', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        if (feedbackDetailModal) feedbackDetailModal.style.display = 'none';
                        showMessage(data.message || '回复成功', 'success');
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        showMessage(data.message || '回复失败', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showMessage('发生错误，请稍后再试', 'error');
                });
            }
        }
    });
    
    // 附件上传
    const uploadAttachmentBtns = document.querySelectorAll('#upload-attachment, #upload-attachment-empty');
    const attachmentFileInput = document.getElementById('attachment-file');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadList = document.getElementById('upload-list');
    
    uploadAttachmentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (attachmentFileInput) attachmentFileInput.click();
        });
    });
    
    if (attachmentFileInput) {
        attachmentFileInput.addEventListener('change', function() {
            if (this.files.length === 0) return;
            
            if (uploadProgress) uploadProgress.style.display = 'block';
            
            const files = Array.from(this.files);
            let completedUploads = 0;
            
            files.forEach(file => {
                uploadFile(file, (progress, success, error) => {
                    if (progress !== undefined) {
                        updateFileUploadProgress(file.name, progress);
                    }
                    
                    if (success || error) {
                        completedUploads++;
                        
                        if (completedUploads === files.length) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }
                    }
                });
            });
        });
    }
    
    function uploadFile(file, callback) {
        const formData = new FormData();
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        // 上传进度
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                callback(percentComplete);
            }
        });
        
        // 上传完成
        xhr.addEventListener('load', function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        callback(undefined, true);
                        showMessage(`文件 ${file.name} 上传成功`, 'success');
                    } else {
                        callback(undefined, false, response.message || '上传失败');
                        showMessage(`文件 ${file.name} 上传失败: ${response.message || '未知错误'}`, 'error');
                    }
                } catch (e) {
                    callback(undefined, false, '响应格式错误');
                    showMessage(`文件 ${file.name} 上传失败: 响应格式错误`, 'error');
                }
            } else {
                callback(undefined, false, `HTTP错误 ${xhr.status}`);
                showMessage(`文件 ${file.name} 上传失败: HTTP错误 ${xhr.status}`, 'error');
            }
        });
        
        // 上传错误
        xhr.addEventListener('error', function() {
            callback(undefined, false, '网络错误');
            showMessage(`文件 ${file.name} 上传失败: 网络错误`, 'error');
        });
        
        // 发送请求
        xhr.open('POST', '/api/attachment/upload');
        xhr.send(formData);
    }
    
    function updateFileUploadProgress(filename, progress) {
        if (!uploadList) return;
        
        let progressItem = document.querySelector(`[data-file="${filename}"]`);
        
        if (!progressItem) {
            progressItem = document.createElement('div');
            progressItem.className = 'upload-progress-item';
            progressItem.setAttribute('data-file', filename);
            
            progressItem.innerHTML = `
                <div class="progress-file">${filename}</div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">0%</span>
                </div>
            `;
            
            uploadList.appendChild(progressItem);
        }
        
        const progressFill = progressItem.querySelector('.progress-fill');
        const progressText = progressItem.querySelector('.progress-text');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
    }
    
    // 复制链接功能
    const copyUrlBtns = document.querySelectorAll('.copy-url-btn');
    
    copyUrlBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    showCopySuccess();
                }).catch(err => {
                    console.error('无法复制链接: ', err);
                    fallbackCopyTextToClipboard(url);
                });
            } else {
                fallbackCopyTextToClipboard(url);
            }
        });
    });
    
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess();
            } else {
                showMessage('复制链接失败', 'error');
            }
        } catch (err) {
            console.error('复制链接失败: ', err);
            showMessage('复制链接失败', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    function showCopySuccess() {
        const toast = document.getElementById('copy-success');
        if (toast) {
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }
    
    // 模态框关闭
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // 文章表单保存草稿功能
    const saveDraftBtn = document.getElementById('save-draft');
    const postForm = document.getElementById('post-form');
    
    if (saveDraftBtn && postForm) {
        saveDraftBtn.addEventListener('click', function() {
            const statusField = document.getElementById('status');
            if (statusField) statusField.value = 'draft';
            
            const formData = new FormData(postForm);
            
            fetch(postForm.getAttribute('action'), {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('草稿保存成功', 'success');
                } else {
                    showMessage(data.message || '保存失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('发生错误，请稍后再试', 'error');
            });
        });
    }
    
    // 文章表单提交前自动设置slug
    if (postForm) {
        const titleInput = document.getElementById('title');
        const slugInput = document.getElementById('slug');
        
        if (titleInput && slugInput) {
            titleInput.addEventListener('blur', function() {
                // 只有在slug为空时才自动生成
                if (!slugInput.value) {
                    const title = this.value;
                    const slug = generateSlug(title);
                    slugInput.value = slug;
                }
            });
        }
    }
    
    // 生成URL slug
    function generateSlug(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // 用-替换空格
            .replace(/[^\w\-]+/g, '')       // 移除非单词字符
            .replace(/\-\-+/g, '-')         // 用-替换多个-
            .replace(/^-+/, '')             // 移除开头的-
            .replace(/-+$/, '');            // 移除结尾的-
    }
    
    // 移除文章附件
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-attachment')) {
            const attachmentId = e.target.getAttribute('data-id');
            
            if (attachmentId && confirm('确定要移除这个附件吗？')) {
                fetch(`/api/post-attachment/${attachmentId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        e.target.closest('.attachment-item').remove();
                        showMessage('附件已移除', 'success');
                    } else {
                        showMessage(data.message || '操作失败', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showMessage('发生错误，请稍后再试', 'error');
                });
            }
        }
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