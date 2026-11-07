package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"tuwaktu.com/internal/config"
	"tuwaktu.com/internal/database"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("[INFO] Starting Tuwaktu Public API in [%s] environment...", cfg.AppEnv)
	log.Printf("[INFO] Config: Port=%s, LogLevel=%s, AutoSeed=%t, MemoryFallback=%t",
		cfg.AppPort, cfg.LogLevel, cfg.DBAutoSeed, cfg.DBAllowMemoryFallback)

	var workerRepo repository.WorkerRepository
	var bookingRepo repository.BookingRepository

	gormDB, err := database.NewGormDBWithConfig(cfg)
	if err != nil {
		if !cfg.DBAllowMemoryFallback || cfg.IsProduction() {
			log.Fatalf("[FATAL] Failed to connect to PostgreSQL in [%s] environment: %v. Memory fallback is disabled.", cfg.AppEnv, err)
		}

		log.Printf("[WARN] Failed to connect to PostgreSQL with GORM (%v).", err)
		log.Printf("[INFO] Falling back to pre-seeded in-memory repository for local testing/development.")
		memRepo := repository.NewMemoryRepository()
		seedMemoryRepository(memRepo)
		workerRepo = memRepo
		bookingRepo = memRepo
	} else {
		sqlDB, _ := gormDB.DB()
		if sqlDB != nil {
			defer sqlDB.Close()
		}
		log.Printf("[INFO] Successfully connected to PostgreSQL via GORM at %s:%s/%s (Pool: max_open=%d, max_idle=%d)",
			cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBMaxOpenConns, cfg.DBMaxIdleConns)

		// AutoMigrate dilarang keras saat runtime/startup server.
		// Skema database dimigrasikan secara manual via `npm run db:migrate` atau `go run ./cmd/migrate up`.

		if cfg.DBAutoSeed && !cfg.IsProduction() {
			seedCtx, seedCancel := context.WithTimeout(context.Background(), 15*time.Second)
			if err := database.SeedIfEmpty(seedCtx, gormDB); err != nil {
				log.Printf("[WARN] Failed to seed initial database records: %v", err)
			} else {
				log.Printf("[INFO] Database initial seed verified successfully via GORM.")
			}
			seedCancel()
		}

		workerRepo = repository.NewGormWorkerRepository(gormDB)
		bookingRepo = repository.NewGormBookingRepository(gormDB)
	}

	// Initialize Services
	workerSvc := service.NewWorkerService(workerRepo)
	bookingSvc := service.NewBookingService(bookingRepo)

	// Initialize Handlers
	workerHandler := handler.NewWorkerHandler(workerSvc)
	bookingHandler := handler.NewBookingHandler(bookingSvc)
	adminHandler := handler.NewAdminHandler(workerSvc)
	authHandler := handler.NewAuthHandler(workerSvc, cfg)
	authMiddleware := handler.NewAuthMiddleware()

	// Initialize Fiber App with environment-aware settings
	app := fiber.New(fiber.Config{
		AppName:           cfg.AppName,
		ServerHeader:      cfg.ServerHeader,
		Prefork:           cfg.Prefork,
		EnablePrintRoutes: cfg.IsDevelopment(),
	})

	// Middlewares
	app.Use(recover.New())

	// Environment-tailored request logging
	if strings.ToLower(strings.TrimSpace(cfg.LogLevel)) != "silent" && strings.ToLower(strings.TrimSpace(cfg.LogLevel)) != "none" {
		if cfg.IsDevelopment() {
			app.Use(logger.New(logger.Config{
				Format:     "[${time}] ${status} - ${latency} ${method} ${path}\n",
				TimeFormat: "15:04:05",
				TimeZone:   "Local",
			}))
		} else {
			// Staging and Production: structured JSON logging for log aggregation (Loki, Datadog, CloudWatch)
			app.Use(logger.New(logger.Config{
				Format:     `{"time":"${time}","status":${status},"latency":"${latency}","method":"${method}","path":"${path}","ip":"${ip}"}` + "\n",
				TimeFormat: time.RFC3339,
				TimeZone:   "UTC",
			}))
		}
	}

	// Environment-tailored CORS policy with credentials support for HTTP-Only cookies
	corsConfig := cors.Config{
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, ng-skip-http-transfer-cache, X-Requested-With, Cache-Control, Pragma",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true,
		ExposeHeaders:    "Set-Cookie, Content-Length",
		MaxAge:           86400,
	}

	if cfg.CORSAllowOrigins == "*" || cfg.IsDevelopment() {
		corsConfig.AllowOriginsFunc = func(origin string) bool {
			if origin == "http://localhost:4200" || origin == "http://127.0.0.1:4200" ||
				strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") {
				return true
			}
			return false
		}
	} else if cfg.CORSAllowOrigins != "" {
		corsConfig.AllowOrigins = cfg.CORSAllowOrigins
	} else {
		corsConfig.AllowOrigins = "http://localhost:4200, http://127.0.0.1:4200"
	}

	app.Use(cors.New(corsConfig))

	// Register Routes
	handler.RegisterRoutes(app, workerHandler, bookingHandler, adminHandler, authHandler, authMiddleware)

	// Channel to listen for shutdown signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		addr := fmt.Sprintf(":%s", cfg.AppPort)
		log.Printf("[INFO] Starting server on port %s...", cfg.AppPort)
		if err := app.Listen(addr); err != nil {
			log.Printf("[INFO] Server stopped: %v", err)
		}
	}()

	<-quit
	log.Println("[INFO] Shutting down server gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Fatalf("[ERROR] Server forced to shutdown: %v", err)
	}

	log.Println("[INFO] Server exited successfully.")
}

func seedMemoryRepository(repo *repository.MemoryRepository) {
	worker1 := &domain.Worker{
		ID:          "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
		Slug:        "budi-santoso",
		Name:        "Budi Santoso",
		Bio:         "Teknisi AC dan kelistrikan berpengalaman lebih dari 8 tahun di area Jakarta Selatan.",
		AvatarURL:   "https://images.unsplash.com/photo-1540569014015-19a7be504e3a",
		Rating:      4.9,
		ReviewCount: 42,
		Zone:           "Jakarta Selatan",
		PhoneNumber:    "+6281234567890",                                  // SENSITIVE
		WhatsAppNumber: "6281234567890",
		Email:          "budi.santoso@internal.tuwaktu.com",               // SENSITIVE
		Address:        "Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan", // SENSITIVE
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:   time.Now(),
	}

	service1 := &domain.Service{
		ID:              "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
		WorkerID:        worker1.ID,
		Name:            "Cuci AC Standar 0.5 - 1 PK",
		Description:     "Pembersihan filter, evaporator, dan cek tekanan freon AC.",
		Price:           75000,
		DurationMinutes: 45,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	service2 := &domain.Service{
		ID:              "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
		WorkerID:        worker1.ID,
		Name:            "Isi / Tambah Freon R32 / R410A",
		Description:     "Pengisian freon berkualitas untuk pendinginan optimal.",
		Price:           150000,
		DurationMinutes: 60,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	repo.SeedWorker(worker1)
	repo.SeedService(service1)
	repo.SeedService(service2)

	worker2 := &domain.Worker{
		ID:             "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
		Slug:           "siti-aminah",
		Name:           "Siti Aminah",
		Bio:            "Spesialis pembersihan rumah tangga dan deep cleaning profesional.",
		AvatarURL:      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
		Rating:         4.8,
		ReviewCount:    35,
		Zone:           "Tangerang Selatan",
		PhoneNumber:    "+6281987654321",
		WhatsAppNumber: "6281987654321",
		Email:          "siti.aminah@internal.tuwaktu.com",
		Address:        "Jl. Bintaro Utama Sektor 3, Tangsel",
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	service2_1 := &domain.Service{
		ID:              "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
		WorkerID:        worker2.ID,
		Name:            "Daily Cleaning (2 Jam)",
		Description:     "Menyapu, mengepel, membersihkan debu, dan merapikan kamar.",
		Price:           120000,
		BasePrice:       120000,
		RateType:        "HOURLY",
		DurationMinutes: 120,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	service2_2 := &domain.Service{
		ID:              "a7b8c9d0-e1f2-4a3b-8c9d-6e7f8a9b0c1d",
		WorkerID:        worker2.ID,
		Name:            "Deep Cleaning Kamar Mandi",
		Description:     "Pembersihan kerak keramik, sanitair, dan desinfeksi menyeluruh.",
		Price:           175000,
		BasePrice:       175000,
		RateType:        "UNIT",
		DurationMinutes: 90,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	repo.SeedWorker(worker2)
	repo.SeedService(service2_1)
	repo.SeedService(service2_2)

	for d := 0; d < 7; d++ {
		repo.SeedSchedule(&domain.WorkerSchedule{
			WorkerID:      worker1.ID,
			DayOfWeek:     d,
			DayName:       domain.GetDayName(d),
			IsActive:      d != 0, // Libur hari Minggu
			SlotMorning:   true,
			SlotAfternoon: true,
			SlotEvening:   d == 5 || d == 6, // Jumat & Sabtu malam buka
		})

		repo.SeedSchedule(&domain.WorkerSchedule{
			WorkerID:      worker2.ID,
			DayOfWeek:     d,
			DayName:       domain.GetDayName(d),
			IsActive:      d != 0,
			SlotMorning:   true,
			SlotAfternoon: true,
			SlotEvening:   false,
		})
	}

	repo.SeedAccount(&domain.WorkerAccount{
		ID:                 "99999999-9999-4999-8999-999999999999",
		WorkerID:           nil,
		Email:              "admin@tuwaktu.com",
		PhoneNumber:        "6281200000000",
		PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$h/Q2qYh7zsDv75pBmrRVhg$RXPT5jUCz0gCbq9DHF3Rrh4JNSakKukU3MMK+yDYs58",
		Role:               domain.RoleAdmin,
		AccountStatus:      domain.AccountStatusActive,
		MustChangePassword: false,
	})

	repo.SeedAccount(&domain.WorkerAccount{
		ID:                 "88888888-8888-4888-8888-888888888881",
		WorkerID:           &worker1.ID,
		Email:              "budi.santoso@internal.tuwaktu.com",
		PhoneNumber:        "6281234567890",
		PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$kguxhYUFs7XucnY26sw4BQ$xH2Q9SU7o50Lp0MevX4AKgozmFdVGvkUmANpoya98qU",
		Role:               domain.RoleWorker,
		AccountStatus:      domain.AccountStatusActive,
		MustChangePassword: false,
	})

	repo.SeedAccount(&domain.WorkerAccount{
		ID:                 "88888888-8888-4888-8888-888888888882",
		WorkerID:           &worker2.ID,
		Email:              "siti.aminah@internal.tuwaktu.com",
		PhoneNumber:        "6281987654321",
		PasswordHash:       "$argon2id$v=19$m=65536,t=1,p=4$kguxhYUFs7XucnY26sw4BQ$xH2Q9SU7o50Lp0MevX4AKgozmFdVGvkUmANpoya98qU",
		Role:               domain.RoleWorker,
		AccountStatus:      domain.AccountStatusActive,
		MustChangePassword: false,
	})
}
