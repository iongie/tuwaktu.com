-- Migration: Add worker_date_overrides table to store full-day holidays and per-slot locks on specific dates
CREATE TABLE IF NOT EXISTS worker_date_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    is_slot1_locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_slot2_locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_slot3_locked BOOLEAN NOT NULL DEFAULT FALSE,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, override_date)
);

CREATE INDEX IF NOT EXISTS idx_worker_date_overrides_worker_date ON worker_date_overrides(worker_id, override_date);

