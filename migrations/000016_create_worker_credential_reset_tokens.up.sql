-- Table: worker_credential_reset_tokens
CREATE TABLE IF NOT EXISTS worker_credential_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES worker_accounts(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    request_type VARCHAR(30) NOT NULL DEFAULT 'RESET_PIN', -- 'RESET_PIN' atau 'CHANGE_PHONE'
    phone_number VARCHAR(30) NOT NULL,
    request_token_hash VARCHAR(64) NOT NULL UNIQUE,
    request_expires_at TIMESTAMPTZ NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by_admin_id UUID REFERENCES worker_accounts(id) ON DELETE SET NULL,
    execution_token_hash VARCHAR(64) UNIQUE,
    execution_expires_at TIMESTAMPTZ,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks pencarian hash token, worker, dan account
CREATE INDEX IF NOT EXISTS idx_credential_reset_request_hash ON worker_credential_reset_tokens(request_token_hash);
CREATE INDEX IF NOT EXISTS idx_credential_reset_execution_hash ON worker_credential_reset_tokens(execution_token_hash);
CREATE INDEX IF NOT EXISTS idx_credential_reset_account ON worker_credential_reset_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_credential_reset_phone ON worker_credential_reset_tokens(phone_number);

