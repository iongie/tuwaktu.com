package handler_test

import (
	"bytes"
	"encoding/json"
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

func setupFullAuthTestApp(repo repository.WorkerRepository) (*fiber.App, string) {
	app := fiber.New()
	workerSvc := service.NewWorkerService(repo)
	authHandler := handler.NewAuthHandler(workerSvc)
	authMiddleware := handler.NewAuthMiddleware()
	adminHandler := handler.NewAdminHandler(workerSvc)

	handler.RegisterRoutes(app, nil, nil, adminHandler, authHandler, authMiddleware, nil, nil, nil)

	adminToken, _ := auth.GenerateToken("admin-acc-1", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
	return app, adminToken
}

func TestAuthHandler_CredentialResetFlow(t *testing.T) {
	newAltcha := func(t *testing.T) string {
		t.Helper()
		p, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)
		return p
	}

	setupWorker := func(t *testing.T) (repository.WorkerRepository, *fiber.App, string, *domain.Worker, *domain.WorkerAccount) {
		repo := repository.NewMemoryRepository()
		app, adminToken := setupFullAuthTestApp(repo)

		workerID := "worker-test-reset-1"
		worker := &domain.Worker{
			ID:             workerID,
			Slug:           "ahmad-teknisi",
			Name:           "Ahmad Teknisi",
			PhoneNumber:    "6281234567890",
			WhatsAppNumber: "6281234567890",
			IsActive:       true,
		}
		repo.SeedWorker(worker)

		initialHash, err := auth.HashPassword("123987")
		require.NoError(t, err)

		account := &domain.WorkerAccount{
			ID:           "acc-test-reset-1",
			WorkerID:     &workerID,
			PhoneNumber:  "6281234567890",
			PasswordHash: initialHash,
			Role:         domain.RoleWorker,
		}
		repo.SeedAccount(account)

		return repo, app, adminToken, worker, account
	}

	t.Run("alur lengkap pengajuan -> verifikasi admin -> persetujuan admin -> eksekusi reset PIN baru via HTTP", func(t *testing.T) {
		_, app, adminToken, worker, _ := setupWorker(t)

		// 1. Pengajuan reset PIN
		reqPayload := map[string]interface{}{
			"phone_number":    worker.WhatsAppNumber,
			"request_type":    "RESET_PIN",
			"altcha_payload":  newAltcha(t),
		}
		reqBytes, _ := json.Marshal(reqPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/credential-reset-request", bytes.NewReader(reqBytes))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var reqRes struct {
			Success bool                                  `json:"success"`
			Message string                                `json:"message"`
			Data    domain.CredentialResetRequestResponse `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&reqRes)
		require.NoError(t, err)
		assert.True(t, reqRes.Success)
		assert.Contains(t, reqRes.Message, "Permohonan reset kredensial berhasil dibuat")

		// Ekstrak token Tier-1
		tokenIdx := strings.Index(reqRes.Data.WhatsAppMessage, "token=")
		require.True(t, tokenIdx != -1)
		rawTier1Token := reqRes.Data.WhatsAppMessage[tokenIdx+len("token="):]
		endIdx := strings.IndexAny(rawTier1Token, " \n\r\t")
		if endIdx != -1 {
			rawTier1Token = rawTier1Token[:endIdx]
		}

		// 2. Verifikasi oleh admin via GET /api/v1/admin/credential-reset/verify
		verifyReq := httptest.NewRequest(http.MethodGet, "/api/v1/admin/credential-reset/verify?token="+rawTier1Token, nil)
		verifyReq.Header.Set("Authorization", "Bearer "+adminToken)
		verifyResp, err := app.Test(verifyReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, verifyResp.StatusCode)

		var verifyRes struct {
			Success bool                          `json:"success"`
			Data    domain.AdminResetApprovalView `json:"data"`
		}
		err = json.NewDecoder(verifyResp.Body).Decode(&verifyRes)
		require.NoError(t, err)
		assert.True(t, verifyRes.Success)
		assert.Equal(t, worker.Name, verifyRes.Data.WorkerName)

		// 3. Persetujuan oleh admin via POST /api/v1/admin/credential-reset/approve
		approvePayload := map[string]interface{}{
			"request_token": rawTier1Token,
		}
		approveBytes, _ := json.Marshal(approvePayload)
		approveReq := httptest.NewRequest(http.MethodPost, "/api/v1/admin/credential-reset/approve", bytes.NewReader(approveBytes))
		approveReq.Header.Set("Content-Type", "application/json")
		approveReq.Header.Set("Authorization", "Bearer "+adminToken)
		approveResp, err := app.Test(approveReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, approveResp.StatusCode)

		var approveRes struct {
			Success bool                             `json:"success"`
			Data    domain.AdminApproveResetResponse `json:"data"`
		}
		err = json.NewDecoder(approveResp.Body).Decode(&approveRes)
		require.NoError(t, err)
		assert.True(t, approveRes.Success)

		// Ekstrak token Tier-2
		execIdx := strings.Index(approveRes.Data.ExecutionURL, "token=")
		require.True(t, execIdx != -1)
		rawTier2Token := approveRes.Data.ExecutionURL[execIdx+len("token="):]

		// 4. Eksekusi reset PIN baru via POST /api/v1/auth/credential-reset/execute
		newPIN := "852963"
		execPayload := map[string]interface{}{
			"execution_token": rawTier2Token,
			"phone_number":    worker.WhatsAppNumber,
			"new_pin":         newPIN,
			"altcha_payload":  newAltcha(t),
		}
		execBytes, _ := json.Marshal(execPayload)
		execReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/credential-reset/execute", bytes.NewReader(execBytes))
		execReq.Header.Set("Content-Type", "application/json")
		execResp, err := app.Test(execReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, execResp.StatusCode)

		// 5. Coba login dengan PIN baru
		loginPayload := map[string]interface{}{
			"identifier":     worker.WhatsAppNumber,
			"password":       newPIN,
			"altcha_payload": newAltcha(t),
		}
		loginBytes, _ := json.Marshal(loginPayload)
		loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBytes))
		loginReq.Header.Set("Content-Type", "application/json")
		loginResp, err := app.Test(loginReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, loginResp.StatusCode)
	})

	t.Run("gagal eksekusi jika captcha Altcha tidak disertakan", func(t *testing.T) {
		_, app, _, worker, _ := setupWorker(t)

		execPayload := map[string]interface{}{
			"execution_token": "some-token",
			"phone_number":    worker.WhatsAppNumber,
			"new_pin":         "852963",
		}
		execBytes, _ := json.Marshal(execPayload)
		execReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/credential-reset/execute", bytes.NewReader(execBytes))
		execReq.Header.Set("Content-Type", "application/json")
		execResp, err := app.Test(execReq)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, execResp.StatusCode)
	})
}
