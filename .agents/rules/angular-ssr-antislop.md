# Aturan Penulisan Kode & Desain Visual Frontend Angular SSR (Anti-Slop)

Panduan teknis dan estetika baku untuk seluruh pengembangan frontend di `apps/web`.

---

## 1. Aturan Penulisan Kode (TypeScript & Angular)

### 1.1 Penamaan Spesifik Domain Bisnis
- **Dilarang**: Menggunakan nama variabel/fungsi generik seperti `data`, `item`, `items`, `obj`, `res`, `processData()`, `handleEvent()`, `handleClick()`.
- **Wajib**: Gunakan istilah domain bisnis Tuwaktu yang merefleksikan entitas:
  - `activeTechnicianProfile` bukan `data`
  - `selectedCatalogService` bukan `item`
  - `submitBookingReservation()` bukan `submitForm()`
  - `onTechnicianServiceSelected()` bukan `handleClick()`

### 1.2 Kebersihan Komentar (Anti Over-Commenting)
- **Dilarang**: Komentar yang menjelaskan *apa* yang dilakukan baris kode yang sudah jelas (`// inisialisasi loading`, `// fungsi untuk get worker`).
- **Wajib**: Komentar hanya untuk menjelaskan *mengapa* (*why*) keputusan teknis diambil (misalnya: penanganan clock drift 15 menit pada SSR atau mitigasi double slash URL).

### 1.3 State Management Proporsional (Signals-First)
- Gunakan Angular Signals (`signal`, `computed`) yang dienkapsulasi dalam Service Store fitur.
- Jangan gunakan NgRx / library state global yang berat untuk interaksi lokal satu halaman atau alur booking sederhana.

### 1.4 TransferState & Pencegahan Flickering SSR
- Wajib menggunakan `provideHttpClient(withFetch())` dan `provideClientHydration(withEventReplay())`.
- State yang dimuat di server harus ditransfer secara transparan ke browser tanpa memicu double HTTP fetch.

### 1.5 Strict Typing Konsisten (Zero `any`)
- Penggunaan tipe `any` dilarang tanpa pengecualian.
- Seluruh DTO API, parameter fungsi, dan state UI wajib memiliki kontrak tipe (`interface` / `type`). Gunakan `unknown` dan *type guard* untuk data eksternal tak terprediksi.

### 1.6 Feature-Sliced Design
- Struktur folder wajib dikelompokkan berdasarkan domain fitur di `src/app/features/<nama-fitur>/`:
  - `components/`: Komponen UI spesifik fitur.
  - `services/`: API client & Signals Store fitur.
  - `models/`: Interface dan type kontrak data fitur.
- Folder `core/` hanya boleh berisi singleton global aplikasi (seperti Global Error Handler dan Environment Token).

### 1.7 Global & Specific Error Handling
- Pasang `ErrorHandler` global untuk mencatat unhandled exception.
- Pada komponen, error jaringan (misal: backend offline / status 0) harus ditangani secara spesifik dengan pesan ramah berbahasa Indonesia, bukan sekadar `console.error`.

### 1.8 Sintaks Template Modern (Angular 17+)
- Gunakan control flow bawaan `@if`, `@for` (wajib dengan `track`), dan `@defer`.
- Dilarang menggunakan directive legacy `*ngIf` dan `*ngFor`.

---

## 2. Aturan Desain Visual & UI/UX (Anti AI-Slop)

### 2.1 Tata Letak Asimetris & Bento Box Grid
- Hindari layout klise "Hero Rata Tengah + 3 Kartu Identik".
- Gunakan proporsi asimetris (misal: 60% katalog layanan teknisi, 40% panel ringkasan pemesanan).
- Kelompokkan informasi reputasi teknisi, metrik review, dan cakupan wilayah menggunakan kartu dengan variasi dimensi (*Bento Grid*).

### 2.2 Visual Autentik Tanpa Vektor Klise
- Dilarang menggunakan ilustrasi *Corporate Memphis* (vektor manusia beranggotakan tubuh aneh) atau visual 3D clay AI.
- Gunakan tipografi tebal, foto teknisi asli, badge verifikasi presisi, dan garis pembatas teknis (*blueprint grid*).

### 2.3 Palet Warna Khas (Bukan Default Framework)
- Canvas latar belakang: Off-white hangat `#FDFCFB` atau stone dingin `#F6F4F0` (bukan `#FFFFFF` polos).
- Teks utama: Deep ink `#141413`.
- Aksen merek: Terracotta / Burnt Amber `#C84B31` atau Deep Forest `#1E4D3B` (menggantikan warna default `indigo-600` / `blue-500`).

### 2.4 Hierarki Tipografi Kontras
- Judul utama: Gunakan font Display / Serif berkarakter kuat dengan kontras ukuran ekstrem.
- Body copy: Sans-serif netral yang mudah dibaca.
- Angka harga & kode reservasi: Monospace terstruktur.

### 2.5 Skeleton Loader & Empty State Terarah
- Dilarang menampilkan spinner lingkaran berputar di tengah layar.
- Wajib menggunakan Skeleton Loader yang mencerminkan siluet asli kartu profil dan daftar layanan saat memuat data SSR.
- Empty State wajib menyediakan tombol atau arahan aksi konkret, bukan hanya tulisan "Data Kosong".

### 2.6 Batas Tegas (Deliberate Depth)
- Hindari soft drop shadow berlebih di semua kartu.
- Gunakan border tipis `1px solid rgba(20, 20, 19, 0.08)`. Shadow hanya digunakan saat status *hover* atau *floating modal*.

### 2.7 Microcopy Fungsional Berbahasa Indonesia
- Ganti teks umum dengan microcopy spesifik:
  - *"Kunci Jadwal & Buat Kode Booking"* (bukan *"Submit"* / *"Kirim"*)
  - *"Pilih Layanan Ini"* (bukan *"Click Here"*)
  - *"Periksa Status Reservasi"* (bukan *"Check Status"*)

