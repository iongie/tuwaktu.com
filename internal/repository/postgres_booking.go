package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"tuwaktu.com/internal/domain"
)

type PostgresBookingRepository struct {
	db *gorm.DB
}

func NewPostgresBookingRepository(db *gorm.DB) *PostgresBookingRepository {
	return &PostgresBookingRepository{db: db}
}

// GormBookingRepository is an alias for PostgresBookingRepository
type GormBookingRepository = PostgresBookingRepository

func NewGormBookingRepository(db *gorm.DB) *GormBookingRepository {
	return NewPostgresBookingRepository(db)
}

func (r *PostgresBookingRepository) CreateBooking(ctx context.Context, booking *domain.Booking) error {
	if err := r.db.WithContext(ctx).Omit(clause.Associations).Create(booking).Error; err != nil {
		return fmt.Errorf("inserting booking: %w", err)
	}
	return nil
}

func (r *PostgresBookingRepository) GetServiceByID(ctx context.Context, serviceID string) (*domain.Service, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying service by id: %w", err)
	}
	serviceID = strings.TrimSpace(serviceID)
	var s domain.Service
	db := r.db.WithContext(ctx)

	// If valid UUID, look up directly by ID
	if _, err := uuid.Parse(serviceID); err == nil {
		if err := db.Where("id = ?", serviceID).First(&s).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, domain.ErrServiceNotFound
			}
			return nil, fmt.Errorf("querying service by id: %w", err)
		}
		return &s, nil
	}

	// Not a UUID: try looking up by case-insensitive service name
	if err := db.Where("LOWER(name) = ?", strings.ToLower(serviceID)).First(&s).Error; err == nil {
		return &s, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("querying service by id: %w", err)
	}

	// In non-postgres environments (e.g. SQLite tests), allow arbitrary string IDs like "srv-001"
	if r.db.Dialector.Name() != "postgres" {
		if err := db.Where("id = ?", serviceID).First(&s).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, domain.ErrServiceNotFound
			}
			return nil, fmt.Errorf("querying service by id: %w", err)
		}
		return &s, nil
	}

	return nil, domain.ErrServiceNotFound
}

func (r *PostgresBookingRepository) GetWorkerByID(ctx context.Context, workerID string) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}
	workerID = strings.TrimSpace(workerID)
	if _, err := uuid.Parse(workerID); err != nil && r.db.Dialector.Name() == "postgres" {
		return nil, domain.ErrWorkerNotFound
	}
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("id = ?", workerID).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}

	return &w, nil
}

func (r *PostgresBookingRepository) GetWorkerBySlug(ctx context.Context, slug string) (*domain.Worker, error) {
	slug = strings.ToLower(strings.TrimSpace(slug))
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("LOWER(slug) = ?", slug).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("querying worker by slug: %w", err)
	}

	return &w, nil
}

func (r *PostgresBookingRepository) GetBookingsByWorkerAndDateRange(ctx context.Context, workerID string, startTime, endTime time.Time) ([]domain.Booking, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying bookings by worker and date range: %w", err)
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}

	var bookings []domain.Booking
	err := r.db.WithContext(ctx).
		Where("worker_id = ? AND status != ? AND ((start_time IS NOT NULL AND start_time < ? AND end_time > ?) OR (start_time IS NULL AND booking_date >= ? AND booking_date <= ?))",
			workerID, "CANCELLED", endTime, startTime, startTime, endTime).
		Order("booking_date ASC").
		Find(&bookings).Error
	if err != nil {
		return nil, fmt.Errorf("querying bookings by worker and date range: %w", err)
	}

	if bookings == nil {
		bookings = []domain.Booking{}
	}

	return bookings, nil
}

func (r *PostgresBookingRepository) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker schedules: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetWorkerByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetWorkerBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	var schedules []domain.WorkerSchedule
	err = r.db.WithContext(ctx).
		Where("worker_id = ?", worker.ID).
		Order("day_of_week ASC").
		Find(&schedules).Error
	if err != nil {
		return nil, fmt.Errorf("querying worker schedules: %w", err)
	}

	if len(schedules) == 0 {
		schedules = make([]domain.WorkerSchedule, 7)
		for d := 0; d < 7; d++ {
			schedules[d] = domain.WorkerSchedule{
				WorkerID:      worker.ID,
				DayOfWeek:     d,
				DayName:       domain.GetDayName(d),
				IsActive:      true,
				SlotMorning:   true,
				SlotAfternoon: true,
				SlotEvening:   false,
			}
		}
	} else {
		for i := range schedules {
			schedules[i].DayName = domain.GetDayName(schedules[i].DayOfWeek)
		}
	}

	return schedules, nil
}


