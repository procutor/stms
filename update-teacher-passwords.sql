-- Update all teacher passwords to 'Rwanda@123'
-- Hash generated with bcrypt cost 12: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1BbIhQqKvzK6

UPDATE users
SET password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1BbIhQqKvzK6'
WHERE role = 'TEACHER';

-- Verify the update
SELECT COUNT(*) as updated_teachers FROM users WHERE role = 'TEACHER' AND password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1BbIhQqKvzK6';