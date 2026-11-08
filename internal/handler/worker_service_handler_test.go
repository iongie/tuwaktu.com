package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupWorkerServiceTestApp(repo repository.WorkerRepository) (*fiber.App, *domain.Worker) {
	app := fiber.New()
	workerSvc := service.NewWorkerService(repo)
	workerHandler := handler.NewWorkerHandler(workerSvc)
	bookingRepo := repository.NewMemoryRepository()
	bookingSvc := service.NewBookingService(bookingRepo)
	bookingHandler := handler.NewBookingHandler(bookingSvc)
	authHandler := handler.NewAuthHandler(workerSvc)
	authMiddleware := handler.NewAuthMiddleware()

	worker := &domain.Worker{
		ID:       "wrk-service-100",
		Slug:     "budi-service-test",
		Name:     "Budi Servis",
		IsActive: true,
	}
	if memRepo, ok := repo.(*repository.MemoryRepository); ok {
		memRepo.SeedWorker(worker)
	}

	handler.RegisterRoutes(app, workerHandler, bookingHandler, nil, authHandler, authMiddleware, nil)
	return app, worker
}

func TestWorkerHandler_ServicesCRUD(t *testing.T) {
	repo := repository.NewMemoryRepository()
	app, worker := setupWorkerServiceTestApp(repo)

	var createdServiceID string

	t.Run("POST /api/v1/worker/services berhasil membuat layanan baru", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":             "Cuci AC Standar 1 PK",
			"description":      "Pembersihan indoor dan outdoor unit",
			"price":            85000,
			"duration_minutes": 60,
			"rate_type":        "HOURLY",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/worker/services?worker_id="+worker.ID, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool           `json:"success"`
			Message string         `json:"message"`
			Data    domain.Service `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Layanan baru berhasil ditambahkan ke katalog", res.Message)
		assert.Equal(t, "Cuci AC Standar 1 PK", res.Data.Name)
		assert.Equal(t, 85000.0, res.Data.Price)
		assert.NotEmpty(t, res.Data.ID)
		createdServiceID = res.Data.ID
	})

	t.Run("POST /api/v1/worker/services gagal jika nama layanan kosong", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":  "",
			"price": 85000,
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/worker/services?worker_id="+worker.ID, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("PUT /api/v1/worker/services/:serviceId berhasil memperbarui layanan", func(t *testing.T) {
		require.NotEmpty(t, createdServiceID)
		newName := "Cuci AC Standar 1 PK Promo"
		newPrice := 75000.0
		payload := map[string]interface{}{
			"name":  newName,
			"price": newPrice,
		}
		body, _ := json.Marshal(payload)

		url := "/api/v1/worker/services/" + createdServiceID + "?worker_id=" + worker.ID
		req := httptest.NewRequest(http.MethodPut, url, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var res struct {
			Success bool           `json:"success"`
			Message string         `json:"message"`
			Data    domain.Service `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Paket layanan berhasil diperbarui", res.Message)
		assert.Equal(t, newName, res.Data.Name)
		assert.Equal(t, newPrice, res.Data.Price)
	})

	t.Run("DELETE /api/v1/worker/services/:serviceId berhasil menonaktifkan layanan", func(t *testing.T) {
		require.NotEmpty(t, createdServiceID)
		url := "/api/v1/worker/services/" + createdServiceID + "?worker_id=" + worker.ID
		req := httptest.NewRequest(http.MethodDelete, url, nil)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Paket layanan berhasil dinonaktifkan dari katalog", res.Message)
	})

	t.Run("POST /api/v1/worker/services berhasil dengan worker_id di body tanpa query param", func(t *testing.T) {
		payload := map[string]interface{}{
			"worker_id":        worker.ID,
			"name":             "Bongkar Pasang AC",
			"description":      "Relokasi unit AC antar ruangan",
			"price":            180000,
			"duration_minutes": 90,
			"rate_type":        "UNIT",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/worker/services", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)
	})

	t.Run("POST /api/v1/worker/services gagal jika tipe tarif tidak valid", func(t *testing.T) {
		payload := map[string]interface{}{
			"worker_id": worker.ID,
			"name":      "Layanan Tidak Valid",
			"price":     50000,
			"rate_type": "MONTHLY",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/worker/services", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("DELETE /api/v1/worker/services/:serviceId berhasil dengan worker_id di body JSON", func(t *testing.T) {
		// create a temporary service first
		createPayload := map[string]interface{}{
			"worker_id": worker.ID,
			"name":      "Servis Sementara Body",
			"price":     40000,
		}
		createBody, _ := json.Marshal(createPayload)
		createReq := httptest.NewRequest(http.MethodPost, "/api/v1/worker/services", bytes.NewReader(createBody))
		createReq.Header.Set("Content-Type", "application/json")
		createResp, err := app.Test(createReq)
		require.NoError(t, err)
		var createRes struct {
			Data domain.Service `json:"data"`
		}
		_ = json.NewDecoder(createResp.Body).Decode(&createRes)

		// delete with worker_id in body
		delPayload := map[string]interface{}{
			"worker_id": worker.ID,
		}
		delBody, _ := json.Marshal(delPayload)
		delReq := httptest.NewRequest(http.MethodDelete, "/api/v1/worker/services/"+createRes.Data.ID, bytes.NewReader(delBody))
		delReq.Header.Set("Content-Type", "application/json")

		delResp, err := app.Test(delReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, delResp.StatusCode)
	})

	t.Run("DELETE /api/v1/worker/services/:serviceId return 404 jika service tidak ditemukan", func(t *testing.T) {
		url := "/api/v1/worker/services/non-existent-id?worker_id=" + worker.ID
		req := httptest.NewRequest(http.MethodDelete, url, nil)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	})
}
