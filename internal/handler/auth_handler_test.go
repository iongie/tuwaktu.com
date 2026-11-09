package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupAuthTestApp(repo repository.WorkerRepository) *fiber.App {
	app := fiber.New()
	workerSvc := service.NewWorkerService(repo)
	authHandler := handler.NewAuthHandler(workerSvc)
	authMiddleware := handler.NewAuthMiddleware()

	handler.RegisterRoutes(app, nil, nil, nil, authHandler, authMiddleware, nil, nil, nil)
	return app
}

func TestAuthHandler_AltchaChallenge(t *testing.T) {
	t.Run("GET /api/v1/auth/altcha-challenge mengembalikan tantangan ALTCHA yang valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/altcha-challenge", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var resBody struct {
			Success bool                 `json:"success"`
			Message string               `json:"message"`
			Data    auth.AltchaChallenge `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.True(t, resBody.Success)
		assert.Equal(t, "Tantangan keamanan captcha berhasil dibuat", resBody.Message)
		assert.Equal(t, "SHA-256", resBody.Data.Algorithm)
		assert.NotEmpty(t, resBody.Data.Challenge)
		assert.NotEmpty(t, resBody.Data.Salt)
		assert.NotEmpty(t, resBody.Data.Signature)
		assert.Greater(t, resBody.Data.MaxNumber, int64(0))
	})
}

func TestAuthHandler_Login_AltchaValidation(t *testing.T) {
	t.Run("gagal dengan 400 jika altcha_payload kosong saat login", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"identifier": "6281299887766",
			"password":   "654321",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Equal(t, "Verifikasi keamanan captcha wajib diselesaikan", resBody.Message)
		assert.Equal(t, "ALTCHA_REQUIRED", resBody.Error)
	})

	t.Run("gagal dengan 400 jika altcha_payload tidak sah saat login", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"identifier":     "6281299887766",
			"password":       "654321",
			"altcha_payload": "invalid-payload-token",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Equal(t, "Verifikasi keamanan captcha tidak valid atau telah kedaluwarsa", resBody.Message)
		assert.Equal(t, "ALTCHA_INVALID", resBody.Error)
	})
}

func TestAuthHandler_Register(t *testing.T) {
	newAltcha := func(t *testing.T) string {
		t.Helper()
		p, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)
		return p
	}

	t.Run("berhasil mendaftar via POST /api/v1/auth/register dan mengembalikan link aktivasi whatsapp", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":       "Rian Hendrawan",
			"specialtyId":    "ac-electric",
			"specialtyLabel": "Teknisi AC & Kelistrikan",
			"waNumber":       "6281299887766",
			"basecamp":       "Jakarta Selatan",
			"customSlug":     "rian-ac-jakarta",
			"pin":            "482915",
			"altcha_payload": newAltcha(t),
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

		var resBody struct {
			Success bool                        `json:"success"`
			Message string                      `json:"message"`
			Data    domain.AuthRegisterResponse `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)

		assert.True(t, resBody.Success)
		assert.Contains(t, resBody.Message, "Pendaftaran berhasil diajukan")
		assert.NotEmpty(t, resBody.Data.WorkerID)
		assert.Equal(t, "Rian Hendrawan", resBody.Data.Name)
		assert.Equal(t, "rian-ac-jakarta", resBody.Data.Slug)
		assert.Equal(t, "6281299887766", resBody.Data.WhatsAppNumber)
		assert.NotEmpty(t, resBody.Data.AdminWhatsAppNumber)
		assert.NotEmpty(t, resBody.Data.ActivationURL)
		assert.NotEmpty(t, resBody.Data.WhatsAppShareURL)
		assert.Equal(t, 15, resBody.Data.ExpiresInMinutes)

		// Verifikasi cookie sesi TIDAK di-set saat pendaftaran (akun pending verifikasi)
		cookies := resp.Cookies()
		for _, c := range cookies {
			assert.NotEqual(t, handler.AuthCookieName, c.Name)
		}
	})

	t.Run("gagal dengan 400 jika PIN termasuk blacklist PIN lemah (123456, 000000, 111111)", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		for _, weakPIN := range []string{"123456", "000000", "111111", "654321"} {
			payload := map[string]interface{}{
				"fullName":       "Rian Hendrawan",
				"waNumber":       "6281299887766",
				"basecamp":       "Jakarta Selatan",
				"customSlug":     "rian-ac-jakarta",
				"pin":            weakPIN,
				"altcha_payload": newAltcha(t),
			}
			body, _ := json.Marshal(payload)

			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			require.NoError(t, err)
			assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

			var resBody struct {
				Success bool   `json:"success"`
				Message string `json:"message"`
				Error   string `json:"error"`
			}
			err = json.NewDecoder(resp.Body).Decode(&resBody)
			require.NoError(t, err)
			assert.False(t, resBody.Success)
			assert.Contains(t, resBody.Message, "PIN terlalu lemah")
		}
	})

	t.Run("gagal dengan 400 jika altcha_payload kosong saat registrasi", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":   "Rian Hendrawan",
			"waNumber":   "6281299887766",
			"basecamp":   "Jakarta Selatan",
			"customSlug": "rian-ac-jakarta",
			"pin":        "654321",
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Equal(t, "Verifikasi keamanan captcha wajib diselesaikan", resBody.Message)
		assert.Equal(t, "ALTCHA_REQUIRED", resBody.Error)
	})

	t.Run("gagal dengan 400 jika format payload tidak valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader([]byte("{invalid-json")))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("gagal dengan 400 jika validasi service gagal", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":       "",
			"waNumber":       "6281299887766",
			"altcha_payload": newAltcha(t),
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
			Error   string `json:"error"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Contains(t, resBody.Message, "nama lengkap mitra wajib diisi")
	})

	t.Run("gagal dengan 400 jika nomor WhatsApp sudah terdaftar", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedAccount(&domain.WorkerAccount{
			ID:          "acc-existing",
			Email:       "existing@tuwaktu.com",
			PhoneNumber: "6281299887766",
			Role:        domain.RoleWorker,
		})
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":       "Rian Hendrawan",
			"waNumber":       "6281299887766",
			"basecamp":       "Jakarta Selatan",
			"customSlug":     "rian-baru",
			"pin":            "482915",
			"altcha_payload": newAltcha(t),
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Equal(t, "Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.", resBody.Message)
	})

	t.Run("gagal dengan 400 jika slug profil bentrok", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "w-existing",
			Slug:     "rian-ac",
			Name:     "Rian Lama",
			IsActive: true,
		})
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":       "Rian Baru",
			"waNumber":       "6289999888877",
			"basecamp":       "Jakarta Selatan",
			"customSlug":     "rian-ac",
			"pin":            "482915",
			"altcha_payload": newAltcha(t),
		}
		body, _ := json.Marshal(payload)

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var resBody struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}
		err = json.NewDecoder(resp.Body).Decode(&resBody)
		require.NoError(t, err)
		assert.False(t, resBody.Success)
		assert.Equal(t, "Slug profil sudah digunakan. Silakan pilih slug lain.", resBody.Message)
	})
}

func TestAuthHandler_Login_RateLimitAndLockout(t *testing.T) {
	newAltcha := func(t *testing.T) string {
		t.Helper()
		p, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)
		return p
	}

	t.Run("mengembalikan 429 ACCOUNT_LOCKED setelah 5 kali percobaan login gagal", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedAccount(&domain.WorkerAccount{
			ID:                 "99999999-9999-4999-8999-999999999999",
			Email:              "admin@tuwaktu.com",
			PhoneNumber:        "6281200000000",
			PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$uiYTw8zX3xJl1cpIqo//XA$LnCOOfHd56X6q9B+PSCdEy38A8oH8a1/fvdvETKrhKM",
			Role:               domain.RoleAdmin,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		})
		app := setupAuthTestApp(repo)

		for attempt := 1; attempt <= 5; attempt++ {
			payload := map[string]interface{}{
				"identifier":     "admin@tuwaktu.com",
				"password":       "000000",
				"altcha_payload": newAltcha(t),
			}
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			require.NoError(t, err)

			if attempt < 5 {
				assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
			} else {
				assert.Equal(t, fiber.StatusTooManyRequests, resp.StatusCode)
				var resBody struct {
					Success bool   `json:"success"`
					Message string `json:"message"`
					Error   string `json:"error"`
				}
				require.NoError(t, json.NewDecoder(resp.Body).Decode(&resBody))
				assert.False(t, resBody.Success)
				assert.Equal(t, "ACCOUNT_LOCKED", resBody.Error)
				assert.Contains(t, resBody.Message, "terkunci sementara")
			}
		}
	})
}

func TestAuthHandler_ActivateWorker(t *testing.T) {
	newAltcha := func(t *testing.T) string {
		t.Helper()
		p, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)
		return p
	}

	t.Run("berhasil mengaktifkan worker via GET /api/v1/admin/workers/activate dengan token valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		payload := map[string]interface{}{
			"fullName":       "Agus Teknisi",
			"specialtyId":    "ac-electric",
			"specialtyLabel": "Teknisi AC",
			"waNumber":       "6281233445566",
			"basecamp":       "Jakarta Barat",
			"customSlug":     "agus-teknisi",
			"pin":            "482915",
			"altcha_payload": newAltcha(t),
		}
		body, _ := json.Marshal(payload)
		regReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		regReq.Header.Set("Content-Type", "application/json")
		regResp, err := app.Test(regReq)
		require.NoError(t, err)
		require.Equal(t, fiber.StatusCreated, regResp.StatusCode)

		var regResult struct {
			Data domain.AuthRegisterResponse `json:"data"`
		}
		require.NoError(t, json.NewDecoder(regResp.Body).Decode(&regResult))
		token := strings.Split(regResult.Data.ActivationURL, "token=")[1]

		// Eksekusi GET aktivasi
		actReq := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers/activate?token="+token, nil)
		actResp, err := app.Test(actReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, actResp.StatusCode)
		assert.Contains(t, actResp.Header.Get("Content-Type"), "text/html")

		var buf bytes.Buffer
		_, _ = buf.ReadFrom(actResp.Body)
		assert.Contains(t, buf.String(), "Aktivasi Mitra Berhasil")
		assert.Contains(t, buf.String(), "Agus Teknisi")

		// Klik kedua kali harus mengembalikan halaman status gagal / sudah digunakan
		actReq2 := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers/activate?token="+token, nil)
		actResp2, err := app.Test(actReq2)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, actResp2.StatusCode)

		var buf2 bytes.Buffer
		_, _ = buf2.ReadFrom(actResp2.Body)
		assert.Contains(t, buf2.String(), "sudah pernah digunakan sebelumnya")
	})

	t.Run("gagal dengan 400 jika token kosong", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		app := setupAuthTestApp(repo)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers/activate?token=", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		var buf bytes.Buffer
		_, _ = buf.ReadFrom(resp.Body)
		assert.Contains(t, buf.String(), "Tautan Aktivasi Tidak Lengkap")
	})
}
