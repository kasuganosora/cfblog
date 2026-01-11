-- 创建文章表
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT DEFAULT '',
    author_id INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 0, -- 0: draft, 1: published, 2: archived
    featured INTEGER NOT NULL DEFAULT 0, -- 0: not featured, 1: featured
    comment_status INTEGER NOT NULL DEFAULT 1, -- 0: closed, 1: open
    content_key TEXT, -- R2 存储的键名
    view_count INTEGER NOT NULL DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建文章全文搜索索引
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts(title, excerpt);