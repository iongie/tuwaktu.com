package domain

import "errors"

var (
	ErrWorkerNotFound        = errors.New("pekerja tidak ditemukan")
	ErrWorkerInactive        = errors.New("pekerja sedang tidak aktif")
	ErrServiceNotFound       = errors.New("layanan tidak ditemukan")
	ErrServiceWorkerMismatch = errors.New("layanan tidak sesuai dengan pekerja yang dipilih")
	ErrInvalidInput          = errors.New("data masukan tidak valid")
	ErrPastBookingDate       = errors.New("tanggal booking harus di masa depan")
)
