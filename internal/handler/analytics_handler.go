package handler

import (
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type AnalyticsHandler struct {
	analyticsSvc service.AnalyticsService
}

func NewAnalyticsHandler(analyticsSvc service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsSvc: analyticsSvc}
}

// TrackPublicEvent mencatat event telemetri interaksi dari sisi klien secara non-blocking
// POST /api/public/telemetry/events dan /api/v1/public/telemetry/events
func (h *AnalyticsHandler) TrackPublicEvent(c *fiber.Ctx) error {
	var payload domain.TrackEventPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload telemetri tidak valid", err.Error())
	}

	payload.EventName = strings.TrimSpace(payload.EventName)
	if payload.EventName == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "nama event (event_name) wajib diisi", nil)
	}

	// Deteksi kota/wilayah hybrid (gabungan input eksplisit & header CDN/proxy)
	if payload.Metadata == nil {
		payload.Metadata = make(map[string]interface{})
	}
	if city := extractCityFromRequest(c, payload.Metadata); city != "" {
		if _, exists := payload.Metadata["city"]; !exists {
			payload.Metadata["city"] = city
		}
	}

	if err := h.analyticsSvc.TrackEvent(c.UserContext(), &payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Gagal mencatat event: "+err.Error(), err.Error())
	}

	return SuccessResponse(c, fiber.StatusCreated, "Event telemetri berhasil dicatat", nil)
}

// extractCityFromRequest mengekstrak nama kota/wilayah secara hybrid
func extractCityFromRequest(c *fiber.Ctx, meta map[string]interface{}) string {
	// 1. Cek jika metadata dari request body sudah memiliki city / location eksplisit (misal dari pencarian / filter)
	if meta != nil {
		if loc, ok := meta["location"].(string); ok && strings.TrimSpace(loc) != "" {
			return strings.TrimSpace(loc)
		}
		if city, ok := meta["city"].(string); ok && strings.TrimSpace(city) != "" {
			return strings.TrimSpace(city)
		}
	}

	// 2. Cek Header Reverse Proxy / CDN (Cloudflare CF-IPCity, CF-Region, X-City, X-Forwarded-City)
	headers := []string{"CF-IPCity", "X-City", "X-Forwarded-City", "CF-Region", "X-Region"}
	for _, h := range headers {
		val := strings.TrimSpace(c.Get(h))
		if val != "" {
			return val
		}
	}

	return ""
}

// GetAdminSummary mengambil data ringkasan analitik platform untuk panel admin
// GET /api/admin/analytics/summary dan /api/v1/admin/analytics/summary
func (h *AnalyticsHandler) GetAdminSummary(c *fiber.Ctx) error {
	daysStr := strings.TrimSpace(c.Query("days", "30"))
	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 0 {
		days = 30
	}

	summary, err := h.analyticsSvc.GetAdminSummary(c.UserContext(), days)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat ringkasan analitik admin", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Ringkasan data analitik admin berhasil dimuat", summary)
}

