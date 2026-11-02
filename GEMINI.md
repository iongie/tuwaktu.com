# Aturan Proyek Tuwaktu (Tuwaktu Project Guidelines)

File ini menetapkan aturan baku dan panduan pengerjaan dalam codebase **Tuwaktu Backend & Frontend Monorepo**. Seluruh kontributor dan agen AI wajib mematuhi aturan ini secara konsisten.

---

## 1. Aturan Bahasa Respons (Response Messages Rule)

> [!IMPORTANT]
> **Seluruh response message API yang dikembalikan kepada klien (frontend, mobile, atau pihak ketiga) serta pesan error dan validasi WAJIB SELALU menggunakan Bahasa Indonesia.**

### Standar Format JSON Response:
Semua endpoint HTTP harus mengembalikan struktur JSON konsisten:
```json
{
  "success": true,
  "message": "Pesan deskriptif dalam Bahasa Indonesia",
  "data": { ... },
  "error": null
}
```

### Pedoman Pesan:
- **Respons Sukses**: Gunakan kalimat positif, jelas, dan lugas.
  - Contoh: `"Data profil pekerja berhasil diambil"`, `"Pesanan booking berhasil dibuat"`, `"Layanan berjalan normal"`.
- **Respons Validasi**: Sebutkan nama field atau konteks kesalahan beserta arahan perbaikan dalam Bahasa Indonesia.
  - Contoh: `"nama klien (client_name) wajib diisi"`, `"pilihan layanan (service_id) wajib diisi"`, `"tanggal booking harus di masa depan"`.
- **Respons Error / Not Found**: Gunakan kalimat deskriptif yang tidak membocorkan informasi sensitif internal.
  - Contoh: `"Pekerja tidak ditemukan"`, `"Layanan tidak ditemukan atau sedang tidak aktif"`, `"Format data payload pemesanan tidak valid"`.

---

## 2. Aturan Komunikasi Asisten AI

- Dalam diskusi, penjelasan teknis, dan laporan penyelesaian tugas, asisten AI wajib selalu merespons menggunakan **Bahasa Indonesia**.

---

## 3. Aturan Proteksi Data Pribadi

- Endpoint publik (seperti `GET /api/public/workers/:slug`) **TIDAK BOLEH** mengekspos data pribadi pekerja (nomor telepon, alamat email, alamat fisik). Gunakan DTO publik `domain.PublicWorkerProfile`.

---

## 4. Larangan Keras AutoMigrate Database (Database Migration Rule)

> [!CAUTION]
> **DILARANG KERAS MENGGUNAKAN `AutoMigrate` DI CODEBASE BACKEND (misal: `db.AutoMigrate(...)`).**
- Seluruh modifikasi skema DDL PostgreSQL wajib dilakukan secara manual dan terencana melalui file migrasi di folder `migrations/` (`*.up.sql` dan `*.down.sql`).
- Eksekusi migrasi wajib menggunakan migration runner CLI:
  - `npm run db:migrate` (atau `go run ./cmd/migrate up`)
  - `npm run db:revert` (atau `go run ./cmd/migrate down`)
  - `npm run db:status` (atau `go run ./cmd/migrate status`)
  - `npm run db:seed` (atau `go run ./cmd/migrate seed`)
- Dilarang memicu mutasi DDL tabel secara implisit saat startup server HTTP (`cmd/api/main.go`).

---

## 5. Aturan Penulisan Kode Frontend Angular SSR (Code Anti-Slop)

Wajib dipatuhi pada seluruh aplikasi frontend Angular SSR (`apps/web`):

1. **Hindari Penamaan Variabel & Fungsi yang Terlalu Generik**:
   - Dilarang keras menggunakan nama seperti `data`, `item`, `items`, `processData()`, `handleEvent()`, atau `handleClick()`.
   - Gunakan nama yang mencerminkan domain bisnis Tuwaktu secara spesifik: `activeWorkerProfile`, `selectedCatalogService`, `submitServiceBooking()`, `selectTechnicianService()`.
2. **Hapus Komentar yang Menjelaskan Sesuatu yang Jelas (Anti Over-Commenting)**:
   - Dilarang menambahkan komentar redundan yang hanya mengulang fungsi kode (seperti `// panggil service`, `// set loading ke true`).
   - Gunakan komentar hanya jika menjelaskan *mengapa* (*why*) sebuah logika non-trivial dibuat atau mitigasi edge-case tertentu (misal: sanitasi timezone SSR).
3. **State Management Proporsional Berbasis Signals**:
   - Gunakan Angular Signals (`signal()`, `computed()`) dan store lokal berbasis service untuk state fitur. Hindari over-engineering dengan NgRx pada fitur sederhana.
4. **Penanganan TransferState & Pencegahan Double-Fetching di Angular SSR**:
   - Wajib memanfaatkan `provideHttpClient(withFetch())` dan `provideClientHydration(withEventReplay(), withHttpTransferCacheOptions(...))` untuk memastikan payload yang di-render di server tidak di-fetch ulang oleh browser klien.
5. **Hindari `any` (Strict Typing Konsisten)**:
   - Selalu definisikan tipe data menggunakan `interface` atau `type`. Jika data dari sumber eksternal bersifat dinamis, gunakan `unknown` dan terapkan *type narrowing*.
6. **Struktur Folder Berbasis Fitur (Feature-Sliced Design)**:
   - Dilarang memisahkan root folder hanya berdasarkan tipe teknis (`/components`, `/services`, `/models`).
   - Kelompokkan kode berdasarkan domain fitur (contoh: `src/app/features/worker-booking/` yang menaungi subfolder `components/`, `services/`, dan `models/`).
7. **Tangani Error Handling Secara Global & Spesifik**:
   - Sediakan `ErrorHandler` kustom di tingkat aplikasi untuk menangkap runtime exception.
   - Pada layer service/komponen, tangani error HTTP dengan pesan spesifik yang bermakna bagi pengguna (melalui UI state/banner berbahasa Indonesia), bukan sekadar mencetak `console.error`.
8. **Gunakan Sintaks Template Modern (Angular 17+)**:
   - Wajib menggunakan built-in control flow `@if`, `@for` (dengan expression `track` yang unik), dan `@defer`. Dilarang menggunakan `*ngIf` dan `*ngFor`.

---

## 6. Aturan Desain Visual & UI/UX Frontend (Visual Anti-Slop)

1. **Hindari Layout Klise "Hero Centered + 3 Kartu Fitur"**:
   - Gunakan tata letak asimetris (misal: rasio 60/40 untuk eksplorasi katalog teknisi dan panel reservasi).
   - Terapkan pola **Bento Box Grid** dengan variasi ukuran kartu untuk mengelompokkan metrik keandalan teknisi, zona layanan, dan daftar harga.
2. **Berhenti Menggunakan Ilustrasi Corporate Memphis atau 3D AI**:
   - Gunakan fotografi teknisi nyata, badge verifikasi presisi, atau aksen garis teknis (*hairline grid/wireframe precision*).
3. **Modifikasi Palet Warna Default Framework**:
   - Dilarang menggunakan latar belakang putih murni `#FFFFFF` dengan tombol klise Tailwind `indigo-600` / `blue-500`.
   - Gunakan canvas off-white hangat (seperti `#FDFCFB` atau `#F6F4F0`), teks deep ink `#141413`, dan aksen warna khas seperti Terracotta / Burnt Amber (`#C84B31`) atau Deep Forest (`#1E4D3B`).
4. **Hierarki Tipografi yang Berkarakter**:
   - Padukan jenis font yang kontras: gunakan Display/Serif berkarakter untuk judul utama dan sans-serif yang sangat terbaca untuk body copy, serta monospace untuk kode booking dan nominal tarif.
5. **Detail pada Empty States dan Loading States (Konteks SSR)**:
   - Dilarang menggunakan spinner generik di tengah layar.
   - Wajib merancang **Skeleton Loader** yang merepresentasikan bentuk asli anatomi kartu profil dan daftar layanan saat hidrasi/transisi data.
   - Tampilkan pesan Empty State yang terarah dan memberikan aksi alternatif yang jelas.
6. **Kedalaman (Depth) yang Sengaja, Bukan Bayangan Lembut Seragam**:
   - Gunakan desain flat terstruktur dengan border tipis tegas (`1px solid rgba(20, 20, 19, 0.08)`). Gunakan shadow hanya untuk status interaksi aktif (hover) atau elemen melayang (modal/dropdown).
7. **Microcopy yang Spesifik dan Manusiawi**:
   - Tulis teks antarmuka yang fungsional dan berorientasi domain bisnis Tuwaktu dalam Bahasa Indonesia (contoh: *"Kunci Jadwal & Buat Kode Booking"* bukan *"Submit"*, *"Cari Teknisi AC & Listrik"* bukan *"Search"*).
