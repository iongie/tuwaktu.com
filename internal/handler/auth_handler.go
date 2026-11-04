package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type AuthHandler struct {
	workerSvc service.WorkerService
}

func NewAuthHandler(workerSvc service.WorkerService) *AuthHandler {
	return &AuthHandler{workerSvc: workerSvc}
}

// Login menangani autentikasi pengguna (Admin & Mitra)
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var payload domain.AuthLoginPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload login tidak valid", err.Error())
	}

	result, err := h.workerSvc.Authenticate(c.Context(), payload.Identifier, payload.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusUnauthorized, err.Error(), "INVALID_CREDENTIALS")
		}
		if errors.Is(err, domain.ErrWorkerInactive) {
			return ErrorResponse(c, fiber.StatusForbidden, err.Error(), "ACCOUNT_SUSPENDED")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal melakukan proses login: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Proses masuk berhasil", result)
}

// Me mengembalikan informasi sesi akun yang sedang aktif
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	accountID, _ := c.Locals("accountID").(string)
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

