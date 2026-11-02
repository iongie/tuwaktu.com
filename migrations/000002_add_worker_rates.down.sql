-- Migration Down: Remove base_price and rate_type from workers and services
DROP VIEW IF EXISTS worker_services;
ALTER TABLE services DROP COLUMN IF EXISTS rate_type;
ALTER TABLE services DROP COLUMN IF EXISTS base_price;
ALTER TABLE workers DROP COLUMN IF EXISTS rate_type;
ALTER TABLE workers DROP COLUMN IF EXISTS base_price;
