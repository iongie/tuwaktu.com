package handler

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/config"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/service"
)

const (
	AuthCookieName       = "tuwaktu_token"
	LegacyAuthCookieName = "auth_token"
)

type AuthHandler struct {
	workerSvc service.WorkerService
	isProd    bool
}

func NewAuthHandler(workerSvc service.WorkerService, configs ...*config.Config) *AuthHandler {
	h := &AuthHandler{workerSvc: workerSvc}
	if len(configs) > 0 && configs[0] != nil {
		h.isProd = configs[0].IsProduction()
	} else if os.Getenv("APP_ENV") == "production" {
		h.isProd = true
	}
	return h
}

func (h *AuthHandler) isSecure(c *fiber.Ctx) bool {
	return h.isProd || c.Protocol() == "https" || c.Get("X-Forwarded-Proto") == "https"
}

// GetAltchaChallenge membuat tantangan kriptografi Proof-of-Work ALTCHA untuk verifikasi anti-bot
func (h *AuthHandler) GetAltchaChallenge(c *fiber.Ctx) error {
	challenge, err := auth.CreateAltchaChallenge(auth.DefaultMaxNumber, auth.DefaultAltchaTTL)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal membuat tantangan keamanan captcha", "ALTCHA_CHALLENGE_ERROR")
	}
	return SuccessResponse(c, fiber.StatusOK, "Tantangan keamanan captcha berhasil dibuat", challenge)
}

// Login menangani autentikasi pengguna (Admin & Mitra) dan menetapkan cookie HTTP-Only
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var payload domain.AuthLoginPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload login tidak valid", err.Error())
	}

	if err := auth.VerifyAltchaPayload(payload.AltchaPayload); err != nil {
		if errors.Is(err, auth.ErrAltchaRequired) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha wajib diselesaikan", "ALTCHA_REQUIRED")
		}
		return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha tidak valid atau telah kedaluwarsa", "ALTCHA_INVALID")
	}

	result, err := h.workerSvc.Authenticate(c.Context(), payload.Identifier, payload.Password)
	if err != nil {
		if errors.Is(err, domain.ErrAccountLocked) {
			return ErrorResponse(c, fiber.StatusTooManyRequests, err.Error(), "ACCOUNT_LOCKED")
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusUnauthorized, err.Error(), "INVALID_CREDENTIALS")
		}
		if errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusForbidden, err.Error(), "ACCOUNT_SUSPENDED")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal melakukan proses login: "+err.Error(), "INTERNAL_ERROR")
	}

	// Menetapkan HTTP-Only Cookie untuk sesi aman berbasis server
	c.Cookie(&fiber.Cookie{
		Name:     AuthCookieName,
		Value:    result.Token,
		Path:     "/",
		HTTPOnly: true,
		Secure:   h.isSecure(c),
		SameSite: fiber.CookieSameSiteLaxMode,
		MaxAge:   7 * 24 * 3600,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})

	return SuccessResponse(c, fiber.StatusOK, "Proses masuk berhasil", result)
}

// Register menangani pendaftaran mandiri mitra baru dan menetapkan cookie HTTP-Only
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var payload domain.AuthRegisterPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload pendaftaran tidak valid", err.Error())
	}

	if err := auth.VerifyAltchaPayload(payload.AltchaPayload); err != nil {
		if errors.Is(err, auth.ErrAltchaRequired) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha wajib diselesaikan", "ALTCHA_REQUIRED")
		}
		return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha tidak valid atau telah kedaluwarsa", "ALTCHA_INVALID")
	}

	result, err := h.workerSvc.RegisterWorker(c.Context(), &payload)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			errMsg := err.Error()
			errMsg = strings.TrimPrefix(errMsg, domain.ErrInvalidInput.Error()+": ")
			return ErrorResponse(c, fiber.StatusBadRequest, errMsg, "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal melakukan proses pendaftaran: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusCreated, "Pendaftaran berhasil diajukan. Silakan kirimkan tautan aktivasi WhatsApp ke Admin untuk mengaktifkan akun Anda.", result)
}

// ActivateWorker menangani aktivasi profil mitra melalui tautan sekali pakai yang dikirim via WhatsApp
// GET /api/admin/workers/activate dan /api/v1/admin/workers/activate
func (h *AuthHandler) ActivateWorker(c *fiber.Ctx) error {
	rawToken := strings.TrimSpace(c.Query("token"))
	c.Set("Content-Type", "text/html; charset=utf-8")

	if rawToken == "" {
		return c.Status(fiber.StatusBadRequest).SendString(renderActivationErrorPage("Tautan Aktivasi Tidak Lengkap", "Parameter token aktivasi tidak ditemukan pada tautan yang Anda buka."))
	}

	worker, err := h.workerSvc.ActivateWorkerByToken(c.Context(), rawToken)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).SendString(renderActivationErrorPage("Aktivasi Tidak Berhasil", err.Error()))
	}

	return c.Status(fiber.StatusOK).SendString(renderActivationSuccessPage(worker))
}

func renderActivationSuccessPage(worker *domain.Worker) string {
	workerName := "Mitra"
	workerZone := "-"
	workerSlug := ""
	if worker != nil {
		workerName = worker.Name
		workerZone = worker.Zone
		workerSlug = worker.Slug
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivasi Mitra Berhasil - Tuwaktu</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #FDFCFB;
      color: #141413;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid rgba(20, 20, 19, 0.08);
      border-radius: 20px;
      max-width: 480px;
      width: 100%%;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      background: #E8F5E9;
      color: #2E7D32;
      border-radius: 50%%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .icon-badge span { font-size: 36px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #1E4D3B; }
    p { font-size: 14px; color: #5C5855; line-height: 1.5; margin-bottom: 24px; }
    .info-box {
      background: #F6F4F0;
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #8A8580; font-weight: 500; }
    .info-val { font-weight: 700; color: #141413; }
    .btn {
      display: block;
      width: 100%%;
      padding: 14px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    .btn-primary { background: #C84B31; color: #FFFFFF; }
    .btn-primary:hover { background: #A83820; }
    .btn-secondary { background: #F0EDE7; color: #141413; }
    .btn-secondary:hover { background: #E4E0D8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">
      <span class="material-symbols-outlined">check_circle</span>
    </div>
    <h1>Akun Mitra Berhasil Diaktifkan!</h1>
    <p>Profil mitra telah terverifikasi secara resmi. Mitra kini dapat masuk ke konsol kerja mandiri dan menerima pesanan dari klien.</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Nama Mitra:</span>
        <span class="info-val">%s</span>
      </div>
      <div class="info-row">
        <span class="info-label">Area Operasional:</span>
        <span class="info-val">%s</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status Profil:</span>
        <span class="info-val" style="color: #2E7D32;">AKTIF</span>
      </div>
    </div>
    <a href="/admin/workers" class="btn btn-primary">Buka Panel Kelola Mitra</a>
    <a href="/%s" target="_blank" class="btn btn-secondary">Lihat Halaman Publik Mitra</a>
  </div>
</body>
</html>`, workerName, workerZone, workerSlug)
}

func renderActivationErrorPage(title string, message string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivasi Gagal - Tuwaktu</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #FDFCFB;
      color: #141413;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid rgba(20, 20, 19, 0.08);
      border-radius: 20px;
      max-width: 480px;
      width: 100%%;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .icon-badge {
      width: 64px;
      height: 64px;
      background: #FFEBEE;
      color: #C62828;
      border-radius: 50%%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .icon-badge span { font-size: 36px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #B71C1C; }
    p { font-size: 14px; color: #5C5855; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: block;
      width: 100%%;
      padding: 14px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      background: #F0EDE7;
      color: #141413;
    }
    .btn:hover { background: #E4E0D8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">
      <span class="material-symbols-outlined">error</span>
    </div>
    <h1>%s</h1>
    <p>%s</p>
    <a href="/admin/workers" class="btn">Kembali ke Panel Admin</a>
  </div>
</body>
</html>`, title, message)
}

// Logout menghapus cookie sesi otentikasi
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     AuthCookieName,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   h.isSecure(c),
		SameSite: fiber.CookieSameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Now().Add(-1 * time.Hour),
	})
	c.Cookie(&fiber.Cookie{
		Name:     LegacyAuthCookieName,
		Value:    "",
		Path:     "/",
		HTTPOnly: true,
		Secure:   h.isSecure(c),
		SameSite: fiber.CookieSameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Now().Add(-1 * time.Hour),
	})

	return SuccessResponse(c, fiber.StatusOK, "Sesi otentikasi berhasil ditutup", nil)
}

// Me mengembalikan informasi sesi akun yang sedang aktif
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	accountID, _ := c.Locals("accountID").(string)
	if accountID == "" {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Otentikasi diperlukan: silakan masuk terlebih dahulu", "UNAUTHORIZED")
	}

	if h.workerSvc != nil {
		session, err := h.workerSvc.GetSessionProfile(c.Context(), accountID)
		if err != nil {
			if errors.Is(err, domain.ErrWorkerInactive) {
				return ErrorResponse(c, fiber.StatusForbidden, err.Error(), "ACCOUNT_SUSPENDED")
			}
			if errors.Is(err, domain.ErrWorkerNotFound) {
				return ErrorResponse(c, fiber.StatusUnauthorized, "Akun pengguna tidak ditemukan", "ACCOUNT_NOT_FOUND")
			}
			return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil data profil sesi: "+err.Error(), "INTERNAL_ERROR")
		}
		return SuccessResponse(c, fiber.StatusOK, "Sesi otentikasi aktif berhasil diambil", session)
	}

	workerID, _ := c.Locals("workerID").(string)
	role, _ := c.Locals("role").(string)
	accountStatus, _ := c.Locals("accountStatus").(string)
	email, _ := c.Locals("email").(string)

	var workerIDPtr *string
	if workerID != "" {
		workerIDPtr = &workerID
	}

	session := domain.AuthUserSession{
		ID:            accountID,
		WorkerID:      workerIDPtr,
		Email:         email,
		Role:          role,
		AccountStatus: accountStatus,
	}

	return SuccessResponse(c, fiber.StatusOK, "Sesi otentikasi aktif berhasil diambil", session)
}

