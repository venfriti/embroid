ALTER TABLE login_attempts ADD COLUMN token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS login_attempts_token ON login_attempts(token);
