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

// UpdateWorkerRates handles PUT /api/v1/worker/rates, PUT /api/worker/rates, and PUT /api/v1/workers/:id/rates
func (h *WorkerHandler) UpdateWorkerRates(c *fiber.Ctx) error {
	var req domain.WorkerRateUpdate
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload tidak valid", err.Error())
	}

	// Check if :id is provided in URL path
	if rawID := c.Params("id"); rawID != "" {
		if unescaped, err := url.PathUnescape(rawID); err == nil {
			rawID = unescaped
		}
		if trimmed := strings.TrimSpace(rawID); trimmed != "" {
			req.WorkerID = trimmed
		}
	}

	if req.WorkerID == "" && req.ID != "" {
		req.WorkerID = req.ID
	}

	req.WorkerID = strings.TrimSpace(req.WorkerID)
	if req.WorkerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi", nil)
	}

	if req.BasePrice <= 0 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Nominal tarif dasar harus lebih besar dari Rp 0", nil)
	}

	rateType := strings.ToUpper(strings.TrimSpace(req.RateType))
	if rateType != "HOURLY" && rateType != "UNIT" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tipe tarif tidak valid. Nilai yang diizinkan adalah HOURLY atau UNIT", nil)
	}
	req.RateType = rateType

	profile, err := h.service.UpdateWorkerRates(c.UserContext(), &req)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidBasePrice) || errors.Is(err, domain.ErrInvalidRateType) || errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui tarif pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Pengaturan tarif pekerja berhasil diperbarui", profile)
}

// UpdateWorkerLocationSettings handles PUT /api/v1/worker/location-settings and aliases
func (h *WorkerHandler) UpdateWorkerLocationSettings(c *fiber.Ctx) error {
	var req domain.WorkerLocationSettingsUpdate
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload tidak valid", err.Error())
	}

	// Check if :id is provided in URL path
	if rawID := c.Params("id"); rawID != "" {
		if unescaped, err := url.PathUnescape(rawID); err == nil {
			rawID = unescaped
		}
		if trimmed := strings.TrimSpace(rawID); trimmed != "" {
			req.WorkerID = trimmed
		}
	}

	if req.WorkerID == "" && req.ID != "" {
		req.WorkerID = req.ID
	}

	req.WorkerID = strings.TrimSpace(req.WorkerID)
	if req.WorkerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi", nil)
	}

	if req.MaxRadiusKM <= 0 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Jarak maksimal jangkauan harus lebih besar dari 0 km", nil)
	}
	if req.FreeRadiusKM < 0 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Radius gratis ongkir tidak boleh bernilai negatif", nil)
	}
	if req.FreeRadiusKM > req.MaxRadiusKM {
		return ErrorResponse(c, fiber.StatusBadRequest, "Radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal", nil)
	}
	if req.ExtraFeePerKM < 0 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tarif per kilometer tidak boleh bernilai negatif", nil)
	}
	if (req.Lat != nil && req.Lng == nil) || (req.Lat == nil && req.Lng != nil) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Titik lintang dan bujur harus diisi bersamaan", nil)
	}
	if req.Lat != nil && (*req.Lat < -90.0 || *req.Lat > 90.0) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Titik lintang (latitude) harus berada di antara -90 dan 90", nil)
	}
	if req.Lng != nil && (*req.Lng < -180.0 || *req.Lng > 180.0) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Titik bujur (longitude) harus berada di antara -180 dan 180", nil)
	}

	profile, err := h.service.UpdateWorkerLocationSettings(c.UserContext(), &req)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui pengaturan lokasi pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Pengaturan lokasi pekerja berhasil diperbarui", profile)
}

// GetWorkerSchedules handles GET /api/v1/worker/schedules, GET /api/worker/schedules, and GET /api/v1/workers/:id/schedules
func (h *WorkerHandler) GetWorkerSchedules(c *fiber.Ctx) error {
	workerID := c.Params("id")
	if unescaped, err := url.PathUnescape(workerID); err == nil {
		workerID = unescaped
	}
	if strings.TrimSpace(workerID) == "" {
		workerID = c.Query("worker_id")
		if workerID == "" {
			workerID = c.Query("worker_slug")
		}
		if workerID == "" {
			workerID = c.Query("slug")
		}
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID atau slug pekerja wajib diisi", nil)
	}

	schedules, err := h.service.GetWorkerSchedules(c.UserContext(), workerID)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar jadwal kerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar jadwal kerja berhasil diambil", schedules)
}

// UpdateWorkerSchedules handles PUT /api/v1/worker/schedules, PUT /api/worker/schedules, and PUT /api/v1/workers/:id/schedules
func (h *WorkerHandler) UpdateWorkerSchedules(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)

	var req domain.UpdateWorkerSchedulesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload jadwal tidak valid", err.Error())
	}

	if workerID == "" {
		workerID = strings.TrimSpace(req.WorkerID)
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_id"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_slug"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("slug"))
	}
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi", nil)
	}

	if len(req.Schedules) == 0 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Konfigurasi jadwal kerja tidak boleh kosong", nil)
	}

	for _, item := range req.Schedules {
		if item.DayOfWeek < 0 || item.DayOfWeek > 6 {
			return ErrorResponse(c, fiber.StatusBadRequest, "Hari jadwal kerja tidak valid (harus antara 0 dan 6)", nil)
		}
	}

	schedules, err := h.service.UpdateWorkerSchedules(c.UserContext(), workerID, req.Schedules)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidScheduleDay) || errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui konfigurasi jadwal kerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Konfigurasi jadwal kerja berhasil disimpan", schedules)
}


