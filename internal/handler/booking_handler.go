package handler

import (
	"errors"

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

