package handler_test

import (
	"bytes"
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

	workerHandler := handler.NewWorkerHandler(workerSvc)
	bookingHandler := handler.NewBookingHandler(bookingSvc)

	handler.RegisterRoutes(app, workerHandler, bookingHandler)

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

	t.Run("201 Created - minimal payload (nama klien, lokasi/zona, pilihan layanan)", func(t *testing.T) {
		payload := map[string]any{
			"client_name": "Pak Joko",
			"location":    "Jakarta Selatan",
			"service_id":  srv.ID,
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
			"lokasi":          "Kebayoran Baru",
			"pilihan_layanan": srv.ID,
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
			"lokasi":          "Kebayoran Lama",
			"pilihan_layanan": "Daily Cleaning",
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
			"location":     "Lokasi",
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
			"location":     "Lokasi",
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

