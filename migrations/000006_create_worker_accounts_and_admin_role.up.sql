-- Migrasi Skema Tabel worker_accounts dan Role Admin / Worker
CREATE TABLE IF NOT EXISTS worker_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'WORKER' CHECK (role IN ('ADMIN', 'WORKER')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED')),
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_accounts_email ON worker_accounts(email);
CREATE INDEX IF NOT EXISTS idx_worker_accounts_phone ON worker_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_worker_accounts_worker_id ON worker_accounts(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_accounts_role ON worker_accounts(role);
CREATE INDEX IF NOT EXISTS idx_worker_accounts_status ON worker_accounts(account_status);

