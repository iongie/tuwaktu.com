package handler

import (
	"errors"
	"net/url"
	"strings"

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
	rawSlug := c.Params("slug")
	if unescaped, err := url.PathUnescape(rawSlug); err == nil {
		rawSlug = unescaped
	}
	slug := strings.TrimSpace(rawSlug)
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

// UpdateWorkerProfile handles PUT /api/workers/:id/profile and PUT /api/v1/workers/:id/profile
func (h *WorkerHandler) UpdateWorkerProfile(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	id := strings.TrimSpace(rawID)
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi", nil)
	}

	var req domain.WorkerProfileUpdate
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload tidak valid", err.Error())
	}

	if strings.TrimSpace(req.Name) == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "nama pekerja wajib diisi", nil)
	}

	profile, err := h.service.UpdateWorkerProfile(c.UserContext(), id, &req)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui profil pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Profil pekerja berhasil diperbarui", profile)
}

