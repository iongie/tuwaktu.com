package handler

import (
	"errors"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type ReviewHandler struct {
	reviewService service.ReviewService
}

func NewReviewHandler(reviewService service.ReviewService) *ReviewHandler {
	return &ReviewHandler{
		reviewService: reviewService,
	}
}

// GetReviewInvitation handles GET /api/public/review-invitations/:bookingCode?token=...
func (h *ReviewHandler) GetReviewInvitation(c *fiber.Ctx) error {
	bookingCode := c.Params("bookingCode")
	if unescaped, err := url.PathUnescape(bookingCode); err == nil {
		bookingCode = unescaped
	}
	token := c.Query("token")

	invitation, err := h.reviewService.GetReviewInvitation(c.UserContext(), bookingCode, token)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrBookingNotFound):
			return ErrorResponse(c, fiber.StatusNotFound, "Pesanan booking tidak ditemukan", err.Error())
		case errors.Is(err, domain.ErrInvalidReviewToken):
			return ErrorResponse(c, fiber.StatusForbidden, "Token tautan ulasan tidak valid atau telah kadaluarsa", err.Error())
		case errors.Is(err, domain.ErrBookingNotCompleted):
			return ErrorResponse(c, fiber.StatusBadRequest, "Ulasan hanya dapat diberikan untuk pesanan yang telah selesai dikerjakan", err.Error())
		case errors.Is(err, domain.ErrBookingAlreadyReviewed):
			return ErrorResponse(c, fiber.StatusConflict, "Pesanan ini sudah pernah diulas sebelumnya", err.Error())
		default:
			return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat data formulir ulasan", err.Error())
		}
	}

	return SuccessResponse(c, fiber.StatusOK, "Data formulir ulasan berhasil dimuat", invitation)
}

// SubmitReview handles POST /api/public/reviews
func (h *ReviewHandler) SubmitReview(c *fiber.Ctx) error {
	var req domain.SubmitReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format data ulasan tidak valid", err.Error())
	}

	review, err := h.reviewService.SubmitReview(c.UserContext(), req)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrBookingNotFound):
			return ErrorResponse(c, fiber.StatusNotFound, "Pesanan booking tidak ditemukan", err.Error())
		case errors.Is(err, domain.ErrInvalidReviewToken):
			return ErrorResponse(c, fiber.StatusForbidden, "Token tautan ulasan tidak valid atau telah kadaluarsa", err.Error())
		case errors.Is(err, domain.ErrBookingNotCompleted):
			return ErrorResponse(c, fiber.StatusBadRequest, "Ulasan hanya dapat diberikan untuk pesanan yang telah selesai dikerjakan", err.Error())
		case errors.Is(err, domain.ErrBookingAlreadyReviewed):
			return ErrorResponse(c, fiber.StatusConflict, "Pesanan ini sudah pernah diulas sebelumnya", err.Error())
		case errors.Is(err, domain.ErrInvalidRating):
			return ErrorResponse(c, fiber.StatusBadRequest, "Rating harus bernilai antara 1 sampai 5 bintang", err.Error())
		case errors.Is(err, domain.ErrReviewCommentTooShort):
			return ErrorResponse(c, fiber.StatusBadRequest, "Komentar ulasan minimal harus 5 karakter", err.Error())
		case errors.Is(err, domain.ErrInvalidInput):
			return ErrorResponse(c, fiber.StatusBadRequest, "Data masukan ulasan tidak valid", err.Error())
		default:
			return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menyimpan ulasan pelanggan", err.Error())
		}
	}

	return SuccessResponse(c, fiber.StatusCreated, "Ulasan Anda berhasil dikirim. Terima kasih atas masukan Anda!", review)
}

// GetPublicWorkerReviews handles GET /api/public/workers/:slug/reviews
func (h *ReviewHandler) GetPublicWorkerReviews(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if unescaped, err := url.PathUnescape(slug); err == nil {
		slug = unescaped
	}

	limit := c.QueryInt("limit", 10)
	offset := c.QueryInt("offset", 0)

	reviews, total, err := h.reviewService.GetPublicReviews(c.UserContext(), slug, limit, offset)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", err.Error())
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat daftar ulasan pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar ulasan pekerja berhasil diambil", fiber.Map{
		"reviews": reviews,
		"total":   total,
	})
}

// GetWorkerReviews handles GET /api/v1/worker/reviews and GET /api/worker/reviews
func (h *ReviewHandler) GetWorkerReviews(c *fiber.Ctx) error {
	workerID := c.Params("id")
	if unescaped, err := url.PathUnescape(workerID); err == nil {
		workerID = unescaped
	}
	if strings.TrimSpace(workerID) == "" {
		workerID = c.Query("worker_id")
		if workerID == "" {
			workerID = c.Query("worker_slug")
		}
		if workerID == "" {
			workerID = c.Query("slug")
		}
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID atau slug pekerja wajib diisi", nil)
	}

	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)

	reviews, total, err := h.reviewService.GetWorkerDashboardReviews(c.UserContext(), workerID, limit, offset)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Pekerja tidak ditemukan", nil)
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal mengambil daftar ulasan pekerja", err.Error())
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar ulasan dashboard pekerja berhasil diambil", fiber.Map{
		"reviews": reviews,
		"total":   total,
	})
}
