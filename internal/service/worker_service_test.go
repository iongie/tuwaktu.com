package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestWorkerService_GetPublicProfileBySlug(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns public profile without private fields", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:          "worker-1",
			Slug:        "ahmad-cleaner",
			Name:        "Ahmad Cleaner",
			Bio:         "Ahli bersih-bersih rumah",
			AvatarURL:   "https://example.com/avatar.jpg",
			Rating:      4.9,
			ReviewCount: 15,
			Zone:        "Jakarta Selatan",
			PhoneNumber: "+6281234567890",    // SENSITIVE
			Email:       "ahmad@private.com", // SENSITIVE
			Address:     "Jl. Rahasia No. 1", // SENSITIVE
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		repo.SeedWorker(worker)

		s1 := &domain.Service{
			ID:              "service-1",
			WorkerID:        worker.ID,
			Name:            "Deep Cleaning",
			Description:     "Pembersihan detail",
			Price:           200000,
			DurationMinutes: 120,
			IsActive:        true,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		repo.SeedService(s1)

		svc := service.NewWorkerService(repo)
		profile, err := svc.GetPublicProfileBySlug(ctx, "ahmad-cleaner")

		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Equal(t, "ahmad-cleaner", profile.Slug)
		assert.Equal(t, "Ahmad Cleaner", profile.Name)
		assert.Equal(t, "Jakarta Selatan", profile.Zone)
		assert.Equal(t, 4.9, profile.Rating)
		assert.Len(t, profile.Services, 1)
		assert.Equal(t, "Deep Cleaning", profile.Services[0].Name)
		assert.Equal(t, 200000.0, profile.Services[0].Price)
	})

	t.Run("returns ErrWorkerNotFound when slug does not exist", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		profile, err := svc.GetPublicProfileBySlug(ctx, "non-existent")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, profile)
	})

	t.Run("returns ErrWorkerInactive when worker is inactive", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "worker-inactive",
			Slug:     "inactive-worker",
			Name:     "Inactive Worker",
			IsActive: false,
		})

		svc := service.NewWorkerService(repo)
		profile, err := svc.GetPublicProfileBySlug(ctx, "inactive-worker")
		assert.ErrorIs(t, err, domain.ErrWorkerInactive)
		assert.Nil(t, profile)
	})

	t.Run("returns empty services slice when worker has no active services", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "worker-no-services",
			Slug:     "no-services",
			Name:     "No Services",
			IsActive: true,
		})

		svc := service.NewWorkerService(repo)
		profile, err := svc.GetPublicProfileBySlug(ctx, "no-services")
		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Empty(t, profile.Services)
		assert.NotNil(t, profile.Services) // not nil, should be empty slice []
	})

	t.Run("returns ErrInvalidInput on empty or whitespace slug", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		profile, err := svc.GetPublicProfileBySlug(ctx, "   ")
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
		assert.Nil(t, profile)
	})

	t.Run("case-insensitive slug lookup succeeds", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "worker-case",
			Slug:     "budi-santoso",
			Name:     "Budi Santoso",
			IsActive: true,
		})

		svc := service.NewWorkerService(repo)
		profile, err := svc.GetPublicProfileBySlug(ctx, "Budi-Santoso")
		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Equal(t, "budi-santoso", profile.Slug)
	})
}
