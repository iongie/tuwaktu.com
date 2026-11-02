package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"tuwaktu.com/internal/config"
	"tuwaktu.com/internal/database"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE workers (
			id TEXT PRIMARY KEY,
			slug TEXT UNIQUE,
			name TEXT,
			bio TEXT,
			avatar_url TEXT,
			rating REAL,
			review_count INTEGER,
			zone TEXT,
			base_price REAL DEFAULT 0.00,
			rate_type TEXT DEFAULT 'HOURLY',
			lat REAL,
			lng REAL,
			max_radius_km REAL DEFAULT 10.00,
			free_radius_km REAL DEFAULT 3.00,
			extra_fee_per_km INTEGER DEFAULT 0,
			phone_number TEXT,
			email TEXT,
			address TEXT,
			is_active BOOLEAN,
			created_at DATETIME,
			updated_at DATETIME
		);
		CREATE TABLE services (
			id TEXT PRIMARY KEY,
			worker_id TEXT,
			name TEXT,
			description TEXT,
			price REAL,
			base_price REAL DEFAULT 0.00,
			rate_type TEXT DEFAULT 'HOURLY',
			duration_minutes INTEGER,
			is_active BOOLEAN,
			created_at DATETIME,
			updated_at DATETIME
		);
		CREATE TABLE worker_schedules (
			id TEXT PRIMARY KEY,
			worker_id TEXT,
			day_of_week INTEGER,
			is_active BOOLEAN,
			slot_morning BOOLEAN,
			slot_afternoon BOOLEAN,
			slot_evening BOOLEAN,
			created_at DATETIME,
			updated_at DATETIME
		);
		CREATE TABLE bookings (
			id TEXT PRIMARY KEY,
			booking_code TEXT UNIQUE,
			worker_id TEXT,
			service_id TEXT,
			client_name TEXT,
			client_phone TEXT,
			client_email TEXT,
			location TEXT,
			zone TEXT,
			booking_date DATETIME,
			start_time DATETIME,
			end_time DATETIME,
			notes TEXT,
			total_price REAL,
			status TEXT,
			created_at DATETIME,
			updated_at DATETIME
		);
	`).Error
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

func TestPostgresWorkerRepository_UpdateProfile(t *testing.T) {
	ctx := context.Background()

	t.Run("success updates worker profile and updated_at", func(t *testing.T) {
		db := setupTestDB(t)
		initialTime := time.Now().Add(-1 * time.Hour).UTC()
		w := domain.Worker{
			ID:          "w-update-101",
			Slug:        "supardi-kebun",
			Name:        "Supardi",
			Bio:         "Bio lama",
			AvatarURL:   "https://example.com/old.jpg",
			Zone:        "Jakarta Barat",
			PhoneNumber: "+6281111111",
			Email:       "old@tuwaktu.com",
			Address:     "Alamat Lama",
			IsActive:    true,
			CreatedAt:   initialTime,
			UpdatedAt:   initialTime,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		updatePayload := &domain.WorkerProfileUpdate{
			Name:        "Supardi Baru",
			Bio:         "Bio baru diperbarui",
			AvatarURL:   "https://example.com/new.jpg",
			Zone:        "Jakarta Selatan",
			PhoneNumber: "+6289999999",
			Email:       "new@tuwaktu.com",
			Address:     "Alamat Baru",
		}

		updated, err := repo.UpdateProfile(ctx, "w-update-101", updatePayload)
		require.NoError(t, err)
		require.NotNil(t, updated)

		assert.Equal(t, "Supardi Baru", updated.Name)
		assert.Equal(t, "Bio baru diperbarui", updated.Bio)
		assert.Equal(t, "https://example.com/new.jpg", updated.AvatarURL)
		assert.Equal(t, "Jakarta Selatan", updated.Zone)
		assert.Equal(t, "+6289999999", updated.PhoneNumber)
		assert.Equal(t, "new@tuwaktu.com", updated.Email)
		assert.Equal(t, "Alamat Baru", updated.Address)
		assert.True(t, updated.UpdatedAt.After(initialTime))

		// Verify re-fetch from database
		persisted, err := repo.GetByID(ctx, "w-update-101")
		require.NoError(t, err)
		assert.Equal(t, "Supardi Baru", persisted.Name)
		assert.Equal(t, "Bio baru diperbarui", persisted.Bio)
	})

	t.Run("partial update preserves existing optional fields", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:          "w-update-102",
			Slug:        "budi-teknisi",
			Name:        "Budi",
			Bio:         "Bio Budi",
			AvatarURL:   "https://example.com/avatar.jpg",
			Zone:        "Jakarta Timur",
			PhoneNumber: "+6285555555",
			Email:       "budi@tuwaktu.com",
			Address:     "Jl. Rawamangun",
			IsActive:    true,
			CreatedAt:   time.Now().UTC(),
			UpdatedAt:   time.Now().UTC(),
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		// Only update name and bio, leave others empty
		partialUpdate := &domain.WorkerProfileUpdate{
			Name: "Budi Updated",
			Bio:  "Bio Budi Baru",
		}

		updated, err := repo.UpdateProfile(ctx, "w-update-102", partialUpdate)
		require.NoError(t, err)
		assert.Equal(t, "Budi Updated", updated.Name)
		assert.Equal(t, "Bio Budi Baru", updated.Bio)
		assert.Equal(t, "https://example.com/avatar.jpg", updated.AvatarURL)
		assert.Equal(t, "Jakarta Timur", updated.Zone)
		assert.Equal(t, "+6285555555", updated.PhoneNumber)
	})

	t.Run("nil profile returns ErrInvalidInput", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.UpdateProfile(ctx, "w-001", nil)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("success updates profile using worker slug", func(t *testing.T) {
		db := setupTestDB(t)
		w := domain.Worker{
			ID:       "w-slug-update",
			Slug:     "anton-ac",
			Name:     "Anton Asli",
			Zone:     "Jakarta",
			IsActive: true,
		}
		require.NoError(t, db.Create(&w).Error)

		repo := repository.NewPostgresWorkerRepository(db)
		updated, err := repo.UpdateProfile(ctx, "anton-ac", &domain.WorkerProfileUpdate{
			Name: "Anton AC Profesional",
		})
		require.NoError(t, err)
		assert.Equal(t, "Anton AC Profesional", updated.Name)
	})

	t.Run("worker not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.UpdateProfile(ctx, "non-existent-worker-id", &domain.WorkerProfileUpdate{Name: "Name"})
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})

	t.Run("canceled context returns error", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		canceledCtx, cancel := context.WithCancel(ctx)
		cancel()

		_, err := repo.UpdateProfile(canceledCtx, "w-001", &domain.WorkerProfileUpdate{Name: "Name"})
		require.Error(t, err)
		assert.Contains(t, err.Error(), "updating worker profile")
	})
}

func TestPostgresWorkerRepository_UpdateRates(t *testing.T) {
	ctx := context.Background()

	t.Run("success updates rates by worker id", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker := &domain.Worker{
			ID:        "w-rates-01",
			Slug:      "budi-rate",
			Name:      "Budi Rate",
			Zone:      "Jakarta",
			BasePrice: 50000,
			RateType:  "HOURLY",
			IsActive:  true,
		}
		require.NoError(t, db.Create(worker).Error)

		updated, err := repo.UpdateRates(ctx, "w-rates-01", 125000, "UNIT")
		require.NoError(t, err)
		assert.Equal(t, 125000.0, updated.BasePrice)
		assert.Equal(t, "UNIT", updated.RateType)

		// Verify database persistence
		var fetched domain.Worker
		err = db.Where("id = ?", "w-rates-01").First(&fetched).Error
		require.NoError(t, err)
		assert.Equal(t, 125000.0, fetched.BasePrice)
		assert.Equal(t, "UNIT", fetched.RateType)
	})

	t.Run("success updates rates by worker slug", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker := &domain.Worker{
			ID:        "w-rates-02",
			Slug:      "siti-rate",
			Name:      "Siti Rate",
			Zone:      "Tangsel",
			BasePrice: 80000,
			RateType:  "HOURLY",
			IsActive:  true,
		}
		require.NoError(t, db.Create(worker).Error)

		updated, err := repo.UpdateRates(ctx, "siti-rate", 175000, "HOURLY")
		require.NoError(t, err)
		assert.Equal(t, 175000.0, updated.BasePrice)
		assert.Equal(t, "HOURLY", updated.RateType)
	})

	t.Run("empty identifier returns ErrInvalidInput", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.UpdateRates(ctx, "   ", 100000, "HOURLY")
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("worker not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.UpdateRates(ctx, "non-existent-worker", 100000, "HOURLY")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})
}

func TestPostgresWorkerRepository_UpdateLocationSettings(t *testing.T) {
	ctx := context.Background()

	t.Run("successfully updates worker location settings by ID", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		workerID := uuid.New().String()
		worker := &domain.Worker{
			ID:          workerID,
			Slug:        "tono-reparasi",
			Name:        "Tono Reparasi",
			Zone:        "Jakarta Selatan",
			MaxRadiusKM: 10.0,
			IsActive:    true,
		}
		require.NoError(t, db.Create(worker).Error)

		newLat := -6.2200
		newLng := 106.8300
		update := &domain.WorkerLocationSettingsUpdate{
			WorkerID:      workerID,
			Lat:           &newLat,
			Lng:           &newLng,
			MaxRadiusKM:   18.0,
			FreeRadiusKM:  4.0,
			ExtraFeePerKM: 6000,
		}

		updated, err := repo.UpdateLocationSettings(ctx, workerID, update)
		require.NoError(t, err)
		require.NotNil(t, updated)
		require.NotNil(t, updated.Lat)
		require.NotNil(t, updated.Lng)
		assert.InDelta(t, newLat, *updated.Lat, 0.0001)
		assert.InDelta(t, newLng, *updated.Lng, 0.0001)
		assert.Equal(t, 18.0, updated.MaxRadiusKM)
		assert.Equal(t, 4.0, updated.FreeRadiusKM)
		assert.Equal(t, 6000, updated.ExtraFeePerKM)
	})

	t.Run("successfully updates worker location settings by slug", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		workerID := uuid.New().String()
		worker := &domain.Worker{
			ID:          workerID,
			Slug:        "jono-pipa",
			Name:        "Jono Pipa",
			Zone:        "Jakarta Barat",
			MaxRadiusKM: 10.0,
			IsActive:    true,
		}
		require.NoError(t, db.Create(worker).Error)

		newLat := -6.1500
		newLng := 106.7500
		update := &domain.WorkerLocationSettingsUpdate{
			WorkerID:      "jono-pipa",
			Lat:           &newLat,
			Lng:           &newLng,
			MaxRadiusKM:   25.0,
			FreeRadiusKM:  5.0,
			ExtraFeePerKM: 7500,
		}

		updated, err := repo.UpdateLocationSettings(ctx, "jono-pipa", update)
		require.NoError(t, err)
		assert.Equal(t, 25.0, updated.MaxRadiusKM)
	})

	t.Run("empty identifier or nil update returns ErrInvalidInput", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err1 := repo.UpdateLocationSettings(ctx, "", &domain.WorkerLocationSettingsUpdate{MaxRadiusKM: 10})
		assert.ErrorIs(t, err1, domain.ErrInvalidInput)

		_, err2 := repo.UpdateLocationSettings(ctx, "valid-id", nil)
		assert.ErrorIs(t, err2, domain.ErrInvalidInput)
	})

	t.Run("worker not found returns ErrWorkerNotFound", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.UpdateLocationSettings(ctx, "non-existent-worker-uuid", &domain.WorkerLocationSettingsUpdate{MaxRadiusKM: 10})
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})
}

func TestPostgresWorkerRepository_Schedules(t *testing.T) {
	ctx := context.Background()

	t.Run("returns default 7 days when no schedule exists in DB", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker := &domain.Worker{
			ID:       "w-sched-pg-1",
			Slug:     "agus-sched",
			Name:     "Agus",
			IsActive: true,
		}
		require.NoError(t, db.Create(worker).Error)

		schedules, err := repo.GetWorkerSchedules(ctx, "agus-sched")
		require.NoError(t, err)
		assert.Len(t, schedules, 7)
		assert.Equal(t, "Minggu", schedules[0].DayName)
		assert.Equal(t, "Senin", schedules[1].DayName)
	})

	t.Run("successfully creates and updates worker schedules in DB", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		worker := &domain.Worker{
			ID:       "w-sched-pg-2",
			Slug:     "bambang-sched",
			Name:     "Bambang",
			IsActive: true,
		}
		require.NoError(t, db.Create(worker).Error)

		items := []domain.WorkerSchedule{
			{DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: true},
			{DayOfWeek: 2, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		}

		updated, err := repo.UpdateWorkerSchedules(ctx, worker.ID, items)
		require.NoError(t, err)
		require.NotEmpty(t, updated)

		var monday *domain.WorkerSchedule
		for i := range updated {
			if updated[i].DayOfWeek == 1 {
				monday = &updated[i]
				break
			}
		}
		require.NotNil(t, monday)
		assert.True(t, monday.IsActive)
		assert.True(t, monday.SlotMorning)
		assert.False(t, monday.SlotAfternoon)
		assert.True(t, monday.SlotEvening)
		assert.NotEmpty(t, monday.ID)
	})

	t.Run("returns ErrWorkerNotFound on non-existent worker", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresWorkerRepository(db)

		_, err := repo.GetWorkerSchedules(ctx, "none")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)

		_, err2 := repo.UpdateWorkerSchedules(ctx, "none", []domain.WorkerSchedule{{DayOfWeek: 1}})
		assert.ErrorIs(t, err2, domain.ErrWorkerNotFound)
	})
}

func TestPostgresBookingRepository_BookingsAndSchedules(t *testing.T) {
	ctx := context.Background()

	t.Run("queries bookings by worker and date range with start_time and end_time", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		workerID := "w-bkg-pg-1"
		w := &domain.Worker{ID: workerID, Slug: "tono-bkg", Name: "Tono", IsActive: true}
		require.NoError(t, db.Create(w).Error)

		baseDate := time.Date(2026, 11, 10, 10, 0, 0, 0, time.UTC)
		b1Start := baseDate
		b1End := baseDate.Add(2 * time.Hour)
		b1 := &domain.Booking{
			ID:          "bkg-pg-1",
			BookingCode: "TW-PG-001",
			WorkerID:    workerID,
			ServiceID:   "srv-1",
			ClientName:  "Klien 1",
			BookingDate: b1Start,
			StartTime:   &b1Start,
			EndTime:     &b1End,
			Status:      "CONFIRMED",
		}
		require.NoError(t, db.Create(b1).Error)

		// Overlapping range [09:00, 11:00]
		results, err := repo.GetBookingsByWorkerAndDateRange(ctx, workerID, baseDate.Add(-1*time.Hour), baseDate.Add(1*time.Hour))
		require.NoError(t, err)
		assert.Len(t, results, 1)
		assert.Equal(t, "bkg-pg-1", results[0].ID)

		// Non-overlapping range [13:00, 15:00]
		nonOverlapping, err := repo.GetBookingsByWorkerAndDateRange(ctx, workerID, baseDate.Add(3*time.Hour), baseDate.Add(5*time.Hour))
		require.NoError(t, err)
		assert.Empty(t, nonOverlapping)
	})

	t.Run("GetWorkerSchedules from PostgresBookingRepository", func(t *testing.T) {
		db := setupTestDB(t)
		repo := repository.NewPostgresBookingRepository(db)

		workerID := "w-bkg-pg-2"
		w := &domain.Worker{ID: workerID, Slug: "joko-bkg", Name: "Joko", IsActive: true}
		require.NoError(t, db.Create(w).Error)

		schedules, err := repo.GetWorkerSchedules(ctx, "joko-bkg")
		require.NoError(t, err)
		assert.Len(t, schedules, 7)
	})
}



func TestPostgresWorkerRepository_RealPostgresIntegration(t *testing.T) {
	cfg := config.LoadConfig()
	db, err := database.NewGormDBWithConfig(cfg)
	if err != nil {
		t.Skip("PostgreSQL not available for integration test:", err)
	}

	ctx := context.Background()
	repo := repository.NewPostgresWorkerRepository(db)

	// Test UpdateRates using slug against real PostgreSQL with UUID column
	updated, err := repo.UpdateRates(ctx, "budi-santoso", 85000, "HOURLY")
	require.NoError(t, err)
	assert.Equal(t, 85000.0, updated.BasePrice)
	assert.Equal(t, "HOURLY", updated.RateType)

	// Test UpdateProfile using slug against real PostgreSQL
	profUpdated, err := repo.UpdateProfile(ctx, "budi-santoso", &domain.WorkerProfileUpdate{
		Name: "Budi Santoso",
	})
	require.NoError(t, err)
	assert.Equal(t, "Budi Santoso", profUpdated.Name)
}
