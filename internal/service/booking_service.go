package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/geo"
	"tuwaktu.com/internal/repository"
)

type BookingService interface {
	CreateBooking(ctx context.Context, req domain.CreateBookingRequest) (*domain.PublicBookingResponse, error)
	CalculateFee(ctx context.Context, req domain.CalculateFeeRequest) (*domain.FeeCalculationResponse, error)
}

type bookingService struct {
	repo repository.BookingRepository
}

func NewBookingService(repo repository.BookingRepository) BookingService {
	return &bookingService{repo: repo}
}

func (s *bookingService) CreateBooking(ctx context.Context, req domain.CreateBookingRequest) (*domain.PublicBookingResponse, error) {
	// 1. Validate request payload
	bookingDate, err := req.Validate()
	if err != nil {
		return nil, err
	}

	// 2. Validate Service exists and is active
	srv, err := s.repo.GetServiceByID(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}
	if !srv.IsActive {
		return nil, domain.ErrServiceNotFound
	}

	// 3. Resolve Worker: from worker_id, worker_slug, or automatically inferred from service
	var worker *domain.Worker
	if strings.TrimSpace(req.WorkerID) != "" {
		worker, err = s.repo.GetWorkerByID(ctx, strings.TrimSpace(req.WorkerID))
		if err != nil {
			return nil, err
		}
	} else if strings.TrimSpace(req.WorkerSlug) != "" {
		worker, err = s.repo.GetWorkerBySlug(ctx, strings.TrimSpace(req.WorkerSlug))
		if err != nil {
			return nil, err
		}
	} else {
		// Automatically infer worker from the chosen service
		worker, err = s.repo.GetWorkerByID(ctx, srv.WorkerID)
		if err != nil {
			return nil, err
		}
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}

	// Ensure the service belongs to the resolved worker
	if srv.WorkerID != worker.ID {
		return nil, domain.ErrServiceWorkerMismatch
	}

	// 4. Resolve Location and Zone
	location := strings.TrimSpace(req.Location)
	zone := strings.TrimSpace(req.Zone)
	if zone == "" {
		zone = worker.Zone
	}
	if location == "" {
		location = zone
	}

	// 5. Calculate pricing and validate radius if client coordinates are provided
	var transportFee float64
	totalPrice := srv.Price

	if req.ClientLat != nil && req.ClientLng != nil {
		clientLat := *req.ClientLat
		clientLng := *req.ClientLng

		if clientLat < -90.0 || clientLat > 90.0 {
			return nil, fmt.Errorf("%w: titik lintang klien (client_lat) harus berada di antara -90 dan 90", domain.ErrInvalidInput)
		}
		if clientLng < -180.0 || clientLng > 180.0 {
			return nil, fmt.Errorf("%w: titik bujur klien (client_lng) harus berada di antara -180 dan 180", domain.ErrInvalidInput)
		}

		if worker.Lat != nil && worker.Lng != nil {
			distance := geo.CalculateDistance(*worker.Lat, *worker.Lng, clientLat, clientLng)
			maxRadius := worker.MaxRadiusKM
			if maxRadius <= 0 {
				maxRadius = 10.0
			}
			if distance > maxRadius {
				return nil, domain.ErrOutOfServiceRadius
			}

			freeRadius := worker.FreeRadiusKM
			if freeRadius < 0 {
				freeRadius = 3.0
			}

			chargeableKM := math.Round(math.Max(0.0, distance-freeRadius)*100.0) / 100.0
			transportFee = math.Ceil(chargeableKM) * float64(worker.ExtraFeePerKM)
			totalPrice = srv.Price + transportFee
		}
	}

	// 6. Generate unique booking code
	bookingCode := generateBookingCode()

	bookingID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("generating booking id: %w", err)
	}

	now := time.Now().UTC()
	booking := &domain.Booking{
		ID:          bookingID.String(),
		BookingCode: bookingCode,
		WorkerID:    worker.ID,
		ServiceID:   srv.ID,
		ClientName:  strings.TrimSpace(req.ClientName),
		ClientPhone: strings.TrimSpace(req.ClientPhone),
		ClientEmail: strings.TrimSpace(req.ClientEmail),
		Location:    location,
		Zone:        zone,
		BookingDate: bookingDate,
		Notes:       strings.TrimSpace(req.Notes),
		TotalPrice:  totalPrice,
		Status:      "PENDING",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// 7. Persist to database
	if err := s.repo.CreateBooking(ctx, booking); err != nil {
		return nil, fmt.Errorf("persisting booking: %w", err)
	}

	// 8. Return sanitized response
	res := &domain.PublicBookingResponse{
		BookingCode:  booking.BookingCode,
		WorkerID:     worker.ID,
		WorkerName:   worker.Name,
		ServiceID:    srv.ID,
		ServiceName:  srv.Name,
		ClientName:   booking.ClientName,
		Location:     booking.Location,
		Zone:         booking.Zone,
		BookingDate:  booking.BookingDate,
		Notes:        booking.Notes,
		TotalPrice:   booking.TotalPrice,
		TransportFee: transportFee,
		Status:       booking.Status,
		CreatedAt:    booking.CreatedAt,
	}

	return res, nil
}

func generateBookingCode() string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("TW-%s", uuid.NewString()[:8])
	}
	today := time.Now().Format("20060102")
	return fmt.Sprintf("TW-%s-%s", today, strings.ToUpper(hex.EncodeToString(bytes)))
}

func (s *bookingService) CalculateFee(ctx context.Context, req domain.CalculateFeeRequest) (*domain.FeeCalculationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	serviceID := strings.TrimSpace(req.ServiceID)
	if serviceID == "" {
		return nil, fmt.Errorf("%w: pilihan layanan (service_id) wajib diisi", domain.ErrInvalidInput)
	}

	if req.ClientLat == nil || req.ClientLng == nil {
		return nil, fmt.Errorf("%w: titik koordinat klien (client_lat dan client_lng) wajib diisi", domain.ErrInvalidInput)
	}

	clientLat := *req.ClientLat
	clientLng := *req.ClientLng

	if clientLat < -90.0 || clientLat > 90.0 {
		return nil, fmt.Errorf("%w: titik lintang klien (client_lat) harus berada di antara -90 dan 90", domain.ErrInvalidInput)
	}
	if clientLng < -180.0 || clientLng > 180.0 {
		return nil, fmt.Errorf("%w: titik bujur klien (client_lng) harus berada di antara -180 dan 180", domain.ErrInvalidInput)
	}

	// 1. Resolve service
	srv, err := s.repo.GetServiceByID(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !srv.IsActive {
		return nil, domain.ErrServiceNotFound
	}

	// 2. Resolve worker
	var worker *domain.Worker
	if strings.TrimSpace(req.WorkerID) != "" {
		worker, err = s.repo.GetWorkerByID(ctx, strings.TrimSpace(req.WorkerID))
		if err != nil {
			return nil, err
		}
	} else if strings.TrimSpace(req.WorkerSlug) != "" {
		worker, err = s.repo.GetWorkerBySlug(ctx, strings.TrimSpace(req.WorkerSlug))
		if err != nil {
			return nil, err
		}
	} else {
		worker, err = s.repo.GetWorkerByID(ctx, srv.WorkerID)
		if err != nil {
			return nil, err
		}
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}
	if srv.WorkerID != worker.ID {
		return nil, domain.ErrServiceWorkerMismatch
	}

	// 3. Ensure worker location is configured
	if worker.Lat == nil || worker.Lng == nil {
		return nil, domain.ErrWorkerLocationNotSet
	}

	// 4. Calculate straight-line distance via Haversine formula
	distance := geo.CalculateDistance(*worker.Lat, *worker.Lng, clientLat, clientLng)

	maxRadius := worker.MaxRadiusKM
	if maxRadius <= 0 {
		maxRadius = 10.0
	}

	if distance > maxRadius {
		return nil, domain.ErrOutOfServiceRadius
	}

	freeRadius := worker.FreeRadiusKM
	if freeRadius < 0 {
		freeRadius = 3.0
	}

	chargeableKM := math.Round(math.Max(0.0, distance-freeRadius)*100.0) / 100.0
	extraFee := math.Ceil(chargeableKM) * float64(worker.ExtraFeePerKM)
	totalPrice := srv.Price + extraFee

	return &domain.FeeCalculationResponse{
		DistanceKM:     distance,
		MaxRadiusKM:    maxRadius,
		FreeRadiusKM:   freeRadius,
		ServicePrice:   srv.Price,
		ExtraFeePerKM:  worker.ExtraFeePerKM,
		TransportFee:   extraFee,
		TotalPrice:     totalPrice,
		IsWithinRadius: true,
	}, nil
}

