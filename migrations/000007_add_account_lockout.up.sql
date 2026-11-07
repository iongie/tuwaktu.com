-- Migrasi Skema Penambahan Kolom Lockout Akun (Rate Limiting Login)
ALTER TABLE worker_accounts
ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;
