package service

import (
	"context"
	"strings"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/slug"
	"tuwaktu.com/internal/repository"
)

type CategoryService interface {
	ListPublicCategories(ctx context.Context) ([]domain.PublicCategory, error)
	ListAdminCategories(ctx context.Context) ([]domain.Category, error)
	GetCategoryByID(ctx context.Context, id string) (*domain.Category, error)
	CreateCategory(ctx context.Context, payload *domain.CreateCategoryPayload) (*domain.Category, error)
	UpdateCategory(ctx context.Context, id string, payload *domain.UpdateCategoryPayload) (*domain.Category, error)
	DeleteCategory(ctx context.Context, id string) error
}

type categoryService struct {
	repo repository.CategoryRepository
}

func NewCategoryService(repo repository.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) ListPublicCategories(ctx context.Context) ([]domain.PublicCategory, error) {
	categories, err := s.repo.ListPublicCategories(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]domain.PublicCategory, 0, len(categories))
	for _, c := range categories {
		result = append(result, c.ToPublic())
	}
	return result, nil
}

func (s *categoryService) ListAdminCategories(ctx context.Context) ([]domain.Category, error) {
	categories, err := s.repo.ListAdminCategories(ctx)
	if err != nil {
		return nil, err
	}
	if categories == nil {
		categories = []domain.Category{}
	}
	return categories, nil
}

func (s *categoryService) GetCategoryByID(ctx context.Context, id string) (*domain.Category, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return nil, domain.ErrCategoryNotFound
	}
	return s.repo.GetByID(ctx, cleanID)
}

func (s *categoryService) CreateCategory(ctx context.Context, payload *domain.CreateCategoryPayload) (*domain.Category, error) {
	if payload == nil {
		return nil, domain.ErrInvalidInput
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		return nil, domain.ErrCategoryNameRequired
	}

	var catSlug string
	if strings.TrimSpace(payload.Slug) != "" {
		catSlug = slug.GenerateSlug(payload.Slug)
	} else {
		catSlug = slug.GenerateSlug(name)
	}
	if catSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	if existing, err := s.repo.GetBySlug(ctx, catSlug); err == nil && existing != nil {
		return nil, domain.ErrCategorySlugExists
	}

	var startingPrice float64
	if payload.StartingPrice != nil {
		if *payload.StartingPrice < 0 {
			return nil, domain.ErrInvalidInput
		}
		startingPrice = *payload.StartingPrice
	}

	priceUnit := strings.TrimSpace(payload.PriceUnit)
	if priceUnit == "" {
		priceUnit = "kunjungan"
	}

	icon := strings.TrimSpace(payload.Icon)
	if icon == "" {
		icon = "build"
	}

	availabilityTag := strings.TrimSpace(payload.AvailabilityTag)
	if availabilityTag == "" {
		availabilityTag = "Tersedia di Katalog"
	}

	isActive := true
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}

	sortOrder := 0
	if payload.SortOrder != nil {
		sortOrder = *payload.SortOrder
	}

	cat := &domain.Category{
		Name:            name,
		Slug:            catSlug,
		Description:     strings.TrimSpace(payload.Description),
		Icon:            icon,
		StartingPrice:   startingPrice,
		PriceUnit:       priceUnit,
		AvailabilityTag: availabilityTag,
		HighlightTag:    strings.TrimSpace(payload.HighlightTag),
		IsActive:        isActive,
		SortOrder:       sortOrder,
	}

	return s.repo.Create(ctx, cat)
}

func (s *categoryService) UpdateCategory(ctx context.Context, id string, payload *domain.UpdateCategoryPayload) (*domain.Category, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" || payload == nil {
		return nil, domain.ErrInvalidInput
	}

	existing, err := s.repo.GetByID(ctx, cleanID)
	if err != nil {
		return nil, err
	}

	if payload.Name != nil {
		trimmedName := strings.TrimSpace(*payload.Name)
		if trimmedName == "" {
			return nil, domain.ErrCategoryNameRequired
		}
		payload.Name = &trimmedName
	}

	if payload.Slug != nil {
		cleanSlug := slug.GenerateSlug(*payload.Slug)
		if cleanSlug == "" {
			return nil, domain.ErrInvalidInput
		}
		other, err := s.repo.GetBySlug(ctx, cleanSlug)
		if err == nil && other != nil && other.ID != existing.ID {
			return nil, domain.ErrCategorySlugExists
		}
		payload.Slug = &cleanSlug
	}

	if payload.StartingPrice != nil && *payload.StartingPrice < 0 {
		return nil, domain.ErrInvalidInput
	}

	return s.repo.Update(ctx, cleanID, payload)
}

func (s *categoryService) DeleteCategory(ctx context.Context, id string) error {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return domain.ErrCategoryNotFound
	}
	return s.repo.Delete(ctx, cleanID)
}
