package repository

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
)

type MemoryCategoryRepository struct {
	mu         sync.RWMutex
	categories map[string]*domain.Category
}

func NewMemoryCategoryRepository() *MemoryCategoryRepository {
	repo := &MemoryCategoryRepository{
		categories: make(map[string]*domain.Category),
	}
	repo.seedInitialCategories()
	return repo
}

func (m *MemoryCategoryRepository) seedInitialCategories() {
	now := time.Now()
	defaults := []domain.Category{
		{
			ID:              "11111111-1111-4111-8111-111111111111",
			Slug:            "ac-pendingin",
			Name:            "Servis & Pasang AC",
			Description:     "Pembersihan filter, flushing freon berkala, perbaikan pipa bocor, dan perawatan unit inverter.",
			Icon:            "ac_unit",
			StartingPrice:   75000,
			PriceUnit:       "unit",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Populer",
			IsActive:        true,
			SortOrder:       1,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
		{
			ID:              "22222222-2222-4222-8222-222222222222",
			Slug:            "sanitasi-cleaning",
			Name:            "Sanitasi & Deep Clean",
			Description:     "Pembersihan menyeluruh kamar tidur, sofa, kamar mandi berkerak, dan sterilisasi tungau kasur.",
			Icon:            "cleaning_services",
			StartingPrice:   65000,
			PriceUnit:       "jam",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Higienis",
			IsActive:        true,
			SortOrder:       2,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
		{
			ID:              "33333333-3333-4333-8333-333333333333",
			Slug:            "instalasi-listrik",
			Name:            "Instalasi Listrik Presisi",
			Description:     "Pemeriksaan beban daya, tracing korsleting listrik, perakitan panel MCB, dan instalasi stop kontak.",
			Icon:            "bolt",
			StartingPrice:   80000,
			PriceUnit:       "kunjungan",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Prioritas Aman",
			IsActive:        true,
			SortOrder:       3,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
		{
			ID:              "44444444-4444-4444-8444-444444444444",
			Slug:            "elektronik-audio",
			Name:            "Reparasi Elektronik",
			Description:     "Diagnostik mesin cuci digital, kulkas inverter, perbaikan audio speaker, dan instalasi TV dinding.",
			Icon:            "tv",
			StartingPrice:   120000,
			PriceUnit:       "kunjungan",
			AvailabilityTag: "Tersedia di Katalog",
			HighlightTag:    "Spesialis Ahli",
			IsActive:        true,
			SortOrder:       4,
			CreatedAt:       now,
			UpdatedAt:       now,
		},
	}

	for _, c := range defaults {
		cCopy := c
		m.categories[c.ID] = &cCopy
	}
}

func (m *MemoryCategoryRepository) ListPublicCategories(ctx context.Context) ([]domain.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []domain.Category
	for _, c := range m.categories {
		if c.IsActive {
			result = append(result, *c)
		}
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].SortOrder == result[j].SortOrder {
			return result[i].Name < result[j].Name
		}
		return result[i].SortOrder < result[j].SortOrder
	})

	return result, nil
}

func (m *MemoryCategoryRepository) ListAdminCategories(ctx context.Context) ([]domain.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []domain.Category
	for _, c := range m.categories {
		result = append(result, *c)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].SortOrder == result[j].SortOrder {
			return result[i].CreatedAt.After(result[j].CreatedAt)
		}
		return result[i].SortOrder < result[j].SortOrder
	})

	return result, nil
}

func (m *MemoryCategoryRepository) GetByID(ctx context.Context, id string) (*domain.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cat, ok := m.categories[id]
	if !ok {
		return nil, domain.ErrCategoryNotFound
	}
	catCopy := *cat
	return &catCopy, nil
}

func (m *MemoryCategoryRepository) GetBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cleanSlug := strings.ToLower(strings.TrimSpace(slug))
	for _, cat := range m.categories {
		if strings.EqualFold(cat.Slug, cleanSlug) {
			catCopy := *cat
			return &catCopy, nil
		}
	}
	return nil, domain.ErrCategoryNotFound
}

func (m *MemoryCategoryRepository) Create(ctx context.Context, category *domain.Category) (*domain.Category, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cleanSlug := strings.ToLower(strings.TrimSpace(category.Slug))
	for _, cat := range m.categories {
		if strings.EqualFold(cat.Slug, cleanSlug) {
			return nil, domain.ErrCategorySlugExists
		}
	}

	if strings.TrimSpace(category.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			category.ID = uuid.New().String()
		} else {
			category.ID = id.String()
		}
	}

	now := time.Now()
	if category.CreatedAt.IsZero() {
		category.CreatedAt = now
	}
	category.UpdatedAt = now

	catCopy := *category
	m.categories[category.ID] = &catCopy
	return &catCopy, nil
}

func (m *MemoryCategoryRepository) Update(ctx context.Context, id string, payload *domain.UpdateCategoryPayload) (*domain.Category, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cat, ok := m.categories[id]
	if !ok {
		return nil, domain.ErrCategoryNotFound
	}

	if payload.Slug != nil {
		newSlug := strings.ToLower(strings.TrimSpace(*payload.Slug))
		for otherID, otherCat := range m.categories {
			if otherID != id && strings.EqualFold(otherCat.Slug, newSlug) {
				return nil, domain.ErrCategorySlugExists
			}
		}
		cat.Slug = newSlug
	}

	if payload.Name != nil {
		cat.Name = strings.TrimSpace(*payload.Name)
	}
	if payload.Description != nil {
		cat.Description = strings.TrimSpace(*payload.Description)
	}
	if payload.Icon != nil {
		cat.Icon = strings.TrimSpace(*payload.Icon)
	}
	if payload.StartingPrice != nil {
		cat.StartingPrice = *payload.StartingPrice
	}
	if payload.PriceUnit != nil {
		cat.PriceUnit = strings.TrimSpace(*payload.PriceUnit)
	}
	if payload.AvailabilityTag != nil {
		cat.AvailabilityTag = strings.TrimSpace(*payload.AvailabilityTag)
	}
	if payload.HighlightTag != nil {
		cat.HighlightTag = strings.TrimSpace(*payload.HighlightTag)
	}
	if payload.IsActive != nil {
		cat.IsActive = *payload.IsActive
	}
	if payload.SortOrder != nil {
		cat.SortOrder = *payload.SortOrder
	}
	cat.UpdatedAt = time.Now()

	catCopy := *cat
	return &catCopy, nil
}

func (m *MemoryCategoryRepository) Delete(ctx context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.categories[id]; !ok {
		return domain.ErrCategoryNotFound
	}
	delete(m.categories, id)
	return nil
}
