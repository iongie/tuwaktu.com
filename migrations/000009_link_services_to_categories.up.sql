-- Migrasi 000009: Menghubungkan Layanan ke Kategori Keahlian (services.category_id)
-- Memfasilitasi arsitektur harga terpadu dan penghitungan dinamis starting_price per kategori

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);

-- Petakan layanan bawaan (seed) yang sudah ada ke kategori yang sesuai jika kolom masih kosong
UPDATE services 
SET category_id = '11111111-1111-4111-8111-111111111111'
WHERE (LOWER(name) LIKE '%ac%' OR LOWER(name) LIKE '%freon%') 
  AND category_id IS NULL;

UPDATE services 
SET category_id = '22222222-2222-4222-8222-222222222222'
WHERE (LOWER(name) LIKE '%clean%' OR LOWER(name) LIKE '%sanitasi%' OR LOWER(name) LIKE '%sapu%') 
  AND category_id IS NULL;

