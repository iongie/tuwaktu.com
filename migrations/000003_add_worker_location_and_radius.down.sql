-- Rollback: Remove worker location coordinates, radius limits, and transport fee
ALTER TABLE workers DROP COLUMN IF EXISTS lat;
ALTER TABLE workers DROP COLUMN IF EXISTS lng;
ALTER TABLE workers DROP COLUMN IF EXISTS max_radius_km;
ALTER TABLE workers DROP COLUMN IF EXISTS free_radius_km;
ALTER TABLE workers DROP COLUMN IF EXISTS extra_fee_per_km;
