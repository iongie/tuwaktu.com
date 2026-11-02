package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

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
	if id == "" {
		return nil, domain.ErrInvalidInput
	}
	if _, err := uuid.Parse(id); err != nil && r.db.Dialector.Name() == "postgres" {
		return nil, domain.ErrWorkerNotFound
	}
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) ||
			strings.Contains(err.Error(), "invalid input syntax for type uuid") ||
			strings.Contains(err.Error(), "22P02") {
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

func (r *PostgresWorkerRepository) UpdateProfile(ctx context.Context, id string, profile *domain.WorkerProfileUpdate) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker profile: %w", err)
	}
	if profile == nil {
		return nil, domain.ErrInvalidInput
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, id)
		}
		if err != nil {
			return nil, err
		}
	}

	if strings.TrimSpace(profile.Name) != "" {
		worker.Name = strings.TrimSpace(profile.Name)
	}
	worker.Bio = strings.TrimSpace(profile.Bio)
	if strings.TrimSpace(profile.AvatarURL) != "" {
		worker.AvatarURL = strings.TrimSpace(profile.AvatarURL)
	}
	if strings.TrimSpace(profile.Zone) != "" {
		worker.Zone = strings.TrimSpace(profile.Zone)
	}
	if strings.TrimSpace(profile.PhoneNumber) != "" {
		worker.PhoneNumber = strings.TrimSpace(profile.PhoneNumber)
	}
	if strings.TrimSpace(profile.Email) != "" {
		worker.Email = strings.TrimSpace(profile.Email)
	}
	if strings.TrimSpace(profile.Address) != "" {
		worker.Address = strings.TrimSpace(profile.Address)
	}
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker profile update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) UpdateRates(ctx context.Context, idOrSlug string, basePrice float64, rateType string) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker rates: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	worker.BasePrice = basePrice
	worker.RateType = rateType
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker rates update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) UpdateLocationSettings(ctx context.Context, idOrSlug string, update *domain.WorkerLocationSettingsUpdate) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker location settings: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" || update == nil {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	if update.Lat != nil {
		worker.Lat = update.Lat
	}
	if update.Lng != nil {
		worker.Lng = update.Lng
	}
	if update.MaxRadiusKM > 0 {
		worker.MaxRadiusKM = update.MaxRadiusKM
	}
	if update.FreeRadiusKM >= 0 {
		worker.FreeRadiusKM = update.FreeRadiusKM
	}
	if update.ExtraFeePerKM >= 0 {
		worker.ExtraFeePerKM = update.ExtraFeePerKM
	}
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker location settings update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker schedules: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
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
		// Provide default weekly schedule (all 7 days)
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

func (r *PostgresWorkerRepository) UpdateWorkerSchedules(ctx context.Context, idOrSlug string, schedules []domain.WorkerSchedule) ([]domain.WorkerSchedule, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker schedules: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	tx := r.db.WithContext(ctx).Begin()
	now := time.Now().UTC()

	for _, item := range schedules {
		if item.DayOfWeek < 0 || item.DayOfWeek > 6 {
			tx.Rollback()
			return nil, domain.ErrInvalidScheduleDay
		}

		var existing domain.WorkerSchedule
		err := tx.Where("worker_id = ? AND day_of_week = ?", worker.ID, item.DayOfWeek).First(&existing).Error
		if err == nil {
			existing.IsActive = item.IsActive
			existing.SlotMorning = item.SlotMorning
			existing.SlotAfternoon = item.SlotAfternoon
			existing.SlotEvening = item.SlotEvening
			existing.UpdatedAt = now
			if err := tx.Select("is_active", "slot_morning", "slot_afternoon", "slot_evening", "updated_at").Save(&existing).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("saving worker schedule: %w", err)
			}
		} else {
			item.WorkerID = worker.ID
			item.CreatedAt = now
			item.UpdatedAt = now
			if err := tx.Select("*").Omit("DayName").Create(&item).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("creating worker schedule: %w", err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("committing worker schedules update: %w", err)
	}

	return r.GetWorkerSchedules(ctx, worker.ID)
}


