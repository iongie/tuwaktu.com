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

func TestWorkerService_UpdateWorkerProfile(t *testing.T) {
	ctx := context.Background()

	t.Run("success updates profile and returns public profile", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:          "worker-001",
			Slug:        "budi-santoso",
			Name:        "Budi Lama",
			Bio:         "Bio lama",
			AvatarURL:   "https://example.com/old.jpg",
			Zone:        "Jakarta Barat",
			PhoneNumber: "+6281111111",
			Email:       "budi@example.com",
			Address:     "Jl. Lama No. 1",
			IsActive:    true,
		}
		repo.SeedWorker(worker)

		s1 := &domain.Service{
			ID:              "service-001",
			WorkerID:        worker.ID,
			Name:            "Reparasi AC",
			Price:           150000,
			DurationMinutes: 60,
			IsActive:        true,
		}
		repo.SeedService(s1)

		svc := service.NewWorkerService(repo)
		updatePayload := &domain.WorkerProfileUpdate{
			Name:        "Budi Santoso Baru",
			Bio:         "Teknisi Berpengalaman 10 Tahun",
			AvatarURL:   "https://example.com/new.jpg",
			Zone:        "Jakarta Selatan",
			PhoneNumber: "+6289999999",
			Email:       "budi.baru@example.com",
			Address:     "Jl. Baru No. 99",
		}

		profile, err := svc.UpdateWorkerProfile(ctx, "worker-001", updatePayload)
		require.NoError(t, err)
		require.NotNil(t, profile)

		assert.Equal(t, "Budi Santoso Baru", profile.Name)
		assert.Equal(t, "Teknisi Berpengalaman 10 Tahun", profile.Bio)
		assert.Equal(t, "https://example.com/new.jpg", profile.AvatarURL)
		assert.Equal(t, "Jakarta Selatan", profile.Zone)
		assert.Equal(t, "budi-santoso", profile.Slug)
		assert.Len(t, profile.Services, 1)
		assert.Equal(t, "Reparasi AC", profile.Services[0].Name)
	})

	t.Run("returns ErrWorkerNotFound when worker ID not found", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		updatePayload := &domain.WorkerProfileUpdate{
			Name: "Budi Santoso",
		}

		profile, err := svc.UpdateWorkerProfile(ctx, "non-existent-id", updatePayload)
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, profile)
	})

	t.Run("returns ErrInvalidInput on empty name or id", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		// Empty id
		p1, err1 := svc.UpdateWorkerProfile(ctx, "   ", &domain.WorkerProfileUpdate{Name: "Budi"})
		assert.ErrorIs(t, err1, domain.ErrInvalidInput)
		assert.Nil(t, p1)

		// Nil payload
		p2, err2 := svc.UpdateWorkerProfile(ctx, "w-1", nil)
		assert.ErrorIs(t, err2, domain.ErrInvalidInput)
		assert.Nil(t, p2)

		// Empty name
		p3, err3 := svc.UpdateWorkerProfile(ctx, "w-1", &domain.WorkerProfileUpdate{Name: "   "})
		assert.ErrorIs(t, err3, domain.ErrInvalidInput)
		assert.Nil(t, p3)
	})

	t.Run("returns error on canceled context", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		canceledCtx, cancel := context.WithCancel(ctx)
		cancel()

		profile, err := svc.UpdateWorkerProfile(canceledCtx, "w-1", &domain.WorkerProfileUpdate{Name: "Budi"})
		assert.ErrorIs(t, err, context.Canceled)
		assert.Nil(t, profile)
	})
}

func TestWorkerService_UpdateWorkerRates(t *testing.T) {
	ctx := context.Background()

	t.Run("success updates rates and returns updated public profile", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:        "worker-rate-1",
			Slug:      "budi-santoso",
			Name:      "Budi Santoso",
			Zone:      "Jakarta Selatan",
			BasePrice: 50000,
			RateType:  "HOURLY",
			IsActive:  true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		req := &domain.WorkerRateUpdate{
			WorkerID:  "worker-rate-1",
			BasePrice: 85000,
			RateType:  "HOURLY",
		}

		profile, err := svc.UpdateWorkerRates(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Equal(t, 85000.0, profile.BasePrice)
		assert.Equal(t, "HOURLY", profile.RateType)
		assert.Equal(t, "Budi Santoso", profile.Name)
	})

	t.Run("success updates rates with UNIT rate type (case-insensitive)", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:        "worker-rate-2",
			Slug:      "siti-aminah",
			Name:      "Siti Aminah",
			Zone:      "Tangerang",
			BasePrice: 100000,
			RateType:  "HOURLY",
			IsActive:  true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		req := &domain.WorkerRateUpdate{
			WorkerID:  "siti-aminah", // Lookup by slug
			BasePrice: 150000,
			RateType:  "unit", // lowercase should be normalized
		}

		profile, err := svc.UpdateWorkerRates(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Equal(t, 150000.0, profile.BasePrice)
		assert.Equal(t, "UNIT", profile.RateType)
	})

	t.Run("returns ErrInvalidBasePrice when base_price is zero or negative", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		// Zero base_price
		_, errZero := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "w-1",
			BasePrice: 0,
			RateType:  "HOURLY",
		})
		assert.ErrorIs(t, errZero, domain.ErrInvalidBasePrice)

		// Negative base_price
		_, errNeg := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "w-1",
			BasePrice: -50000,
			RateType:  "HOURLY",
		})
		assert.ErrorIs(t, errNeg, domain.ErrInvalidBasePrice)
	})

	t.Run("returns ErrInvalidRateType when rate_type is not HOURLY or UNIT", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		_, errInvalidType := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "w-1",
			BasePrice: 75000,
			RateType:  "DAILY",
		})
		assert.ErrorIs(t, errInvalidType, domain.ErrInvalidRateType)

		_, errEmptyType := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "w-1",
			BasePrice: 75000,
			RateType:  "",
		})
		assert.ErrorIs(t, errEmptyType, domain.ErrInvalidRateType)
	})

	t.Run("returns ErrInvalidInput on nil or empty worker_id", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		_, errNil := svc.UpdateWorkerRates(ctx, nil)
		assert.ErrorIs(t, errNil, domain.ErrInvalidInput)

		_, errEmptyID := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "   ",
			BasePrice: 50000,
			RateType:  "HOURLY",
		})
		assert.ErrorIs(t, errEmptyID, domain.ErrInvalidInput)
	})

	t.Run("returns ErrWorkerNotFound when worker does not exist", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		_, errNotFound := svc.UpdateWorkerRates(ctx, &domain.WorkerRateUpdate{
			WorkerID:  "non-existent-worker-id",
			BasePrice: 75000,
			RateType:  "HOURLY",
		})
		assert.ErrorIs(t, errNotFound, domain.ErrWorkerNotFound)
	})
}
