package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"tuwaktu.com/internal/config"
)

type MigrationFile struct {
	Version string
	Path    string
}

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := strings.ToLower(strings.TrimSpace(os.Args[1]))
	cfg := config.LoadConfig()

	migrationsDir := "migrations"
	if customDir := os.Getenv("MIGRATIONS_DIR"); customDir != "" {
		migrationsDir = customDir
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[FATAL] Gagal menghubungkan ke database PostgreSQL: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("[FATAL] Gagal melakukan ping ke PostgreSQL pada URL konfigurasi: %v", err)
	}

	switch command {
	case "up":
		if err := runUp(db, migrationsDir); err != nil {
			log.Fatalf("[FATAL] Migrasi UP gagal: %v", err)
		}
	case "down", "revert":
		if err := runDown(db, migrationsDir); err != nil {
			log.Fatalf("[FATAL] Migrasi DOWN (revert) gagal: %v", err)
		}
	case "status":
		if err := runStatus(db, migrationsDir); err != nil {
			log.Fatalf("[FATAL] Pemeriksaan status migrasi gagal: %v", err)
		}
	case "seed":
		if err := runSeed(db, migrationsDir); err != nil {
			log.Fatalf("[FATAL] Eksekusi seed data gagal: %v", err)
		}
	case "unlock-admin", "unlock":
		target := ""
		if len(os.Args) > 2 {
			target = strings.TrimSpace(os.Args[2])
		}
		if err := runUnlockAdmin(db, target); err != nil {
			log.Fatalf("[FATAL] Buka kunci akun gagal: %v", err)
		}
	default:
		fmt.Printf("Perintah '%s' tidak dikenali.\n\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("Penggunaan CLI Migrasi Tuwaktu:")
	fmt.Println("  go run ./cmd/migrate [perintah]")
	fmt.Println("\nPerintah yang tersedia:")
	fmt.Println("  up                     Menjalankan seluruh file migrasi pending (*.up.sql)")
	fmt.Println("  down | revert          Membatalkan (rollback) satu file migrasi terakhir (*.down.sql)")
	fmt.Println("  status                 Menampilkan status migrasi yang telah dieksekusi dan pending")
	fmt.Println("  seed                   Mengeksekusi file data awal (migrations/seed.sql)")
	fmt.Println("  unlock-admin | unlock  Membuka kunci akun Admin (atau [identifier]) yang terkunci")
}

func ensureSchemaMigrationsTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`
	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("membuat tabel schema_migrations: %w", err)
	}
	return nil
}

func getAppliedMigrations(db *sql.DB) (map[string]time.Time, []string, error) {
	appliedMap := make(map[string]time.Time)
	var appliedList []string

	rows, err := db.Query("SELECT version, applied_at FROM schema_migrations ORDER BY version ASC")
	if err != nil {
		return nil, nil, fmt.Errorf("membaca data schema_migrations: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var version string
		var appliedAt time.Time
		if err := rows.Scan(&version, &appliedAt); err != nil {
			return nil, nil, fmt.Errorf("memindai baris migrasi: %w", err)
		}
		appliedMap[version] = appliedAt
		appliedList = append(appliedList, version)
	}

	if err := rows.Err(); err != nil {
		return nil, nil, fmt.Errorf("iterasi baris migrasi: %w", err)
	}

	return appliedMap, appliedList, nil
}

func loadMigrationFiles(dir string, suffix string) ([]MigrationFile, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("membaca direktori migrasi '%s': %w", dir, err)
	}

	var files []MigrationFile
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(name, suffix) {
			version := strings.TrimSuffix(name, suffix)
			files = append(files, MigrationFile{
				Version: version,
				Path:    filepath.Join(dir, name),
			})
		}
	}

	sort.Slice(files, func(i, j int) bool {
		return files[i].Version < files[j].Version
	})

	return files, nil
}

func runUp(db *sql.DB, migrationsDir string) error {
	if err := ensureSchemaMigrationsTable(db); err != nil {
		return err
	}

	appliedMap, _, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	upFiles, err := loadMigrationFiles(migrationsDir, ".up.sql")
	if err != nil {
		return err
	}

	var pendingCount int
	for _, mf := range upFiles {
		if _, alreadyApplied := appliedMap[mf.Version]; alreadyApplied {
			continue
		}

		pendingCount++
		log.Printf("[INFO] Menjalankan migrasi UP: %s...", filepath.Base(mf.Path))
		content, err := os.ReadFile(mf.Path)
		if err != nil {
			return fmt.Errorf("membaca file migrasi '%s': %w", mf.Path, err)
		}

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("memulai transaksi untuk migrasi '%s': %w", mf.Version, err)
		}

		if _, err := tx.Exec(string(content)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("gagal mengeksekusi skrip migrasi '%s': %w", mf.Path, err)
		}

		if _, err := tx.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, CURRENT_TIMESTAMP)", mf.Version); err != nil {
			// Jika driver sqlite digunakan saat testing yang memakai ?, fallback eksekusi
			if strings.Contains(err.Error(), "syntax error") {
				_, err = tx.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)", mf.Version)
			}
			if err != nil {
				_ = tx.Rollback()
				return fmt.Errorf("mencatat versi migrasi '%s': %w", mf.Version, err)
			}
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("melakukan commit migrasi '%s': %w", mf.Version, err)
		}

		log.Printf("[INFO] Berhasil menerapkan migrasi: %s", mf.Version)
	}

	if pendingCount == 0 {
		log.Println("[INFO] Skema database sudah mutakhir. Tidak ada migrasi pending.")
	} else {
		log.Printf("[INFO] Selesai! Sebanyak %d migrasi berhasil diterapkan.", pendingCount)
	}

	return nil
}

func runDown(db *sql.DB, migrationsDir string) error {
	if err := ensureSchemaMigrationsTable(db); err != nil {
		return err
	}

	_, appliedList, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	if len(appliedList) == 0 {
		log.Println("[INFO] Tidak ada migrasi tercatat di tabel schema_migrations untuk dibatalkan (revert).")
		return nil
	}

	lastVersion := appliedList[len(appliedList)-1]
	downFilename := fmt.Sprintf("%s.down.sql", lastVersion)
	downFilePath := filepath.Join(migrationsDir, downFilename)

	if _, err := os.Stat(downFilePath); os.IsNotExist(err) {
		return fmt.Errorf("file rollback '%s' tidak ditemukan untuk versi '%s'", downFilePath, lastVersion)
	}

	log.Printf("[INFO] Membatalkan (revert) migrasi: %s...", downFilename)
	content, err := os.ReadFile(downFilePath)
	if err != nil {
		return fmt.Errorf("membaca file rollback '%s': %w", downFilePath, err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("memulai transaksi rollback '%s': %w", lastVersion, err)
	}

	if _, err := tx.Exec(string(content)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("gagal mengeksekusi skrip rollback '%s': %w", downFilePath, err)
	}

	if _, err := tx.Exec("DELETE FROM schema_migrations WHERE version = $1", lastVersion); err != nil {
		if strings.Contains(err.Error(), "syntax error") {
			_, err = tx.Exec("DELETE FROM schema_migrations WHERE version = ?", lastVersion)
		}
		if err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("menghapus catatan migrasi '%s': %w", lastVersion, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("melakukan commit rollback '%s': %w", lastVersion, err)
	}

	log.Printf("[INFO] Berhasil membatalkan (revert) migrasi versi: %s", lastVersion)
	return nil
}

func runStatus(db *sql.DB, migrationsDir string) error {
	if err := ensureSchemaMigrationsTable(db); err != nil {
		return err
	}

	appliedMap, _, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	upFiles, err := loadMigrationFiles(migrationsDir, ".up.sql")
	if err != nil {
		return err
	}

	fmt.Println("\nStatus Migrasi Database Tuwaktu:")
	fmt.Println(strings.Repeat("-", 75))
	fmt.Printf("%-35s %-15s %-25s\n", "VERSI MIGRASI", "STATUS", "WAKTU EKSEKUSI")
	fmt.Println(strings.Repeat("-", 75))

	for _, mf := range upFiles {
		appliedAt, isApplied := appliedMap[mf.Version]
		if isApplied {
			fmt.Printf("%-35s %-15s %-25s\n", mf.Version, "TERPASANG", appliedAt.Format("2006-01-02 15:04:05"))
		} else {
			fmt.Printf("%-35s %-15s %-25s\n", mf.Version, "PENDING", "-")
		}
	}

	// Cek apakah ada migrasi di database yang file fisiknya tidak ditemukan lagi
	for version, appliedAt := range appliedMap {
		found := false
		for _, mf := range upFiles {
			if mf.Version == version {
				found = true
				break
			}
		}
		if !found {
			fmt.Printf("%-35s %-15s %-25s\n", version, "FILE HILANG", appliedAt.Format("2006-01-02 15:04:05"))
		}
	}

	fmt.Println(strings.Repeat("-", 75))
	return nil
}

func runSeed(db *sql.DB, migrationsDir string) error {
	seedPath := filepath.Join(migrationsDir, "seed.sql")
	if _, err := os.Stat(seedPath); os.IsNotExist(err) {
		return fmt.Errorf("file seed '%s' tidak ditemukan", seedPath)
	}

	log.Printf("[INFO] Mengeksekusi file seed: %s...", seedPath)
	content, err := os.ReadFile(seedPath)
	if err != nil {
		return fmt.Errorf("membaca file seed: %w", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("memulai transaksi seeding: %w", err)
	}

	if _, err := tx.Exec(string(content)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("eksekusi seed SQL gagal: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit seed SQL gagal: %w", err)
	}

	log.Println("[INFO] Data seed awal berhasil dimasukkan ke database.")
	return nil
}

func runUnlockAdmin(db *sql.DB, target string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if target == "" || strings.EqualFold(target, "admin") {
		query := `
			UPDATE worker_accounts
			SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE role = 'ADMIN' OR LOWER(email) = 'admin@tuwaktu.com';
		`
		res, err := db.ExecContext(ctx, query)
		if err != nil {
			return fmt.Errorf("membuka kunci akun admin: %w", err)
		}
		rows, _ := res.RowsAffected()
		log.Printf("[INFO] Berhasil membuka kunci %d akun administrator (failed_login_attempts = 0, locked_until = NULL).\n", rows)
		return nil
	}

	query := `
		UPDATE worker_accounts
		SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE LOWER(email) = LOWER($1) OR phone_number = $1 OR id::text = $1;
	`
	res, err := db.ExecContext(ctx, query, target)
	if err != nil {
		return fmt.Errorf("membuka kunci akun '%s': %w", target, err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		log.Printf("[INFO] Tidak ditemukan akun dengan identifier '%s'.\n", target)
	} else {
		log.Printf("[INFO] Berhasil membuka kunci akun '%s' (%d baris terpengaruh).\n", target, rows)
	}
	return nil
}
