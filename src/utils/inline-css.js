// 内联CSS工具 - 开发环境临时解决方案

// 由于Cloudflare Workers开发环境无法直接访问静态文件
// 我们将CSS内容内联到HTML中作为临时解决方案

export const inlineCSS = `
/* Retrospect Theme - 基础样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* 字体和基础样式 */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

/* 网站容器 */
.site-container {
    display: flex;
    min-height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

/* 侧边栏 */
.sidebar {
    width: 300px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    z-index: 1000;
}

.sidebar-content {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* 网站标题 */
.site-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.site-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.site-title a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s ease;
}

.site-title a:hover {
    opacity: 0.8;
}

.site-description {
    font-size: 0.9rem;
    opacity: 0.8;
    line-height: 1.5;
}

/* 导航菜单 */
.main-nav {
    margin-bottom: 2rem;
}

.nav-list {
    list-style: none;
}

.nav-list li {
    margin-bottom: 0.5rem;
}

.nav-list a {
    color: white;
    text-decoration: none;
    padding: 0.75rem 1rem;
    display: block;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.nav-list a:hover,
.nav-list a.active {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
}

/* 侧边栏关于 */
.sidebar-about {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
}

.sidebar-about h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
}

.sidebar-about p {
    font-size: 0.9rem;
    opacity: 0.9;
    line-height: 1.6;
}

/* 社交链接 */
.sidebar-social {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    justify-content: center;
}

.social-link {
    color: white;
    font-size: 1.2rem;
    padding: 0.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.social-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

/* 侧边栏底部 */
.sidebar-footer {
    margin-top: auto;
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-footer p {
    font-size: 0.8rem;
    opacity: 0.7;
}

/* 主内容区 */
.main-content {
    flex: 1;
    margin-left: 300px;
    min-height: 100vh;
}

.content-wrapper {
    padding: 2rem;
    max-width: 800px;
}

/* 文章预览卡片 */
.posts-grid {
    display: grid;
    gap: 2rem;
    margin-bottom: 2rem;
}

.post-preview {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
}

.post-preview:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.post-featured-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
}

.post-content {
    padding: 1.5rem;
}

.post-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.post-title a {
    color: #2c3e50;
    text-decoration: none;
    transition: color 0.3s ease;
}

.post-title a:hover {
    color: #667eea;
}

.post-excerpt {
    color: #6c757d;
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.post-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    color: #8e9aaf;
    margin-bottom: 1rem;
}

.post-date,
.post-category {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.post-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    background: #f8f9fa;
    color: #495057;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    text-decoration: none;
    transition: all 0.3s ease;
}

.tag:hover {
    background: #667eea;
    color: white;
}

/* 移动端菜单按钮 */
.mobile-menu-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 1.2rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.mobile-menu-toggle:hover {
    background: #5a67d8;
    transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .site-container {
        flex-direction: column;
    }
    
    .sidebar {
        position: fixed;
        left: -300px;
        transition: left 0.3s ease;
        width: 280px;
    }
    
    .sidebar.active {
        left: 0;
    }
    
    .main-content {
        margin-left: 0;
        width: 100%;
    }
    
    .content-wrapper {
        padding: 1rem;
        padding-top: 4rem;
    }
    
    .mobile-menu-toggle {
        display: block;
    }
    
    .post-preview {
        margin-bottom: 1rem;
    }
    
    .post-featured-image {
        height: 150px;
    }
    
    .post-content {
        padding: 1rem;
    }
    
    .post-title {
        font-size: 1.1rem;
    }
    
    .post-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}

@media (max-width: 480px) {
    .sidebar {
        width: 100%;
        left: -100%;
    }
    
    .sidebar.active {
        left: 0;
    }
    
    .content-wrapper {
        padding: 0.75rem;
        padding-top: 3.5rem;
    }
    
    .post-featured-image {
        height: 120px;
    }
}

/* 文章详情页样式 */
.post-header {
    margin-bottom: 2rem;
    text-align: center;
}

.post-header .post-featured-image {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 1.5rem;
}

.post-header .post-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.post-header .post-meta {
    justify-content: center;
    font-size: 0.9rem;
}

.post-body {
    font-size: 1rem;
    line-height: 1.8;
    color: #444;
}

.post-body h1,
.post-body h2,
.post-body h3,
.post-body h4,
.post-body h5,
.post-body h6 {
    margin: 2rem 0 1rem 0;
    color: #2c3e50;
    font-weight: 600;
}

.post-body p {
    margin-bottom: 1.5rem;
}

.post-body img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem 0;
}

.post-body blockquote {
    border-left: 4px solid #667eea;
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #6c757d;
}

.post-body code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.9em;
}

.post-body pre {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1.5rem 0;
}

.post-body pre code {
    background: none;
    padding: 0;
}

/* 加载动画 */
.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
}

.loading::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 无内容提示 */
.no-posts {
    text-align: center;
    padding: 3rem 2rem;
    color: #6c757d;
}

.no-posts h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #495057;
}

.no-posts p {
    font-size: 1rem;
    line-height: 1.6;
}
`;

export const inlineJS = `
// Retrospect Theme JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // 点击侧边栏外部关闭菜单
        document.addEventListener('click', function(e) {
            if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
    
    // 图片懒加载
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
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
    
    console.log('Retrospect Theme loaded successfully');
});
`;