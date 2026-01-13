-- 创建初始管理员用户
INSERT INTO users (username, email, password_hash, display_name, role, status)
VALUES ('admin', 'admin@cfblog.com', 'p123456789', 'Administrator', 'admin', 1)
ON CONFLICT(username) DO UPDATE SET
  password_hash = 'p123456789',
  display_name = 'Administrator',
  role = 'admin',
  status = 1,
  updated_at = CURRENT_TIMESTAMP;
