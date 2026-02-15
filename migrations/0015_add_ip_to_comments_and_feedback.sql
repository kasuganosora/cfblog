-- Add IP column to comments and feedback for rate limiting
ALTER TABLE comments ADD COLUMN author_ip TEXT;
ALTER TABLE feedback ADD COLUMN ip TEXT;

-- Index for IP-based cooldown queries
CREATE INDEX IF NOT EXISTS idx_comments_author_ip ON comments(author_ip);
CREATE INDEX IF NOT EXISTS idx_feedback_ip ON feedback(ip);
