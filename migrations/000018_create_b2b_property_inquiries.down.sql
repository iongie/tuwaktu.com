-- Revert Migration: Menghapus tabel b2b_property_inquiries dan indeks terkait
DROP INDEX IF EXISTS idx_b2b_inquiries_created_at;
DROP INDEX IF EXISTS idx_b2b_inquiries_payment_status;
DROP INDEX IF EXISTS idx_b2b_inquiries_status;
DROP TABLE IF EXISTS b2b_property_inquiries;

