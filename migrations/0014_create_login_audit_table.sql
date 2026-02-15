-- Login audit table for tracking login attempts and IP-based rate limiting
CREATE TABLE IF NOT EXISTS login_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  username TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for IP-based rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_audit_ip_created ON login_audit (ip, created_at);
-- Index for listing/cleanup
CREATE INDEX IF NOT EXISTS idx_login_audit_created ON login_audit (created_at);
