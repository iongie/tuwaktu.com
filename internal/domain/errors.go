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
)
