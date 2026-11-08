package database

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"tuwaktu.com/internal/config"
	"tuwaktu.com/internal/domain"
)

// NewGormDB initializes a PostgreSQL connection using GORM with default connection pooling.
// Kept for backward compatibility.
func NewGormDB(databaseURL string) (*gorm.DB, error) {
	defaultCfg := &config.Config{
		DatabaseURL:       databaseURL,
		DBMaxOpenConns:    25,
		DBMaxIdleConns:    5,
		DBConnMaxLifetime: 30 * time.Minute,
		DBConnMaxIdleTime: 5 * time.Minute,
		DBLogLevel:        "warn",
		DBConnectTimeout:  5 * time.Second,
	}
	return NewGormDBWithConfig(defaultCfg)
}

// NewGormDBWithConfig initializes a PostgreSQL connection using GORM configured with environment-specific settings.
func NewGormDBWithConfig(cfg *config.Config) (*gorm.DB, error) {
	if cfg == nil {
		return nil, fmt.Errorf("database config cannot be nil")
	}
	if strings.TrimSpace(cfg.DatabaseURL) == "" {
		return nil, fmt.Errorf("database URL cannot be empty")
	}

	var gormLogLevel logger.LogLevel
	switch strings.ToLower(strings.TrimSpace(cfg.DBLogLevel)) {
	case "silent":
		gormLogLevel = logger.Silent
	case "error":
		gormLogLevel = logger.Error
	case "warn":
		gormLogLevel = logger.Warn
	case "info", "debug":
		gormLogLevel = logger.Info
	default:
		gormLogLevel = logger.Warn
	}

	gormLogger := logger.Default.LogMode(gormLogLevel)

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("opening postgres connection with GORM: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("retrieving underlying sql.DB: %w", err)
	}

	// Environment-configured connection pool
	maxOpen := cfg.DBMaxOpenConns
	if maxOpen <= 0 {
		maxOpen = 25
	}
	maxIdle := cfg.DBMaxIdleConns
	if maxIdle <= 0 {
		maxIdle = 5
	}
	connMaxLifetime := cfg.DBConnMaxLifetime
	if connMaxLifetime <= 0 {
		connMaxLifetime = 30 * time.Minute
	}
	connMaxIdleTime := cfg.DBConnMaxIdleTime
	if connMaxIdleTime <= 0 {
		connMaxIdleTime = 5 * time.Minute
	}

	sqlDB.SetMaxOpenConns(maxOpen)
	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)
	sqlDB.SetConnMaxIdleTime(connMaxIdleTime)

	connectTimeout := cfg.DBConnectTimeout
	if connectTimeout <= 0 {
		connectTimeout = 5 * time.Second
	}

	pingCtx, cancel := context.WithTimeout(context.Background(), connectTimeout)
	defer cancel()

	if err := sqlDB.PingContext(pingCtx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("pinging postgres: %w", err)
	}

	return db, nil
}

// SeedIfEmpty checks if workers exist in the database and seeds initial demo data only if table is empty.
func SeedIfEmpty(ctx context.Context, db *gorm.DB) error {
	dbWithCtx := db.WithContext(ctx)

	var count int64
	if err := dbWithCtx.Model(&domain.Worker{}).Count(&count).Error; err != nil {
		return fmt.Errorf("checking workers count: %w", err)
	}

	if count == 0 {
		if err := SeedData(ctx, db); err != nil {
			return fmt.Errorf("seeding initial database records: %w", err)
		}
	}

	return nil
}

// SeedData inserts standard initial workers and services if they do not exist
func SeedData(ctx context.Context, db *gorm.DB) error {
	dbWithCtx := db.WithContext(ctx)

	latBudi := -6.2921000
	lngBudi := 106.7992000
	latSiti := -6.2838000
	lngSiti := 106.7115000

	seedWorkers := []domain.Worker{
		{
			ID:            "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
			Slug:          "budi-santoso",
			Name:          "Budi Santoso",
			Bio:           "Teknisi AC dan kelistrikan berpengalaman lebih dari 8 tahun di area Jakarta Selatan.",
			AvatarURL:     "https://images.unsplash.com/photo-1540569014015-19a7be504e3a",
			Rating:        4.9,
			ReviewCount:   42,
			Zone:          "Jakarta Selatan",
			BasePrice:     75000.00,
			RateType:      "HOURLY",
			Lat:           &latBudi,
			Lng:           &lngBudi,
			MaxRadiusKM:   15.00,
			FreeRadiusKM:  3.00,
			ExtraFeePerKM: 5000,
			PhoneNumber:   "+6281234567890",
			WhatsAppNumber: "6281234567890",
			Email:         "budi.santoso@internal.tuwaktu.com",
			Address:       "Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan",
			IsActive:      true,
		},
		{
			ID:            "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
			Slug:          "siti-aminah",
			Name:          "Siti Aminah",
			Bio:           "Spesialis pembersihan rumah tangga dan deep cleaning profesional.",
			AvatarURL:     "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
			Rating:        4.8,
			ReviewCount:   35,
			Zone:          "Tangerang Selatan",
			BasePrice:     120000.00,
			RateType:      "UNIT",
			Lat:           &latSiti,
			Lng:           &lngSiti,
			MaxRadiusKM:   20.00,
			FreeRadiusKM:  5.00,
			ExtraFeePerKM: 4000,
			PhoneNumber:   "+6281987654321",
			WhatsAppNumber: "6281987654321",
			Email:         "siti.aminah@internal.tuwaktu.com",
			Address:       "Jl. Bintaro Utama Sektor 3, Tangsel",
			IsActive:      true,
		},
	}

	catAC := "11111111-1111-4111-8111-111111111111"
	catCleaning := "22222222-2222-4222-8222-222222222222"

	seedServices := []domain.Service{
		{
			ID:              "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
			WorkerID:        "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
			CategoryID:      &catAC,
			Name:            "Cuci AC Standar 0.5 - 1 PK",
			Description:     "Pembersihan filter, evaporator, dan cek tekanan freon AC.",
			Price:           75000.00,
			BasePrice:       75000.00,
			RateType:        "UNIT",
			DurationMinutes: 45,
			IsActive:        true,
		},
		{
			ID:              "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
			WorkerID:        "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
			CategoryID:      &catAC,
			Name:            "Isi / Tambah Freon R32 / R410A",
			Description:     "Pengisian freon berkualitas untuk pendinginan optimal.",
			Price:           150000.00,
			BasePrice:       150000.00,
			RateType:        "UNIT",
			DurationMinutes: 60,
			IsActive:        true,
		},
		{
			ID:              "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
			WorkerID:        "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
			CategoryID:      &catAC,
			Name:            "Bongkar Pasang AC",
			Description:     "Layanan instalasi unit AC baru atau relokasi unit lama.",
			Price:           300000.00,
			BasePrice:       300000.00,
			RateType:        "UNIT",
			DurationMinutes: 120,
			IsActive:        true,
		},
		{
			ID:              "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
			WorkerID:        "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
			CategoryID:      &catCleaning,
			Name:            "Daily Cleaning (2 Jam)",
			Description:     "Menyapu, mengepel, membersihkan debu, dan merapikan kamar.",
			Price:           120000.00,
			BasePrice:       120000.00,
			RateType:        "HOURLY",
			DurationMinutes: 120,
			IsActive:        true,
		},
		{
			ID:              "a7b8c9d0-e1f2-4a3b-8c9d-6e7f8a9b0c1d",
			WorkerID:        "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
			CategoryID:      &catCleaning,
			Name:            "Deep Cleaning Kamar Mandi",
			Description:     "Pembersihan kerak keramik, sanitair, dan desinfeksi menyeluruh.",
			Price:           175000.00,
			BasePrice:       175000.00,
			RateType:        "UNIT",
			DurationMinutes: 90,
			IsActive:        true,
		},
	}

	for _, w := range seedWorkers {
		if err := dbWithCtx.Clauses(clause.OnConflict{DoNothing: true}).Create(&w).Error; err != nil {
			return fmt.Errorf("seeding worker %s: %w", w.Slug, err)
		}
	}

	for _, s := range seedServices {
		if err := dbWithCtx.Clauses(clause.OnConflict{DoNothing: true}).Create(&s).Error; err != nil {
			return fmt.Errorf("seeding service %s: %w", s.Name, err)
		}
	}

	seedSchedules := []domain.WorkerSchedule{
		// Budi Santoso (worker 1)
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 0, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 2, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 3, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 4, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 5, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", DayOfWeek: 6, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: false},
		// Siti Aminah (worker 2)
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 0, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: true},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 2, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: true},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 3, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: true},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 4, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: true},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 5, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{WorkerID: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b", DayOfWeek: 6, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
	}

	for _, sc := range seedSchedules {
		if err := dbWithCtx.Clauses(clause.OnConflict{DoNothing: true}).Create(&sc).Error; err != nil {
			return fmt.Errorf("seeding worker_schedule: %w", err)
		}
	}

	worker1ID := "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
	worker2ID := "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b"

	seedAccounts := []domain.WorkerAccount{
		{
			ID:                 "99999999-9999-4999-8999-999999999999",
			WorkerID:           nil,
			Email:              "admin@tuwaktu.com",
			PhoneNumber:        "6281200000000",
			PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$uiYTw8zX3xJl1cpIqo//XA$LnCOOfHd56X6q9B+PSCdEy38A8oH8a1/fvdvETKrhKM",
			Role:               domain.RoleAdmin,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		},
		{
			ID:                 "88888888-8888-4888-8888-888888888881",
			WorkerID:           &worker1ID,
			Email:              "budi.santoso@internal.tuwaktu.com",
			PhoneNumber:        "6281234567890",
			PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$MAaxkWmbfdPHDfyqWXInBw$9f6WM1rw47nmLMh0WkiXvDdGjU0hYU4tau+jIeaivBM",
			Role:               domain.RoleWorker,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		},
		{
			ID:                 "88888888-8888-4888-8888-888888888882",
			WorkerID:           &worker2ID,
			Email:              "siti.aminah@internal.tuwaktu.com",
			PhoneNumber:        "6281987654321",
			PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$MAaxkWmbfdPHDfyqWXInBw$9f6WM1rw47nmLMh0WkiXvDdGjU0hYU4tau+jIeaivBM",
			Role:               domain.RoleWorker,
			AccountStatus:      domain.AccountStatusActive,
			MustChangePassword: false,
		},
	}

	for _, acc := range seedAccounts {
		if err := dbWithCtx.Clauses(clause.OnConflict{DoNothing: true}).Create(&acc).Error; err != nil {
			return fmt.Errorf("seeding worker_account: %w", err)
		}
	}

	seedCategories := []domain.Category{
		{
			ID:              "11111111-1111-4111-8111-111111111111",
			Slug:            "ac-pendingin",
			Name:            "Servis & Pasang AC",
			Description:     "Pembersihan filter, flushing freon berkala, perbaikan pipa bocor, dan perawatan unit inverter.",
			Icon:            "ac_unit",
			StartingPrice:   75000.00,
			PriceUnit:       "unit",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Populer",
			IsActive:        true,
			SortOrder:       1,
		},
		{
			ID:              "22222222-2222-4222-8222-222222222222",
			Slug:            "sanitasi-cleaning",
			Name:            "Sanitasi & Deep Clean",
			Description:     "Pembersihan menyeluruh kamar tidur, sofa, kamar mandi berkerak, dan sterilisasi tungau kasur.",
			Icon:            "cleaning_services",
			StartingPrice:   65000.00,
			PriceUnit:       "jam",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Higienis",
			IsActive:        true,
			SortOrder:       2,
		},
		{
			ID:              "33333333-3333-4333-8333-333333333333",
			Slug:            "instalasi-listrik",
			Name:            "Instalasi Listrik Presisi",
			Description:     "Pemeriksaan beban daya, tracing korsleting listrik, perakitan panel MCB, dan instalasi stop kontak.",
			Icon:            "bolt",
			StartingPrice:   80000.00,
			PriceUnit:       "kunjungan",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Prioritas Aman",
			IsActive:        true,
			SortOrder:       3,
		},
		{
			ID:              "44444444-4444-4444-8444-444444444444",
			Slug:            "elektronik-audio",
			Name:            "Reparasi Elektronik",
			Description:     "Diagnostik mesin cuci digital, kulkas inverter, perbaikan audio speaker, dan instalasi TV dinding.",
			Icon:            "tv",
			StartingPrice:   120000.00,
			PriceUnit:       "kunjungan",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Spesialis Ahli",
			IsActive:        true,
			SortOrder:       4,
		},
	}

	for _, c := range seedCategories {
		if err := dbWithCtx.Clauses(clause.OnConflict{DoNothing: true}).Create(&c).Error; err != nil {
			return fmt.Errorf("seeding category %s: %w", c.Slug, err)
		}
	}

	return nil
}
