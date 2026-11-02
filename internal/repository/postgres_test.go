package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.AutoMigrate(&domain.Worker{}, &domain.Service{}, &domain.Booking{})
	require.NoError(t, err)

	return db
}

func TestPostgresWorkerRepository_GetBySlug(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns worker", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:          "w-001",
			Slug:        "budi-santoso",
			Name:        "Budi Santoso",
			Bio:         "Teknisi AC",
			AvatarURL:   "https://img.jpg",
			Rating:      4.9,
			ReviewCount: 42,
			Zone:        "Jakarta Selatan",
			PhoneNumber: "+62812345678",
			Email:       "budi@tuwaktu.com",
			Address:     "Jl. Fatmawati",
			IsActive:    true,
			CreatedAt:   time.Now().UTC(),
			UpdatedAt:   time.Now().UTC(),
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		worker, err := repo.GetBySlug(ctx, "budi-santoso")
		require.NoError(t, err)
		require.NotNil(t, worker)
		assert.Equal(t, "w-001", worker.ID)
		assert.Equal(t, "budi-santoso", worker.Slug)
		assert.Equal(t, "Budi Santoso", worker.Name)
		assert.Equal(t, 4.9, worker.Rating)
		assert.True(t, worker.IsActive)
	})

	t.Run("case-insensitive slug lookup", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-002",
			Slug:     "siti-aminah",
			Name:     "Siti Aminah",
			Zone:     "Tangerang",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewGormWorkerRepository(db)
		worker, err := repo.GetBySlug(ctx, "Siti-Aminah")
		require.NoError(t, err)
		require.NotNil(t, worker)
		assert.Equal(t, "siti-aminah", worker.Slug)
	})

	t.Run("not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker, err := repo.GetBySlug(ctx, "unknown")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, worker)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		worker, err := repo.GetBySlug(canceledCtx, "any-worker")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying worker by slug")
		assert.Nil(t, worker)
	})
}

func TestPostgresWorkerRepository_GetByID(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns worker", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-001",
			Slug:     "budi-santoso",
			Name:     "Budi Santoso",
			Zone:     "Jakarta",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		worker, err := repo.GetByID(ctx, "w-001")
		require.NoError(t, err)
		require.NotNil(t, worker)
		assert.Equal(t, "w-001", worker.ID)
	})

	t.Run("not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker, err := repo.GetByID(ctx, "w-none")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, worker)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		worker, err := repo.GetByID(canceledCtx, "w-001")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying worker by id")
		assert.Nil(t, worker)
	})
}

func TestPostgresWorkerRepository_GetServicesByWorkerID(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns active services ordered by price ASC", func(t *testing.T) {
		db := setupTestDB(t)
		s1 := domain.Service{
			ID:              "srv-expensive",
			WorkerID:        "w-001",
			Name:            "Expensive Service",
			Price:           200000.0,
			DurationMinutes: 60,
			IsActive:        true,
		}
		s2 := domain.Service{
			ID:              "srv-cheap",
			WorkerID:        "w-001",
			Name:            "Cheap Service",
			Price:           50000.0,
			DurationMinutes: 30,
			IsActive:        true,
		}
		s3 := domain.Service{
			ID:              "srv-inactive",
			WorkerID:        "w-001",
			Name:            "Inactive Service",
			Price:           10000.0,
			DurationMinutes: 15,
			IsActive:        false, // Should be ignored
		}
		require.NoError(t, db.Create(&s1).Error)
		require.NoError(t, db.Create(&s2).Error)
		require.NoError(t, db.Create(&s3).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		services, err := repo.GetServicesByWorkerID(ctx, "w-001")
		require.NoError(t, err)
		require.Len(t, services, 2)
		assert.Equal(t, "srv-cheap", services[0].ID)
		assert.Equal(t, 50000.0, services[0].Price)
		assert.Equal(t, "srv-expensive", services[1].ID)
		assert.Equal(t, 200000.0, services[1].Price)
	})

	t.Run("returns empty slice when no services match", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		services, err := repo.GetServicesByWorkerID(ctx, "w-none")
		require.NoError(t, err)
		assert.Empty(t, services)
		assert.NotNil(t, services)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		services, err := repo.GetServicesByWorkerID(canceledCtx, "w-001")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying services by worker_id")
		assert.Nil(t, services)
	})
}

func TestPostgresBookingRepository_CreateBooking(t *testing.T) {
	ctx := context.Background()

	t.Run("success persists booking", func(t *testing.T) {
		db := setupTestDB(t)
		now := time.Now().UTC().Truncate(time.Second)
		booking := &domain.Booking{
			ID:          "bkg-123",
			BookingCode: "TW-20261102-ABCDEF12",
			WorkerID:    "w-001",
			ServiceID:   "srv-001",
			ClientName:  "Dewi",
			ClientPhone: "+62899",
			ClientEmail: "dewi@example.com",
			Location:    "Jakarta Barat",
			Zone:        "Jakarta Barat",
			BookingDate: now.Add(24 * time.Hour),
			Notes:       "Depan taman",
			TotalPrice:  75000,
			Status:      "PENDING",
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		repo := repository.NewPostgresBookingRepository(db)
		err := repo.CreateBooking(ctx, booking)
		require.NoError(t, err)

		var saved domain.Booking
		err = db.Where("id = ?", "bkg-123").First(&saved).Error
		require.NoError(t, err)
		assert.Equal(t, "bkg-123", saved.ID)
		assert.Equal(t, "TW-20261102-ABCDEF12", saved.BookingCode)
		assert.Equal(t, "Dewi", saved.ClientName)
		assert.Equal(t, 75000.0, saved.TotalPrice)
		assert.Equal(t, "PENDING", saved.Status)
	})

	t.Run("success persists booking with pre-attached associations without duplicate creation", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-assoc-1",
			Slug:     "worker-assoc",
			Name:     "Worker Assoc",
			Zone:     "Jakarta",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		s := domain.Service{
			ID:              "srv-assoc-1",
			WorkerID:        w.ID,
			Name:            "Service Assoc",
			Price:           100000,
			DurationMinutes: 60,
			IsActive:        true,
		}
		require.NoError(t, db.Create(&s).Error)

		now := time.Now().UTC().Truncate(time.Second)
		booking := &domain.Booking{
			ID:          "bkg-assoc-123",
			BookingCode: "TW-ASSOC-123",
			WorkerID:    w.ID,
			ServiceID:   s.ID,
			ClientName:  "Assoc Client",
			Location:    "Jakarta",
			Zone:        "Jakarta",
			BookingDate: now.Add(24 * time.Hour),
			TotalPrice:  100000,
			Status:      "PENDING",
			CreatedAt:   now,
			UpdatedAt:   now,
			Worker:      &w, // Association pre-attached
			Service:     &s, // Association pre-attached
		}

		repo := repository.NewPostgresBookingRepository(db)
		err := repo.CreateBooking(ctx, booking)
		require.NoError(t, err)

		var saved domain.Booking
		require.NoError(t, db.Where("id = ?", "bkg-assoc-123").First(&saved).Error)
		assert.Equal(t, "bkg-assoc-123", saved.ID)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		err := repo.CreateBooking(canceledCtx, &domain.Booking{ID: "err-bkg"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "inserting booking")
	})
}

func TestPostgresBookingRepository_GetServiceByID(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns service", func(t *testing.T) {
		db := setupTestDB(t)
		srv := domain.Service{
			ID:              "srv-001",
			WorkerID:        "w-001",
			Name:            "Reparasi AC",
			Description:     "Desc",
			Price:           120000.0,
			DurationMinutes: 90,
			IsActive:        true,
		}
		require.NoError(t, db.Create(&srv).Error)

		repo := repository.NewPostgresBookingRepository(db)
		res, err := repo.GetServiceByID(ctx, "srv-001")
		require.NoError(t, err)
		assert.Equal(t, "srv-001", res.ID)
		assert.Equal(t, "Reparasi AC", res.Name)
		assert.Equal(t, 120000.0, res.Price)
	})

	t.Run("lookup by service name", func(t *testing.T) {
		db := setupTestDB(t)
		srv := domain.Service{
			ID:              "srv-name-1",
			WorkerID:        "w-001",
			Name:            "Cuci AC Berkualitas",
			Price:           80000.0,
			DurationMinutes: 45,
			IsActive:        true,
		}
		require.NoError(t, db.Create(&srv).Error)

		repo := repository.NewPostgresBookingRepository(db)
		res, err := repo.GetServiceByID(ctx, "Cuci AC Berkualitas")
		require.NoError(t, err)
		assert.Equal(t, "srv-name-1", res.ID)

		// Case-insensitive test
		resLower, err := repo.GetServiceByID(ctx, "cuci ac berkualitas")
		require.NoError(t, err)
		assert.Equal(t, "srv-name-1", resLower.ID)
	})

	t.Run("lookup by valid UUID", func(t *testing.T) {
		db := setupTestDB(t)
		srv := domain.Service{
			ID:              "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
			WorkerID:        "w-001",
			Name:            "UUID Service",
			Price:           99000.0,
			DurationMinutes: 30,
			IsActive:        true,
		}
		require.NoError(t, db.Create(&srv).Error)

		repo := repository.NewPostgresBookingRepository(db)
		res, err := repo.GetServiceByID(ctx, "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d")
		require.NoError(t, err)
		assert.Equal(t, "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", res.ID)
	})

	t.Run("not found returns ErrServiceNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		res, err := repo.GetServiceByID(ctx, "srv-missing")
		assert.ErrorIs(t, err, domain.ErrServiceNotFound)
		assert.Nil(t, res)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		res, err := repo.GetServiceByID(canceledCtx, "srv-001")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying service by id")
		assert.Nil(t, res)
	})
}

func TestPostgresBookingRepository_GetWorkerByID(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns worker", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-001",
			Slug:     "budi-santoso",
			Name:     "Budi",
			Zone:     "Jakarta",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresBookingRepository(db)
		res, err := repo.GetWorkerByID(ctx, "w-001")
		require.NoError(t, err)
		assert.Equal(t, "w-001", res.ID)
	})

	t.Run("not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		res, err := repo.GetWorkerByID(ctx, "w-missing")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, res)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		res, err := repo.GetWorkerByID(canceledCtx, "w-001")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying worker by id")
		assert.Nil(t, res)
	})
}

func TestPostgresBookingRepository_GetWorkerBySlug(t *testing.T) {
	ctx := context.Background()

	t.Run("success returns worker", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-002",
			Slug:     "siti-aminah",
			Name:     "Siti Aminah",
			Zone:     "Tangerang",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresBookingRepository(db)
		res, err := repo.GetWorkerBySlug(ctx, "siti-aminah")
		require.NoError(t, err)
		assert.Equal(t, "w-002", res.ID)
		assert.Equal(t, "siti-aminah", res.Slug)
	})

	t.Run("case-insensitive lookup", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-002",
			Slug:     "siti-aminah",
			Name:     "Siti Aminah",
			Zone:     "Tangerang",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewGormBookingRepository(db)
		res, err := repo.GetWorkerBySlug(ctx, "SITI-AMINAH")
		require.NoError(t, err)
		assert.Equal(t, "w-002", res.ID)
	})

	t.Run("not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		res, err := repo.GetWorkerBySlug(ctx, "unknown-slug")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
		assert.Nil(t, res)
	})

	t.Run("query error on canceled context", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		canceledCtx, cancel := context.WithCancel(context.Background())
		cancel()

		res, err := repo.GetWorkerBySlug(canceledCtx, "any-slug")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "querying worker by slug")
		assert.Nil(t, res)
	})
}
