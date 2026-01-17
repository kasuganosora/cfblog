-- Create trackbacks table (for future use)
CREATE TABLE IF NOT EXISTS trackbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  blog_name TEXT,
  excerpt TEXT,
  ip_address TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trackbacks_post_id ON trackbacks(post_id);
CREATE INDEX IF NOT EXISTS idx_trackbacks_status ON trackbacks(status);
CREATE INDEX IF NOT EXISTS idx_trackbacks_created_at ON trackbacks(created_at);
