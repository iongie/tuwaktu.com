package handler

import (
	"errors"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type BookingHandler struct {
	service service.BookingService
}

func NewBookingHandler(service service.BookingService) *BookingHandler {
	return &BookingHandler{service: service}
}

// CreateBooking handles POST /api/public/bookings
func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	var req domain.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload pemesanan tidak valid", err.Error())
	}

	res, err := h.service.CreateBooking(c.UserContext(), req)
	if err != nil {
		if errors.Is(err, domain.ErrSlotUnavailable) {
			return ErrorResponse(c, fiber.StatusConflict, "Slot waktu tidak tersedia atau bertabrakan dengan jadwal pesanan lain (termasuk buffer transit 60 menit)", err.Error())
		}
		if errors.Is(err, domain.ErrOutOfServiceRadius) {
			return ErrorResponse(c, fiber.StatusUnprocessableEntity, "Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja", err.Error())
		}
		if errors.Is(err, domain.ErrInvalidInput) || errors.Is(err, domain.ErrPastBookingDate) {
			return ErrorResponse(c, fiber.StatusUnprocessableEntity, "Kesalahan validasi data pemesanan", err.Error())
		}
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", err.Error())
		}
		if errors.Is(err, domain.ErrServiceNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Layanan tidak ditemukan atau sedang tidak aktif", err.Error())
		}
		if errors.Is(err, domain.ErrServiceWorkerMismatch) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Layanan tidak sesuai dengan pekerja yang dipilih", err.Error())
		}
		if errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Pekerja saat ini sedang tidak dapat menerima pesanan", err.Error())
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memproses pembuatan pesanan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusCreated, "Pesanan booking berhasil dibuat", res)
}

// CalculateFee handles POST /api/v1/booking/calculate-fee and POST /api/booking/calculate-fee
func (h *BookingHandler) CalculateFee(c *fiber.Ctx) error {
	var req domain.CalculateFeeRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload kalkulasi biaya tidak valid", err.Error())
	}

	res, err := h.service.CalculateFee(c.UserContext(), req)
	if err != nil {
		if errors.Is(err, domain.ErrOutOfServiceRadius) {
			return ErrorResponse(c, fiber.StatusUnprocessableEntity, "Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja", err.Error())
		}
		if errors.Is(err, domain.ErrWorkerLocationNotSet) {
			return ErrorResponse(c, fiber.StatusUnprocessableEntity, "Pekerja belum mengatur titik koordinat lokasi layanan", err.Error())
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusUnprocessableEntity, "Kesalahan validasi data kalkulasi biaya", err.Error())
		}
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", err.Error())
		}
		if errors.Is(err, domain.ErrServiceNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Layanan tidak ditemukan atau sedang tidak aktif", err.Error())
		}
		if errors.Is(err, domain.ErrServiceWorkerMismatch) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Layanan tidak sesuai dengan pekerja yang dipilih", err.Error())
		}
		if errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Pekerja saat ini sedang tidak dapat menerima pesanan", err.Error())
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menghitung kalkulasi biaya pemesanan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Kalkulasi biaya pemesanan berhasil dihitung", res)
}

// GetAvailableSlots handles GET /api/v1/public/workers/:slug/available-slots and alias GET /api/public/workers/:slug/available-slots
func (h *BookingHandler) GetAvailableSlots(c *fiber.Ctx) error {
	rawSlug := c.Params("slug")
	if unescaped, err := url.PathUnescape(rawSlug); err == nil {
		rawSlug = unescaped
	}
	slug := strings.TrimSpace(rawSlug)
	if slug == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Parameter slug pekerja wajib diisi", nil)
	}

	dateStr := strings.TrimSpace(c.Query("date"))
	if dateStr == "" {
		dateStr = strings.TrimSpace(c.Query("tanggal"))
	}
	if dateStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Parameter tanggal (date) wajib diisi dengan format YYYY-MM-DD", nil)
	}

	serviceID := strings.TrimSpace(c.Query("service_id"))
	if serviceID == "" {
		serviceID = strings.TrimSpace(c.Query("serviceId"))
	}
	if serviceID == "" {
		serviceID = strings.TrimSpace(c.Query("layanan_id"))
	}

	res, err := h.service.GetAvailableSlots(c.UserContext(), slug, dateStr, serviceID)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) || errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan atau sedang tidak aktif", err.Error())
		}
		if errors.Is(err, domain.ErrServiceNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Layanan tidak ditemukan atau sedang tidak aktif", err.Error())
		}
		if errors.Is(err, domain.ErrServiceWorkerMismatch) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Layanan tidak sesuai dengan pekerja yang dipilih", err.Error())
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar slot ketersediaan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar slot ketersediaan berhasil diambil", res)
}


