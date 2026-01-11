-- 创建附件表
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL, -- 存储在 R2 中的文件名
    file_path TEXT NOT NULL, -- 存储在 R2 中的路径
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploader_id INTEGER DEFAULT NULL,
    post_id INTEGER DEFAULT NULL, -- 关联的文章ID，可选
    description TEXT DEFAULT '',
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);