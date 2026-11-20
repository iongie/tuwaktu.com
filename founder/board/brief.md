# Board Brief: Tuwaktu.com

## Ringkasan Ide (dari `founder/idea.md`)
- **Nama Bisnis**: Tuwaktu.com
- **Definisi Satu Kalimat**: Platform profil publik, pengatur jadwal kerja, kalkulator tarif jarak, dan penerusan pesanan langsung ke WhatsApp untuk pekerja jasa mandiri dengan 0% komisi transaksi.
- **Target Pasar Awal**: Teknisi servis AC dan pekerja kebersihan rumah mandiri di wilayah Jabodetabek, beserta pelanggan rumah tangga yang memesan jasa mereka.
- **Model Monetisasi & Harga**:
  - 0% komisi dari transaksi jasa (pembayaran penuh dilakukan langsung antara klien dan pekerja via tunai, QRIS, atau transfer bank pribadi pekerja).
  - Rencana monetisasi ke mitra: Gratis penuh pada masa peluncuran awal (atau gratis untuk 50 mitra pertama), kemudian berencana menerapkan langganan bulanan sekitar Rp 49.000 - Rp 99.000/bulan untuk mitra aktif, serta opsi kerja sama B2B/properti.
- **Lokasi, Distribusi & Pengiriman Layanan**:
  - Wilayah: Jabodetabek.
  - Akuisisi Mitra: Jemput bola lewat komunitas/grup teknisi lokal dan kontak langsung.
  - Akuisisi Klien: Mitra membagikan tautan profil publik (`tuwaktu.com/<nama>`) kepada pelanggannya sendiri untuk menggantikan chat tawar-menawar dan pengecekan jadwal manual di WhatsApp, dilengkapi fitur pencarian lokal di halaman utama Tuwaktu.com.
- **Modal & Batasan**:
  - Bootstrap dengan modal minimal (biaya server dan operasional ringan).
  - Target waktu uji coba: 1-3 bulan pertama.

## Fakta Produk yang Sudah Dibangun (Kondisi Saat Ini)
1. **Profil Publik Mitra (`tuwaktu.com/<slug>`)**: Menampilkan spesialisasi, lokasi basecamp, daftar layanan dan tarif (per jam atau per paket), ketersediaan slot harian, dan formulir pemesanan.
2. **Kalkulator Tarif & Radius Jarak**: Menghitung ongkos transportasi otomatis berdasarkan jarak lokasi klien dari basecamp pekerja dan menolak pesanan di luar radius layanan yang ditetapkan pekerja.
3. **Manajemen Jadwal & Anti-Bentrok**: Pekerja dapat mengatur jam operasional mingguan, menandai tanggal libur khusus di kalender, mengunci slot tertentu, dan menerapkan jeda waktu (buffer transit/istirahat) antar-pesanan.
4. **Penerusan Langsung ke WhatsApp**: Setelah klien mengisi formulir reservasi dan memilih slot, ringkasan pesanan dan rincian biaya otomatis diformat menjadi pesan siap kirim ke nomor WhatsApp pekerja (tanpa sistem pembayaran/escrow di dalam aplikasi).
5. **Alur Masuk & Verifikasi Akun**: Pendaftaran pekerja baru menggunakan nomor WhatsApp dan PIN 6 digit dengan verifikasi via admin WhatsApp.

## Yang Belum Diketahui / Belum Teruji
- Besaran pasar yang bersedia membayar langganan Rp 49.000 - Rp 99.000/bulan setelah masa gratis berakhir.
- Biaya akuisisi mitra (CAC) dan tingkat retensi setelah 50 mitra pertama.
- Seberapa sering klien benar-benar mau mengisi formulir web sebelum mengirim chat WhatsApp ke teknisi langganan mereka.
- Peta kompetitor langsung maupun substitusi di Jabodetabek (aplikasi on-demand, grup Facebook, Google Maps, WhatsApp Business biasa).

