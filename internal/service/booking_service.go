package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

type BookingService interface {
	CreateBooking(ctx context.Context, req domain.CreateBookingRequest) (*domain.PublicBookingResponse, error)
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

	// 5. Generate unique booking code
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
		TotalPrice:  srv.Price,
		Status:      "PENDING",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// 6. Persist to database
	if err := s.repo.CreateBooking(ctx, booking); err != nil {
		return nil, fmt.Errorf("persisting booking: %w", err)
	}

	// 7. Return sanitized response
	res := &domain.PublicBookingResponse{
		BookingCode: booking.BookingCode,
		WorkerID:    worker.ID,
		WorkerName:  worker.Name,
		ServiceID:   srv.ID,
		ServiceName: srv.Name,
		ClientName:  booking.ClientName,
		Location:    booking.Location,
		Zone:        booking.Zone,
		BookingDate: booking.BookingDate,
		Notes:       booking.Notes,
		TotalPrice:  booking.TotalPrice,
		Status:      booking.Status,
		CreatedAt:   booking.CreatedAt,
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
