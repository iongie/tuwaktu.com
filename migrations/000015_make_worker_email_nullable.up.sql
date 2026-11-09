-- 1. Hapus batasan NOT NULL pada kolom email di tabel workers dan worker_accounts
ALTER TABLE workers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE worker_accounts ALTER COLUMN email DROP NOT NULL;

-- 2. Ganti constraint unik kaku dengan indeks unik kondisional (hanya jika email diisi)
ALTER TABLE worker_accounts DROP CONSTRAINT IF EXISTS worker_accounts_email_key;
DROP INDEX IF EXISTS idx_worker_accounts_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_worker_accounts_email_unique ON worker_accounts (email) WHERE email IS NOT NULL AND email != '';

-- 3. Bersihkan placeholder dummy email @tuwaktu.com dari mitra mandiri non-admin
UPDATE workers 
SET email = '' 
WHERE email LIKE '%@tuwaktu.com' AND slug != 'admin';

UPDATE worker_accounts 
SET email = '' 
WHERE email LIKE '%@tuwaktu.com' AND role != 'ADMIN';
