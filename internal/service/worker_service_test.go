package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
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

	t.Run("rejects invalid email format", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "w-mail-1",
			Slug:     "worker-mail",
			Name:     "Worker Mail",
			IsActive: true,
		})
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerProfile(ctx, "w-mail-1", &domain.WorkerProfileUpdate{
			Name:  "Worker Mail",
			Email: "invalid-email-format",
		})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "format alamat email tidak valid")
	})

	t.Run("rejects email already used by another worker account", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "w-mail-1",
			Slug:     "worker-1",
			Name:     "Worker One",
			IsActive: true,
		})
		repo.SeedWorker(&domain.Worker{
			ID:       "w-mail-2",
			Slug:     "worker-2",
			Name:     "Worker Two",
			IsActive: true,
		})
		otherWorkerID := "w-mail-1"
		repo.SeedAccount(&domain.WorkerAccount{
			ID:       "acc-mail-1",
			WorkerID: &otherWorkerID,
			Email:    "taken@example.com",
		})
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerProfile(ctx, "w-mail-2", &domain.WorkerProfileUpdate{
			Name:  "Worker Two",
			Email: "taken@example.com",
		})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "alamat email sudah digunakan oleh akun lain")
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

func TestWorkerService_UpdateWorkerLocationSettings(t *testing.T) {
	ctx := context.Background()

	setupWorker := func() (*repository.MemoryRepository, *domain.Worker) {
		repo := repository.NewMemoryRepository()
		lat := -6.2921000
		lng := 106.7992000
		worker := &domain.Worker{
			ID:            "worker-loc-1",
			Slug:          "budi-santoso",
			Name:          "Budi Santoso",
			Zone:          "Jakarta Selatan",
			Lat:           &lat,
			Lng:           &lng,
			MaxRadiusKM:   15.0,
			FreeRadiusKM:  3.0,
			ExtraFeePerKM: 5000,
			IsActive:      true,
		}
		repo.SeedWorker(worker)
		return repo, worker
	}

	t.Run("success updates location settings and returns public profile", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		newLat := -6.2088000
		newLng := 106.8456000
		req := &domain.WorkerLocationSettingsUpdate{
			WorkerID:      "worker-loc-1",
			Lat:           &newLat,
			Lng:           &newLng,
			MaxRadiusKM:   25.0,
			FreeRadiusKM:  5.0,
			ExtraFeePerKM: 6000,
		}

		profile, err := svc.UpdateWorkerLocationSettings(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, profile)
		require.NotNil(t, profile.Lat)
		require.NotNil(t, profile.Lng)
		assert.InDelta(t, -6.2088, *profile.Lat, 0.0001)
		assert.InDelta(t, 106.8456, *profile.Lng, 0.0001)
		assert.Equal(t, 25.0, profile.MaxRadiusKM)
		assert.Equal(t, 5.0, profile.FreeRadiusKM)
		assert.Equal(t, 6000, profile.ExtraFeePerKM)
	})

	t.Run("success updates location settings by worker slug", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		newLat := -6.1754000
		newLng := 106.8272000
		req := &domain.WorkerLocationSettingsUpdate{
			WorkerID:      "budi-santoso", // by slug
			Lat:           &newLat,
			Lng:           &newLng,
			MaxRadiusKM:   20.0,
			FreeRadiusKM:  4.0,
			ExtraFeePerKM: 4500,
		}

		profile, err := svc.UpdateWorkerLocationSettings(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, profile)
		assert.Equal(t, 20.0, profile.MaxRadiusKM)
	})

	t.Run("returns ErrInvalidInput when max_radius_km is <= 0", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:    "worker-loc-1",
			MaxRadiusKM: 0,
		})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrInvalidInput when free_radius_km is negative", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:     "worker-loc-1",
			MaxRadiusKM:  10.0,
			FreeRadiusKM: -1.0,
		})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrInvalidInput when extra_fee_per_km is negative", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:      "worker-loc-1",
			MaxRadiusKM:   10.0,
			ExtraFeePerKM: -500,
		})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrInvalidInput when coordinates out of range", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		invalidLat := 95.0
		_, errLat := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:    "worker-loc-1",
			Lat:         &invalidLat,
			MaxRadiusKM: 10.0,
		})
		assert.ErrorIs(t, errLat, domain.ErrInvalidInput)

		invalidLng := 190.0
		_, errLng := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:    "worker-loc-1",
			Lng:         &invalidLng,
			MaxRadiusKM: 10.0,
		})
		assert.ErrorIs(t, errLng, domain.ErrInvalidInput)
	})

	t.Run("returns ErrInvalidInput when free_radius_km > max_radius_km", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:     "worker-loc-1",
			MaxRadiusKM:  10.0,
			FreeRadiusKM: 15.0,
		})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrInvalidInput when only lat or only lng provided", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		latOnly := -6.2000
		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:    "worker-loc-1",
			Lat:         &latOnly,
			MaxRadiusKM: 10.0,
		})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("preserves existing coordinates when update coords are nil", func(t *testing.T) {
		repo, original := setupWorker()
		svc := service.NewWorkerService(repo)

		profile, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:      "worker-loc-1",
			MaxRadiusKM:   20.0,
			FreeRadiusKM:  5.0,
			ExtraFeePerKM: 7000,
		})
		require.NoError(t, err)
		require.NotNil(t, profile.Lat)
		require.NotNil(t, profile.Lng)
		assert.Equal(t, *original.Lat, *profile.Lat)
		assert.Equal(t, *original.Lng, *profile.Lng)
		assert.Equal(t, 20.0, profile.MaxRadiusKM)
	})

	t.Run("returns ErrWorkerNotFound when worker does not exist", func(t *testing.T) {
		repo, _ := setupWorker()
		svc := service.NewWorkerService(repo)

		_, err := svc.UpdateWorkerLocationSettings(ctx, &domain.WorkerLocationSettingsUpdate{
			WorkerID:    "non-existent",
			MaxRadiusKM: 10.0,
		})
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})
}

func TestWorkerService_GetWorkerSchedules(t *testing.T) {
	ctx := context.Background()

	t.Run("returns default 7 days when no custom schedule configured", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:       "w-sched-1",
			Slug:     "budi-teknisi",
			Name:     "Budi",
			IsActive: true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		schedules, err := svc.GetWorkerSchedules(ctx, "budi-teknisi")
		require.NoError(t, err)
		assert.Len(t, schedules, 7)
		assert.Equal(t, "Minggu", schedules[0].DayName)
		assert.Equal(t, "Senin", schedules[1].DayName)
		assert.True(t, schedules[1].IsActive)
	})

	t.Run("returns ErrInvalidInput on empty id", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)
		_, err := svc.GetWorkerSchedules(ctx, "   ")
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrWorkerNotFound on unknown worker", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)
		_, err := svc.GetWorkerSchedules(ctx, "unknown-worker")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})
}

func TestWorkerService_UpdateWorkerSchedules(t *testing.T) {
	ctx := context.Background()

	t.Run("success updates schedules", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:       "w-sched-2",
			Slug:     "siti-bersih",
			Name:     "Siti",
			IsActive: true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		req := []domain.WorkerScheduleItem{
			{DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: false},
			{DayOfWeek: 2, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		}

		updated, err := svc.UpdateWorkerSchedules(ctx, "siti-bersih", req)
		require.NoError(t, err)
		require.NotEmpty(t, updated)

		var monday, tuesday *domain.WorkerScheduleItem
		for i := range updated {
			if updated[i].DayOfWeek == 1 {
				monday = &updated[i]
			}
			if updated[i].DayOfWeek == 2 {
				tuesday = &updated[i]
			}
		}

		require.NotNil(t, monday)
		assert.True(t, monday.IsActive)
		assert.True(t, monday.SlotMorning)
		assert.False(t, monday.SlotAfternoon)
		assert.Equal(t, "Senin", monday.DayName)

		require.NotNil(t, tuesday)
		assert.False(t, tuesday.IsActive)
		assert.Equal(t, "Selasa", tuesday.DayName)
	})

	t.Run("returns ErrInvalidScheduleDay on invalid day", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:       "w-sched-3",
			Slug:     "doni-service",
			Name:     "Doni",
			IsActive: true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		req := []domain.WorkerScheduleItem{
			{DayOfWeek: 7, IsActive: true}, // Invalid! (Only 0-6 allowed)
		}

		_, err := svc.UpdateWorkerSchedules(ctx, "doni-service", req)
		assert.ErrorIs(t, err, domain.ErrInvalidScheduleDay)
	})

	t.Run("returns ErrInvalidInput on empty payload", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:       "w-sched-4",
			Slug:     "rudi",
			IsActive: true,
		}
		repo.SeedWorker(worker)

		svc := service.NewWorkerService(repo)
		_, err := svc.UpdateWorkerSchedules(ctx, "rudi", []domain.WorkerScheduleItem{})
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})
}

func TestWorkerService_RegisterWorker(t *testing.T) {
	ctx := context.Background()

	t.Run("berhasil mendaftarkan mitra baru dengan status pending dan token aktivasi whatsapp", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi Santoso",
			SpecialtyID:    "ac-electric",
			SpecialtyLabel: "Teknisi AC & Kelistrikan",
			WhatsAppNumber: "6281234567890",
			Zone:           "Jakarta Selatan",
			Slug:           "budi-ac-jakarta",
			PIN:            "482915",
		}

		resp, err := svc.RegisterWorker(ctx, payload)
		require.NoError(t, err)
		require.NotNil(t, resp)
		assert.NotEmpty(t, resp.WorkerID)
		assert.Equal(t, "Budi Santoso", resp.Name)
		assert.Equal(t, "budi-ac-jakarta", resp.Slug)
		assert.Equal(t, "6281234567890", resp.WhatsAppNumber)
		assert.NotEmpty(t, resp.AdminWhatsAppNumber)
		assert.NotEmpty(t, resp.ActivationURL)
		assert.NotEmpty(t, resp.WhatsAppShareURL)
		assert.Equal(t, 15, resp.ExpiresInMinutes)
		assert.Contains(t, resp.WhatsAppShareURL, "wa.me/")
		assert.NotEmpty(t, resp.WhatsAppWebURL)
		assert.Contains(t, resp.WhatsAppWebURL, "web.whatsapp.com/send?phone=")
		assert.NotEmpty(t, resp.WhatsAppMessage)
		assert.Contains(t, resp.WhatsAppMessage, "Halo Admin Tuwaktu")

		// Verifikasi worker tersimpan di repo dengan status awal IsActive = false (pending) dan email kosong
		w, err := repo.GetBySlug(ctx, "budi-ac-jakarta")
		require.NoError(t, err)
		assert.Equal(t, "Budi Santoso", w.Name)
		assert.Equal(t, 75000.0, w.BasePrice)
		assert.Empty(t, w.Email)
		assert.False(t, w.IsActive)

		// Verifikasi jadwal kerja terbuat untuk 7 hari
		schedules, err := repo.GetWorkerSchedules(ctx, w.ID)
		require.NoError(t, err)
		assert.Len(t, schedules, 7)

		// Verifikasi autentikasi ditolak sebelum aktivasi admin
		_, errPending := svc.Authenticate(ctx, "6281234567890", "482915")
		require.Error(t, errPending)
		assert.Contains(t, errPending.Error(), "menunggu konfirmasi aktivasi oleh Admin")

		// Ekstrak token dari URL aktivasi dan aktifkan via service
		parts := strings.Split(resp.ActivationURL, "token=")
		require.Len(t, parts, 2)
		rawToken := parts[1]

		activatedWorker, errActivate := svc.ActivateWorkerByToken(ctx, rawToken)
		require.NoError(t, errActivate)
		require.NotNil(t, activatedWorker)
		assert.True(t, activatedWorker.IsActive)

		// Verifikasi autentikasi berhasil setelah aktivasi admin
		authResp, err := svc.Authenticate(ctx, "6281234567890", "482915")
		require.NoError(t, err)
		require.NotNil(t, authResp)
		assert.Equal(t, w.ID, *authResp.Session.WorkerID)

		// Verifikasi autentikasi gagal dengan PIN yang salah
		_, errWrong := svc.Authenticate(ctx, "6281234567890", "999999")
		require.Error(t, errWrong)
		assert.Contains(t, errWrong.Error(), "kata sandi yang Anda masukkan tidak sesuai")
	})

	t.Run("berhasil menormalisasi nomor Admin WhatsApp dari berbagai format lingkungan", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		// Uji format lokal 08...
		t.Setenv("ADMIN_WHATSAPP_NUMBER", "085290040210")
		payload1 := &domain.AuthRegisterPayload{
			Name:           "Mitra Satu",
			WhatsAppNumber: "6281234567891",
			Zone:           "Tangerang",
			Slug:           "mitra-satu",
			PIN:            "482915",
		}
		resp1, err1 := svc.RegisterWorker(ctx, payload1)
		require.NoError(t, err1)
		assert.Equal(t, "6285290040210", resp1.AdminWhatsAppNumber)
		assert.Contains(t, resp1.WhatsAppShareURL, "wa.me/6285290040210")
		assert.Contains(t, resp1.WhatsAppWebURL, "web.whatsapp.com/send?phone=6285290040210")

		// Uji format bersimbol +62 852-9004-0210
		t.Setenv("ADMIN_WHATSAPP_NUMBER", "+62 852-9004-0210")
		payload2 := &domain.AuthRegisterPayload{
			Name:           "Mitra Dua",
			WhatsAppNumber: "6281234567892",
			Zone:           "Bekasi",
			Slug:           "mitra-dua",
			PIN:            "482915",
		}
		resp2, err2 := svc.RegisterWorker(ctx, payload2)
		require.NoError(t, err2)
		assert.Equal(t, "6285290040210", resp2.AdminWhatsAppNumber)
		assert.Contains(t, resp2.WhatsAppShareURL, "wa.me/6285290040210")
		assert.Contains(t, resp2.WhatsAppWebURL, "web.whatsapp.com/send?phone=6285290040210")
	})

	t.Run("gagal jika menggunakan PIN lemah yang sekuensial atau repetitif", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		weakPINs := []string{"123456", "654321", "000000", "111111", "121212"}
		for _, weakPIN := range weakPINs {
			payload := &domain.AuthRegisterPayload{
				Name:           "Budi Santoso",
				WhatsAppNumber: "6281234567890",
				Zone:           "Jakarta Selatan",
				Slug:           "budi-ac-jakarta",
				PIN:            weakPIN,
			}
			_, err := svc.RegisterWorker(ctx, payload)
			require.Error(t, err, "PIN %s seharusnya ditolak", weakPIN)
			assert.ErrorIs(t, err, domain.ErrInvalidInput)
			assert.Contains(t, err.Error(), "PIN terlalu lemah")
		}
	})

	t.Run("gagal jika nama lengkap kosong", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "",
			WhatsAppNumber: "6281234567890",
			Zone:           "Jakarta Selatan",
			Slug:           "budi-ac",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nama lengkap mitra wajib diisi")
	})

	t.Run("gagal jika nomor WhatsApp tidak valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi",
			WhatsAppNumber: "081234", // diawali 0
			Zone:           "Jakarta Selatan",
			Slug:           "budi-ac",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nomor WhatsApp")
	})

	t.Run("gagal jika zona atau basecamp kosong", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi",
			WhatsAppNumber: "6281234567890",
			Zone:           "",
			Slug:           "budi-ac",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "zona atau basecamp")
	})

	t.Run("gagal jika slug kosong atau terlalu pendek", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi",
			WhatsAppNumber: "6281234567890",
			Zone:           "Jakarta Selatan",
			Slug:           "ab",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "slug profil minimal 3 karakter")
	})

	t.Run("gagal jika PIN bukan tepat 6 digit angka", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi",
			WhatsAppNumber: "6281234567890",
			Zone:           "Jakarta Selatan",
			Slug:           "budi-ac",
			PIN:            "1234",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "PIN kedaulatan harus tepat 6 digit angka")
	})

	t.Run("gagal jika nomor WhatsApp sudah terdaftar", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedAccount(&domain.WorkerAccount{
			ID:          "acc-existing",
			Email:       "existing@tuwaktu.com",
			PhoneNumber: "6281234567890",
			Role:        domain.RoleWorker,
		})

		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi Baru",
			WhatsAppNumber: "6281234567890",
			Zone:           "Jakarta Selatan",
			Slug:           "budi-baru",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.")
	})

	t.Run("gagal jika slug worker bentrok", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedWorker(&domain.Worker{
			ID:       "w-existing",
			Slug:     "budi-ac",
			Name:     "Budi Lama",
			IsActive: true,
		})

		svc := service.NewWorkerService(repo)

		payload := &domain.AuthRegisterPayload{
			Name:           "Budi Baru",
			WhatsAppNumber: "6289999999999",
			Zone:           "Jakarta Selatan",
			Slug:           "budi-ac",
			PIN:            "482915",
		}

		_, err := svc.RegisterWorker(ctx, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "Slug profil sudah digunakan. Silakan pilih slug lain.")
	})
}

func TestWorkerService_ActivateWorkerByToken(t *testing.T) {
	ctx := context.Background()

	t.Run("berhasil mengaktifkan worker dengan token valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		regResp, err := svc.RegisterWorker(ctx, &domain.AuthRegisterPayload{
			Name:           "Bambang AC",
			SpecialtyID:    "ac-electric",
			SpecialtyLabel: "Teknisi AC",
			WhatsAppNumber: "6281211223344",
			Zone:           "Jakarta Timur",
			Slug:           "bambang-ac",
			PIN:            "482915",
		})
		require.NoError(t, err)

		token := strings.Split(regResp.ActivationURL, "token=")[1]
		worker, err := svc.ActivateWorkerByToken(ctx, token)
		require.NoError(t, err)
		require.NotNil(t, worker)
		assert.True(t, worker.IsActive)
		assert.Equal(t, "bambang-ac", worker.Slug)

		// Verifikasi status akun di repo berubah jadi ACTIVE
		account, err := repo.GetAccountByEmailOrPhone(ctx, "6281211223344")
		require.NoError(t, err)
		assert.Equal(t, domain.AccountStatusActive, account.AccountStatus)
	})

	t.Run("gagal jika token aktivasi kosong", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		_, err := svc.ActivateWorkerByToken(ctx, "   ")
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("gagal jika token aktivasi tidak valid", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		_, err := svc.ActivateWorkerByToken(ctx, "token-palsu-ngawur-1234567890")
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
		assert.Contains(t, err.Error(), "tidak valid atau data pendaftaran tidak ditemukan")
	})

	t.Run("gagal jika token sudah pernah digunakan (single-use)", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		regResp, err := svc.RegisterWorker(ctx, &domain.AuthRegisterPayload{
			Name:           "Santoso AC",
			WhatsAppNumber: "6281222334455",
			Zone:           "Jakarta Barat",
			Slug:           "santoso-ac",
			PIN:            "482915",
		})
		require.NoError(t, err)

		token := strings.Split(regResp.ActivationURL, "token=")[1]
		_, err = svc.ActivateWorkerByToken(ctx, token)
		require.NoError(t, err)

		// Aktivasi kedua dengan token yang sama wajib ditolak
		_, errSecond := svc.ActivateWorkerByToken(ctx, token)
		require.Error(t, errSecond)
		assert.ErrorIs(t, errSecond, domain.ErrInvalidInput)
		assert.Contains(t, errSecond.Error(), "sudah pernah digunakan")
	})
}

func TestWorkerService_Authenticate_LockoutAndAdminPIN(t *testing.T) {
	ctx := context.Background()

	t.Run("akun terkunci sementara setelah 5 kali percobaan PIN salah berturut-turut", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		regResp, err := svc.RegisterWorker(ctx, &domain.AuthRegisterPayload{
			Name:           "Rian Teknisi",
			WhatsAppNumber: "6281299887766",
			Zone:           "Jakarta Selatan",
			Slug:           "rian-teknisi",
			PIN:            "482915",
		})
		require.NoError(t, err)
		token := strings.Split(regResp.ActivationURL, "token=")[1]
		_, errAct := svc.ActivateWorkerByToken(ctx, token)
		require.NoError(t, errAct)

		// Percobaan 1 s/d 4 gagal dengan ErrInvalidInput
		for i := 1; i <= 4; i++ {
			_, errAuth := svc.Authenticate(ctx, "6281299887766", "999999")
			require.Error(t, errAuth)
			assert.ErrorIs(t, errAuth, domain.ErrInvalidInput)
			assert.NotErrorIs(t, errAuth, domain.ErrAccountLocked)
		}

		// Percobaan ke-5 memicu penguncian akun sementara (ErrAccountLocked)
		_, errFifth := svc.Authenticate(ctx, "6281299887766", "999999")
		require.Error(t, errFifth)
		assert.ErrorIs(t, errFifth, domain.ErrAccountLocked)

		// Percobaan berikutnya dengan PIN yang BENAR tetap ditolak selama masa terkunci
		_, errWhileLocked := svc.Authenticate(ctx, "6281299887766", "482915")
		require.Error(t, errWhileLocked)
		assert.ErrorIs(t, errWhileLocked, domain.ErrAccountLocked)
	})

	t.Run("penghitung gagal login direset kembali ke nol jika berhasil masuk sebelum percobaan ke-5", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		regResp, err := svc.RegisterWorker(ctx, &domain.AuthRegisterPayload{
			Name:           "Dedi Teknisi",
			WhatsAppNumber: "6281377889900",
			Zone:           "Jakarta Barat",
			Slug:           "dedi-teknisi",
			PIN:            "739184",
		})
		require.NoError(t, err)
		token := strings.Split(regResp.ActivationURL, "token=")[1]
		_, errAct := svc.ActivateWorkerByToken(ctx, token)
		require.NoError(t, errAct)

		// 4 kali gagal
		for i := 1; i <= 4; i++ {
			_, errAuth := svc.Authenticate(ctx, "6281377889900", "000000")
			require.ErrorIs(t, errAuth, domain.ErrInvalidInput)
		}

		// Berhasil login pada percobaan ke-5 -> mereset counter
		resp, errSuccess := svc.Authenticate(ctx, "6281377889900", "739184")
		require.NoError(t, errSuccess)
		require.NotNil(t, resp)

		// Gagal 1 kali lagi tidak langsung mengunci akun
		_, errAfterReset := svc.Authenticate(ctx, "6281377889900", "000000")
		require.ErrorIs(t, errAfterReset, domain.ErrInvalidInput)
		assert.NotErrorIs(t, errAfterReset, domain.ErrAccountLocked)
	})

	t.Run("penghitung gagal login direset lintas identifier (WhatsApp dan email) setelah berhasil masuk", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		regResp, err := svc.RegisterWorker(ctx, &domain.AuthRegisterPayload{
			Name:           "Hendra Teknisi",
			WhatsAppNumber: "6281355667788",
			Zone:           "Jakarta Pusat",
			Slug:           "hendra-teknisi",
			PIN:            "739184",
		})
		require.NoError(t, err)
		token := strings.Split(regResp.ActivationURL, "token=")[1]
		_, errAct := svc.ActivateWorkerByToken(ctx, token)
		require.NoError(t, errAct)

		// Mitra mengisi email di profil
		_, errUpdateProfile := svc.UpdateWorkerProfile(ctx, "hendra-teknisi", &domain.WorkerProfileUpdate{
			Name:  "Hendra Teknisi",
			Email: "hendra-teknisi@tuwaktu.com",
		})
		require.NoError(t, errUpdateProfile)

		// 4 kali gagal via WhatsApp
		for i := 1; i <= 4; i++ {
			_, errAuth := svc.Authenticate(ctx, "6281355667788", "000000")
			require.ErrorIs(t, errAuth, domain.ErrInvalidInput)
		}

		// Berhasil login via Email -> mereset counter baik di DB maupun in-memory untuk WhatsApp & Email
		resp, errSuccess := svc.Authenticate(ctx, "hendra-teknisi@tuwaktu.com", "739184")
		require.NoError(t, errSuccess)
		require.NotNil(t, resp)

		// Gagal 1 kali lagi via WhatsApp tidak boleh mengunci akun
		_, errAfterReset := svc.Authenticate(ctx, "6281355667788", "000000")
		require.ErrorIs(t, errAfterReset, domain.ErrInvalidInput)
		assert.NotErrorIs(t, errAfterReset, domain.ErrAccountLocked)
	})

	t.Run("akun Super Admin berhasil autentikasi menggunakan PIN 6-digit 849205", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		repo.SeedAccount(&domain.WorkerAccount{
			ID:                 "99999999-9999-4999-8999-999999999999",
			WorkerID:           nil,
			Email:              "admin@tuwaktu.com",
			PhoneNumber:        "6281200000000",
			PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$uiYTw8zX3xJl1cpIqo//XA$LnCOOfHd56X6q9B+PSCdEy38A8oH8a1/fvdvETKrhKM",
			Role:               domain.RoleAdmin,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		})

		svc := service.NewWorkerService(repo)

		respByEmail, err := svc.Authenticate(ctx, "admin@tuwaktu.com", "849205")
		require.NoError(t, err)
		assert.Equal(t, domain.RoleAdmin, respByEmail.Session.Role)
		assert.Equal(t, "Super Administrator", respByEmail.Session.Name)

		respByPhone, err := svc.Authenticate(ctx, "6281200000000", "849205")
		require.NoError(t, err)
		assert.Equal(t, domain.RoleAdmin, respByPhone.Session.Role)

		respByLocalPhone, err := svc.Authenticate(ctx, "081200000000", "849205")
		require.NoError(t, err)
		assert.Equal(t, domain.RoleAdmin, respByLocalPhone.Session.Role)

		respByPlusPhone, err := svc.Authenticate(ctx, "+6281200000000", "849205")
		require.NoError(t, err)
		assert.Equal(t, domain.RoleAdmin, respByPlusPhone.Session.Role)
	})

	t.Run("akun dengan hash bcrypt lama berhasil masuk dan otomatis dimigrasikan ke Argon2id", func(t *testing.T) {
		repo := repository.NewMemoryRepository()
		pin := "184920"
		bHashBytes, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
		require.NoError(t, err)
		legacyBcryptHash := string(bHashBytes)
		accountID := "acc-legacy-bcrypt"
		workerID := "w-legacy-bcrypt"

		repo.SeedAccount(&domain.WorkerAccount{
			ID:                 accountID,
			WorkerID:           &workerID,
			Email:              "legacy@tuwaktu.com",
			PhoneNumber:        "6285284185939",
			PasswordHash:       legacyBcryptHash,
			Role:               domain.RoleWorker,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		})
		repo.SeedWorker(&domain.Worker{
			ID:       workerID,
			Slug:     "gigih-santoso",
			Name:     "Gigih Santoso",
			IsActive: true,
		})

		svc := service.NewWorkerService(repo)

		// 1. Berhasil login dengan PIN yang cocok dengan hash bcrypt
		resp, err := svc.Authenticate(ctx, "6285284185939", pin)
		require.NoError(t, err)
		require.NotNil(t, resp)
		assert.Equal(t, "Gigih Santoso", resp.Session.Name)

		// 2. Hash di repo telah di-upgrade secara transparan ke format Argon2id ($argon2id$)
		updatedAcc, err := repo.GetAccountByID(ctx, accountID)
		require.NoError(t, err)
		assert.True(t, strings.HasPrefix(updatedAcc.PasswordHash, "$argon2id$v=19$"))
		assert.False(t, auth.IsLegacyBcryptHash(updatedAcc.PasswordHash))
	})
}

func TestWorkerService_CatalogServicesCRUD(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewMemoryRepository()
	worker := &domain.Worker{
		ID:       "w-srv-test",
		Slug:     "worker-srv-test",
		Name:     "Budi Servis",
		IsActive: true,
	}
	repo.SeedWorker(worker)
	svc := service.NewWorkerService(repo)

	t.Run("berhasil menambahkan layanan baru ke katalog", func(t *testing.T) {
		payload := &domain.CreateServicePayload{
			Name:            "Cuci AC Inverter",
			Description:     "Pembersihan unit indoor dan outdoor",
			Price:           95000,
			RateType:        "HOURLY",
			DurationMinutes: 60,
		}
		res, err := svc.AddWorkerService(ctx, worker.ID, payload)
		require.NoError(t, err)
		assert.NotEmpty(t, res.ID)
		assert.Equal(t, "Cuci AC Inverter", res.Name)
		assert.Equal(t, 95000.0, res.Price)
		assert.Equal(t, worker.ID, res.WorkerID)
	})

	t.Run("gagal menambah layanan jika nama kosong atau terlalu pendek", func(t *testing.T) {
		payload := &domain.CreateServicePayload{
			Name:  "AC",
			Price: 50000,
		}
		_, err := svc.AddWorkerService(ctx, worker.ID, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nama layanan minimal 3 karakter")
	})

	t.Run("gagal menambah layanan jika tarif negatif", func(t *testing.T) {
		payload := &domain.CreateServicePayload{
			Name:  "Perbaikan AC",
			Price: -1000,
		}
		_, err := svc.AddWorkerService(ctx, worker.ID, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tarif harga layanan tidak boleh negatif")
	})

	t.Run("berhasil memperbarui layanan katalog", func(t *testing.T) {
		created, err := svc.AddWorkerService(ctx, worker.ID, &domain.CreateServicePayload{
			Name:  "Perbaikan Freon",
			Price: 150000,
		})
		require.NoError(t, err)

		newName := "Isi Ulang Freon R32"
		newPrice := 175000.0
		updated, err := svc.UpdateWorkerService(ctx, worker.ID, created.ID, &domain.UpdateServicePayload{
			Name:  &newName,
			Price: &newPrice,
		})
		require.NoError(t, err)
		assert.Equal(t, "Isi Ulang Freon R32", updated.Name)
		assert.Equal(t, 175000.0, updated.Price)
	})

	t.Run("gagal menambah layanan jika tipe tarif tidak valid", func(t *testing.T) {
		payload := &domain.CreateServicePayload{
			Name:     "Layanan Khusus",
			Price:    50000,
			RateType: "YEARLY",
		}
		_, err := svc.AddWorkerService(ctx, worker.ID, payload)
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidRateType)
	})

	t.Run("gagal menambah layanan jika tarif dasar negatif", func(t *testing.T) {
		payload := &domain.CreateServicePayload{
			Name:      "Layanan Khusus",
			Price:     50000,
			BasePrice: -1000,
		}
		_, err := svc.AddWorkerService(ctx, worker.ID, payload)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tarif dasar layanan tidak boleh negatif")
	})

	t.Run("berhasil menonaktifkan (delete) layanan katalog", func(t *testing.T) {
		created, err := svc.AddWorkerService(ctx, worker.ID, &domain.CreateServicePayload{
			Name:  "Layanan Sementara",
			Price: 80000,
		})
		require.NoError(t, err)

		err = svc.DeleteWorkerService(ctx, worker.ID, created.ID)
		require.NoError(t, err)

		services, err := repo.GetServicesByWorkerID(ctx, worker.ID)
		require.NoError(t, err)
		for _, s := range services {
			assert.NotEqual(t, created.ID, s.ID)
		}
	})

	t.Run("gagal memperbarui layanan jika tarif dasar negatif", func(t *testing.T) {
		created, err := svc.AddWorkerService(ctx, worker.ID, &domain.CreateServicePayload{
			Name:  "Layanan Tarif Dasar",
			Price: 80000,
		})
		require.NoError(t, err)

		negBase := -500.0
		_, err = svc.UpdateWorkerService(ctx, worker.ID, created.ID, &domain.UpdateServicePayload{
			BasePrice: &negBase,
		})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tarif dasar layanan tidak boleh negatif")
	})

	t.Run("gagal jika context telah dibatalkan", func(t *testing.T) {
		cancCtx, cancel := context.WithCancel(ctx)
		cancel()

		_, err := svc.AddWorkerService(cancCtx, worker.ID, &domain.CreateServicePayload{
			Name:  "Layanan Cancel",
			Price: 80000,
		})
		require.Error(t, err)
		assert.ErrorIs(t, err, context.Canceled)
	})
}

func TestWorkerService_CredentialReset(t *testing.T) {
	ctx := context.Background()

	setupWorkerWithAccount := func(t *testing.T) (*repository.MemoryRepository, service.WorkerService, *domain.Worker, *domain.WorkerAccount) {
		repo := repository.NewMemoryRepository()
		svc := service.NewWorkerService(repo)

		workerID := "worker-reset-1"
		worker := &domain.Worker{
			ID:             workerID,
			Slug:           "budi-teknisi",
			Name:           "Budi Santoso",
			PhoneNumber:    "6281234567890",
			WhatsAppNumber: "6281234567890",
			IsActive:       true,
		}
		repo.SeedWorker(worker)

		initialHash, err := auth.HashPassword("123987")
		require.NoError(t, err)

		account := &domain.WorkerAccount{
			ID:           "acc-reset-1",
			WorkerID:     &workerID,
			PhoneNumber:  "6281234567890",
			PasswordHash: initialHash,
			Role:         domain.RoleWorker,
		}
		repo.SeedAccount(account)

		return repo, svc, worker, account
	}

	t.Run("berhasil mengajukan reset PIN dan menghasilkan tautan WhatsApp admin", func(t *testing.T) {
		_, svc, worker, _ := setupWorkerWithAccount(t)

		res, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePIN,
		})
		require.NoError(t, err)
		assert.Equal(t, worker.Name, res.WorkerName)
		assert.Equal(t, worker.WhatsAppNumber, res.PhoneNumber)
		assert.Contains(t, res.WhatsAppMessage, "Reset PIN Keamanan")
		assert.Contains(t, res.WhatsAppShareURL, "wa.me")
	})

	t.Run("gagal mengajukan reset jika akun tidak ditemukan", func(t *testing.T) {
		_, svc, _, _ := setupWorkerWithAccount(t)

		_, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: "628999999999",
			RequestType: domain.ResetTypePIN,
		})
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})

	t.Run("gagal mengajukan reset kedua kali saat permohonan pertama masih aktif (cooldown)", func(t *testing.T) {
		_, svc, worker, _ := setupWorkerWithAccount(t)

		_, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePIN,
		})
		require.NoError(t, err)

		_, err2 := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePIN,
		})
		require.Error(t, err2)
		assert.Contains(t, err2.Error(), "masih aktif dan belum kedaluwarsa")
	})

	t.Run("alur lengkap: permohonan -> verifikasi admin -> persetujuan admin -> eksekusi reset PIN baru", func(t *testing.T) {
		_, svc, worker, account := setupWorkerWithAccount(t)

		// 1. Pengajuan oleh mitra
		reqRes, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePIN,
		})
		require.NoError(t, err)

		// Ekstrak raw token dari pesan WhatsApp admin
		msg := reqRes.WhatsAppMessage
		tokenIdx := strings.Index(msg, "token=")
		require.True(t, tokenIdx != -1)
		rawTier1Token := strings.TrimSpace(msg[tokenIdx+len("token="):])
		endIdx := strings.IndexAny(rawTier1Token, " \n\r\t")
		if endIdx != -1 {
			rawTier1Token = rawTier1Token[:endIdx]
		}

		// 2. Admin membuka tautan verifikasi
		view, err := svc.VerifyResetRequestByAdmin(ctx, rawTier1Token)
		require.NoError(t, err)
		assert.Equal(t, worker.Name, view.WorkerName)
		assert.Equal(t, worker.WhatsAppNumber, view.WorkerPhone)
		assert.False(t, view.IsApproved)

		// 3. Admin menyetujui permohonan
		approveRes, err := svc.ApproveCredentialReset(ctx, "admin-1", rawTier1Token)
		require.NoError(t, err)
		assert.Contains(t, approveRes.WhatsAppMessage, "telah disetujui")

		// Ekstrak tier-2 execution token
		execIdx := strings.Index(approveRes.ExecutionURL, "token=")
		require.True(t, execIdx != -1)
		rawTier2Token := approveRes.ExecutionURL[execIdx+len("token="):]

		// 4. Mitra mengeksekusi reset PIN baru
		newPIN := "852963"
		err = svc.ExecuteCredentialReset(ctx, &domain.ExecuteCredentialResetPayload{
			ExecutionToken: rawTier2Token,
			PhoneNumber:    worker.WhatsAppNumber,
			NewPIN:         newPIN,
		})
		require.NoError(t, err)

		// 5. Verifikasi PIN lama tidak berlaku dan PIN baru sukses untuk login
		_, errOld := svc.Authenticate(ctx, worker.WhatsAppNumber, "123987")
		require.Error(t, errOld)

		loginRes, errNew := svc.Authenticate(ctx, worker.WhatsAppNumber, newPIN)
		require.NoError(t, errNew)
		assert.Equal(t, account.ID, loginRes.Session.ID)

		// 6. Token tier-2 tidak dapat digunakan kembali (single-use)
		errReuse := svc.ExecuteCredentialReset(ctx, &domain.ExecuteCredentialResetPayload{
			ExecutionToken: rawTier2Token,
			PhoneNumber:    worker.WhatsAppNumber,
			NewPIN:         "741852",
		})
		require.Error(t, errReuse)
		assert.Contains(t, errReuse.Error(), "sudah pernah digunakan")
	})

	t.Run("alur ganti nomor WhatsApp: memperbarui nomor pada akun dan profil", func(t *testing.T) {
		repo, svc, worker, _ := setupWorkerWithAccount(t)

		// 1. Pengajuan ganti nomor
		reqRes, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePhone,
		})
		require.NoError(t, err)

		tokenIdx := strings.Index(reqRes.WhatsAppMessage, "token=")
		rawTier1Token := reqRes.WhatsAppMessage[tokenIdx+len("token="):]
		endIdx := strings.IndexAny(rawTier1Token, " \n\r\t")
		if endIdx != -1 {
			rawTier1Token = rawTier1Token[:endIdx]
		}

		// 2. Persetujuan admin
		approveRes, err := svc.ApproveCredentialReset(ctx, "admin-1", rawTier1Token)
		require.NoError(t, err)

		execIdx := strings.Index(approveRes.ExecutionURL, "token=")
		rawTier2Token := approveRes.ExecutionURL[execIdx+len("token="):]

		// 3. Eksekusi dengan nomor WhatsApp baru
		newPhone := "6285678901234"
		newPIN := "963852"
		err = svc.ExecuteCredentialReset(ctx, &domain.ExecuteCredentialResetPayload{
			ExecutionToken: rawTier2Token,
			PhoneNumber:    worker.WhatsAppNumber,
			NewPhoneNumber: newPhone,
			NewPIN:         newPIN,
		})
		require.NoError(t, err)

		// 4. Verifikasi akun dan profil terbarui
		accUpdated, err := repo.GetAccountByEmailOrPhone(ctx, newPhone)
		require.NoError(t, err)
		assert.Equal(t, newPhone, accUpdated.PhoneNumber)

		wUpdated, err := repo.GetByID(ctx, worker.ID)
		require.NoError(t, err)
		assert.Equal(t, newPhone, wUpdated.WhatsAppNumber)

		// Login dengan nomor baru dan PIN baru
		loginRes, err := svc.Authenticate(ctx, newPhone, newPIN)
		require.NoError(t, err)
		assert.Equal(t, accUpdated.ID, loginRes.Session.ID)
	})

	t.Run("gagal eksekusi jika PIN baru lemah atau urutan angka berulang", func(t *testing.T) {
		_, svc, worker, _ := setupWorkerWithAccount(t)

		reqRes, err := svc.RequestCredentialReset(ctx, &domain.CredentialResetRequestPayload{
			PhoneNumber: worker.WhatsAppNumber,
			RequestType: domain.ResetTypePIN,
		})
		require.NoError(t, err)

		tokenIdx := strings.Index(reqRes.WhatsAppMessage, "token=")
		rawTier1Token := reqRes.WhatsAppMessage[tokenIdx+len("token="):]
		endIdx := strings.IndexAny(rawTier1Token, " \n\r\t")
		if endIdx != -1 {
			rawTier1Token = rawTier1Token[:endIdx]
		}

		approveRes, err := svc.ApproveCredentialReset(ctx, "admin-1", rawTier1Token)
		require.NoError(t, err)

		execIdx := strings.Index(approveRes.ExecutionURL, "token=")
		rawTier2Token := approveRes.ExecutionURL[execIdx+len("token="):]

		// Coba PIN 123456
		errWeak := svc.ExecuteCredentialReset(ctx, &domain.ExecuteCredentialResetPayload{
			ExecutionToken: rawTier2Token,
			PhoneNumber:    worker.WhatsAppNumber,
			NewPIN:         "123456",
		})
		require.Error(t, errWeak)
		assert.Contains(t, errWeak.Error(), "PIN terlalu lemah")
	})
}


