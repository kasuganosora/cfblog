-- 创建设置表
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT DEFAULT '',
    description TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text', -- text, number, boolean, json
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认设置
INSERT OR IGNORE INTO settings (key, value, description, type) VALUES
('site_title', 'Cloudflare Blog', '网站标题', 'text'),
('site_description', 'A blog built with Cloudflare Workers', '网站描述', 'text'),
('site_keywords', 'cloudflare,worker,blog', '网站关键词', 'text'),
('site_url', 'https://yourdomain.com', '网站URL', 'text'),
('posts_per_page', '10', '每页显示文章数', 'number'),
('comment_moderation', '1', '评论审核 (0: 关闭, 1: 开启)', 'boolean'),
('allow_comments', '1', '允许评论 (0: 否, 1: 是)', 'boolean'),
('allow_registration', '0', '允许用户注册 (0: 否, 1: 是)', 'boolean'),
('admin_email', 'admin@example.com', '管理员邮箱', 'text');