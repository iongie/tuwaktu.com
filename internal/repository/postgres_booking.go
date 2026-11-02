package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

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
