-- Rollback Migrasi 000009: Hapus indeks dan relasi category_id dari services
DROP INDEX IF EXISTS idx_services_category_id;
ALTER TABLE services DROP COLUMN IF EXISTS category_id;

