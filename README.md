# Tuwaktu Public API

Backend RESTful API publik untuk platform Tuwaktu yang dibangun menggunakan **Golang (Go Fiber)** dan **PostgreSQL dengan GORM (ORM)**.

## Fitur Utama

1. **API Publik Profil Pekerja (`GET /api/public/workers/:slug`)**
   - Mengambil data publik pekerja (nama, slug, bio, avatar, rating, zona, dan daftar layanan & harga).
   - **Keamanan & Privasi Terjamin**: Data sensitif seperti nomor telepon (`phone_number`), email (`email`), dan alamat pribadi **tidak pernah diekspos** di endpoint publik.

2. **API Publik Pemesanan (`POST /api/public/bookings`)**
   - Memproses booking baru dari klien publik (nama klien, nomor telepon, alamat/lokasi, zona, tanggal/waktu, catatan, dan pilihan layanan pekerja).
   - Validasi data masukan lengkap (format RFC3339, validasi tanggal masa depan, kecocokan layanan dan pekerja aktif).
   - Menghasilkan kode booking unik (contoh: `TW-20261102-A1B2C3`) dengan status awal `PENDING`.

3. **Database Layer dengan ORM (GORM)**
   - Menggunakan GORM (`gorm.io/gorm` dan `gorm.io/driver/postgres`) untuk relasi entitas, query builder type-safe, dan auto-migration.
   - Dilengkapi connection pooling (MaxOpenConns, MaxIdleConns, ConnMaxLifetime).
   - Fallback otomatis ke in-memory saat database offline untuk memudahkan testing & pengembangan lokal.

---

## Struktur Proyek

```
tuwaktu.com/
├── cmd/
│   └── api/
│       └── main.go                  # Entrypoint aplikasi server
├── internal/
│   ├── config/                      # Konfigurasi aplikasi & database per environment
│   ├── database/                    # Koneksi PostgreSQL & AutoMigrate via GORM
│   ├── domain/                      # Entitas bisnis, GORM tags, DTO publik, validasi, dan domain errors
│   ├── repository/                  # Layer akses data (GORM repository & In-Memory mock untuk testing)
│   ├── service/                     # Usecase / Business logic layer
│   └── handler/                     # Fiber HTTP Handler & routing
├── migrations/
│   ├── 000001_init_schema.up.sql    # DDL skema PostgreSQL
│   ├── 000001_init_schema.down.sql  # DDL rollback skema
│   └── seed.sql                     # Data contoh untuk pekerja & layanan
├── .env.example                     # Template konfigurasi lengkap & dokumentasi opsi
├── .env.development                 # Default preset untuk lokal development
├── .env.staging                     # Default preset untuk staging / UAT testing
├── .env.production                  # Default preset untuk production (secure defaults)
├── go.mod
├── go.sum
└── README.md
```

---

## Pemisahan Environment (Dev, Staging, Production)

Aplikasi mendukung tiga environment target utama:
- **`development`** (alias: `dev`)
- **`staging`** (alias: `stage`, `uat`)
- **`production`** (alias: `prod`)

### 1. Hierarki & Prioritas Pemuatan Konfigurasi

Sistem konfigurasi memuat variabel environment dengan urutan prioritas standar (dari tertinggi ke terendah):

1. **OS Environment Variables**: Variabel yang di-set di shell host, container Docker, atau Kubernetes (selalu menang dan tidak pernah ditimpa oleh file).
2. **`.env.<env>.local`**: Override lokal per environment untuk mesin developer (misal: `.env.development.local`, di-ignore git).
3. **`.env.local`**: Override lokal umum (di-ignore git).
4. **`.env.<env>`**: Konfigurasi preset default spesifik environment (`.env.development`, `.env.staging`, `.env.production`).
5. **`.env`**: File fallback konfigurasi umum.

### 2. Matriks Perbedaan Konfigurasi per Environment

| Fitur / Parameter | Development (`dev`) | Staging (`staging`) | Production (`prod`) |
| :--- | :--- | :--- | :--- |
| **Fiber App Name** | `Tuwaktu API [development]` | `Tuwaktu API [staging]` | `Tuwaktu API` |
| **Server Header** | `Fiber` | `Fiber` | *Omitted* (keamanan info server) |
| **HTTP Logger Format** | Human-readable dev (warna, path, status, latency) | Structured JSON (RFC3339 UTC) | Structured JSON (RFC3339 UTC) |
| **GORM DB Log Level** | `info` (seluruh query & timing) | `warn` (query lambat & warning) | `error` (hanya error, no query leak) |
| **DB Name Default** | `tuwaktu_dev` | `tuwaktu_staging` | `tuwaktu_prod` |
| **DB SSL Mode** | `disable` | `disable` | `require` |
| **DB Max Open Conns** | `10` | `25` | `50` |
| **DB Max Idle Conns** | `2` | `5` | `10` |
| **DB Conn Lifetime** | `30m` | `30m` | `15m` |
| **DB Auto Migrate** | `true` | `true` | `false` (manual / CI deploy) |
| **DB Auto Seed** | `true` (demo pekerja & layanan) | `false` | `false` (strict) |
| **DB Memory Fallback** | `true` (fallback jika DB offline) | `false` (fail-fast jika DB gagal) | `false` (fail-fast fatal error) |
| **CORS Origins** | `*` (permissive untuk web dev) | `https://staging.tuwaktu.com,...` | `https://tuwaktu.com,...` |

---

## Menjalankan Aplikasi

### Opsi A: Mode Development (Lokal)

Secara default, jika `APP_ENV` tidak diset, aplikasi otomatis berjalan dalam mode **`development`**. File `.env.development` akan otomatis dibaca.

```bash
# Menjalankan dengan default development
go run cmd/api/main.go

# Atau secara eksplisit:
APP_ENV=development go run cmd/api/main.go
# Pada PowerShell Windows:
# $env:APP_ENV="development"; go run cmd/api/main.go
```

> **Catatan Dev Lokal**: Jika PostgreSQL belum terpasang atau sedang offline di port 5432, aplikasi dalam mode development otomatis beralih ke *in-memory repository* yang sudah di-seed dengan data pekerja & layanan contoh sehingga Anda dapat langsung mengetes endpoint tanpa hambatan.

### Opsi B: Mode Staging (UAT)

```bash
# Linux / macOS
APP_ENV=staging go run cmd/api/main.go

# PowerShell Windows
$env:APP_ENV="staging"; go run cmd/api/main.go
```

### Opsi C: Mode Production

```bash
# Linux / Docker
APP_ENV=production DATABASE_URL="postgres://user:pass@db.internal:5432/tuwaktu_prod?sslmode=require" ./bin/api

# PowerShell Windows
$env:APP_ENV="production"; go run cmd/api/main.go
```

> **Peringatan Keamanan Production**: Pada environment `production`, jika database gagal terhubung, aplikasi akan langsung **berhenti (fatal error)** dan menolak berjalan demi mencegah data booking pengguna hilang atau tersimpan di memori sementara.

---

## Migrasi Skema Database (PostgreSQL)

> [!CAUTION]
> **Larangan Keras AutoMigrate**:
> Sesuai aturan arsitektur codebase Tuwaktu, penggunaan `AutoMigrate` saat runtime atau startup server **dilarang keras**. Seluruh perubahan skema DDL wajib dieksekusi secara manual dan terencana melalui runner migrasi.

### Menjalankan Migrasi Manual via NPM Scripts:
```bash
# 1. Menjalankan migrasi UP (menerapkan file migrations/*.up.sql yang pending)
npm run db:migrate

# 2. Membatalkan / Revert migrasi DOWN (rollback file migrations/*.down.sql terakhir)
npm run db:revert

# 3. Memeriksa status migrasi (terpasang vs pending)
npm run db:status

# 4. Mengisi data awal / seeding (migrations/seed.sql)
npm run db:seed
```

### Atau via Go CLI Langsung:
```bash
go run ./cmd/migrate up
go run ./cmd/migrate down
go run ./cmd/migrate status
go run ./cmd/migrate seed
```

### Alternatif Eksekusi Manual via PostgreSQL CLI (`psql`):
```bash
psql -h localhost -U postgres -d tuwaktu_dev -f migrations/000001_init_schema.up.sql
psql -h localhost -U postgres -d tuwaktu_dev -f migrations/seed.sql
```
*(Lihat dokumentasi lengkap di [migrations/README.md](file:///c:/Users/gigih/Documents/gigih/tuwaktu.com/migrations/README.md))*

---

## Dokumentasi API

### 1. GET `/api/public/workers/:slug`

Mengambil profil publik pekerja berdasarkan slug URL.

#### Request Contoh

```http
GET /api/public/workers/budi-santoso HTTP/1.1
Host: localhost:3000
```

#### Response Sukses (200 OK)

```json
{
  "success": true,
  "message": "Data profil pekerja berhasil diambil",
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "slug": "budi-santoso",
    "name": "Budi Santoso",
    "bio": "Teknisi AC dan kelistrikan berpengalaman lebih dari 8 tahun di area Jakarta Selatan.",
    "avatar_url": "https://images.unsplash.com/photo-1540569014015-19a7be504e3a",
    "rating": 4.9,
    "review_count": 42,
    "zone": "Jakarta Selatan",
    "services": [
      {
        "id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        "name": "Cuci AC Standar 0.5 - 1 PK",
        "description": "Pembersihan filter, evaporator, dan cek tekanan freon AC.",
        "price": 75000,
        "duration_minutes": 45
      },
      {
        "id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
        "name": "Isi / Tambah Freon R32 / R410A",
        "description": "Pengisian freon berkualitas untuk pendinginan optimal.",
        "price": 150000,
        "duration_minutes": 60
      }
    ]
  }
}
```

> **Catatan Keamanan:** Field sensitif seperti nomor HP, email pribadi, dan NIK pekerja difilter ketat pada level model DTO publik dan tidak pernah disertakan dalam payload response.

---

### 2. POST `/api/public/bookings`

Membuat pesanan / booking layanan baru dari klien.

#### Request Contoh (Payload Fleksibel)

**Opsi A: Payload Minimal (Sesuai Spesifikasi: nama klien, lokasi/zona, pilihan layanan)**
Worker dan jadwal akan otomatis ditentukan dari layanan yang dipilih:

```http
POST /api/public/bookings HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "client_name": "Rian Kusuma",
  "location": "Jakarta Selatan",
  "service_id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"
}
```

_(Bisa juga menggunakan key bahasa Indonesia: `nama_klien`, `lokasi`, `pilihan_layanan`)_

**Opsi B: Payload Lengkap (dengan nomor telepon, jadwal, dan catatan)**

```http
POST /api/public/bookings HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "worker_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "service_id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "client_name": "Rian Kusuma",
  "client_phone": "+628123456789",
  "client_email": "rian.kusuma@example.com",
  "location": "Jl. Metro Pondok Indah Blok TB No. 12",
  "zone": "Jakarta Selatan",
  "booking_date": "2026-11-10T09:00:00Z",
  "notes": "Rumah pagar hitam di samping taman"
}
```

#### Response Sukses (201 Created)

```json
{
  "success": true,
  "message": "Pesanan booking berhasil dibuat",
  "data": {
    "booking_code": "TW-20261102-3F9A1B",
    "worker_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "worker_name": "Budi Santoso",
    "service_id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    "service_name": "Cuci AC Standar 0.5 - 1 PK",
    "client_name": "Rian Kusuma",
    "location": "Jl. Metro Pondok Indah Blok TB No. 12",
    "zone": "Jakarta Selatan",
    "booking_date": "2026-11-10T09:00:00Z",
    "notes": "Rumah pagar hitam di samping taman",
    "total_price": 75000,
    "status": "PENDING",
    "created_at": "2026-11-02T07:15:00Z"
  }
}
```

#### Response Error Validasi (422 Unprocessable Entity)

```json
{
  "success": false,
  "message": "Validation error",
  "error": "invalid input data: client_name is required"
}
```

---

## Menjalankan Unit & Integration Test

Jalankan suite pengujian lengkap:

```bash
# Go standard test
go test -v ./cmd/... ./internal/...

# Atau via Nx CLI
npx nx test api
npx nx test web
npx nx run-many --target=test --all
```

---

## Nx Monorepo & Angular SSR Frontend

Workspace ini terintegrasi menggunakan **Nx Monorepo** yang mengelola backend Golang dan frontend Angular SSR secara terpadu.

### Struktur Proyek Monorepo:
```
tuwaktu.com/
├── apps/
│   ├── api/
│   │   └── project.json             # Konfigurasi Nx target untuk Golang backend
│   └── web/
│       ├── .postcssrc.json          # Konfigurasi PostCSS Tailwind CSS v4
│       ├── project.json             # Konfigurasi Angular SSR (build, serve, fileReplacements)
│       └── src/
│           ├── environments/
│           │   ├── environment.model.ts       # Interface AppEnvironment & InjectionToken
│           │   ├── environment.development.ts # Konfigurasi development (http://localhost:3000)
│           │   ├── environment.staging.ts     # Konfigurasi staging (https://staging-api.tuwaktu.com)
│           │   ├── environment.production.ts  # Konfigurasi production (https://api.tuwaktu.com)
│           │   └── environment.ts             # Base fallback environment
│           ├── app/
│           │   ├── core/                      # Global Error Handler & app configs
│           │   └── features/                  # Feature-Sliced Atomic Design Components
│           │       ├── worker-booking/        # Fitur Pemesanan Publik (molecules, organisms, pages)
│           │       └── worker-dashboard/      # Fitur Dasbor Pekerja (molecules, organisms, pages)
│           ├── main.ts                        # Browser entrypoint
│           ├── main.server.ts                 # Server entrypoint
│           ├── server.ts                      # Express SSR Server
│           └── styles.css                     # Tailwind CSS import
├── cmd/api/                                   # Backend Go entrypoint
├── internal/                                  # Logika internal Go
├── nx.json                                    # Konfigurasi Nx Workspace
├── tsconfig.base.json                         # Base TypeScript config
└── package.json
```

### Perintah Utama Nx:

#### 1. Backend Golang (`api`):
```bash
# Build binary Go ke dist/apps/api/
npx nx build api

# Jalankan server API backend
npx nx serve api

# Jalankan unit test backend
npx nx test api
```

#### 2. Frontend Angular SSR (`web`):
```bash
# Build Angular SSR sesuai environment
npx nx build web --configuration=development
npx nx build web --configuration=staging
npx nx build web --configuration=production

# Jalankan dev server Angular (SSR enabled)
npx nx serve web

# Jalankan unit test Angular (Jest)
npx nx test web

# Jalankan production SSR server (Express)
npx nx run web:serve-ssr
```

#### 3. Eksekusi Bersama (Run-Many):
```bash
# Build seluruh aplikasi (api & web)
npx nx run-many --target=build --all

# Test seluruh aplikasi (api & web)
npx nx run-many --target=test --all
```

