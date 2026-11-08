package handler

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/service"
)

type CategoryHandler struct {
	categorySvc service.CategoryService
}

func NewCategoryHandler(categorySvc service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categorySvc: categorySvc}
}

// ListPublicCategories mengambil daftar kategori aktif untuk halaman beranda
func (h *CategoryHandler) ListPublicCategories(c *fiber.Ctx) error {
	categories, err := h.categorySvc.ListPublicCategories(c.Context())
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat katalog keahlian: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar kategori keahlian teknisi berhasil diambil", categories)
}

// ListCategories mengambil seluruh data kategori untuk panel admin
func (h *CategoryHandler) ListCategories(c *fiber.Ctx) error {
	categories, err := h.categorySvc.ListAdminCategories(c.Context())
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat daftar kategori admin: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Daftar seluruh kategori berhasil dimuat", categories)
}

// GetCategory mengambil detail satu kategori berdasarkan ID
func (h *CategoryHandler) GetCategory(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID kategori wajib disertakan pada parameter URL", "INVALID_CATEGORY_ID")
	}

	category, err := h.categorySvc.GetCategoryByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Kategori tidak ditemukan", "CATEGORY_NOT_FOUND")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memuat detail kategori: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Detail kategori berhasil dimuat", category)
}

// CreateCategory menambahkan kategori keahlian baru dari panel admin
func (h *CategoryHandler) CreateCategory(c *fiber.Ctx) error {
	var payload domain.CreateCategoryPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload kategori tidak valid", err.Error())
	}

	category, err := h.categorySvc.CreateCategory(c.Context(), &payload)
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNameRequired) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Nama kategori wajib diisi", "CATEGORY_NAME_REQUIRED")
		}
		if errors.Is(err, domain.ErrCategorySlugExists) {
			return ErrorResponse(c, fiber.StatusConflict, "Slug kategori sudah digunakan", "CATEGORY_SLUG_EXISTS")
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Data masukan kategori tidak valid", "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menambahkan kategori: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusCreated, "Kategori baru berhasil ditambahkan", category)
}

// UpdateCategory memperbarui data kategori dari panel admin
func (h *CategoryHandler) UpdateCategory(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID kategori wajib disertakan pada parameter URL", "INVALID_CATEGORY_ID")
	}

	var payload domain.UpdateCategoryPayload
	if err := c.BodyParser(&payload); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Format payload pembaruan kategori tidak valid", err.Error())
	}

	category, err := h.categorySvc.UpdateCategory(c.Context(), id, &payload)
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Kategori tidak ditemukan", "CATEGORY_NOT_FOUND")
		}
		if errors.Is(err, domain.ErrCategorySlugExists) {
			return ErrorResponse(c, fiber.StatusConflict, "Slug kategori sudah digunakan", "CATEGORY_SLUG_EXISTS")
		}
		if errors.Is(err, domain.ErrCategoryNameRequired) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Nama kategori wajib diisi", "CATEGORY_NAME_REQUIRED")
		}
		if errors.Is(err, domain.ErrInvalidInput) {
			return ErrorResponse(c, fiber.StatusBadRequest, "Data masukan pembaruan tidak valid", "INVALID_INPUT")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal memperbarui kategori: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Kategori berhasil diperbarui", category)
}

// DeleteCategory menghapus kategori dari panel admin
func (h *CategoryHandler) DeleteCategory(c *fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "ID kategori wajib disertakan pada parameter URL", "INVALID_CATEGORY_ID")
	}

	if err := h.categorySvc.DeleteCategory(c.Context(), id); err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			return ErrorResponse(c, fiber.StatusNotFound, "Kategori tidak ditemukan", "CATEGORY_NOT_FOUND")
		}
		return ErrorResponse(c, fiber.StatusInternalServerError, "Gagal menghapus kategori: "+err.Error(), "INTERNAL_ERROR")
	}

	return SuccessResponse(c, fiber.StatusOK, "Kategori berhasil dihapus", fiber.Map{
		"category_id": id,
	})
}
