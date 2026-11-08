package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupCategoryTestApp() (*fiber.App, *repository.MemoryCategoryRepository) {
	app := fiber.New()
	workerRepo := repository.NewMemoryRepository()
	catRepo := repository.NewMemoryCategoryRepository()

	workerSvc := service.NewWorkerService(workerRepo)
	bookingSvc := service.NewBookingService(workerRepo)
	catSvc := service.NewCategoryService(catRepo)

	workerHandler := handler.NewWorkerHandler(workerSvc)
	bookingHandler := handler.NewBookingHandler(bookingSvc)
	adminHandler := handler.NewAdminHandler(workerSvc)
	authHandler := handler.NewAuthHandler(workerSvc)
	authMiddleware := handler.NewAuthMiddleware()
	catHandler := handler.NewCategoryHandler(catSvc)

	handler.RegisterRoutes(app, workerHandler, bookingHandler, adminHandler, authHandler, authMiddleware, catHandler, nil)

	return app, catRepo
}

func TestCategoryHandler_PublicRoutes(t *testing.T) {
	app, _ := setupCategoryTestApp()

	t.Run("GET /api/v1/public/categories mengembalikan 200 dan daftar kategori", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/public/categories", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var body map[string]any
		err = json.NewDecoder(resp.Body).Decode(&body)
		require.NoError(t, err)
		assert.True(t, body["success"].(bool))
		assert.Equal(t, "Daftar kategori keahlian teknisi berhasil diambil", body["message"])

		data := body["data"].([]any)
		assert.NotEmpty(t, data)
	})

	t.Run("GET /api/public/categories kompatibel backward", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/public/categories", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestCategoryHandler_AdminRBAC(t *testing.T) {
	app, _ := setupCategoryTestApp()

	t.Run("akses tanpa token menghasilkan 401 Unauthorized", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("akses dengan role WORKER menghasilkan 403 Forbidden", func(t *testing.T) {
		token, err := auth.GenerateToken("acc-worker", "w-1", "worker@tuwaktu.com", domain.RoleWorker, domain.AccountStatusActive, time.Hour)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("akses dengan role ADMIN berhasil 200 OK", func(t *testing.T) {
		token, err := auth.GenerateToken("acc-admin", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestCategoryHandler_AdminCRUD(t *testing.T) {
	app, _ := setupCategoryTestApp()

	adminToken, err := auth.GenerateToken("acc-admin", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
	require.NoError(t, err)

	var createdCategoryID string

	t.Run("POST /api/v1/admin/categories berhasil membuat kategori baru", func(t *testing.T) {
		price := 85000.0
		payload := domain.CreateCategoryPayload{
			Name:          "Perbaikan Saluran Air",
			Description:   "Pembersihan pipa mampet, deteksi kebocoran pipa, dan instalasi kran air.",
			Icon:          "plumbing",
			StartingPrice: &price,
			PriceUnit:     "titik",
		}
		bodyBytes, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var resBody map[string]any
		json.NewDecoder(resp.Body).Decode(&resBody)
		assert.True(t, resBody["success"].(bool))
		assert.Equal(t, "Kategori baru berhasil ditambahkan", resBody["message"])

		data := resBody["data"].(map[string]any)
		createdCategoryID = data["id"].(string)
		assert.NotEmpty(t, createdCategoryID)
		assert.Equal(t, "Perbaikan Saluran Air", data["name"])
		assert.Equal(t, "perbaikan-saluran-air", data["slug"])
	})

	t.Run("POST kategori duplikat menghasilkan 409 Conflict", func(t *testing.T) {
		payload := domain.CreateCategoryPayload{
			Name: "Servis AC Duplikat",
			Slug: "ac-pendingin",
		}
		bodyBytes, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
	})

	t.Run("POST nama kosong menghasilkan 400 Bad Request", func(t *testing.T) {
		payload := domain.CreateCategoryPayload{
			Name: "",
		}
		bodyBytes, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("GET /api/v1/admin/categories/:id detail kategori", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories/"+createdCategoryID, nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var resBody map[string]any
		json.NewDecoder(resp.Body).Decode(&resBody)
		assert.True(t, resBody["success"].(bool))
		assert.Equal(t, "Detail kategori berhasil dimuat", resBody["message"])
	})

	t.Run("GET kategori tidak ditemukan menghasilkan 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories/invalid-id-99", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	t.Run("PUT /api/v1/admin/categories/:id memperbarui kategori", func(t *testing.T) {
		newName := "Plumbing & Saluran Air Modern"
		newPrice := 95000.0
		payload := domain.UpdateCategoryPayload{
			Name:          &newName,
			StartingPrice: &newPrice,
		}
		bodyBytes, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/categories/"+createdCategoryID, bytes.NewReader(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var resBody map[string]any
		json.NewDecoder(resp.Body).Decode(&resBody)
		assert.True(t, resBody["success"].(bool))
		assert.Equal(t, "Kategori berhasil diperbarui", resBody["message"])

		data := resBody["data"].(map[string]any)
		assert.Equal(t, "Plumbing & Saluran Air Modern", data["name"])
		assert.Equal(t, 95000.0, data["starting_price"])
	})

	t.Run("DELETE /api/v1/admin/categories/:id menghapus kategori", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/admin/categories/"+createdCategoryID, nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var resBody map[string]any
		json.NewDecoder(resp.Body).Decode(&resBody)
		assert.True(t, resBody["success"].(bool))
		assert.Equal(t, "Kategori berhasil dihapus", resBody["message"])

		// Verifikasi sudah terhapus
		reqGet := httptest.NewRequest(http.MethodGet, "/api/v1/admin/categories/"+createdCategoryID, nil)
		reqGet.Header.Set("Authorization", "Bearer "+adminToken)
		respGet, err := app.Test(reqGet)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, respGet.StatusCode)
	})
}
