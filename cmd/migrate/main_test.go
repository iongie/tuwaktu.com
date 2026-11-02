package main

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func openTestSQLDB(t *testing.T) (*sql.DB, string) {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test_migrate.db")

	gormDB, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	sqlDB, err := gormDB.DB()
	require.NoError(t, err)

	t.Cleanup(func() {
		_ = sqlDB.Close()
	})

	return sqlDB, dir
}

func createDummyMigrationFiles(t *testing.T, dir string) {
	t.Helper()

	up001 := `
		CREATE TABLE items (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL
		);
	`
	down001 := `
		DROP TABLE IF EXISTS items;
	`

	up002 := `
		CREATE TABLE tags (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
		);
	`
	down002 := `
		DROP TABLE IF EXISTS tags;
	`

	seed := `
		INSERT INTO items (id, title) VALUES ('it-1', 'Item Demo 1');
	`

	require.NoError(t, os.WriteFile(filepath.Join(dir, "000001_create_items.up.sql"), []byte(up001), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "000001_create_items.down.sql"), []byte(down001), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "000002_create_tags.up.sql"), []byte(up002), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "000002_create_tags.down.sql"), []byte(down002), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "seed.sql"), []byte(seed), 0644))
}

func TestMigrationRunner_Up_Down_Status_Seed(t *testing.T) {
	db, tempDir := openTestSQLDB(t)
	migrationsDir := filepath.Join(tempDir, "migrations")
	require.NoError(t, os.MkdirAll(migrationsDir, 0755))
	createDummyMigrationFiles(t, migrationsDir)

	// 1. Initial status should be all pending
	err := runStatus(db, migrationsDir)
	require.NoError(t, err)

	// 2. Run up: should apply 000001 and 000002
	err = runUp(db, migrationsDir)
	require.NoError(t, err)

	appliedMap, appliedList, err := getAppliedMigrations(db)
	require.NoError(t, err)
	assert.Len(t, appliedList, 2)
	assert.Contains(t, appliedMap, "000001_create_items")
	assert.Contains(t, appliedMap, "000002_create_tags")

	// Verify tables exist
	var count int
	err = db.QueryRow("SELECT count(*) FROM items").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 0, count)

	err = db.QueryRow("SELECT count(*) FROM tags").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 0, count)

	// 3. Run up again: should be idempotent and do nothing
	err = runUp(db, migrationsDir)
	require.NoError(t, err)

	// 4. Run seed
	err = runSeed(db, migrationsDir)
	require.NoError(t, err)

	err = db.QueryRow("SELECT count(*) FROM items").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 1, count)

	// 5. Run status
	err = runStatus(db, migrationsDir)
	require.NoError(t, err)

	// 6. Run down (revert 000002)
	err = runDown(db, migrationsDir)
	require.NoError(t, err)

	_, appliedListAfterRevert, err := getAppliedMigrations(db)
	require.NoError(t, err)
	assert.Len(t, appliedListAfterRevert, 1)
	assert.Equal(t, "000001_create_items", appliedListAfterRevert[0])

	// tags table should no longer exist
	_, err = db.Query("SELECT count(*) FROM tags")
	require.Error(t, err)

	// items table should still exist with seed
	err = db.QueryRow("SELECT count(*) FROM items").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 1, count)

	// 7. Run down again (revert 000001)
	err = runDown(db, migrationsDir)
	require.NoError(t, err)

	_, appliedListEmpty, err := getAppliedMigrations(db)
	require.NoError(t, err)
	assert.Empty(t, appliedListEmpty)

	// items table should no longer exist
	_, err = db.Query("SELECT count(*) FROM items")
	require.Error(t, err)

	// 8. Run down when empty should not error
	err = runDown(db, migrationsDir)
	require.NoError(t, err)
}

func TestMigrationRunner_EdgeCases(t *testing.T) {
	db, tempDir := openTestSQLDB(t)
	migrationsDir := filepath.Join(tempDir, "migrations")
	require.NoError(t, os.MkdirAll(migrationsDir, 0755))

	t.Run("empty migrations directory", func(t *testing.T) {
		err := runUp(db, migrationsDir)
		require.NoError(t, err)

		err = runStatus(db, migrationsDir)
		require.NoError(t, err)
	})

	t.Run("seed file not found returns error", func(t *testing.T) {
		err := runSeed(db, migrationsDir)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tidak ditemukan")
	})

	t.Run("down file not found returns error", func(t *testing.T) {
		// insert fake version
		err := ensureSchemaMigrationsTable(db)
		require.NoError(t, err)
		_, err = db.Exec("INSERT INTO schema_migrations (version) VALUES ('fake_001')")
		require.NoError(t, err)

		err = runDown(db, migrationsDir)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tidak ditemukan")
	})

	t.Run("failing SQL in up causes rollback", func(t *testing.T) {
		badUp := filepath.Join(migrationsDir, "000099_bad.up.sql")
		require.NoError(t, os.WriteFile(badUp, []byte("CREATE MALFORMED SQL;"), 0644))

		err := runUp(db, migrationsDir)
		require.Error(t, err)

		appliedMap, _, err := getAppliedMigrations(db)
		require.NoError(t, err)
		assert.NotContains(t, appliedMap, "000099_bad")
	})
}
