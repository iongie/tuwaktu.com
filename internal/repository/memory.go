package repository

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
)

type MemoryRepository struct {
	mu        sync.RWMutex
	workers   map[string]*domain.Worker
	services  map[string]*domain.Service
	bookings  map[string]*domain.Booking
	schedules map[string]map[int]*domain.WorkerSchedule
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		workers:   make(map[string]*domain.Worker),
		services:  make(map[string]*domain.Service),
		bookings:  make(map[string]*domain.Booking),
		schedules: make(map[string]map[int]*domain.WorkerSchedule),
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

func (m *MemoryRepository) SeedBooking(b *domain.Booking) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.bookings[b.ID] = b
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

func (m *MemoryRepository) UpdateLocationSettings(ctx context.Context, idOrSlug string, update *domain.WorkerLocationSettingsUpdate) (*domain.Worker, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" || update == nil {
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

	if update.Lat != nil {
		w.Lat = update.Lat
	}
	if update.Lng != nil {
		w.Lng = update.Lng
	}
	if update.MaxRadiusKM > 0 {
		w.MaxRadiusKM = update.MaxRadiusKM
	}
	if update.FreeRadiusKM >= 0 {
		w.FreeRadiusKM = update.FreeRadiusKM
	}
	if update.ExtraFeePerKM >= 0 {
		w.ExtraFeePerKM = update.ExtraFeePerKM
	}
	w.UpdatedAt = time.Now().UTC()

	return w, nil
}

func (m *MemoryRepository) SeedSchedule(s *domain.WorkerSchedule) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.schedules[s.WorkerID]; !ok {
		m.schedules[s.WorkerID] = make(map[int]*domain.WorkerSchedule)
	}
	m.schedules[s.WorkerID][s.DayOfWeek] = s
}

func (m *MemoryRepository) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

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

	workerMap, hasSchedules := m.schedules[w.ID]
	var result []domain.WorkerSchedule
	if hasSchedules && len(workerMap) > 0 {
		for d := 0; d < 7; d++ {
			if sc, found := workerMap[d]; found {
				scCopy := *sc
				scCopy.DayName = domain.GetDayName(d)
				result = append(result, scCopy)
			}
		}
	}

	if len(result) == 0 {
		// Return 7 days default
		for d := 0; d < 7; d++ {
			result = append(result, domain.WorkerSchedule{
				WorkerID:      w.ID,
				DayOfWeek:     d,
				DayName:       domain.GetDayName(d),
				IsActive:      true,
				SlotMorning:   true,
				SlotAfternoon: true,
				SlotEvening:   false,
			})
		}
	}

	return result, nil
}

func (m *MemoryRepository) UpdateWorkerSchedules(ctx context.Context, idOrSlug string, schedules []domain.WorkerSchedule) ([]domain.WorkerSchedule, error) {
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

	if _, ok := m.schedules[w.ID]; !ok {
		m.schedules[w.ID] = make(map[int]*domain.WorkerSchedule)
	}

	now := time.Now().UTC()
	for _, sc := range schedules {
		if sc.DayOfWeek < 0 || sc.DayOfWeek > 6 {
			return nil, domain.ErrInvalidScheduleDay
		}
		item := sc
		if strings.TrimSpace(item.ID) == "" {
			if id, err := uuid.NewV7(); err == nil {
				item.ID = id.String()
			}
		}
		item.WorkerID = w.ID
		item.DayName = domain.GetDayName(sc.DayOfWeek)
		item.UpdatedAt = now
		if item.CreatedAt.IsZero() {
			item.CreatedAt = now
		}
		m.schedules[w.ID][sc.DayOfWeek] = &item
	}

	var updated []domain.WorkerSchedule
	for d := 0; d < 7; d++ {
		if sc, found := m.schedules[w.ID][d]; found {
			scCopy := *sc
			scCopy.DayName = domain.GetDayName(d)
			updated = append(updated, scCopy)
		}
	}

	return updated, nil
}

func (m *MemoryRepository) GetBookingsByWorkerAndDateRange(ctx context.Context, workerID string, startTime, endTime time.Time) ([]domain.Booking, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	workerID = strings.TrimSpace(workerID)
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}

	var results []domain.Booking
	for _, b := range m.bookings {
		if b.WorkerID != workerID || b.Status == "CANCELLED" {
			continue
		}

		bStart := b.BookingDate
		bEnd := bStart.Add(60 * time.Minute)
		if b.StartTime != nil {
			bStart = *b.StartTime
		}
		if b.EndTime != nil {
			bEnd = *b.EndTime
		} else if b.StartTime != nil {
			bEnd = bStart.Add(60 * time.Minute)
		}

		if bStart.Before(endTime) && bEnd.After(startTime) {
			results = append(results, *b)
		}
	}

	return results, nil
}


