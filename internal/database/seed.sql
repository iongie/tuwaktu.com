-- Sample Worker 1 (Active)
INSERT INTO workers (
    id, slug, name, bio, avatar_url, rating, review_count, zone,
    base_price, rate_type,
    lat, lng, max_radius_km, free_radius_km, extra_fee_per_km,
    phone_number, email, address, is_active
) VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'budi-santoso',
    'Budi Santoso',
    'Teknisi AC dan kelistrikan berpengalaman lebih dari 8 tahun di area Jakarta Selatan.',
    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a',
    4.9,
    42,
    'Jakarta Selatan',
    75000.00,
    'HOURLY',
    -6.2921000,
    106.7992000,
    15.00,
    3.00,
    5000,
    '+6281234567890',
    'budi.santoso@internal.tuwaktu.com',
    'Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan',
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    rate_type = EXCLUDED.rate_type,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    max_radius_km = EXCLUDED.max_radius_km,
    free_radius_km = EXCLUDED.free_radius_km,
    extra_fee_per_km = EXCLUDED.extra_fee_per_km;

-- Services for Worker 1
INSERT INTO services (
    id, worker_id, name, description, price, base_price, rate_type, duration_minutes, is_active
) VALUES (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Cuci AC Standar 0.5 - 1 PK',
    'Pembersihan filter, evaporator, dan cek tekanan freon AC.',
    75000.00,
    75000.00,
    'UNIT',
    45,
    TRUE
),
(
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Isi / Tambah Freon R32 / R410A',
    'Pengisian freon berkualitas untuk pendinginan optimal.',
    150000.00,
    150000.00,
    'UNIT',
    60,
    TRUE
),
(
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Bongkar Pasang AC',
    'Layanan instalasi unit AC baru atau relokasi unit lama.',
    300000.00,
    300000.00,
    'UNIT',
    120,
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    rate_type = EXCLUDED.rate_type;

-- Sample Worker 2 (Active)
INSERT INTO workers (
    id, slug, name, bio, avatar_url, rating, review_count, zone,
    base_price, rate_type,
    lat, lng, max_radius_km, free_radius_km, extra_fee_per_km,
    phone_number, email, address, is_active
) VALUES (
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'siti-aminah',
    'Siti Aminah',
    'Spesialis pembersihan rumah tangga dan deep cleaning profesional.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
    4.8,
    35,
    'Tangerang Selatan',
    120000.00,
    'UNIT',
    -6.2838000,
    106.7115000,
    20.00,
    5.00,
    4000,
    '+6281987654321',
    'siti.aminah@internal.tuwaktu.com',
    'Jl. Bintaro Utama Sektor 3, Tangsel',
    TRUE
) ON CONFLICT (slug) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    rate_type = EXCLUDED.rate_type,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    max_radius_km = EXCLUDED.max_radius_km,
    free_radius_km = EXCLUDED.free_radius_km,
    extra_fee_per_km = EXCLUDED.extra_fee_per_km;

-- Services for Worker 2
INSERT INTO services (
    id, worker_id, name, description, price, base_price, rate_type, duration_minutes, is_active
) VALUES (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Daily Cleaning (2 Jam)',
    'Menyapu, mengepel, membersihkan debu, dan merapikan kamar.',
    120000.00,
    120000.00,
    'HOURLY',
    120,
    TRUE
),
(
    'a7b8c9d0-e1f2-4a3b-8c9d-6e7f8a9b0c1d',
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Deep Cleaning Kamar Mandi',
    'Pembersihan kerak keramik, sanitair, dan desinfeksi menyeluruh.',
    175000.00,
    175000.00,
    'UNIT',
    90,
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    rate_type = EXCLUDED.rate_type;
