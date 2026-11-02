package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tuwaktu.com/internal/domain"
)

type PostgresWorkerRepository struct {
	db *gorm.DB
}

func NewPostgresWorkerRepository(db *gorm.DB) *PostgresWorkerRepository {
	return &PostgresWorkerRepository{db: db}
}

// GormWorkerRepository is an alias for PostgresWorkerRepository
type GormWorkerRepository = PostgresWorkerRepository

func NewGormWorkerRepository(db *gorm.DB) *GormWorkerRepository {
	return NewPostgresWorkerRepository(db)
}

func (r *PostgresWorkerRepository) GetBySlug(ctx context.Context, slug string) (*domain.Worker, error) {
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

func (r *PostgresWorkerRepository) GetByID(ctx context.Context, id string) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}
	id = strings.TrimSpace(id)
	if _, err := uuid.Parse(id); err != nil && r.db.Dialector.Name() == "postgres" {
		return nil, domain.ErrWorkerNotFound
	}
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}

	return &w, nil
}

func (r *PostgresWorkerRepository) GetServicesByWorkerID(ctx context.Context, workerID string) ([]domain.Service, error) {
	var services []domain.Service
	err := r.db.WithContext(ctx).
		Where("worker_id = ? AND is_active = ?", workerID, true).
		Order("price ASC").
		Find(&services).Error
	if err != nil {
		return nil, fmt.Errorf("querying services by worker_id: %w", err)
	}

	if services == nil {
		services = []domain.Service{}
	}

	return services, nil
}
