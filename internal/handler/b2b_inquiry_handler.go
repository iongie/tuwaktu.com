package handler

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/service"
)

type B2BInquiryHandler struct {
	svc service.B2BInquiryService
}

func NewB2BInquiryHandler(svc service.B2BInquiryService) *B2BInquiryHandler {
	return &B2BInquiryHandler{svc: svc}
}

// CreatePublicInquiry menangani pengajuan Paket Klien Bisnis dari halaman publik /bisnis
func (h *B2BInquiryHandler) CreatePublicInquiry(c *fiber.Ctx) error {
	var payload domain.CreateB2BInquiryPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data pengajuan klien bisnis tidak valid", err.Error())
	}

	if err := auth.VerifyAltchaPayload(payload.AltchaPayload); err != nil {
		if errors.Is(err, auth.ErrAltchaRequired) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha wajib diselesaikan", "ALTCHA_REQUIRED")
		}
		return ErrorResponse(c, fiber.StatusBadRequest, "Verifikasi keamanan captcha tidak valid atau telah kedaluwarsa", "ALTCHA_INVALID")
	}

	res, err := h.svc.CreatePublicInquiry(c.Context(), &payload)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menyimpan pengajuan klien bisnis: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusCreated, "Pengajuan paket klien bisnis berhasil dikirim", res)
}

// ListAdminInquiries mengambil seluruh pengajuan klien bisnis beserta ringkasan statistik untuk Admin
func (h *B2BInquiryHandler) ListAdminInquiries(c *fiber.Ctx) error {
	filter := domain.B2BInquiryFilter{
		Status:        strings.TrimSpace(c.Query("status")),
		PaymentStatus: strings.TrimSpace(c.Query("payment_status")),
		Query:         strings.TrimSpace(c.Query("q")),
	}

	res, err := h.svc.ListAdminInquiries(c.Context(), filter)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat daftar pengajuan klien bisnis: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar pengajuan klien bisnis berhasil dimuat", res)
}

// GetAdminInquiry mengambil detail satu pengajuan klien bisnis berdasarkan ID
func (h *B2BInquiryHandler) GetAdminInquiry(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pengajuan wajib disertakan pada parameter URL", "INVALID_ID")
	}

	item, err := h.svc.GetInquiryByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrB2BInquiryNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pengajuan klien bisnis tidak ditemukan", "B2B_INQUIRY_NOT_FOUND")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat detail pengajuan klien bisnis: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Detail pengajuan klien bisnis berhasil dimuat", item)
}

// UpdateAdminInquiry memperbarui status, nominal kesepakatan, dan status pembayaran oleh Admin
func (h *B2BInquiryHandler) UpdateAdminInquiry(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID pengajuan wajib disertakan pada parameter URL", "INVALID_ID")
	}

	var payload domain.UpdateB2BInquiryAdminPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data pembaruan pengajuan tidak valid", err.Error())
	}

	updated, err := h.svc.UpdateInquiryByAdmin(c.Context(), id, &payload)
	if err != nil {
		if errors.Is(err, domain.ErrB2BInquiryNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pengajuan klien bisnis tidak ditemukan", "B2B_INQUIRY_NOT_FOUND")
		}
		if errors.Is(err, domain.ErrInvalidB2BStatus) || errors.Is(err, domain.ErrInvalidB2BPaymentStatus) || errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, err.Error(), "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui pengajuan klien bisnis: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Pengajuan klien bisnis berhasil diperbarui", updated)
}

