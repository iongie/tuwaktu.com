package domain

import "errors"

var (
	ErrWorkerNotFound        = errors.New("pekerja tidak ditemukan")
	ErrWorkerInactive        = errors.New("pekerja sedang tidak aktif")
	ErrServiceNotFound       = errors.New("layanan tidak ditemukan")
	ErrServiceWorkerMismatch = errors.New("layanan tidak sesuai dengan pekerja yang dipilih")
	ErrInvalidInput          = errors.New("data masukan tidak valid")
	ErrPastBookingDate       = errors.New("tanggal booking harus di masa depan")
	ErrInvalidBasePrice      = errors.New("Nominal tarif dasar harus lebih besar dari Rp 0")
	ErrInvalidRateType       = errors.New("Tipe tarif tidak valid. Nilai yang diizinkan adalah HOURLY atau UNIT")
	ErrOutOfServiceRadius    = errors.New("Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja")
	ErrWorkerLocationNotSet  = errors.New("Pekerja belum mengatur titik koordinat lokasi layanan")
	ErrSlotUnavailable       = errors.New("slot waktu tidak tersedia atau bertabrakan dengan jadwal pesanan lain")
	ErrInvalidScheduleDay    = errors.New("hari jadwal kerja tidak valid (harus bernilai antara 0 sampai 6)")
	ErrAccountLocked         = errors.New("akun terkunci sementara karena terlalu banyak percobaan masuk yang gagal")
	ErrWeakPIN               = errors.New("kombinasi PIN terlalu lemah: dilarang menggunakan angka berurutan atau berulang")
	ErrCategoryNotFound      = errors.New("kategori tidak ditemukan")
	ErrCategorySlugExists    = errors.New("slug kategori sudah digunakan")
	ErrCategoryNameRequired  = errors.New("nama kategori wajib diisi")
	ErrBookingNotFound       = errors.New("pesanan booking tidak ditemukan")
	ErrInvalidBookingStatus  = errors.New("status pemesanan tidak valid: nilai yang diizinkan adalah PENDING_WA, CONFIRMED, COMPLETED, atau CANCELLED")
	ErrInvalidReviewToken    = errors.New("token tautan ulasan tidak valid atau telah kadaluarsa")
	ErrBookingNotCompleted   = errors.New("ulasan hanya dapat diberikan untuk pesanan yang telah selesai dikerjakan")
	ErrBookingAlreadyReviewed = errors.New("pesanan ini sudah pernah diulas sebelumnya")
	ErrInvalidRating         = errors.New("rating harus bernilai antara 1 sampai 5 bintang")
	ErrReviewCommentTooShort = errors.New("komentar ulasan minimal harus 5 karakter")
)

