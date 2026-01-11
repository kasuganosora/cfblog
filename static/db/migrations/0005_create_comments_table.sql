-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER DEFAULT NULL, -- NULL 表示游客评论
    parent_id INTEGER DEFAULT NULL, -- 用于回复
    author_name TEXT DEFAULT '', -- 游客评论时的作者名
    author_email TEXT DEFAULT '', -- 游客评论时的作者邮箱
    author_url TEXT DEFAULT '', -- 游客评论时的作者网站
    content TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 0, -- 0: pending, 1: approved, 2: rejected
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);