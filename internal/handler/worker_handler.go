package handler

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/media"
	"tuwaktu.com/internal/service"
)

type WorkerHandler struct {
	service service.WorkerService
}

func NewWorkerHandler(service service.WorkerService) *WorkerHandler {
	return &WorkerHandler{service: service}
}

// ListPublicWorkers handles GET /api/public/workers and GET /api/v1/public/workers
func (h *WorkerHandler) ListPublicWorkers(c *fiber.Ctx) error {
	workers, err := h.service.ListPublicWorkers(c.UserContext())
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar pekerja publik", err.Error())
	}

	if workers == nil {
		workers = []domain.PublicWorkerProfile{}
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar pekerja publik berhasil diambil", workers)
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

// UpdateWorkerProfile handles PUT /api/v1/worker/profile, PUT /api/worker/profile, and PUT /api/v1/workers/:id/profile
func (h *WorkerHandler) UpdateWorkerProfile(c *fiber.Ctx) error {
	var req domain.WorkerProfileUpdate
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload tidak valid", err.Error())
	}

	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	id := strings.TrimSpace(rawID)
	if id == "" {
		id = strings.TrimSpace(req.WorkerID)
	}
	if id == "" {
		id = strings.TrimSpace(req.ID)
	}
	if id == "" {
		id = strings.TrimSpace(c.Query("worker_id"))
	}
	if id == "" {
		id = strings.TrimSpace(c.Query("worker_slug"))
	}
	if id == "" {
		id = strings.TrimSpace(c.Query("id"))
	}
	if id == "" {
		id = strings.TrimSpace(c.Query("slug"))
	}

	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi", nil)
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

// UploadWorkerAvatar handles POST /api/v1/workers/:id/avatar, POST /api/v1/worker/avatar, and POST /api/worker/avatar
func (h *WorkerHandler) UploadWorkerAvatar(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_id"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("id"))
	}
	if workerID == "" {
		if authWorkerID, ok := c.Locals("worker_id").(string); ok && strings.TrimSpace(authWorkerID) != "" {
			workerID = strings.TrimSpace(authWorkerID)
		}
	}
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pekerja wajib diisi untuk mengunggah foto profil", nil)
	}

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Berkas foto profil (avatar) wajib diunggah", nil)
	}

	// Backend protection: max 200 KB
	const maxUploadBytes = 200 * 1024
	if fileHeader.Size > maxUploadBytes {
		return ErrorResponse(c, fiber.StatusBadRequest, "Ukuran berkas melebihi batas maksimal 200 KB", nil)
	}

	src, err := fileHeader.Open()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal membaca berkas yang diunggah", err.Error())
	}
	defer src.Close()

	// Sniff magic bytes (first 512 bytes)
	buf := make([]byte, 512)
	n, _ := io.ReadFull(src, buf)
	contentType := http.DetectContentType(buf[:n])

	var ext string
	lowerFilename := strings.ToLower(fileHeader.Filename)
	switch {
	case strings.Contains(contentType, "webp") || strings.HasSuffix(lowerFilename, ".webp"):
		ext = ".webp"
	case strings.Contains(contentType, "png") || strings.HasSuffix(lowerFilename, ".png"):
		ext = ".png"
	case strings.Contains(contentType, "jpeg") || strings.Contains(contentType, "jpg") || strings.HasSuffix(lowerFilename, ".jpg") || strings.HasSuffix(lowerFilename, ".jpeg"):
		ext = ".jpg"
	default:
		return ErrorResponse(c, fiber.StatusBadRequest, "Format berkas tidak didukung. Harap unggah citra WebP, JPG, atau PNG", nil)
	}

	// Generate safe unique filename
	uniqueID, err := uuid.NewV7()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menghasilkan pengidentifikasi berkas unik", err.Error())
	}
	filename := fmt.Sprintf("avt_%s%s", strings.ReplaceAll(uniqueID.String(), "-", ""), ext)

	uploadDir := filepath.Join(".", "storage", "uploads", "avatars")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menyiapkan direktori penyimpanan berkas", err.Error())
	}

	destPath := filepath.Join(uploadDir, filename)
	if err := c.SaveFile(fileHeader, destPath); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menyimpan berkas ke penyimpanan server", err.Error())
	}

	profile, err := h.service.UpdateWorkerAvatar(c.UserContext(), workerID, filename)
	if err != nil {
		_ = os.Remove(destPath)
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui foto profil pekerja di database", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Foto profil berhasil diunggah", fiber.Map{
		"avatar_url":   profile.AvatarURL,
		"raw_filename": filename,
	})
}

// ServeAvatarMedia handles GET /api/v1/media/avatars/:filename and GET /api/media/avatars/:filename
func (h *WorkerHandler) ServeAvatarMedia(c *fiber.Ctx) error {
	rawFilename := c.Params("filename")
	cleanFilename, err := media.SanitizeFilename(rawFilename)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Nama berkas foto tidak valid atau mengandung karakter dilarang", nil)
	}

	filePath := filepath.Join(".", "storage", "uploads", "avatars", cleanFilename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return ErrorResponse(c, fiber.StatusNotFound, "Berkas foto profil tidak ditemukan pada penyimpanan server", nil)
	}

	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("Cache-Control", "public, max-age=86400")

	lowerExt := strings.ToLower(filepath.Ext(cleanFilename))
	switch lowerExt {
	case ".webp":
		c.Set("Content-Type", "image/webp")
	case ".png":
		c.Set("Content-Type", "image/png")
	case ".jpg", ".jpeg":
		c.Set("Content-Type", "image/jpeg")
	}

	return c.SendFile(filePath)
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

// CreateService handles POST /api/v1/workers/:id/services and POST /api/v1/worker/services
func (h *WorkerHandler) CreateService(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)

	var payload domain.CreateServicePayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload layanan tidak valid", err.Error())
	}

	if workerID == "" {
		workerID = strings.TrimSpace(payload.WorkerID)
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_id"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("slug"))
	}
	if workerID == "" {
		if authWorkerID, ok := c.Locals("workerID").(string); ok && authWorkerID != "" {
			workerID = authWorkerID
		}
	}
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID atau slug pekerja wajib diisi", nil)
	}

	created, err := h.service.CreateService(c.UserContext(), workerID, &payload)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) || errors.Is(err, domain.ErrInvalidRateType) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menambahkan layanan ke katalog", err.Error())
	}

	return SuccessResponse(c, fiber.StatusCreated, "Layanan baru berhasil ditambahkan ke katalog", created)
}

// UpdateService handles PUT /api/v1/workers/:id/services/:serviceId and PUT /api/v1/worker/services/:serviceId
func (h *WorkerHandler) UpdateService(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)

	serviceID := strings.TrimSpace(c.Params("serviceId"))
	if serviceID == "" {
		serviceID = strings.TrimSpace(c.Params("service_id"))
	}

	var payload domain.UpdateServicePayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload layanan tidak valid", err.Error())
	}

	if workerID == "" {
		workerID = strings.TrimSpace(payload.WorkerID)
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_id"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("slug"))
	}
	if workerID == "" {
		if authWorkerID, ok := c.Locals("workerID").(string); ok && authWorkerID != "" {
			workerID = authWorkerID
		}
	}
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID atau slug pekerja wajib diisi", nil)
	}
	if serviceID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID layanan wajib diisi", nil)
	}

	updated, err := h.service.UpdateService(c.UserContext(), workerID, serviceID, &payload)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrServiceNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Layanan tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) || errors.Is(err, domain.ErrInvalidRateType) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui data layanan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Paket layanan berhasil diperbarui", updated)
}

// DeleteService handles DELETE /api/v1/workers/:id/services/:serviceId and DELETE /api/v1/worker/services/:serviceId
func (h *WorkerHandler) DeleteService(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)

	serviceID := strings.TrimSpace(c.Params("serviceId"))
	if serviceID == "" {
		serviceID = strings.TrimSpace(c.Params("service_id"))
	}

	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("worker_id"))
	}
	if workerID == "" {
		workerID = strings.TrimSpace(c.Query("slug"))
	}
	if workerID == "" {
		if authWorkerID, ok := c.Locals("workerID").(string); ok && authWorkerID != "" {
			workerID = authWorkerID
		}
	}
	if workerID == "" {
		var body struct {
			WorkerID string `json:"worker_id"`
		}
		if err := c.BodyParser(&body); err == nil && body.WorkerID != "" {
			workerID = strings.TrimSpace(body.WorkerID)
		}
	}
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID atau slug pekerja wajib diisi", nil)
	}
	if serviceID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID layanan wajib diisi", nil)
	}

	err := h.service.DeleteService(c.UserContext(), workerID, serviceID)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrServiceNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Layanan tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menonaktifkan layanan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Paket layanan berhasil dinonaktifkan dari katalog", nil)
}

// GetWorkerBookings handles GET /api/v1/worker/bookings, GET /api/worker/bookings, and GET /api/v1/workers/:id/bookings
func (h *WorkerHandler) GetWorkerBookings(c *fiber.Ctx) error {
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

	limit := c.QueryInt("limit", 20)
	bookings, err := h.service.GetWorkerBookings(c.UserContext(), workerID, limit)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar pesanan pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar riwayat pesanan pekerja berhasil diambil", bookings)
}

// UpdateWorkerBookingStatus handles PATCH /api/v1/worker/bookings/:bookingId/status and PATCH /api/v1/workers/:id/bookings/:bookingId/status
func (h *WorkerHandler) UpdateWorkerBookingStatus(c *fiber.Ctx) error {
	rawID := c.Params("id")
	if unescaped, err := url.PathUnescape(rawID); err == nil {
		rawID = unescaped
	}
	workerID := strings.TrimSpace(rawID)

	bookingID := c.Params("bookingId")
	if unescaped, err := url.PathUnescape(bookingID); err == nil {
		bookingID = unescaped
	}
	bookingID = strings.TrimSpace(bookingID)

	var payload struct {
		WorkerID string `json:"worker_id"`
		Status   string `json:"status"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data payload status pesanan tidak valid", err.Error())
	}

	if workerID == "" {
		workerID = strings.TrimSpace(payload.WorkerID)
	}
	if workerID == "" {
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
	if bookingID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID booking wajib diisi", nil)
	}

	updated, err := h.service.UpdateWorkerBookingStatus(c.UserContext(), workerID, bookingID, payload.Status)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrBookingNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pesanan booking tidak ditemukan", nil)
		}
		if errors.Is(err, domain.ErrInvalidBookingStatus) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Status pemesanan tidak valid: nilai yang diizinkan adalah PENDING_WA, CONFIRMED, COMPLETED, atau CANCELLED", nil)
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui status pesanan", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Status pesanan berhasil diperbarui", updated)
}



