-- Migrasi Skema Tabel categories (Katalog Keahlian Teknisi)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon VARCHAR(100) NOT NULL DEFAULT 'build',
    starting_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (starting_price >= 0),
    price_unit VARCHAR(50) NOT NULL DEFAULT 'kunjungan',
    availability_tag VARCHAR(100) DEFAULT 'Tersedia di Katalog',
    highlight_tag VARCHAR(100) DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Seed data awal katalog keahlian teknisi
INSERT INTO categories (id, slug, name, description, icon, starting_price, price_unit, availability_tag, highlight_tag, is_active, sort_order)
VALUES 
    ('11111111-1111-4111-8111-111111111111', 'ac-pendingin', 'Servis & Pasang AC', 'Pembersihan filter, flushing freon berkala, perbaikan pipa bocor, dan perawatan unit inverter.', 'ac_unit', 75000.00, 'unit', 'Tersedia di Katalog', 'Populer', TRUE, 1),
    ('22222222-2222-4222-8222-222222222222', 'sanitasi-cleaning', 'Sanitasi & Deep Clean', 'Pembersihan menyeluruh kamar tidur, sofa, kamar mandi berkerak, dan sterilisasi tungau kasur.', 'cleaning_services', 65000.00, 'jam', 'Tersedia di Katalog', 'Higienis', TRUE, 2),
    ('33333333-3333-4333-8333-333333333333', 'instalasi-listrik', 'Instalasi Listrik Presisi', 'Pemeriksaan beban daya, tracing korsleting listrik, perakitan panel MCB, dan instalasi stop kontak.', 'bolt', 80000.00, 'kunjungan', 'Tersedia di Katalog', 'Prioritas Aman', TRUE, 3),
    ('44444444-4444-4444-8444-444444444444', 'elektronik-audio', 'Reparasi Elektronik', 'Diagnostik mesin cuci digital, kulkas inverter, perbaikan audio speaker, dan instalasi TV dinding.', 'tv', 120000.00, 'kunjungan', 'Tersedia di Katalog', 'Spesialis Ahli', TRUE, 4)
ON CONFLICT (slug) DO NOTHING;
