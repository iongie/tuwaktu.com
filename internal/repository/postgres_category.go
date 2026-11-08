package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tuwaktu.com/internal/domain"
)

type GormCategoryRepository struct {
	db *gorm.DB
}

func NewGormCategoryRepository(db *gorm.DB) *GormCategoryRepository {
	return &GormCategoryRepository{db: db}
}

func (r *GormCategoryRepository) ListPublicCategories(ctx context.Context) ([]domain.Category, error) {
	var categories []domain.Category
	err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *GormCategoryRepository) ListAdminCategories(ctx context.Context) ([]domain.Category, error) {
	var categories []domain.Category
	err := r.db.WithContext(ctx).
		Order("sort_order ASC, created_at DESC").
		Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *GormCategoryRepository) GetByID(ctx context.Context, id string) (*domain.Category, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return nil, domain.ErrCategoryNotFound
	}

	if _, err := uuid.Parse(cleanID); err != nil && r.db.Dialector.Name() == "postgres" {
		return nil, domain.ErrCategoryNotFound
	}

	var category domain.Category
	err := r.db.WithContext(ctx).Where("id = ?", cleanID).First(&category).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) ||
			strings.Contains(err.Error(), "invalid input syntax for type uuid") ||
			strings.Contains(err.Error(), "22P02") {
			return nil, domain.ErrCategoryNotFound
		}
		return nil, err
	}
	return &category, nil
}

func (r *GormCategoryRepository) GetBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	cleanSlug := strings.ToLower(strings.TrimSpace(slug))
	if cleanSlug == "" {
		return nil, domain.ErrCategoryNotFound
	}

	var category domain.Category
	err := r.db.WithContext(ctx).Where("LOWER(slug) = ?", cleanSlug).First(&category).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrCategoryNotFound
		}
		return nil, err
	}
	return &category, nil
}

func (r *GormCategoryRepository) Create(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	if category.CreatedAt.IsZero() {
		category.CreatedAt = time.Now()
	}
	category.UpdatedAt = time.Now()

	if err := r.db.WithContext(ctx).Create(category).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, domain.ErrCategorySlugExists
		}
		return nil, err
	}
	return category, nil
}

func (r *GormCategoryRepository) Update(ctx context.Context, id string, payload *domain.UpdateCategoryPayload) (*domain.Category, error) {
	category, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	if payload.Name != nil {
		updates["name"] = strings.TrimSpace(*payload.Name)
	}
	if payload.Slug != nil {
		updates["slug"] = strings.ToLower(strings.TrimSpace(*payload.Slug))
	}
	if payload.Description != nil {
		updates["description"] = strings.TrimSpace(*payload.Description)
	}
	if payload.Icon != nil {
		updates["icon"] = strings.TrimSpace(*payload.Icon)
	}
	if payload.StartingPrice != nil {
		updates["starting_price"] = *payload.StartingPrice
	}
	if payload.PriceUnit != nil {
		updates["price_unit"] = strings.TrimSpace(*payload.PriceUnit)
	}
	if payload.AvailabilityTag != nil {
		updates["availability_tag"] = strings.TrimSpace(*payload.AvailabilityTag)
	}
	if payload.HighlightTag != nil {
		updates["highlight_tag"] = strings.TrimSpace(*payload.HighlightTag)
	}
	if payload.IsActive != nil {
		updates["is_active"] = *payload.IsActive
	}
	if payload.SortOrder != nil {
		updates["sort_order"] = *payload.SortOrder
	}

	if err := r.db.WithContext(ctx).Model(category).Updates(updates).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, domain.ErrCategorySlugExists
		}
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *GormCategoryRepository) Delete(ctx context.Context, id string) error {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return domain.ErrCategoryNotFound
	}

	if _, err := uuid.Parse(cleanID); err != nil && r.db.Dialector.Name() == "postgres" {
		return domain.ErrCategoryNotFound
	}

	res := r.db.WithContext(ctx).Where("id = ?", cleanID).Delete(&domain.Category{})
	if res.Error != nil {
		if strings.Contains(res.Error.Error(), "invalid input syntax for type uuid") ||
			strings.Contains(res.Error.Error(), "22P02") {
			return domain.ErrCategoryNotFound
		}
		return res.Error
	}
	if res.RowsAffected == 0 {
		return domain.ErrCategoryNotFound
	}
	return nil
}
