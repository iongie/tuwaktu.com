UPDATE workers 
SET email = CONCAT(slug, '@tuwaktu.com') 
WHERE email IS NULL OR email = '';

UPDATE worker_accounts 
SET email = CONCAT('worker_', id, '@tuwaktu.com') 
WHERE email IS NULL OR email = '';

DROP INDEX IF EXISTS idx_worker_accounts_email_unique;
ALTER TABLE worker_accounts ADD CONSTRAINT worker_accounts_email_key UNIQUE (email);
ALTER TABLE workers ALTER COLUMN email SET NOT NULL;
ALTER TABLE worker_accounts ALTER COLUMN email SET NOT NULL;
