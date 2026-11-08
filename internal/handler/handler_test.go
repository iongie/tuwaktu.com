package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupTestApp() (*fiber.App, *repository.MemoryRepository) {
	app := fiber.New()
	repo := repository.NewMemoryRepository()

	workerSvc := service.NewWorkerService(repo)
	bookingSvc := service.NewBookingService(repo)
	reviewSvc := service.NewReviewService(repo, repo, repo)

	workerHandler := handler.NewWorkerHandler(workerSvc)
	bookingHandler := handler.NewBookingHandler(bookingSvc)
	adminHandler := handler.NewAdminHandler(workerSvc)
	authHandler := handler.NewAuthHandler(workerSvc)
	authMiddleware := handler.NewAuthMiddleware()
	reviewHandler := handler.NewReviewHandler(reviewSvc)

	handler.RegisterRoutes(app, workerHandler, bookingHandler, adminHandler, authHandler, authMiddleware, nil, reviewHandler)

	return app, repo
}

func TestWorkerHandler_GetWorkerBySlug(t *testing.T) {
	app, repo := setupTestApp()

	secretPhone := "+6281234567890"
	secretEmail := "rahasia.pribadi@tuwaktu.com"
	secretAddress := "Jl. Rahasia Nomor 99"

	worker := &domain.Worker{
		ID:          "worker-001",
		Slug:        "bambang-pamungkas",
		Name:        "Bambang Pamungkas",
		Bio:         "Tukang kebun handal",
		AvatarURL:   "https://example.com/bambang.jpg",
		Rating:      4.95,
		ReviewCount: 20,
		Zone:        "Jakarta Selatan",
		PhoneNumber: secretPhone,
		Email:       secretEmail,
		Address:     secretAddress,
		IsActive:    true,
	}
	repo.SeedWorker(worker)

	s1 := &domain.Service{
		ID:              "service-001",
		WorkerID:        worker.ID,
		Name:            "Potong Rumput",
		Description:     "Pemotongan rumput rapi dan pembuangan sampah kebun",
		Price:           100000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(s1)

	t.Run("200 OK - returns public worker data and strictly NO sensitive info", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/bambang-pamungkas", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		bodyBytes, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		bodyStr := string(bodyBytes)

		// CRITICAL PRIVACY CHECKS: Ensure sensitive private fields do not leak in raw JSON
		assert.NotContains(t, bodyStr, secretPhone, "Phone number must NOT be exposed in public API")
		assert.NotContains(t, bodyStr, secretEmail, "Email must NOT be exposed in public API")
		assert.NotContains(t, bodyStr, secretAddress, "Address must NOT be exposed in public API")

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.Unmarshal(bodyBytes, &res)
		require.NoError(t, err)

		assert.True(t, res.Success)
		assert.Equal(t, "Data profil pekerja berhasil diambil", res.Message)
		assert.Equal(t, "bambang-pamungkas", res.Data.Slug)
		assert.Equal(t, "Bambang Pamungkas", res.Data.Name)
		assert.Equal(t, "Jakarta Selatan", res.Data.Zone)
		assert.Len(t, res.Data.Services, 1)
		assert.Equal(t, "Potong Rumput", res.Data.Services[0].Name)
		assert.Equal(t, 100000.0, res.Data.Services[0].Price)
	})

	t.Run("404 Not Found - non-existent worker slug", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/non-existent-worker", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Pekerja tidak ditemukan", errRes.Message)
	})

	t.Run("404 Not Found - inactive worker", func(t *testing.T) {
		inactive := &domain.Worker{
			ID:       "worker-inactive-test",
			Slug:     "inactive-worker-test",
			Name:     "Inactive Worker",
			IsActive: false,
		}
		repo.SeedWorker(inactive)

		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/inactive-worker-test", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Pekerja tidak ditemukan", errRes.Message)
	})

	t.Run("200 OK - case-insensitive slug query", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/Bambang-Pamungkas", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("200 OK - route alias /api/v1/public/workers/:slug works correctly", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/bambang-pamungkas", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Data profil pekerja berhasil diambil", res.Message)
		assert.Equal(t, "bambang-pamungkas", res.Data.Slug)
	})
}

func TestBookingHandler_CreateBooking(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:          "worker-bkg-1",
		Slug:        "siti-nurhaliza",
		Name:        "Siti Nurhaliza",
		Zone:        "Jakarta Selatan",
		PhoneNumber: "+628111222333",
		Email:       "siti@tuwaktu.com",
		IsActive:    true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-bkg-1",
		WorkerID:        worker.ID,
		Name:            "Daily Cleaning",
		Price:           150000,
		DurationMinutes: 120,
		IsActive:        true,
	}
	repo.SeedService(srv)

	futureTime := time.Now().Add(48 * time.Hour).Format(time.RFC3339)

	t.Run("201 Created - valid booking payload", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   srv.ID,
			"client_name":  "Budi Pratama",
			"client_phone": "+6281299887766",
			"client_email": "budi.pratama@gmail.com",
			"location":     "Apartemen Sudirman Tower A Lt 15",
			"zone":         "Jakarta Selatan",
			"booking_date": futureTime,
			"notes":        "Parkir di basement 2",
		}

		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Message string                       `json:"message"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		respBytes, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)

		assert.True(t, res.Success)
		assert.Equal(t, "Pesanan booking berhasil dibuat", res.Message)
		assert.NotEmpty(t, res.Data.BookingCode)
		assert.True(t, strings.HasPrefix(res.Data.BookingCode, "TW-"))
		assert.Equal(t, "Budi Pratama", res.Data.ClientName)
		assert.Equal(t, "Siti Nurhaliza", res.Data.WorkerName)
		assert.Equal(t, "Daily Cleaning", res.Data.ServiceName)
		assert.Equal(t, 150000.0, res.Data.TotalPrice)
		assert.Equal(t, "PENDING", res.Data.Status)
	})

	t.Run("201 Created - minimal payload (nama klien, lokasi/zona, pilihan layanan, telepon, jadwal)", func(t *testing.T) {
		payload := map[string]any{
			"client_name":  "Pak Joko",
			"client_phone": "08123456789",
			"location":     "Jl. Kebon Jeruk No. 5 Jakarta",
			"service_id":   srv.ID,
			"booking_date": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		}

		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		respBytes, _ := io.ReadAll(resp.Body)
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Pak Joko", res.Data.ClientName)
		assert.Equal(t, worker.ID, res.Data.WorkerID)
		assert.Equal(t, srv.ID, res.Data.ServiceID)
	})

	t.Run("201 Created - Indonesian payload aliases", func(t *testing.T) {
		payload := map[string]any{
			"nama_klien":      "Ibu Ratna",
			"telepon":         "08123456789",
			"lokasi":          "Jl. Kebayoran Baru No. 10 Jakarta",
			"pilihan_layanan": srv.ID,
			"tanggal_booking": time.Now().Add(27 * time.Hour).Format(time.RFC3339),
		}

		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		respBytes, _ := io.ReadAll(resp.Body)
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Ibu Ratna", res.Data.ClientName)
	})

	t.Run("201 Created - Indonesian payload with service name as pilihan_layanan", func(t *testing.T) {
		payload := map[string]any{
			"nama_klien":      "Pak Bambang",
			"telepon":         "08123456789",
			"lokasi":          "Jl. Kebayoran Lama No. 20 Jakarta",
			"pilihan_layanan": "Daily Cleaning",
			"tanggal_booking": time.Now().Add(30 * time.Hour).Format(time.RFC3339),
		}

		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		respBytes, _ := io.ReadAll(resp.Body)
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Pak Bambang", res.Data.ClientName)
		assert.Equal(t, "Daily Cleaning", res.Data.ServiceName)
	})

	t.Run("400 Bad Request - invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader([]byte("{invalid-json")))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Format data payload pemesanan tidak valid", errRes.Message)
	})

	t.Run("422 Unprocessable Entity - missing required fields", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"service_id": srv.ID,
			// missing client_name, client_phone, location, zone, booking_date
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Kesalahan validasi data pemesanan", errRes.Message)
	})

	t.Run("422 Unprocessable Entity - past booking date", func(t *testing.T) {
		pastTime := time.Now().Add(-24 * time.Hour).Format(time.RFC3339)
		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   srv.ID,
			"client_name":  "Budi",
			"client_phone": "+6281299887766",
			"location":     "Lokasi",
			"zone":         "Jakarta",
			"booking_date": pastTime,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Kesalahan validasi data pemesanan", errRes.Message)
	})

	t.Run("404 Not Found - worker not found", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":    "unknown-worker-id",
			"service_id":   srv.ID,
			"client_name":  "Budi",
			"client_phone": "+6281299887766",
			"location":     "Jl. Kebayoran Baru No. 10 Jakarta",
			"zone":         "Jakarta",
			"booking_date": futureTime,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Pekerja tidak ditemukan", errRes.Message)
	})

	t.Run("400 Bad Request - service belongs to another worker", func(t *testing.T) {
		otherWorker := &domain.Worker{
			ID:       "worker-other-2",
			Slug:     "worker-other",
			Name:     "Other Worker",
			IsActive: true,
		}
		otherService := &domain.Service{
			ID:       "service-other-2",
			WorkerID: otherWorker.ID,
			Name:     "Other Service",
			Price:    50000,
			IsActive: true,
		}
		repo.SeedWorker(otherWorker)
		repo.SeedService(otherService)

		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   otherService.ID, // mismatch!
			"client_name":  "Budi",
			"client_phone": "+6281299887766",
			"location":     "Jl. Kebayoran Baru No. 10 Jakarta",
			"zone":         "Jakarta",
			"booking_date": futureTime,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
		var errRes struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errRes)
		assert.False(t, errRes.Success)
		assert.Equal(t, "Layanan tidak sesuai dengan pekerja yang dipilih", errRes.Message)
	})
}

func TestWorkerHandler_UpdateWorkerProfile(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:          "worker-update-001",
		Slug:        "supardi-kebun",
		Name:        "Supardi",
		Bio:         "Tukang kebun berpengalaman",
		AvatarURL:   "https://example.com/supardi.jpg",
		Zone:        "Jakarta Selatan",
		PhoneNumber: "+628111222333",
		Email:       "supardi.rahasia@tuwaktu.com",
		Address:     "Alamat Rahasia Supardi No. 12",
		IsActive:    true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-supardi-1",
		WorkerID:        worker.ID,
		Name:            "Potong Rumput",
		Price:           80000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	t.Run("200 OK - PUT /api/workers/:id/profile updates worker successfully", func(t *testing.T) {
		payload := map[string]any{
			"name":         "Supardi Ahli Taman",
			"bio":          "Spesialis desain taman dan bonsai",
			"avatar_url":   "https://example.com/supardi-new.jpg",
			"zone":         "Jakarta Selatan & Depok",
			"phone_number": "+628999888777",
			"email":        "supardi.baru@tuwaktu.com",
			"address":      "Jl. Depok Baru No. 1",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/workers/"+worker.ID+"/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		respBodyBytes, _ := io.ReadAll(resp.Body)
		respBodyStr := string(respBodyBytes)

		// Privacy checks: sensitive fields must not leak
		assert.NotContains(t, respBodyStr, "+628999888777")
		assert.NotContains(t, respBodyStr, "supardi.baru@tuwaktu.com")
		assert.NotContains(t, respBodyStr, "Jl. Depok Baru No. 1")

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.Unmarshal(respBodyBytes, &res)
		require.NoError(t, err)

		assert.True(t, res.Success)
		assert.Equal(t, "Profil pekerja berhasil diperbarui", res.Message)
		assert.Equal(t, "Supardi Ahli Taman", res.Data.Name)
		assert.Equal(t, "Spesialis desain taman dan bonsai", res.Data.Bio)
		assert.Equal(t, "Jakarta Selatan & Depok", res.Data.Zone)
		assert.Equal(t, "https://example.com/supardi-new.jpg", res.Data.AvatarURL)
		assert.Len(t, res.Data.Services, 1)
	})

	t.Run("200 OK - PUT /api/v1/workers/:id/profile alias works", func(t *testing.T) {
		payload := map[string]any{
			"name":       "Supardi Master Taman",
			"bio":        "Konsultan lanskap taman",
			"avatar_url": "https://example.com/supardi-v1.jpg",
			"zone":       "Jabodetabek",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/workers/"+worker.ID+"/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "Profil pekerja berhasil diperbarui", res.Message)
		assert.Equal(t, "Supardi Master Taman", res.Data.Name)
	})

	t.Run("400 Bad Request - missing worker name in payload", func(t *testing.T) {
		payload := map[string]any{
			"name": "   ",
			"bio":  "Bio tanpa nama",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/workers/"+worker.ID+"/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "nama pekerja wajib diisi", res.Message)
	})

	t.Run("404 Not Found - updating non-existent worker", func(t *testing.T) {
		payload := map[string]any{
			"name": "Orang Hilang",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/workers/non-existent-worker/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "Pekerja tidak ditemukan", res.Message)
	})

	t.Run("400 Bad Request - malformed JSON payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/workers/"+worker.ID+"/profile", bytes.NewReader([]byte(`{"name": invalid-json`)))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "Format data payload tidak valid", res.Message)
	})

	t.Run("400 Bad Request - empty or whitespace worker ID parameter", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/workers/%20/profile", bytes.NewReader([]byte(`{"name": "Valid Name"}`)))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "ID pekerja wajib diisi", res.Message)
	})
}

func TestWorkerHandler_UpdateWorkerRates(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:          "worker-rates-001",
		Slug:        "joko-kendil",
		Name:        "Joko Kendil",
		Bio:         "Teknisi Pompa Air Berpengalaman",
		Zone:        "Jakarta Barat",
		BasePrice:   60000,
		RateType:    "HOURLY",
		PhoneNumber: "+62811223344",
		Email:       "joko@tuwaktu.com",
		Address:     "Jl. Barat No. 5",
		IsActive:    true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-joko-1",
		WorkerID:        worker.ID,
		Name:            "Servis Pompa Air",
		Price:           120000,
		BasePrice:       120000,
		RateType:        "HOURLY",
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	t.Run("200 OK - PUT /api/v1/worker/rates updates rates successfully", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"base_price": 95000,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		respBytes, _ := io.ReadAll(resp.Body)
		assert.NotContains(t, string(respBytes), "+62811223344", "Sensitive phone must not leak")
		assert.NotContains(t, string(respBytes), "joko@tuwaktu.com", "Sensitive email must not leak")

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Pengaturan tarif pekerja berhasil diperbarui", res.Message)
		assert.Equal(t, 95000.0, res.Data.BasePrice)
		assert.Equal(t, "HOURLY", res.Data.RateType)
		assert.Equal(t, "Joko Kendil", res.Data.Name)
	})

	t.Run("200 OK - PUT /api/v1/worker/rates with rate_type UNIT", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  "joko-kendil", // by slug
			"base_price": 350000,
			"rate_type":  "UNIT",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 350000.0, res.Data.BasePrice)
		assert.Equal(t, "UNIT", res.Data.RateType)
	})

	t.Run("200 OK - alias PUT /api/worker/rates works", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"base_price": 110000,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 110000.0, res.Data.BasePrice)
	})

	t.Run("200 OK - alias PUT /api/v1/workers/:id/rates works with param ID", func(t *testing.T) {
		payload := map[string]any{
			"base_price": 125000,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/workers/"+worker.ID+"/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 125000.0, res.Data.BasePrice)
	})

	t.Run("400 Bad Request - base_price <= 0 returns Indonesian error", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"base_price": 0,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "Nominal tarif dasar harus lebih besar dari Rp 0", res.Message)
	})

	t.Run("400 Bad Request - invalid rate_type returns Indonesian error", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"base_price": 75000,
			"rate_type":  "DAILY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "Tipe tarif tidak valid")
	})

	t.Run("400 Bad Request - missing worker_id", func(t *testing.T) {
		payload := map[string]any{
			"base_price": 75000,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "ID pekerja wajib diisi", res.Message)
	})

	t.Run("404 Not Found - non-existent worker", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  "non-existent-worker-uuid",
			"base_price": 75000,
			"rate_type":  "HOURLY",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "Pekerja tidak ditemukan", res.Message)
	})

	t.Run("400 Bad Request - malformed JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader([]byte(`{"base_price":`)))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Equal(t, "Format data payload tidak valid", res.Message)
	})
}

func TestWorkerHandler_GetWorkerProfileRoutes(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:        "worker-prof-001",
		Slug:      "hendra-listrik",
		Name:      "Hendra Listrik",
		Bio:       "Spesialis Instalasi Listrik Rumah",
		Zone:      "Jakarta Pusat",
		BasePrice: 80000,
		RateType:  "HOURLY",
		IsActive:  true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-hendra-1",
		WorkerID:        worker.ID,
		Name:            "Instalasi Titik Lampu",
		Price:           80000,
		BasePrice:       80000,
		RateType:        "HOURLY",
		DurationMinutes: 45,
		IsActive:        true,
	}
	repo.SeedService(srv)

	t.Run("200 OK - GET /api/v1/worker/:slug/profile returns base_price and rate_type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/worker/hendra-listrik/profile", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)

		assert.True(t, res.Success)
		assert.Equal(t, "Data profil pekerja berhasil diambil", res.Message)
		assert.Equal(t, "hendra-listrik", res.Data.Slug)
		assert.Equal(t, 80000.0, res.Data.BasePrice)
		assert.Equal(t, "HOURLY", res.Data.RateType)
		assert.Len(t, res.Data.Services, 1)
		assert.Equal(t, 80000.0, res.Data.Services[0].BasePrice)
		assert.Equal(t, "HOURLY", res.Data.Services[0].RateType)
	})

	t.Run("200 OK - GET /api/public/workers/:slug returns base_price and rate_type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/hendra-listrik", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 80000.0, res.Data.BasePrice)
		assert.Equal(t, "HOURLY", res.Data.RateType)
	})

	t.Run("200 OK - GET /api/v1/workers/:slug returns base_price and rate_type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/workers/hendra-listrik", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 80000.0, res.Data.BasePrice)
	})

	t.Run("200 OK - PUT /api/v1/worker/rates works with id field in JSON body", func(t *testing.T) {
		payload := map[string]any{
			"id":         "hendra-listrik",
			"base_price": 99000,
			"rate_type":  "UNIT",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/rates", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 99000.0, res.Data.BasePrice)
		assert.Equal(t, "UNIT", res.Data.RateType)
	})
}

func TestWorkerHandler_UpdateWorkerLocationSettings(t *testing.T) {
	app, repo := setupTestApp()

	lat := -6.2921000
	lng := 106.7992000
	worker := &domain.Worker{
		ID:            "worker-loc-test-1",
		Slug:          "agus-ac",
		Name:          "Agus AC",
		Bio:           "Teknisi AC Cilandak",
		Zone:          "Jakarta Selatan",
		PhoneNumber:   "+628123456789",
		Email:         "agus.secret@tuwaktu.com",
		Address:       "Jl. Rahasia No. 10",
		Lat:           &lat,
		Lng:           &lng,
		MaxRadiusKM:   12.0,
		FreeRadiusKM:  3.0,
		ExtraFeePerKM: 5000,
		IsActive:      true,
	}
	repo.SeedWorker(worker)

	t.Run("200 OK - PUT /api/v1/worker/location-settings updates location and radius", func(t *testing.T) {
		newLat := -6.2088000
		newLng := 106.8456000
		payload := map[string]any{
			"worker_id":        worker.ID,
			"lat":              newLat,
			"lng":              newLng,
			"max_radius_km":    18.5,
			"free_radius_km":   4.0,
			"extra_fee_per_km": 5500,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		respBytes, _ := io.ReadAll(resp.Body)
		assert.NotContains(t, string(respBytes), "+628123456789")
		assert.NotContains(t, string(respBytes), "agus.secret@tuwaktu.com")

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		err = json.Unmarshal(respBytes, &res)
		require.NoError(t, err)
		assert.True(t, res.Success)
		assert.Equal(t, "Pengaturan lokasi pekerja berhasil diperbarui", res.Message)
		require.NotNil(t, res.Data.Lat)
		require.NotNil(t, res.Data.Lng)
		assert.InDelta(t, newLat, *res.Data.Lat, 0.0001)
		assert.InDelta(t, newLng, *res.Data.Lng, 0.0001)
		assert.Equal(t, 18.5, res.Data.MaxRadiusKM)
		assert.Equal(t, 4.0, res.Data.FreeRadiusKM)
		assert.Equal(t, 5500, res.Data.ExtraFeePerKM)
	})

	t.Run("200 OK - alias PUT /api/worker/location-settings works with Indonesian aliases", func(t *testing.T) {
		payload := map[string]any{
			"pekerja_id":         "agus-ac",
			"latitude":           -6.2500,
			"longitude":          106.8000,
			"jarak_maksimal_km":  20.0,
			"radius_gratis_km":   5.0,
			"tarif_per_km":       6000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, 20.0, res.Data.MaxRadiusKM)
		assert.Equal(t, 5.0, res.Data.FreeRadiusKM)
		assert.Equal(t, 6000, res.Data.ExtraFeePerKM)
	})

	t.Run("200 OK - alias PUT /api/v1/workers/:id/location-settings works with param ID", func(t *testing.T) {
		payload := map[string]any{
			"lat":              -6.2400,
			"lng":              106.8100,
			"max_radius_km":    15.0,
			"free_radius_km":   3.0,
			"extra_fee_per_km": 5000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/workers/"+worker.ID+"/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("400 Bad Request - missing worker_id", func(t *testing.T) {
		payload := map[string]any{
			"max_radius_km": 10.0,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("400 Bad Request - max_radius_km <= 0", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":     worker.ID,
			"max_radius_km": 0,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("400 Bad Request - free_radius_km exceeds max_radius_km", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":      worker.ID,
			"max_radius_km":  10.0,
			"free_radius_km": 15.0,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("400 Bad Request - unpaired coordinates (lat only)", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":     worker.ID,
			"lat":           -6.2000,
			"max_radius_km": 10.0,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("404 Not Found - non-existent worker", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":     "non-existent-worker-id",
			"max_radius_km": 10.0,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/location-settings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
}

func TestBookingHandler_CalculateFee(t *testing.T) {
	app, repo := setupTestApp()

	lat := -6.2921000
	lng := 106.7992000
	worker := &domain.Worker{
		ID:            "worker-calc-1",
		Slug:          "joko-teknisi",
		Name:          "Joko Teknisi",
		Zone:          "Jakarta Selatan",
		Lat:           &lat,
		Lng:           &lng,
		MaxRadiusKM:   15.0,
		FreeRadiusKM:  3.0,
		ExtraFeePerKM: 5000,
		IsActive:      true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-calc-1",
		WorkerID:        worker.ID,
		Name:            "Servis AC Berkala",
		Price:           100000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	t.Run("200 OK - POST /api/v1/booking/calculate-fee within free radius", func(t *testing.T) {
		// ~0.43 km <= 3.0 km
		payload := map[string]any{
			"worker_id":  worker.ID,
			"service_id": srv.ID,
			"client_lat": -6.2941000,
			"client_lng": 106.8025000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                          `json:"success"`
			Message string                        `json:"message"`
			Data    domain.FeeCalculationResponse `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&res)
		require.NoError(t, err)

		assert.True(t, res.Success)
		assert.Equal(t, "Kalkulasi biaya pemesanan berhasil dihitung", res.Message)
		assert.InDelta(t, 0.43, res.Data.DistanceKM, 0.05)
		assert.Equal(t, 100000.0, res.Data.ServicePrice)
		assert.Equal(t, 0.0, res.Data.TransportFee)
		assert.Equal(t, 100000.0, res.Data.TotalPrice)
		assert.True(t, res.Data.IsWithinRadius)
	})

	t.Run("200 OK - alias POST /api/booking/calculate-fee beyond free radius", func(t *testing.T) {
		// ~8.3 km distance from Monas to worker in Cilandak (~13 km)
		payload := map[string]any{
			"worker_slug": "joko-teknisi",
			"service_id":  srv.ID,
			"client_lat":  -6.1754000,
			"client_lng":  106.8272000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                          `json:"success"`
			Data    domain.FeeCalculationResponse `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.True(t, res.Data.TransportFee > 0)
		assert.Equal(t, 100000.0+res.Data.TransportFee, res.Data.TotalPrice)
	})

	t.Run("422 Unprocessable Entity - distance exceeds max_radius_km", func(t *testing.T) {
		// Bandung coordinates (~120 km > 15 km)
		payload := map[string]any{
			"worker_id":  worker.ID,
			"service_id": srv.ID,
			"client_lat": -6.9025000,
			"client_lng": 107.6186000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "Di luar jangkauan")
	})

	t.Run("422 Unprocessable Entity - worker has no location configured", func(t *testing.T) {
		noLocWorker := &domain.Worker{
			ID:       "worker-no-loc",
			Slug:     "tanpa-lokasi",
			Name:     "Tanpa Lokasi",
			Zone:     "Jakarta",
			IsActive: true,
		}
		noLocSrv := &domain.Service{
			ID:       "service-no-loc",
			WorkerID: noLocWorker.ID,
			Name:     "Servis Biasa",
			Price:    50000,
			IsActive: true,
		}
		repo.SeedWorker(noLocWorker)
		repo.SeedService(noLocSrv)

		payload := map[string]any{
			"worker_id":  noLocWorker.ID,
			"service_id": noLocSrv.ID,
			"client_lat": -6.2000,
			"client_lng": 106.8000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "belum mengatur titik koordinat")
	})

	t.Run("404 Not Found - service does not exist", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"service_id": "non-existent-service",
			"client_lat": -6.2000,
			"client_lng": 106.8000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("422 Unprocessable Entity - missing client coordinates in calculate fee", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":  worker.ID,
			"service_id": srv.ID,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/calculate-fee", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "Kesalahan validasi data kalkulasi biaya")
	})

	t.Run("422 Unprocessable Entity - CreateBooking beyond worker max radius", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":       worker.ID,
			"service_id":      srv.ID,
			"client_name":     "Client Bandung",
			"client_phone":    "08123456789",
			"location":        "Jl. Asia Afrika No. 10 Kota Bandung",
			"zone":            "Kota Bandung Jawa Barat",
			"tanggal_booking": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
			"client_lat":      -6.9025000,
			"client_lng":      107.6186000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "Di luar jangkauan")
	})

	t.Run("201 Created - CreateBooking within radius includes transport fee", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":       worker.ID,
			"service_id":      srv.ID,
			"client_name":     "Client Monas",
			"client_phone":    "08123456789",
			"location":        "Jl. Medan Merdeka No. 1 Jakarta Pusat",
			"zone":            "Jakarta Pusat",
			"tanggal_booking": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
			"client_lat":      -6.1754000,
			"client_lng":      106.8272000,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                        `json:"success"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.True(t, res.Data.TransportFee > 0)
		assert.Equal(t, 100000.0+res.Data.TransportFee, res.Data.TotalPrice)
	})
}

func TestWorkerHandler_SchedulesEndpoints(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:       "worker-sched-01",
		Slug:     "teguh-teknisi",
		Name:     "Teguh Teknisi",
		IsActive: true,
	}
	repo.SeedWorker(worker)

	// Seed initial schedule
	repo.SeedSchedule(&domain.WorkerSchedule{
		ID:            "sched-1",
		WorkerID:      worker.ID,
		DayOfWeek:     1, // Senin
		IsActive:      true,
		SlotMorning:   true,
		SlotAfternoon: true,
		SlotEvening:   false,
	})

	t.Run("200 OK - GET /api/v1/worker/schedules with worker_id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/worker/schedules?worker_id="+worker.ID, nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                    `json:"success"`
			Message string                  `json:"message"`
			Data    []domain.WorkerSchedule `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "Daftar jadwal kerja berhasil diambil", res.Message)
		assert.NotEmpty(t, res.Data)
	})

	t.Run("400 Bad Request - GET without worker identifier", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/worker/schedules", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "ID atau slug pekerja wajib diisi")
	})

	t.Run("200 OK - PUT /api/v1/worker/schedules updates weekly schedules", func(t *testing.T) {
		payload := domain.UpdateWorkerSchedulesRequest{
			WorkerID: worker.ID,
			Schedules: []domain.WorkerScheduleItem{
				{DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: true},
				{DayOfWeek: 2, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
			},
		}
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/schedules", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                    `json:"success"`
			Message string                  `json:"message"`
			Data    []domain.WorkerSchedule `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "Konfigurasi jadwal kerja berhasil disimpan", res.Message)
		assert.Len(t, res.Data, 2)
	})

	t.Run("200 OK - PUT /api/v1/worker/schedules with worker_slug in query param", func(t *testing.T) {
		payload := domain.UpdateWorkerSchedulesRequest{
			Schedules: []domain.WorkerScheduleItem{
				{DayOfWeek: 3, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
			},
		}
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/schedules?worker_slug="+worker.Slug, bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("400 Bad Request - PUT with invalid day_of_week", func(t *testing.T) {
		payload := domain.UpdateWorkerSchedulesRequest{
			WorkerID: worker.ID,
			Schedules: []domain.WorkerScheduleItem{
				{DayOfWeek: 7, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
			},
		}
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/schedules", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

func TestBookingHandler_GetAvailableSlots(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:       "worker-slots-01",
		Slug:     "agus-ac",
		Name:     "Agus AC",
		IsActive: true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "srv-agus-1",
		WorkerID:        worker.ID,
		Name:            "Servis AC Cepat",
		Price:           85000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	// Seed schedule for Monday (day_of_week = 1)
	repo.SeedSchedule(&domain.WorkerSchedule{
		ID:            "sched-mon",
		WorkerID:      worker.ID,
		DayOfWeek:     1, // Senin
		IsActive:      true,
		SlotMorning:   true,
		SlotAfternoon: true,
		SlotEvening:   true,
	})

	// Monday: 2026-11-09
	// Existing booking on Afternoon slot: 13:00 - 15:00 WIB
	wib := time.FixedZone("WIB", 7*3600)
	bookingStart := time.Date(2026, 11, 9, 13, 0, 0, 0, wib)
	bookingEnd := time.Date(2026, 11, 9, 15, 0, 0, 0, wib)

	repo.SeedBooking(&domain.Booking{
		ID:          "booking-exist-1",
		WorkerID:    worker.ID,
		Status:      "CONFIRMED",
		BookingDate: bookingStart,
		StartTime:   &bookingStart,
		EndTime:     &bookingEnd,
	})

	t.Run("200 OK - returns slot list and marks afternoon slot unavailable due to overlap", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/agus-ac/available-slots?date=2026-11-09", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Message string                       `json:"message"`
			Data    domain.AvailableSlotsResponse `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		require.True(t, res.Success)
		assert.Equal(t, "Daftar slot ketersediaan berhasil diambil", res.Message)
		assert.Equal(t, 1, res.Data.DayOfWeek)
		assert.True(t, res.Data.IsWorkingDay)
		assert.Len(t, res.Data.Slots, 3)

		// Morning slot (08:00 - 11:30): available because booking starts at 13:00 (gap > 60m)
		assert.Equal(t, domain.SlotMorning, res.Data.Slots[0].SlotType)
		assert.True(t, res.Data.Slots[0].Available)

		// Afternoon slot (13:00 - 16:30): NOT available because booking is 13:00 - 15:00
		assert.Equal(t, domain.SlotAfternoon, res.Data.Slots[1].SlotType)
		assert.False(t, res.Data.Slots[1].Available)
		assert.Contains(t, res.Data.Slots[1].Reason, "bentrok")

		// Evening slot (17:00 - 20:30): available because booking ends at 15:00, 15:00+60m = 16:00 < 17:00
		assert.Equal(t, domain.SlotEvening, res.Data.Slots[2].SlotType)
		assert.True(t, res.Data.Slots[2].Available)
	})

	t.Run("200 OK - alias routes work for available-slots", func(t *testing.T) {
		// Test /api/public/worker/:slug/available-slots
		req1 := httptest.NewRequest(http.MethodGet, "/api/public/worker/agus-ac/available-slots?date=2026-11-09", nil)
		resp1, err1 := app.Test(req1)
		require.NoError(t, err1)
		assert.Equal(t, http.StatusOK, resp1.StatusCode)

		// Test /api/worker/:slug/available-slots
		req2 := httptest.NewRequest(http.MethodGet, "/api/worker/agus-ac/available-slots?date=2026-11-09", nil)
		resp2, err2 := app.Test(req2)
		require.NoError(t, err2)
		assert.Equal(t, http.StatusOK, resp2.StatusCode)
	})

	t.Run("200 OK - with valid service_id query param", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/agus-ac/available-slots?date=2026-11-09&service_id="+srv.ID, nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("404 Not Found - with invalid service_id query param", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/agus-ac/available-slots?date=2026-11-09&service_id=non-existent-service", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("400 Bad Request - missing date param", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/agus-ac/available-slots", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("404 Not Found - unknown worker", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/workers/unknown-slug/available-slots?date=2026-11-09", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("409 Conflict - CreateBooking rejects colliding booking with 60 min transit buffer", func(t *testing.T) {
		// Existing booking is 13:00 - 15:00 on 2026-11-09.
		// Try to book at 15:30 (starts within 60m buffer of 15:00):
		collidingTime := time.Date(2026, 11, 9, 15, 30, 0, 0, wib).Format(time.RFC3339)
		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   srv.ID,
			"client_name":  "Budi Tabrakan",
			"client_phone": "08123456789",
			"location":     "Jl. Sudirman No. 10 Jakarta",
			"booking_date": collidingTime,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/bookings", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "Slot waktu tidak tersedia")
	})
}

func TestWorkerHandler_WhatsAppNumber_And_BookingCreate(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:             "worker-wa-101",
		Slug:           "hendra-teknik",
		Name:           "Hendra Teknik",
		Bio:            "Teknisi Berpengalaman",
		Zone:           "Jakarta Selatan",
		PhoneNumber:    "+6281299887766",
		WhatsAppNumber: "6281299887766",
		Email:          "hendra@tuwaktu.com",
		Address:        "Jl. Radio Dalam No. 1",
		IsActive:       true,
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "service-wa-101",
		WorkerID:        worker.ID,
		Name:            "Instalasi Pipa Air",
		Price:           200000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	t.Run("200 OK - PUT /api/v1/worker/profile updates whatsapp_number with sanitization", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":       worker.ID,
			"name":            "Hendra Teknik Updated",
			"whatsapp_number": "+62 813-1122-3344",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "Profil pekerja berhasil diperbarui", res.Message)
		assert.Equal(t, "6281311223344", res.Data.WhatsAppNumber)
		assert.Equal(t, "Hendra Teknik Updated", res.Data.Name)
	})

	t.Run("400 Bad Request - PUT /api/v1/worker/profile rejects whatsapp_number starting with 0", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":       worker.ID,
			"name":            "Hendra Teknik",
			"whatsapp_number": "081234567890",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "nomor WhatsApp wajib diawali kode negara")
	})

	t.Run("400 Bad Request - PUT /api/v1/worker/profile rejects too short whatsapp_number", func(t *testing.T) {
		payload := map[string]any{
			"worker_id":       worker.ID,
			"name":            "Hendra Teknik",
			"whatsapp_number": "62812",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/worker/profile", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.False(t, res.Success)
		assert.Contains(t, res.Message, "10 hingga 16 digit")
	})

	t.Run("201 Created - POST /api/v1/booking/create saves with PENDING_WA and returns complete response", func(t *testing.T) {
		futureTime := time.Now().Add(48 * time.Hour).Format(time.RFC3339)
		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   srv.ID,
			"client_name":  "Rina Sasmita",
			"client_phone": "+628177889900",
			"location":     "Jl. Dharmawangsa No. 10",
			"zone":         "Jakarta Selatan",
			"booking_date": futureTime,
			"notes":        "Pipa bocor di lantai 2",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/booking/create", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Message string                       `json:"message"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "Pesanan booking berhasil dibuat", res.Message)
		assert.NotEmpty(t, res.Data.BookingID)
		assert.NotEmpty(t, res.Data.BookingCode)
		assert.True(t, strings.HasPrefix(res.Data.BookingCode, "TW-"))
		assert.Equal(t, "PENDING_WA", res.Data.Status)
		assert.Equal(t, "Hendra Teknik Updated", res.Data.WorkerName)
		assert.Equal(t, "6281311223344", res.Data.WorkerWhatsApp)
		assert.Equal(t, "Instalasi Pipa Air", res.Data.ServiceName)
		assert.Equal(t, 200000.0, res.Data.TotalPrice)
		assert.Equal(t, "Rina Sasmita", res.Data.ClientName)
	})

	t.Run("201 Created - POST /api/booking/create alias works with PENDING_WA", func(t *testing.T) {
		futureTime := time.Now().Add(72 * time.Hour).Format(time.RFC3339)
		payload := map[string]any{
			"worker_id":    worker.ID,
			"service_id":   srv.ID,
			"client_name":  "Klien Alias",
			"client_phone": "08123456789",
			"location":     "Jl. Kebayoran Baru No. 15 Jakarta",
			"booking_date": futureTime,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/booking/create", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool                         `json:"success"`
			Message string                       `json:"message"`
			Data    domain.PublicBookingResponse `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "PENDING_WA", res.Data.Status)
		assert.NotEmpty(t, res.Data.BookingID)
	})

	t.Run("200 OK - GET /api/public/workers/:slug exposes whatsapp_number", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/hendra-teknik", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Data    domain.PublicWorkerProfile `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Success)
		assert.Equal(t, "6281311223344", res.Data.WhatsAppNumber)
	})
}

func TestWorkerHandler_WorkerBookingsEndpoints(t *testing.T) {
	app, repo := setupTestApp()

	worker := &domain.Worker{
		ID:             "worker-bk-test",
		Slug:           "worker-booking-tester",
		Name:           "Pak Joko Booking",
		Zone:           "Jakarta Timur",
		BasePrice:      80000,
		IsActive:       true,
		WhatsAppNumber: "6281234567899",
	}
	repo.SeedWorker(worker)

	srv := &domain.Service{
		ID:              "svc-bk-test",
		WorkerID:        worker.ID,
		Name:            "Servis AC Cepat",
		Price:           85000,
		DurationMinutes: 60,
		IsActive:        true,
	}
	repo.SeedService(srv)

	booking := &domain.Booking{
		ID:          "bkg-101",
		BookingCode: "BK-TEST101",
		WorkerID:    worker.ID,
		ServiceID:   srv.ID,
		ClientName:  "Ibu Ratna",
		ClientPhone: "081999888777",
		Location:    "Jl. Melati No. 2",
		Zone:        "Jakarta Timur",
		BookingDate: time.Now().Add(24 * time.Hour),
		TotalPrice:  85000,
		Status:      "PENDING_WA",
		CreatedAt:   time.Now().UTC(),
	}
	repo.SeedBooking(booking)

	t.Run("200 OK - GET /api/v1/worker/bookings returns worker bookings", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/worker/bookings?worker_id=worker-bk-test", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                       `json:"success"`
			Message string                     `json:"message"`
			Data    []domain.WorkerBookingItem `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Len(t, res.Data, 1)
		assert.Equal(t, "BK-TEST101", res.Data[0].BookingCode)
		assert.Equal(t, "Ibu Ratna", res.Data[0].ClientName)
		assert.Equal(t, "Servis AC Cepat", res.Data[0].ServiceName)
		assert.Equal(t, "PENDING_WA", res.Data[0].Status)
	})

	t.Run("200 OK - PATCH /api/v1/worker/bookings/:bookingId/status updates status to CONFIRMED", func(t *testing.T) {
		payload := map[string]string{
			"worker_id": "worker-bk-test",
			"status":    "CONFIRMED",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/worker/bookings/bkg-101/status", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                     `json:"success"`
			Message string                   `json:"message"`
			Data    domain.WorkerBookingItem `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Equal(t, "CONFIRMED", res.Data.Status)
	})

	t.Run("400 Bad Request - PATCH /api/v1/worker/bookings/:bookingId/status with invalid status", func(t *testing.T) {
		payload := map[string]string{
			"worker_id": "worker-bk-test",
			"status":    "UNKNOWN_STATUS",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/worker/bookings/bkg-101/status", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

func TestReviewHandler_Endpoints(t *testing.T) {
	app, repo := setupTestApp()
	ctx := context.Background()

	w := &domain.Worker{
		ID:        "worker-rev-test",
		Slug:      "hendra-teknisi",
		Name:      "Hendra Wijaya",
		Zone:      "Jakarta Selatan",
		IsActive:  true,
		Rating:    0,
		ReviewCount: 0,
	}
	repo.SeedWorker(w)

	srv := &domain.Service{
		ID:       "srv-rev-test",
		WorkerID: w.ID,
		Name:     "Bongkar Pasang AC",
		Price:    250000,
		IsActive: true,
	}
	repo.SeedService(srv)

	token := "token-review-abc-123"
	bkg := &domain.Booking{
		ID:          "bkg-rev-01",
		BookingCode: "BK-REV-TEST-01",
		WorkerID:    w.ID,
		ServiceID:   srv.ID,
		ClientName:  "Rian Ardianto",
		Status:      "COMPLETED",
		ReviewToken: token,
		BookingDate: time.Now().Add(-2 * time.Hour),
		TotalPrice:  250000,
	}
	require.NoError(t, repo.CreateBooking(ctx, bkg))

	t.Run("200 OK - GET /api/public/review-invitations/:bookingCode with valid token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/review-invitations/BK-REV-TEST-01?token="+token, nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool                          `json:"success"`
			Message string                        `json:"message"`
			Data    domain.ReviewInvitationDetail `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Equal(t, "BK-REV-TEST-01", res.Data.BookingCode)
		assert.Equal(t, "Hendra Wijaya", res.Data.WorkerName)
		assert.Equal(t, "Bongkar Pasang AC", res.Data.ServiceName)
	})

	t.Run("403 Forbidden - GET /api/public/review-invitations/:bookingCode with invalid token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/review-invitations/BK-REV-TEST-01?token=wrong-token", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("201 Created - POST /api/public/reviews submits valid review", func(t *testing.T) {
		payload := domain.SubmitReviewRequest{
			BookingCode: "BK-REV-TEST-01",
			Token:       token,
			Rating:      5,
			Comment:     "Pekerjaan sangat cepat, rapi, dan teknisinya sangat ramah!",
			IsAnonymous: true,
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/reviews", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res struct {
			Success bool          `json:"success"`
			Message string        `json:"message"`
			Data    domain.Review `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Equal(t, 5, res.Data.Rating)
	})

	t.Run("409 Conflict - POST /api/public/reviews rejected on second submission", func(t *testing.T) {
		payload := domain.SubmitReviewRequest{
			BookingCode: "BK-REV-TEST-01",
			Token:       token,
			Rating:      4,
			Comment:     "Ulasan kedua harus gagal",
		}
		bodyBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/public/reviews", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
	})

	t.Run("200 OK - GET /api/public/workers/:slug/reviews returns public reviews", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/workers/hendra-teknisi/reviews", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Reviews []domain.PublicReviewItem `json:"reviews"`
				Total   int64                     `json:"total"`
			} `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Equal(t, int64(1), res.Data.Total)
		assert.Equal(t, "Rian A.", res.Data.Reviews[0].ClientDisplayName)
	})

	t.Run("200 OK - GET /api/v1/worker/reviews returns worker dashboard reviews", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/worker/reviews?worker_id=worker-rev-test", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Reviews []domain.WorkerDashboardReviewItem `json:"reviews"`
				Total   int64                              `json:"total"`
			} `json:"data"`
		}
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&res))
		assert.True(t, res.Success)
		assert.Equal(t, int64(1), res.Data.Total)
		assert.Equal(t, "BK-REV-TEST-01", res.Data.Reviews[0].BookingCode)
	})
}



