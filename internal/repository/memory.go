package repository

import (
	"context"
	"strings"
	"sync"
	"time"

	"tuwaktu.com/internal/domain"
)

type MemoryRepository struct {
	mu       sync.RWMutex
	workers  map[string]*domain.Worker
	services map[string]*domain.Service
	bookings map[string]*domain.Booking
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		workers:  make(map[string]*domain.Worker),
		services: make(map[string]*domain.Service),
		bookings: make(map[string]*domain.Booking),
	}
}

func (m *MemoryRepository) SeedWorker(w *domain.Worker) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.workers[w.ID] = w
}

func (m *MemoryRepository) SeedService(s *domain.Service) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.services[s.ID] = s
}

func (m *MemoryRepository) GetBySlug(ctx context.Context, slug string) (*domain.Worker, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	slug = strings.TrimSpace(slug)
	for _, w := range m.workers {
		if strings.EqualFold(w.Slug, slug) {
			return w, nil
		}
	}
	return nil, domain.ErrWorkerNotFound
}

func (m *MemoryRepository) GetByID(ctx context.Context, id string) (*domain.Worker, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if w, exists := m.workers[id]; exists {
		return w, nil
	}
	return nil, domain.ErrWorkerNotFound
}

func (m *MemoryRepository) GetWorkerByID(ctx context.Context, id string) (*domain.Worker, error) {
	return m.GetByID(ctx, id)
}

func (m *MemoryRepository) GetWorkerBySlug(ctx context.Context, slug string) (*domain.Worker, error) {
	return m.GetBySlug(ctx, slug)
}

func (m *MemoryRepository) GetServicesByWorkerID(ctx context.Context, workerID string) ([]domain.Service, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []domain.Service
	for _, s := range m.services {
		if s.WorkerID == workerID && s.IsActive {
			result = append(result, *s)
		}
	}
	return result, nil
}

func (m *MemoryRepository) GetServiceByID(ctx context.Context, serviceID string) (*domain.Service, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	serviceID = strings.TrimSpace(serviceID)
	if s, exists := m.services[serviceID]; exists {
		return s, nil
	}
	for _, s := range m.services {
		if strings.EqualFold(s.Name, serviceID) {
			return s, nil
		}
	}
	return nil, domain.ErrServiceNotFound
}

func (m *MemoryRepository) CreateBooking(ctx context.Context, b *domain.Booking) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.bookings[b.ID] = b
	return nil
}

func (m *MemoryRepository) GetBookingByID(id string) *domain.Booking {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.bookings[id]
}

func (m *MemoryRepository) GetAllBookings() []*domain.Booking {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var all []*domain.Booking
	for _, b := range m.bookings {
		all = append(all, b)
	}
	return all
}

func (m *MemoryRepository) UpdateProfile(ctx context.Context, id string, profile *domain.WorkerProfileUpdate) (*domain.Worker, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if profile == nil {
		return nil, domain.ErrInvalidInput
	}

	id = strings.TrimSpace(id)
	if id == "" {
		return nil, domain.ErrInvalidInput
	}

	w, exists := m.workers[id]
	if !exists {
		for _, worker := range m.workers {
			if strings.EqualFold(worker.Slug, id) {
				w = worker
				exists = true
				break
			}
		}
	}
	if !exists {
		return nil, domain.ErrWorkerNotFound
	}

	if strings.TrimSpace(profile.Name) != "" {
		w.Name = strings.TrimSpace(profile.Name)
	}
	w.Bio = strings.TrimSpace(profile.Bio)
	if strings.TrimSpace(profile.AvatarURL) != "" {
		w.AvatarURL = strings.TrimSpace(profile.AvatarURL)
	}
	if strings.TrimSpace(profile.Zone) != "" {
		w.Zone = strings.TrimSpace(profile.Zone)
	}
	if strings.TrimSpace(profile.PhoneNumber) != "" {
		w.PhoneNumber = strings.TrimSpace(profile.PhoneNumber)
	}
	if strings.TrimSpace(profile.Email) != "" {
		w.Email = strings.TrimSpace(profile.Email)
	}
	if strings.TrimSpace(profile.Address) != "" {
		w.Address = strings.TrimSpace(profile.Address)
	}
	w.UpdatedAt = time.Now().UTC()

	return w, nil
}

func (m *MemoryRepository) UpdateRates(ctx context.Context, idOrSlug string, basePrice float64, rateType string) (*domain.Worker, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	w, exists := m.workers[idOrSlug]
	if !exists {
		for _, worker := range m.workers {
			if strings.EqualFold(worker.Slug, idOrSlug) {
				w = worker
				exists = true
				break
			}
		}
	}
	if !exists {
		return nil, domain.ErrWorkerNotFound
	}

	w.BasePrice = basePrice
	w.RateType = rateType
	w.UpdatedAt = time.Now().UTC()

	return w, nil
}
