-- Migration: Add whatsapp_number to workers and set default booking status to PENDING_WA
ALTER TABLE workers ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30) DEFAULT '';

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'PENDING_WA';
