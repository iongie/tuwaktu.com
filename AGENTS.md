# Aturan Proyek Tuwaktu (Tuwaktu Project Guidelines)

File ini menetapkan aturan baku dan panduan pengerjaan dalam codebase **Tuwaktu Backend API**. Seluruh kontributor dan agen AI wajib mematuhi aturan ini secara konsisten.

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

