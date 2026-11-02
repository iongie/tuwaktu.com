-- Rollback: Remove whatsapp_number from workers and revert booking status default to PENDING
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE workers DROP COLUMN IF EXISTS whatsapp_number;
