-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('blog_title', 'CFBlog', 'Blog title'),
  ('blog_description', 'A modern blog platform built on Cloudflare', 'Blog description'),
  ('blog_subtitle', 'Welcome to CFBlog', 'Blog subtitle'),
  ('posts_per_page', '10', 'Number of posts per page'),
  ('pagination_style', 'numeric', 'Pagination style (numeric/previous-next)'),
  ('comment_moderation', '0', 'Comment moderation (0=auto-approve, 1=manual)'),
  ('comment_permission', 'all', 'Comment permission (all/registered)'),
  ('upload_allowed_types', 'jpg,jpeg,png,gif,pdf,doc,docx', 'Allowed file types for upload'),
  ('upload_max_size', '5242880', 'Maximum file size in bytes (5MB)'),
  ('meta_description', 'CFBlog - A modern blog platform', 'Meta description for SEO'),
  ('meta_keywords', 'blog,cloudflare,workers', 'Meta keywords for SEO');
