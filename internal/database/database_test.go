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

func TestAutoMigrateAndSeedData(t *testing.T) {
	ctx := context.Background()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// First AutoMigrate should create tables and seed default data
	err = database.AutoMigrate(ctx, db)
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

	// Second AutoMigrate should be idempotent and not re-seed duplicates
	err = database.AutoMigrate(ctx, db)
	require.NoError(t, err)

	var workerCountAfter int64
	err = db.Model(&domain.Worker{}).Count(&workerCountAfter).Error
	require.NoError(t, err)
	assert.Equal(t, int64(2), workerCountAfter)
}

func TestMigrateSchemaAndSeedIfEmpty(t *testing.T) {
	ctx := context.Background()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Migrate schema only
	err = database.MigrateSchema(ctx, db)
	require.NoError(t, err)

	// Workers should be 0 since SeedIfEmpty was not invoked
	var count int64
	err = db.Model(&domain.Worker{}).Count(&count).Error
	require.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// Now run SeedIfEmpty
	err = database.SeedIfEmpty(ctx, db)
	require.NoError(t, err)

	err = db.Model(&domain.Worker{}).Count(&count).Error
	require.NoError(t, err)
	assert.Equal(t, int64(2), count)

	// Running SeedIfEmpty again should do nothing
	err = database.SeedIfEmpty(ctx, db)
	require.NoError(t, err)

	err = db.Model(&domain.Worker{}).Count(&count).Error
	require.NoError(t, err)
	assert.Equal(t, int64(2), count)
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
