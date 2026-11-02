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

	// Environment-tailored CORS policy
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSAllowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))

	// Register Routes
	handler.RegisterRoutes(app, workerHandler, bookingHandler)

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
		Zone:        "Jakarta Selatan",
		PhoneNumber: "+6281234567890",                                  // SENSITIVE
		Email:       "budi.santoso@internal.tuwaktu.com",               // SENSITIVE
		Address:     "Jl. Fatmawati No. 12, Cilandak, Jakarta Selatan", // SENSITIVE
		IsActive:    true,
		CreatedAt:   time.Now(),
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
	}
}
