-- Bersihkan avatar bawaan dummy Unsplash yang rentan broken/gagal muat
-- agar mitra yang belum mengunggah foto profil menggunakan inisial secara elegan
UPDATE workers
SET avatar_url = ''
WHERE avatar_url LIKE '%photo-1540569014015%';

