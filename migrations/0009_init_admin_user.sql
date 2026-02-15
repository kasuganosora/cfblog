-- Initialize admin user
-- Default password: Admin@2026!
-- Hashed using PBKDF2-SHA256 (100000 iterations, 16-byte salt)
-- Change this password immediately after first login!

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
  'pbkdf2:100000:af3a94d509f65381ff3fcfa628d7ad8f:1477237ddec3d104d16ecedeeddd8633eafcdc9bab6aef2760bfce50247cbfcc',
  'Administrator',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
