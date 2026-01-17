-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  upload_user_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attachments_storage_key ON attachments(storage_key);
CREATE INDEX IF NOT EXISTS idx_attachments_upload_user_id ON attachments(upload_user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
