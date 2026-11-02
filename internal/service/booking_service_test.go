package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
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

		// Assert persisted booking ID is valid UUIDv7
		for _, b := range repo.GetAllBookings() {
			if b.BookingCode == res.BookingCode {
				parsedUUID, parseErr := uuid.Parse(b.ID)
				require.NoError(t, parseErr)
				assert.Equal(t, uuid.Version(7), parsedUUID.Version())
			}
		}

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

func TestBookingService_CalculateFee(t *testing.T) {
	ctx := context.Background()

	setupFeeRepo := func() (*repository.MemoryRepository, *domain.Worker, *domain.Service) {
		repo := repository.NewMemoryRepository()
		lat := -6.2921000
		lng := 106.7992000
		worker := &domain.Worker{
			ID:            "worker-fee-1",
			Slug:          "budi-santoso",
			Name:          "Budi Santoso",
			Zone:          "Jakarta Selatan",
			Lat:           &lat,
			Lng:           &lng,
			MaxRadiusKM:   15.0,
			FreeRadiusKM:  3.0,
			ExtraFeePerKM: 5000,
			IsActive:      true,
		}
		srv := &domain.Service{
			ID:              "service-fee-1",
			WorkerID:        worker.ID,
			Name:            "Cuci AC Standar",
			Price:           75000,
			DurationMinutes: 45,
			IsActive:        true,
		}
		repo.SeedWorker(worker)
		repo.SeedService(srv)
		return repo, worker, srv
	}

	t.Run("success within free radius - zero transport fee", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		// Client very close to worker (~0.43 km <= 3.0 km free)
		lat := -6.2941000
		lng := 106.8025000
		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
			ClientLat: &lat,
			ClientLng: &lng,
		}

		res, err := svc.CalculateFee(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)

		assert.InDelta(t, 0.43, res.DistanceKM, 0.05)
		assert.Equal(t, 15.0, res.MaxRadiusKM)
		assert.Equal(t, 3.0, res.FreeRadiusKM)
		assert.Equal(t, 75000.0, res.ServicePrice)
		assert.Equal(t, 5000, res.ExtraFeePerKM)
		assert.Equal(t, 0.0, res.TransportFee)
		assert.Equal(t, 75000.0, res.TotalPrice)
		assert.True(t, res.IsWithinRadius)
	})

	t.Run("success beyond free radius but within max radius", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		// Distance Monas area (~13.1 km > 3.0 km free, <= 15.0 km max)
		lat := -6.1754000
		lng := 106.8272000
		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
			ClientLat: &lat,
			ClientLng: &lng,
		}

		res, err := svc.CalculateFee(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)

		assert.True(t, res.DistanceKM > 3.0 && res.DistanceKM <= 15.0)
		chargeableKM := res.DistanceKM - 3.0
		expectedFee := float64(int(chargeableKM+0.999999) * 5000)
		assert.Equal(t, expectedFee, res.TransportFee)
		assert.Equal(t, 75000.0+expectedFee, res.TotalPrice)
	})

	t.Run("fails with ErrOutOfServiceRadius when beyond max radius", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		// Bandung coordinate (~120 km > 15 km max radius)
		lat := -6.9025000
		lng := 107.6186000
		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
			ClientLat: &lat,
			ClientLng: &lng,
		}

		res, err := svc.CalculateFee(ctx, req)
		assert.ErrorIs(t, err, domain.ErrOutOfServiceRadius)
		assert.Nil(t, res)
	})

	t.Run("fails when worker location is not configured", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		worker.Lat = nil
		worker.Lng = nil
		repo.SeedWorker(worker)

		svc := service.NewBookingService(repo)
		lat := -6.2941000
		lng := 106.8025000
		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
			ClientLat: &lat,
			ClientLng: &lng,
		}

		res, err := svc.CalculateFee(ctx, req)
		assert.ErrorIs(t, err, domain.ErrWorkerLocationNotSet)
		assert.Nil(t, res)
	})

	t.Run("auto resolves worker from service if worker_id omitted", func(t *testing.T) {
		repo, _, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		lat := -6.2941000
		lng := 106.8025000
		req := domain.CalculateFeeRequest{
			ServiceID: srv.ID,
			ClientLat: &lat,
			ClientLng: &lng,
		}

		res, err := svc.CalculateFee(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)
		assert.Equal(t, 75000.0, res.TotalPrice)
	})

	t.Run("fails when client coordinates are omitted", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
		}

		_, err := svc.CalculateFee(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("invalid client coordinates returns ErrInvalidInput", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)

		invalidLat := 95.0
		lng := 106.8025000
		req := domain.CalculateFeeRequest{
			WorkerID:  worker.ID,
			ServiceID: srv.ID,
			ClientLat: &invalidLat,
			ClientLng: &lng,
		}

		_, err := svc.CalculateFee(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("CreateBooking validates client coordinates and applies transport fee", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)
		futureDate := time.Now().Add(24 * time.Hour).Format(time.RFC3339)

		// 1. Within radius with extra fee
		clientLat := -6.1754000
		clientLng := 106.8272000
		reqValid := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Budi Pelanggan",
			ClientPhone: "+62812345678",
			Location:    "Jl. Monas No. 1",
			Zone:        "Jakarta Pusat",
			BookingDate: futureDate,
			ClientLat:   &clientLat,
			ClientLng:   &clientLng,
		}

		resValid, err := svc.CreateBooking(ctx, reqValid)
		require.NoError(t, err)
		require.NotNil(t, resValid)
		assert.True(t, resValid.TransportFee > 0)
		assert.Equal(t, srv.Price+resValid.TransportFee, resValid.TotalPrice)

		// 2. Out of radius booking attempt gets rejected
		farLat := -6.9025000
		farLng := 107.6186000
		reqFar := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Pelanggan Bandung",
			ClientPhone: "+62812345678",
			Location:    "Bandung",
			Zone:        "Bandung",
			BookingDate: futureDate,
			ClientLat:   &farLat,
			ClientLng:   &farLng,
		}

		resFar, errFar := svc.CreateBooking(ctx, reqFar)
		assert.ErrorIs(t, errFar, domain.ErrOutOfServiceRadius)
		assert.Nil(t, resFar)
	})

	t.Run("CreateBooking computes and populates start_time and end_time based on service duration", func(t *testing.T) {
		repo, worker, srv := setupFeeRepo()
		svc := service.NewBookingService(repo)
		futureDate := time.Now().Add(48 * time.Hour).Truncate(time.Minute)

		req := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Wawan",
			Location:    "Jakarta Selatan",
			BookingDate: futureDate.Format(time.RFC3339),
		}

		res, err := svc.CreateBooking(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res.StartTime)
		require.NotNil(t, res.EndTime)

		expectedDuration := time.Duration(srv.DurationMinutes) * time.Minute
		assert.Equal(t, futureDate.Unix(), res.StartTime.Unix())
		assert.Equal(t, futureDate.Add(expectedDuration).Unix(), res.EndTime.Unix())

		// Also check in repo
		var saved *domain.Booking
		for _, b := range repo.GetAllBookings() {
			if b.BookingCode == res.BookingCode {
				saved = b
				break
			}
		}
		require.NotNil(t, saved)
		require.NotNil(t, saved.StartTime)
		require.NotNil(t, saved.EndTime)
		assert.Equal(t, futureDate.Unix(), saved.StartTime.Unix())
		assert.Equal(t, futureDate.Add(expectedDuration).Unix(), saved.EndTime.Unix())
	})
}

func TestBookingService_TransitBufferAndAvailableSlots(t *testing.T) {
	ctx := context.Background()
	loc := time.FixedZone("WIB", 7*3600)

	// Target date for testing: e.g. future Wednesday: 2026-11-18
	targetDate := "2026-11-18"
	parsedDate, _ := time.Parse("2006-01-02", targetDate)
	dateInLoc := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, loc)

	setupWorkerWithSlots := func() (*repository.MemoryRepository, *domain.Worker) {
		repo := repository.NewMemoryRepository()
		worker := &domain.Worker{
			ID:       "w-transit-1",
			Slug:     "teguh-teknisi",
			Name:     "Teguh",
			Zone:     "Jakarta",
			IsActive: true,
		}
		repo.SeedWorker(worker)

		// Set Wednesday (day 3) active with all 3 slots
		repo.SeedSchedule(&domain.WorkerSchedule{
			WorkerID:      worker.ID,
			DayOfWeek:     int(dateInLoc.Weekday()),
			IsActive:      true,
			SlotMorning:   true,
			SlotAfternoon: true,
			SlotEvening:   true,
		})

		return repo, worker
	}

	// Table-driven test cases focusing specifically on Siang slot (13:00 - 16:30)
	// Morning slot is 08:00 - 11:30, Sore slot is 17:00 - 20:30
	tests := []struct {
		name                 string
		bookingStart         time.Time
		bookingEnd           time.Time
		bookingStatus        string
		expectedMorningAvail bool
		expectedSiangAvail   bool
		expectedSoreAvail    bool
		expectedSiangReason  string
	}{
		{
			name:                 "Preceding booking ending > 60m before Siang slot (ends at 11:45)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 10, 0, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 11, 45, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: false, // 10:00 - 11:45 overlaps Morning slot
			expectedSiangAvail:   true,  // 11:45 + 60m = 12:45 <= 13:00 -> NO conflict for Siang!
			expectedSoreAvail:    true,
			expectedSiangReason:  "Tersedia",
		},
		{
			name:                 "Preceding booking ending EXACTLY 60m before Siang slot (ends at 12:00)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 11, 0, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 12, 0, 0, 0, loc),
			bookingStatus:        "PENDING",
			expectedMorningAvail: false,
			expectedSiangAvail:   true, // 12:00 + 60m = 13:00. slot_start (13:00) < 13:00 is FALSE -> NO conflict!
			expectedSoreAvail:    true,
			expectedSiangReason:  "Tersedia",
		},
		{
			name:                 "Preceding booking ending WITHIN 60m transit buffer (ends at 12:15)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 11, 15, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 12, 15, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: false,
			expectedSiangAvail:   false, // 12:15 + 60m = 13:15 > 13:00 -> CONFLICT!
			expectedSoreAvail:    true,
			expectedSiangReason:  "Slot bentrok dengan pesanan lain (termasuk buffer transit 60 menit)",
		},
		{
			name:                 "Direct overlap inside Siang slot (14:00 - 15:30)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 14, 0, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 15, 30, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: true,
			expectedSiangAvail:   false, // Direct overlap
			expectedSoreAvail:    true,
			expectedSiangReason:  "Slot bentrok dengan pesanan lain (termasuk buffer transit 60 menit)",
		},
		{
			name:                 "Subsequent booking starting WITHIN 60m buffer of Siang slot end (starts at 17:15)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 17, 15, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 18, 30, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: true,
			expectedSiangAvail:   false, // 17:15 - 60m = 16:15 < 16:30 -> CONFLICT!
			expectedSoreAvail:    false,
			expectedSiangReason:  "Slot bentrok dengan pesanan lain (termasuk buffer transit 60 menit)",
		},
		{
			name:                 "Subsequent booking starting EXACTLY 60m after Siang slot end (starts at 17:30)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 17, 30, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 19, 0, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: true,
			expectedSiangAvail:   true, // 17:30 - 60m = 16:30. slot_end (16:30) > 16:30 is FALSE -> NO conflict!
			expectedSoreAvail:    false, // 17:30 overlaps Sore slot (17:00 - 20:30)
			expectedSiangReason:  "Tersedia",
		},
		{
			name:                 "Subsequent booking starting > 60m after Siang slot end (starts at 18:00)",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 18, 0, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 19, 30, 0, 0, loc),
			bookingStatus:        "CONFIRMED",
			expectedMorningAvail: true,
			expectedSiangAvail:   true, // 18:00 - 60m = 17:00 > 16:30 -> NO conflict!
			expectedSoreAvail:    false,
			expectedSiangReason:  "Tersedia",
		},
		{
			name:                 "Cancelled booking inside Siang slot does NOT block availability",
			bookingStart:         time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 14, 0, 0, 0, loc),
			bookingEnd:           time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 15, 30, 0, 0, loc),
			bookingStatus:        "CANCELLED",
			expectedMorningAvail: true,
			expectedSiangAvail:   true,
			expectedSoreAvail:    true,
			expectedSiangReason:  "Tersedia",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo, worker := setupWorkerWithSlots()
			svc := service.NewBookingService(repo)

			// Seed the test booking
			b := &domain.Booking{
				ID:          "bkg-test-" + tt.name,
				BookingCode: "TW-TEST-001",
				WorkerID:    worker.ID,
				ServiceID:   "srv-1",
				ClientName:  "Test Client",
				BookingDate: tt.bookingStart,
				StartTime:   &tt.bookingStart,
				EndTime:     &tt.bookingEnd,
				Status:      tt.bookingStatus,
			}
			require.NoError(t, repo.CreateBooking(ctx, b))

			res, err := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, "")
			require.NoError(t, err)
			require.NotNil(t, res)
			require.Len(t, res.Slots, 3)

			var morning, siang, sore *domain.AvailableTimeSlot
			for i := range res.Slots {
				switch res.Slots[i].SlotType {
				case domain.SlotMorning:
					morning = &res.Slots[i]
				case domain.SlotAfternoon:
					siang = &res.Slots[i]
				case domain.SlotEvening:
					sore = &res.Slots[i]
				}
			}

			require.NotNil(t, morning)
			require.NotNil(t, siang)
			require.NotNil(t, sore)

			assert.Equal(t, tt.expectedMorningAvail, morning.Available, "morning slot availability mismatch")
			assert.Equal(t, tt.expectedSiangAvail, siang.Available, "siang slot availability mismatch")
			assert.Equal(t, tt.expectedSoreAvail, sore.Available, "sore slot availability mismatch")
			assert.Equal(t, tt.expectedSiangReason, siang.Reason, "siang slot reason mismatch")
		})
	}

	t.Run("worker day off marks all slots as unavailable", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		// Deactivate Wednesday
		repo.SeedSchedule(&domain.WorkerSchedule{
			WorkerID:  worker.ID,
			DayOfWeek: int(dateInLoc.Weekday()),
			IsActive:  false, // Libur!
		})

		svc := service.NewBookingService(repo)
		res, err := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, "")
		require.NoError(t, err)
		assert.False(t, res.IsWorkingDay)
		for _, s := range res.Slots {
			assert.False(t, s.Available)
			assert.Contains(t, s.Reason, "libur")
		}
	})

	t.Run("specific slot toggled off in schedule is marked unavailable", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		repo.SeedSchedule(&domain.WorkerSchedule{
			WorkerID:      worker.ID,
			DayOfWeek:     int(dateInLoc.Weekday()),
			IsActive:      true,
			SlotMorning:   true,
			SlotAfternoon: true,
			SlotEvening:   false, // Evening disabled
		})

		svc := service.NewBookingService(repo)
		res, err := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, "")
		require.NoError(t, err)

		for _, s := range res.Slots {
			if s.SlotType == domain.SlotEvening {
				assert.False(t, s.Available)
				assert.Contains(t, s.Reason, "tidak diaktifkan")
			}
		}
	})

	t.Run("returns error on invalid date format", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		svc := service.NewBookingService(repo)

		_, err := svc.GetAvailableSlots(ctx, worker.Slug, "18-11-2026", "")
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns error on empty slug", func(t *testing.T) {
		repo, _ := setupWorkerWithSlots()
		svc := service.NewBookingService(repo)

		_, err := svc.GetAvailableSlots(ctx, "", targetDate, "")
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("returns ErrWorkerNotFound on unknown worker slug", func(t *testing.T) {
		repo, _ := setupWorkerWithSlots()
		svc := service.NewBookingService(repo)

		_, err := svc.GetAvailableSlots(ctx, "non-existent-worker", targetDate, "")
		assert.ErrorIs(t, err, domain.ErrWorkerNotFound)
	})

	t.Run("returns ErrWorkerInactive on inactive worker", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		worker.IsActive = false
		svc := service.NewBookingService(repo)

		_, err := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, "")
		assert.ErrorIs(t, err, domain.ErrWorkerInactive)
	})

	t.Run("validates optional service_id correctly", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		srv := &domain.Service{
			ID:              "srv-valid-1",
			WorkerID:        worker.ID,
			Name:            "Servis AC",
			Price:           100000,
			DurationMinutes: 60,
			IsActive:        true,
		}
		repo.SeedService(srv)
		svc := service.NewBookingService(repo)

		// 1. Valid service_id
		res, err := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, srv.ID)
		require.NoError(t, err)
		assert.NotNil(t, res)

		// 2. Unknown service_id
		_, errUnknown := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, "unknown-service-id")
		assert.ErrorIs(t, errUnknown, domain.ErrServiceNotFound)

		// 3. Service belonging to another worker
		otherWorker := &domain.Worker{
			ID:       "w-other-99",
			Slug:     "worker-lain",
			IsActive: true,
		}
		otherService := &domain.Service{
			ID:       "srv-other-99",
			WorkerID: otherWorker.ID,
			Name:     "Servis Orang Lain",
			IsActive: true,
		}
		repo.SeedWorker(otherWorker)
		repo.SeedService(otherService)

		_, errMismatch := svc.GetAvailableSlots(ctx, worker.Slug, targetDate, otherService.ID)
		assert.ErrorIs(t, errMismatch, domain.ErrServiceWorkerMismatch)
	})

	t.Run("CreateBooking rejects booking colliding with existing booking transit buffer", func(t *testing.T) {
		repo, worker := setupWorkerWithSlots()
		srv := &domain.Service{
			ID:              "srv-transit-test",
			WorkerID:        worker.ID,
			Name:            "Reparasi",
			Price:           100000,
			DurationMinutes: 60,
			IsActive:        true,
		}
		repo.SeedService(srv)
		svc := service.NewBookingService(repo)

		// Create first booking tomorrow at 10:00 (ends at 11:00)
		futureDay := time.Now().Add(48 * time.Hour).Truncate(24 * time.Hour)
		b1Start := futureDay.Add(10 * time.Hour)
		req1 := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Klien Pertama",
			Location:    "Jakarta",
			BookingDate: b1Start.Format(time.RFC3339),
		}
		res1, err := svc.CreateBooking(ctx, req1)
		require.NoError(t, err)
		require.NotNil(t, res1)

		// Attempt second booking ending within 60 min transit buffer (starts at 11:30, buffer reaches 11:00+60m = 12:00)
		b2Start := futureDay.Add(11*time.Hour + 30*time.Minute)
		req2 := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Klien Kedua (Bentrok Buffer)",
			Location:    "Jakarta",
			BookingDate: b2Start.Format(time.RFC3339),
		}
		_, err2 := svc.CreateBooking(ctx, req2)
		assert.ErrorIs(t, err2, domain.ErrSlotUnavailable)

		// Attempt third booking with safe gap (> 60m buffer, e.g. starts at 12:30, gap = 90m > 60m)
		b3Start := futureDay.Add(12*time.Hour + 30*time.Minute)
		req3 := domain.CreateBookingRequest{
			WorkerID:    worker.ID,
			ServiceID:   srv.ID,
			ClientName:  "Klien Ketiga (Aman)",
			Location:    "Jakarta",
			BookingDate: b3Start.Format(time.RFC3339),
		}
		res3, err3 := svc.CreateBooking(ctx, req3)
		require.NoError(t, err3)
		require.NotNil(t, res3)
	})
}



