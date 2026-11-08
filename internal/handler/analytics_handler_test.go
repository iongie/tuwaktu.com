package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestAnalyticsHandler_TrackPublicEvent(t *testing.T) {
	repo := repository.NewMemoryRepository()
	svc := service.NewAnalyticsService(repo)
	h := handler.NewAnalyticsHandler(svc)

	app := fiber.New()
	app.Post("/api/public/telemetry/events", h.TrackPublicEvent)

	t.Run("gagal jika nama event kosong", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"event_name": "",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/public/telemetry/events", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("berhasil mencatat event telemetri publik", func(t *testing.T) {
		body, _ := json.Marshal(domain.TrackEventPayload{
			EventName:  domain.EventWhatsAppClick,
			EntityType: domain.EntityTypeWorker,
			EntityID:   "budi-santoso",
			Metadata: map[string]interface{}{
				"source": "worker_booking_page",
			},
		})
		req := httptest.NewRequest(http.MethodPost, "/api/public/telemetry/events", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)
	})
}

func TestAnalyticsHandler_GetAdminSummary(t *testing.T) {
	repo := repository.NewMemoryRepository()
	svc := service.NewAnalyticsService(repo)
	h := handler.NewAnalyticsHandler(svc)

	app := fiber.New()
	app.Get("/api/admin/analytics/summary", h.GetAdminSummary)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/analytics/summary?days=7", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var result struct {
		Success bool                         `json:"success"`
		Data    domain.AdminAnalyticsSummary `json:"data"`
	}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, 7, result.Data.DaysRange)
}

