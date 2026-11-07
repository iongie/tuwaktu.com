-- Rollback Kolom Lockout Akun
ALTER TABLE worker_accounts
DROP COLUMN IF EXISTS locked_until,
DROP COLUMN IF EXISTS failed_login_attempts;
