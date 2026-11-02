package repository

import (
	"context"
	"strings"
	"sync"

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
