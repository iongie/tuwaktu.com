package handler

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type AdminHandler struct {
	workerSvc service.WorkerService
}

func NewAdminHandler(workerSvc service.WorkerService) *AdminHandler {
	return &AdminHandler{workerSvc: workerSvc}
}

// CreateWorker menangani pembuatan mitra baru secara transaksional
func (h *AdminHandler) CreateWorker(c *fiber.Ctx) error {
	var payload domain.AdminCreateWorkerPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload pembuatan mitra tidak valid", err.Error())
	}

	result, err := h.workerSvc.OnboardWorker(c.Context(), &payload)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menambahkan mitra baru: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusCreated, "Akun mitra baru berhasil didaftarkan", result)
}

// GetWorkers mengambil seluruh data mitra untuk tabel panel admin
func (h *AdminHandler) GetWorkers(c *fiber.Ctx) error {
	workers, err := h.workerSvc.ListWorkersForAdmin(c.Context())
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar mitra: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar seluruh mitra berhasil dimuat", workers)
}

// UpdateWorkerStatus mengubah status aktif atau penangguhan (suspend) mitra
func (h *AdminHandler) UpdateWorkerStatus(c *fiber.Ctx) error {
	workerID := strings.TrimSpace(c.Params("id"))
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID mitra wajib disertakan pada parameter URL", "INVALID_WORKER_ID")
	}

	var payload domain.AdminUpdateWorkerStatusPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload perubahan status tidak valid", err.Error())
	}

	status := strings.ToUpper(strings.TrimSpace(payload.Status))
	if status != domain.AccountStatusActive && status != domain.AccountStatusSuspended {
		return ErrorResponse(c, fiber.StatusBadRequest, "Nilai status harus 'ACTIVE' atau 'SUSPENDED'", "INVALID_STATUS")
	}

	if err := h.workerSvc.SetWorkerStatus(c.Context(), workerID, status); err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Mitra tidak ditemukan", "WORKER_NOT_FOUND")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui status mitra: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Status mitra berhasil diperbarui", fiber.Map{
		"worker_id": workerID,
		"status":    status,
	})
}

