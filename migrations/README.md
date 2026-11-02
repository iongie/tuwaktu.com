# Dokumentasi Migrasi Database Tuwaktu (PostgreSQL)

Dokumen ini berisi panduan resmi pelaksanaan migrasi skema database manual, rollback/pembatalan perubahan (revert), pemeriksaan status migrasi, dan pengisian data awal (seeding) untuk platform Tuwaktu.

> [!CAUTION]
> **Larangan Keras AutoMigrate**:
> Sesuai aturan arsitektur codebase Tuwaktu, penggunaan `AutoMigrate` (seperti `db.AutoMigrate(...)`) saat runtime atau startup server dilarang keras. Seluruh modifikasi skema DDL wajib dieksekusi secara terencana dan tercatat menggunakan file migrasi manual berpasangan (`.up.sql` dan `.down.sql`).

---

## 1. Mekanisme Pelacakan Skema (`schema_migrations`)

Runner migrasi melacak setiap file migrasi yang telah dieksekusi pada tabel metadata:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Setiap file migrasi penamaan menggunakan pola versi berurutan:
- `migrations/<versi>_<deskripsi>.up.sql` (Perubahan skema maju)
- `migrations/<versi>_<deskripsi>.down.sql` (Pembatalan perubahan / rollback)

Contoh file yang ada di direktori `migrations/`:
- `000001_init_schema.up.sql`
- `000001_init_schema.down.sql`
- `seed.sql`

---

## 2. Cara Menjalankan Migrasi Manual

### A. Melalui NPM Scripts (Rekomendasi)

Tersedia perintah praktis di root direktori proyek:

1. **Menjalankan Migrasi (UP)**
   Mengeksekusi seluruh file `*.up.sql` yang belum tercatat di database:
   ```bash
   npm run db:migrate
   ```

2. **Membatalkan / Revert Migrasi Terakhir (DOWN)**
   Mengeksekusi file `*.down.sql` dari migrasi versi paling mutakhir yang tercatat di tabel `schema_migrations`, lalu menghapus catatannya:
   ```bash
   npm run db:revert
   ```

3. **Mengecek Status Migrasi**
   Melihat daftar seluruh migrasi beserta statusnya (`TERPASANG` atau `PENDING`):
   ```bash
   npm run db:status
   ```

4. **Menjalankan Seeding Data Awal**
   Memasukkan data demo pekerja dan layanan contoh dari `migrations/seed.sql`:
   ```bash
   npm run db:seed
   ```

---

### B. Melalui Go CLI Langsung

Anda juga dapat menjalankan executable CLI secara langsung:

```bash
# Menjalankan migrasi maju
go run ./cmd/migrate up

# Membatalkan (revert) satu migrasi terakhir
go run ./cmd/migrate down
# atau
go run ./cmd/migrate revert

# Memeriksa status migrasi
go run ./cmd/migrate status

# Menjalankan seed data
go run ./cmd/migrate seed
```

Runner membaca konfigurasi database dari file `.env`, `.env.development`, atau variabel lingkungan `DATABASE_URL` via modul `internal/config`.

---

## 3. Alternatif Eksekusi Manual via PostgreSQL CLI (`psql`)

Jika server atau pipeline CI/CD belum memiliki runtime Go atau membutuhkan eksekusi instan langsung dari terminal host database:

### A. Eksekusi Migrasi UP
```bash
psql -h localhost -U postgres -d tuwaktu_dev -f migrations/000001_init_schema.up.sql
```

Jangan lupa mencatat versinya jika ingin menjaga konsistensi dengan tabel pelacak:
```sql
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('000001_init_schema', NOW()) 
ON CONFLICT (version) DO NOTHING;
```

### B. Eksekusi Migrasi DOWN (Revert)
```bash
psql -h localhost -U postgres -d tuwaktu_dev -f migrations/000001_init_schema.down.sql
```

Hapus versinya dari tabel pelacak:
```sql
DELETE FROM schema_migrations WHERE version = '000001_init_schema';
```

### C. Eksekusi Seed Data
```bash
psql -h localhost -U postgres -d tuwaktu_dev -f migrations/seed.sql
```

---

## 4. Panduan Membuat File Migrasi Baru

Ketika menambahkan fitur baru atau mengubah skema kolom:
1. Buat dua file berpasangan di folder `migrations/` dengan timestamp atau nomor urut baru, contoh:
   - `000002_add_worker_certifications.up.sql`
   - `000002_add_worker_certifications.down.sql`
2. Pastikan file `.down.sql` membalikkan tepat apa yang dibuat oleh `.up.sql` (misal: jika `up` membuat tabel atau kolom baru, `down` melakukan `DROP TABLE` atau `DROP COLUMN`).
3. Selalu uji coba siklus migrasi lokal:
   ```bash
   npm run db:status
   npm run db:migrate
   npm run db:status
   npm run db:revert
   npm run db:status
   npm run db:migrate
   ```
