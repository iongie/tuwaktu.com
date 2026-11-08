package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestCategoryService_ListPublicAndAdmin(t *testing.T) {
	repo := repository.NewMemoryCategoryRepository()
	svc := service.NewCategoryService(repo)
	ctx := context.Background()

	// ListPublicCategories harus mengembalikan kategori aktif yang sudah di-seed
	publicCats, err := svc.ListPublicCategories(ctx)
	require.NoError(t, err)
	assert.NotEmpty(t, publicCats)
	for _, pc := range publicCats {
		assert.NotEmpty(t, pc.ID)
		assert.NotEmpty(t, pc.Name)
		assert.Equal(t, pc.Name, pc.Title)
		assert.NotEmpty(t, pc.Slug)
	}

	// ListAdminCategories mengembalikan seluruh kategori
	adminCats, err := svc.ListAdminCategories(ctx)
	require.NoError(t, err)
	assert.Equal(t, len(publicCats), len(adminCats))
}

func TestCategoryService_CreateCategory(t *testing.T) {
	repo := repository.NewMemoryCategoryRepository()
	svc := service.NewCategoryService(repo)
	ctx := context.Background()

	t.Run("sukses membuat kategori dengan nilai default", func(t *testing.T) {
		price := 150000.0
		payload := &domain.CreateCategoryPayload{
			Name:          "Servis Kulkas Inverter",
			Description:   "Perbaikan kompresor dan kebocoran freon kulkas.",
			StartingPrice: &price,
		}

		created, err := svc.CreateCategory(ctx, payload)
		require.NoError(t, err)
		assert.NotEmpty(t, created.ID)
		assert.Equal(t, "Servis Kulkas Inverter", created.Name)
		assert.Equal(t, "servis-kulkas-inverter", created.Slug)
		assert.Equal(t, "build", created.Icon)
		assert.Equal(t, "kunjungan", created.PriceUnit)
		assert.True(t, created.IsActive)
		assert.Equal(t, 150000.0, created.StartingPrice)
	})

	t.Run("gagal jika nama kategori kosong", func(t *testing.T) {
		payload := &domain.CreateCategoryPayload{
			Name: "   ",
		}

		_, err := svc.CreateCategory(ctx, payload)
		assert.ErrorIs(t, err, domain.ErrCategoryNameRequired)
	})

	t.Run("gagal jika slug sudah terdaftar", func(t *testing.T) {
		price := 50000.0
		payload := &domain.CreateCategoryPayload{
			Name:          "Servis AC Duplikat",
			Slug:          "ac-pendingin", // slug bawaan seed
			StartingPrice: &price,
		}

		_, err := svc.CreateCategory(ctx, payload)
		assert.ErrorIs(t, err, domain.ErrCategorySlugExists)
	})

	t.Run("gagal jika starting_price negatif", func(t *testing.T) {
		negativePrice := -1000.0
		payload := &domain.CreateCategoryPayload{
			Name:          "Layanan Tarif Negatif",
			StartingPrice: &negativePrice,
		}

		_, err := svc.CreateCategory(ctx, payload)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})
}

func TestCategoryService_GetAndUpdateAndDelete(t *testing.T) {
	repo := repository.NewMemoryCategoryRepository()
	svc := service.NewCategoryService(repo)
	ctx := context.Background()

	// 1. Get by ID
	cat, err := svc.GetCategoryByID(ctx, "11111111-1111-4111-8111-111111111111")
	require.NoError(t, err)
	assert.Equal(t, "ac-pendingin", cat.Slug)

	// 2. Get non-existent ID
	_, err = svc.GetCategoryByID(ctx, "non-existent-uuid")
	assert.ErrorIs(t, err, domain.ErrCategoryNotFound)

	// 3. Update category
	newName := "Servis AC dan Perawatan Rutin"
	newPrice := 90000.0
	isActive := false
	updatePayload := &domain.UpdateCategoryPayload{
		Name:          &newName,
		StartingPrice: &newPrice,
		IsActive:      &isActive,
	}

	updated, err := svc.UpdateCategory(ctx, cat.ID, updatePayload)
	require.NoError(t, err)
	assert.Equal(t, "Servis AC dan Perawatan Rutin", updated.Name)
	assert.Equal(t, 90000.0, updated.StartingPrice)
	assert.False(t, updated.IsActive)

	// Verifikasi ListPublic tidak lagi menyertakan kategori yang dinonaktifkan
	publicCats, err := svc.ListPublicCategories(ctx)
	require.NoError(t, err)
	for _, pc := range publicCats {
		assert.NotEqual(t, cat.ID, pc.ID)
	}

	// 4. Update with duplicate slug from another category
	dupSlug := "sanitasi-cleaning"
	_, err = svc.UpdateCategory(ctx, cat.ID, &domain.UpdateCategoryPayload{
		Slug: &dupSlug,
	})
	assert.ErrorIs(t, err, domain.ErrCategorySlugExists)

	// 5. Delete category
	err = svc.DeleteCategory(ctx, cat.ID)
	require.NoError(t, err)

	_, err = svc.GetCategoryByID(ctx, cat.ID)
	assert.ErrorIs(t, err, domain.ErrCategoryNotFound)

	// Delete non-existent
	err = svc.DeleteCategory(ctx, "non-existent-uuid")
	assert.ErrorIs(t, err, domain.ErrCategoryNotFound)
}
