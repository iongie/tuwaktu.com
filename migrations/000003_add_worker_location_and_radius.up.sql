-- Migration: Add worker location coordinates, radius limits, and transport fee
ALTER TABLE workers ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS max_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 10.00 CHECK (max_radius_km > 0);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS free_radius_km NUMERIC(6, 2) NOT NULL DEFAULT 3.00 CHECK (free_radius_km >= 0);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS extra_fee_per_km INT NOT NULL DEFAULT 0 CHECK (extra_fee_per_km >= 0);
