-- Table: worker_activation_tokens
CREATE TABLE IF NOT EXISTS worker_activation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks pencarian hash token dan relasi worker
CREATE INDEX IF NOT EXISTS idx_worker_activation_tokens_hash ON worker_activation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_worker_activation_tokens_worker ON worker_activation_tokens(worker_id);

