package handler

import (
	"errors"
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

	return SuccessResponse(c, fiber.StatusCreated, "Pendaftaran mitra berhasil", result)
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

