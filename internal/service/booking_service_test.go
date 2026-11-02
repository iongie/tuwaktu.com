package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestBookingService_CreateBooking(t *testing.T) {
	ctx := context.Background()

	setupRepo := func() (*repository.MemoryRepository, *domain.Worker, *domain.Service) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:          "worker-123",
			Slug:        "joko-kendil",
			Name:        "Joko Kendil",
			Zone:        "Jakarta Barat",
			PhoneNumber: "+628111222333",
			Email:       "joko@tuwaktu.com",
			IsActive:    true,
		}
		service := &domain.Service{
			ID:              "service-456",
			WorkerID:        worker.ID,
			Name:            "Reparasi Pompa Air",
			Price:           180000,
			DurationMinutes: 90,
			IsActive:        true,
		}
		repo.SeedWorker(worker)
		repo.SeedService(service)
		return repo, worker, service
	}

	futureDate := time.Now().Add(24 * time.Hour).Format(time.RFC3339)

	t.Run("success create booking", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi Lestari",
			ClientPhone: "+62899887766",
			ClientEmail: "dewi@client.com",
			Location:    "Jl. Kebon Jeruk No. 5",
			Zone:        "Jakarta Barat",
			BookingDate: futureDate,
			Notes:       "Tolong datang jam 10 pagi",
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)

		assert.NotEmpty(t, res.BookingCode)
		assert.Contains(t, res.BookingCode, "TW-")
		assert.Equal(t, worker.ID, res.WorkerID)
		assert.Equal(t, worker.Name, res.WorkerName)
		assert.Equal(t, srv.ID, res.ServiceID)
		assert.Equal(t, srv.Name, res.ServiceName)
		assert.Equal(t, "Dewi Lestari", res.ClientName)
		assert.Equal(t, "Jl. Kebon Jeruk No. 5", res.Location)
		assert.Equal(t, "Jakarta Barat", res.Zone)
		assert.Equal(t, "Tolong datang jam 10 pagi", res.Notes)
		assert.Equal(t, 180000.0, res.TotalPrice)
		assert.Equal(t, "PENDING", res.Status)
	})

	t.Run("success create booking with minimal payload (nama, lokasi, pilihan layanan)", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		// Client only passes client_name, location/zone, and service_id (worker is auto-resolved)
		req := domain.CreateBookingRequest{
			ServiceID:  srv.ID,
			ClientName: "Budi Minimal",
			Location:   "Jakarta Barat",
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)

		assert.NotEmpty(t, res.BookingCode)
		assert.Equal(t, worker.ID, res.WorkerID)
		assert.Equal(t, worker.Name, res.WorkerName)
		assert.Equal(t, srv.ID, res.ServiceID)
		assert.Equal(t, "Budi Minimal", res.ClientName)
		assert.Equal(t, "Jakarta Barat", res.Location)
		assert.Equal(t, worker.Zone, res.Zone) // fallback to worker's zone
		assert.True(t, res.BookingDate.After(time.Now()))
		assert.Equal(t, srv.Price, res.TotalPrice)
	})

	t.Run("success create booking with worker_slug", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerSlug: worker.Slug,
			ServiceID:  srv.ID,
			ClientName: "Dewi Slug",
			Location:   "Jl. Panjang No. 1",
			Zone:       "Jakarta Barat",
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)
		assert.Equal(t, worker.ID, res.WorkerID)
	})

	t.Run("success create booking with service name instead of ID", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			ServiceID:  srv.Name, // Passing service name "Reparasi Pompa Air"
			ClientName: "Dewi by Service Name",
			Location:   "Jakarta Barat",
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)
		assert.Equal(t, worker.ID, res.WorkerID)
		assert.Equal(t, srv.ID, res.ServiceID)
		assert.Equal(t, srv.Name, res.ServiceName)
	})

	t.Run("missing client_name", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "",
			ClientPhone: "+62899887766",
			Location:    "Jl. Kebon Jeruk No. 5",
			Zone:        "Jakarta Barat",
			BookingDate: futureDate,
		}

		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("optional client_phone allows empty phone", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi Lestari",
			ClientPhone: "", // empty phone allowed
			Location:    "Jl. Kebon Jeruk No. 5",
			Zone:        "Jakarta Barat",
			BookingDate: futureDate,
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		assert.Equal(t, "Dewi Lestari", res.ClientName)
	})

	t.Run("missing both location and zone fails", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "",
			Zone:        "",
			BookingDate: futureDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("invalid booking date format", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: "invalid-date",
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("past booking date rejected", func(t *testing.T) {
		repo, worker, srv := setupRepo()
		svc := service.NewBookingService(repo)

		pastDate := time.Now().Add(-24 * time.Hour).Format(time.RFC3339)
		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: pastDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrPastBookingDate)
	})

	t.Run("worker not found", func(t *testing.T) {
		repo, _, srv := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    "non-existent-worker",
			ServiceID:   srv.ID,
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: futureDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})

	t.Run("worker is inactive", func(t *testing.T) {
		repo, _, srv := setupRepo()
		inactiveWorker := &domain.Worker{
			ID:       "worker-inactive",
			Name:     "Inactive Worker",
			IsActive: false,
		}
		repo.SeedWorker(inactiveWorker)

		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    inactiveWorker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: futureDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrWorkerInactive)
	})

	t.Run("service not found", func(t *testing.T) {
		repo, worker, _ := setupRepo()
		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   "non-existent-service",
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: futureDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrServiceNotFound)
	})

	t.Run("service does not belong to worker", func(t *testing.T) {
		repo, worker, _ := setupRepo()
		otherWorker := &domain.Worker{
			ID:       "other-worker-id",
			Name:     "Other Worker",
			IsActive: true,
		}
		otherService := &domain.Service{
			ID:       "other-service-id",
			WorkerID: otherWorker.ID, // belongs to other worker
			Name:     "Service Lain",
			Price:    50000,
			IsActive: true,
		}
		repo.SeedWorker(otherWorker)
		repo.SeedService(otherService)

		svc := service.NewBookingService(repo)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   otherService.ID, // mismatch!
			ClientName:  "Dewi",
			ClientPhone: "+62899887766",
			Location:    "Location",
			Zone:        "Jakarta",
			BookingDate: futureDate,
		}
		_, err := svc.CreateBooking(ctx, req)
		assert.ErrorIs(t, err, domain.ErrServiceWorkerMismatch)
	})
}
