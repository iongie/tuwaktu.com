package database_test

import (
	"context"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"tuwaktu.com/internal/config"
	"tuwaktu.com/internal/database"
	"tuwaktu.com/internal/domain"
)

func TestSeedIfEmptyAndSeedData(t *testing.T) {
	ctx := context.Background()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Create tables using manual DDL to avoid AutoMigrate
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
			notes TEXT,
			total_price REAL,
			status TEXT,
			created_at DATETIME,
			updated_at DATETIME
		);
	`).Error
	require.NoError(t, err)

	// Workers should initially be 0
	var count int64
	err = db.Model(&domain.Worker{}).Count(&count).Error
	require.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// First SeedIfEmpty should populate workers and services
	err = database.SeedIfEmpty(ctx, db)
	require.NoError(t, err)

	var workerCount int64
	err = db.Model(&domain.Worker{}).Count(&workerCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(2), workerCount)

	var serviceCount int64
	err = db.Model(&domain.Service{}).Count(&serviceCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(5), serviceCount)

	// Verify specific worker data
	var budi domain.Worker
	err = db.Where("slug = ?", "budi-santoso").First(&budi).Error
	require.NoError(t, err)
	assert.Equal(t, "Budi Santoso", budi.Name)
	assert.Equal(t, 4.9, budi.Rating)

	// Second SeedIfEmpty should be idempotent and not re-seed duplicates
	err = database.SeedIfEmpty(ctx, db)
	require.NoError(t, err)

	var workerCountAfter int64
	err = db.Model(&domain.Worker{}).Count(&workerCountAfter).Error
	require.NoError(t, err)
	assert.Equal(t, int64(2), workerCountAfter)
}

func TestNewGormDBWithConfig_Validation(t *testing.T) {
	t.Run("nil config returns error without panic", func(t *testing.T) {
		db, err := database.NewGormDBWithConfig(nil)
		assert.Nil(t, db)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "database config cannot be nil")
	})

	t.Run("empty database URL returns error", func(t *testing.T) {
		db, err := database.NewGormDBWithConfig(&config.Config{DatabaseURL: "   "})
		assert.Nil(t, db)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "database URL cannot be empty")
	})
}
