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

func TestMigrationRunner_LockoutMigration000007AndSeed(t *testing.T) {
	db, tempDir := openTestSQLDB(t)
	migrationsDir := filepath.Join(tempDir, "migrations")
	require.NoError(t, os.MkdirAll(migrationsDir, 0755))

	initTable := `
		CREATE TABLE worker_accounts (
			id TEXT PRIMARY KEY,
			worker_id TEXT,
			email TEXT UNIQUE NOT NULL,
			phone_number TEXT UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'WORKER',
			account_status TEXT NOT NULL DEFAULT 'ACTIVE',
			must_change_password BOOLEAN NOT NULL DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000006_create_worker_accounts.up.sql"), []byte(initTable), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000006_create_worker_accounts.down.sql"), []byte("DROP TABLE IF EXISTS worker_accounts;"), 0644))

	realUp007, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000007_add_account_lockout.up.sql"))
	require.NoError(t, err)
	sqliteUp007 := `
		ALTER TABLE worker_accounts ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
		ALTER TABLE worker_accounts ADD COLUMN locked_until TIMESTAMPTZ NULL;
	`
	assert.Contains(t, string(realUp007), "failed_login_attempts")
	assert.Contains(t, string(realUp007), "locked_until")
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000007_add_account_lockout.up.sql"), []byte(sqliteUp007), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000007_add_account_lockout.down.sql"), []byte("ALTER TABLE worker_accounts DROP COLUMN locked_until; ALTER TABLE worker_accounts DROP COLUMN failed_login_attempts;"), 0644))

	require.NoError(t, runUp(db, migrationsDir))

	var attempts int
	var lockedUntil sql.NullString
	_, err = db.Exec(`INSERT INTO worker_accounts (id, email, phone_number, password_hash, role, account_status, must_change_password) VALUES ('admin-1', 'admin@tuwaktu.com', '6281200000000', 'hash', 'ADMIN', 'ACTIVE', 0)`)
	require.NoError(t, err)

	err = db.QueryRow(`SELECT failed_login_attempts, locked_until FROM worker_accounts WHERE email = 'admin@tuwaktu.com'`).Scan(&attempts, &lockedUntil)
	require.NoError(t, err)
	assert.Equal(t, 0, attempts)
	assert.False(t, lockedUntil.Valid)
}

func TestMigrationRunner_CategoriesMigration000008(t *testing.T) {
	// 1. Verifikasi integritas file migrasi 000008 fisik
	realUp008, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000008_create_categories.up.sql"))
	require.NoError(t, err)
	assert.Contains(t, string(realUp008), "CREATE TABLE IF NOT EXISTS categories")
	assert.Contains(t, string(realUp008), "slug")
	assert.Contains(t, string(realUp008), "starting_price")
	assert.Contains(t, string(realUp008), "is_active")
	assert.Contains(t, string(realUp008), "sort_order")

	realDown008, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000008_create_categories.down.sql"))
	require.NoError(t, err)
	assert.Contains(t, string(realDown008), "DROP TABLE IF EXISTS categories")

	// 2. Uji eksekusi UP dan DOWN pada migration runner
	db, tempDir := openTestSQLDB(t)
	migrationsDir := filepath.Join(tempDir, "migrations")
	require.NoError(t, os.MkdirAll(migrationsDir, 0755))

	sqliteUp008 := `
		CREATE TABLE categories (
			id TEXT PRIMARY KEY,
			slug TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			icon TEXT DEFAULT 'build',
			starting_price REAL DEFAULT 0.00,
			price_unit TEXT DEFAULT 'kunjungan',
			availability_tag TEXT DEFAULT 'Tersedia di Katalog',
			highlight_tag TEXT DEFAULT '',
			is_active BOOLEAN DEFAULT 1,
			sort_order INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		INSERT INTO categories (id, slug, name, description, icon, starting_price, price_unit, availability_tag, highlight_tag, is_active, sort_order)
		VALUES 
			('11111111-1111-4111-8111-111111111111', 'ac-pendingin', 'Servis & Pasang AC', 'Perawatan AC', 'ac_unit', 75000.00, 'unit', 'Tersedia di Katalog', 'Populer', 1, 1),
			('22222222-2222-4222-8222-222222222222', 'sanitasi-cleaning', 'Sanitasi & Deep Clean', 'Pembersihan kasur', 'cleaning_services', 65000.00, 'jam', 'Tersedia di Katalog', 'Higienis', 1, 2);
	`
	sqliteDown008 := `DROP TABLE IF EXISTS categories;`

	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000008_create_categories.up.sql"), []byte(sqliteUp008), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000008_create_categories.down.sql"), []byte(sqliteDown008), 0644))

	// Jalankan UP
	require.NoError(t, runUp(db, migrationsDir))

	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 2, count)

	// Jalankan DOWN (revert)
	require.NoError(t, runDown(db, migrationsDir))

	// Verifikasi tabel telah terhapus
	err = db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&count)
	require.Error(t, err)
}

func TestMigrationRunner_LinkServicesToCategories000009(t *testing.T) {
	// 1. Verifikasi integritas file fisik migrasi 000009
	realUp009, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000009_link_services_to_categories.up.sql"))
	require.NoError(t, err)
	assert.Contains(t, string(realUp009), "category_id UUID REFERENCES categories(id)")
	assert.Contains(t, string(realUp009), "CREATE INDEX IF NOT EXISTS idx_services_category_id")

	realDown009, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000009_link_services_to_categories.down.sql"))
	require.NoError(t, err)
	assert.Contains(t, string(realDown009), "DROP INDEX IF EXISTS idx_services_category_id")
	assert.Contains(t, string(realDown009), "ALTER TABLE services DROP COLUMN IF EXISTS category_id")

	// 2. Uji eksekusi UP dan DOWN pada migration runner
	db, tempDir := openTestSQLDB(t)
	migrationsDir := filepath.Join(tempDir, "migrations")
	require.NoError(t, os.MkdirAll(migrationsDir, 0755))

	sqliteUpPre := `
		CREATE TABLE categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
		);
		CREATE TABLE services (
			id TEXT PRIMARY KEY,
			worker_id TEXT NOT NULL,
			name TEXT NOT NULL,
			price REAL NOT NULL
		);
		INSERT INTO categories (id, name) VALUES ('11111111-1111-4111-8111-111111111111', 'Servis AC');
		INSERT INTO services (id, worker_id, name, price) VALUES ('srv-1', 'wrk-1', 'Cuci AC Standar', 75000);
	`
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000008_create_categories.up.sql"), []byte(sqliteUpPre), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000008_create_categories.down.sql"), []byte("DROP TABLE IF EXISTS services; DROP TABLE IF EXISTS categories;"), 0644))

	sqliteUp009 := `
		ALTER TABLE services ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;
		CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
		UPDATE services SET category_id = '11111111-1111-4111-8111-111111111111' WHERE LOWER(name) LIKE '%ac%';
	`
	sqliteDown009 := `
		DROP INDEX IF EXISTS idx_services_category_id;
		ALTER TABLE services DROP COLUMN category_id;
	`
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000009_link_services_to_categories.up.sql"), []byte(sqliteUp009), 0644))
	require.NoError(t, os.WriteFile(filepath.Join(migrationsDir, "000009_link_services_to_categories.down.sql"), []byte(sqliteDown009), 0644))

	// Jalankan UP
	require.NoError(t, runUp(db, migrationsDir))

	var categoryID sql.NullString
	err = db.QueryRow("SELECT category_id FROM services WHERE id = 'srv-1'").Scan(&categoryID)
	require.NoError(t, err)
	assert.True(t, categoryID.Valid)
	assert.Equal(t, "11111111-1111-4111-8111-111111111111", categoryID.String)

	// Jalankan DOWN (revert)
	require.NoError(t, runDown(db, migrationsDir))

	// Kolom category_id harusnya sudah terhapus
	err = db.QueryRow("SELECT category_id FROM services WHERE id = 'srv-1'").Scan(&categoryID)
	require.Error(t, err)
}
