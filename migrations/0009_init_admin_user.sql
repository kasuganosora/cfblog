-- Initialize admin user
-- Default password: admin123
-- The password is hashed using SHA-256 twice with salt

INSERT INTO users (
  username,
  email,
  password_hash,
  display_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'admin',
  'admin@cfblog.local',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Administrator',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
