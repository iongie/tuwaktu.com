-- Memperbarui check constraint account_status pada worker_accounts agar mengizinkan status 'PENDING'
ALTER TABLE worker_accounts DROP CONSTRAINT IF EXISTS worker_accounts_account_status_check;

ALTER TABLE worker_accounts ADD CONSTRAINT worker_accounts_account_status_check 
    CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING'));

