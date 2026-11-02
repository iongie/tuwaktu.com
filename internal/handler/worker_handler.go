package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type WorkerHandler struct {
	service service.WorkerService
}

func NewWorkerHandler(service service.WorkerService) *WorkerHandler {
	return &WorkerHandler{service: service}
}

// GetWorkerBySlug handles GET /api/public/workers/:slug
func (h *WorkerHandler) GetWorkerBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Parameter slug pekerja wajib diisi", nil)
	}

	profile, err := h.service.GetPublicProfileBySlug(c.UserContext(), slug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) || errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil data profil pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Data profil pekerja berhasil diambil", profile)
}
