-- Migration: Add base_price and rate_type to workers and services
ALTER TABLE workers ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2) DEFAULT 0.00 CHECK (base_price >= 0);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) DEFAULT 'HOURLY' CHECK (rate_type IN ('HOURLY', 'UNIT'));

ALTER TABLE services ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2) DEFAULT 0.00 CHECK (base_price >= 0);
ALTER TABLE services ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) DEFAULT 'HOURLY' CHECK (rate_type IN ('HOURLY', 'UNIT'));

-- View worker_services alias for compatibility with service representations
CREATE OR REPLACE VIEW worker_services AS
    SELECT id, worker_id, name, description, price, base_price, rate_type, duration_minutes, is_active, created_at, updated_at
    FROM services;
