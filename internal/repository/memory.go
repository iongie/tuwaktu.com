package repository

import (
	"context"
	"fmt"
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
	accounts  map[string]*domain.WorkerAccount
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		workers:   make(map[string]*domain.Worker),
		services:  make(map[string]*domain.Service),
		bookings:  make(map[string]*domain.Booking),
		schedules: make(map[string]map[int]*domain.WorkerSchedule),
		accounts:  make(map[string]*domain.WorkerAccount),
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

func (m *MemoryRepository) CreateService(ctx context.Context, service *domain.Service) (*domain.Service, error) {
	if service == nil || strings.TrimSpace(service.WorkerID) == "" {
		return nil, domain.ErrInvalidInput
	}
	m.mu.Lock()
	defer m.mu.Unlock()

	if strings.TrimSpace(service.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return nil, fmt.Errorf("generating service id: %w", err)
		}
		service.ID = id.String()
	}
	now := time.Now()
	service.CreatedAt = now
	service.UpdatedAt = now
	cp := *service
	m.services[service.ID] = &cp
	m.syncWorkerBasePrice(service.WorkerID)
	return &cp, nil
}

func (m *MemoryRepository) syncWorkerBasePrice(workerID string) {
	minPrice := 0.0
	for _, s := range m.services {
		if s.WorkerID == workerID && s.IsActive && s.Price > 0 {
			if minPrice == 0 || s.Price < minPrice {
				minPrice = s.Price
			}
		}
	}
	if w, exists := m.workers[workerID]; exists {
		w.BasePrice = minPrice
	}
}

func (m *MemoryRepository) UpdateService(ctx context.Context, workerID string, serviceID string, update *domain.UpdateServicePayload) (*domain.Service, error) {
	if update == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID = strings.TrimSpace(workerID)
	serviceID = strings.TrimSpace(serviceID)
	if workerID == "" || serviceID == "" {
		return nil, domain.ErrInvalidInput
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	existing, exists := m.services[serviceID]
	if !exists || existing.WorkerID != workerID {
		return nil, domain.ErrServiceNotFound
	}

	if update.CategoryID != nil {
		existing.CategoryID = update.CategoryID
	}
	if update.Name != nil {
		existing.Name = strings.TrimSpace(*update.Name)
	}
	if update.Description != nil {
		existing.Description = strings.TrimSpace(*update.Description)
	}
	if update.Price != nil {
		existing.Price = *update.Price
	}
	if update.BasePrice != nil {
		existing.BasePrice = *update.BasePrice
	}
	if update.RateType != nil {
		existing.RateType = strings.ToUpper(strings.TrimSpace(*update.RateType))
	}
	if update.DurationMinutes != nil {
		existing.DurationMinutes = *update.DurationMinutes
	}
	if update.IsActive != nil {
		existing.IsActive = *update.IsActive
	}
	existing.UpdatedAt = time.Now()
	m.syncWorkerBasePrice(workerID)
	cp := *existing
	return &cp, nil
}

func (m *MemoryRepository) DeleteService(ctx context.Context, workerID string, serviceID string) error {
	workerID = strings.TrimSpace(workerID)
	serviceID = strings.TrimSpace(serviceID)
	if workerID == "" || serviceID == "" {
		return domain.ErrInvalidInput
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	existing, exists := m.services[serviceID]
	if !exists || existing.WorkerID != workerID {
		return domain.ErrServiceNotFound
	}

	existing.IsActive = false
	existing.UpdatedAt = time.Now()
	m.syncWorkerBasePrice(workerID)
	return nil
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
	if strings.TrimSpace(profile.WhatsAppNumber) != "" {
		w.WhatsAppNumber = strings.TrimSpace(profile.WhatsAppNumber)
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

func (m *MemoryRepository) SeedAccount(a *domain.WorkerAccount) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.accounts[a.ID] = a
}

func (m *MemoryRepository) CreateWorkerWithAccountTx(ctx context.Context, worker *domain.Worker, schedules []domain.WorkerSchedule, account *domain.WorkerAccount) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if worker == nil || account == nil {
		return domain.ErrInvalidInput
	}

	if worker.ID == "" {
		id, _ := uuid.NewV7()
		worker.ID = id.String()
	}

	m.workers[worker.ID] = worker

	if m.schedules[worker.ID] == nil {
		m.schedules[worker.ID] = make(map[int]*domain.WorkerSchedule)
	}

	now := time.Now().UTC()
	for _, sc := range schedules {
		scCopy := sc
		scCopy.WorkerID = worker.ID
		scCopy.CreatedAt = now
		scCopy.UpdatedAt = now
		m.schedules[worker.ID][sc.DayOfWeek] = &scCopy
	}

	if account.ID == "" {
		id, _ := uuid.NewV7()
		account.ID = id.String()
	}
	account.WorkerID = &worker.ID
	account.CreatedAt = now
	account.UpdatedAt = now
	m.accounts[account.ID] = account

	return nil
}

func (m *MemoryRepository) GetAdminWorkerList(ctx context.Context) ([]domain.AdminWorkerListItem, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	items := make([]domain.AdminWorkerListItem, 0)
	for _, acc := range m.accounts {
		if acc.Role != domain.RoleWorker {
			continue
		}

		item := domain.AdminWorkerListItem{
			AccountID:          acc.ID,
			Role:               acc.Role,
			AccountStatus:      acc.AccountStatus,
			MustChangePassword: acc.MustChangePassword,
			Email:              acc.Email,
			PhoneNumber:        acc.PhoneNumber,
			CreatedAt:          acc.CreatedAt,
		}

		if acc.WorkerID != nil {
			if w, ok := m.workers[*acc.WorkerID]; ok {
				item.WorkerID = w.ID
				item.Slug = w.Slug
				item.Name = w.Name
				item.Bio = w.Bio
				item.Zone = w.Zone
				item.BasePrice = w.BasePrice
				item.RateType = w.RateType
				item.AvatarURL = w.AvatarURL
				item.Rating = w.Rating
				item.ReviewCount = w.ReviewCount
				item.WhatsAppNumber = w.WhatsAppNumber
				if item.PhoneNumber == "" {
					item.PhoneNumber = w.PhoneNumber
				}
			}
		}

		items = append(items, item)
	}

	return items, nil
}

func (m *MemoryRepository) GetAdminStats(ctx context.Context) (*domain.AdminStats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := &domain.AdminStats{}
	for _, acc := range m.accounts {
		if acc.Role == domain.RoleWorker {
			stats.TotalWorkers++
			if acc.AccountStatus == domain.AccountStatusActive {
				stats.ActiveWorkers++
			} else if acc.AccountStatus == domain.AccountStatusSuspended {
				stats.SuspendedWorkers++
			}
		}
	}
	stats.TotalBookings = int64(len(m.bookings))
	return stats, nil
}

func (m *MemoryRepository) UpdateWorkerAccountStatus(ctx context.Context, workerID string, newStatus string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	workerID = strings.TrimSpace(workerID)
	newStatus = strings.ToUpper(strings.TrimSpace(newStatus))

	found := false
	for _, acc := range m.accounts {
		if (acc.WorkerID != nil && *acc.WorkerID == workerID) || acc.ID == workerID {
			acc.AccountStatus = newStatus
			acc.UpdatedAt = time.Now().UTC()
			found = true
			break
		}
	}

	if !found {
		return domain.ErrWorkerNotFound
	}

	if w, ok := m.workers[workerID]; ok {
		w.IsActive = (newStatus == domain.AccountStatusActive)
		w.UpdatedAt = time.Now().UTC()
	}

	return nil
}

func (m *MemoryRepository) GetAccountByEmailOrPhone(ctx context.Context, identifier string) (*domain.WorkerAccount, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	identifier = strings.TrimSpace(identifier)
	for _, acc := range m.accounts {
		if strings.EqualFold(acc.Email, identifier) || acc.PhoneNumber == identifier {
			accCopy := *acc
			if acc.WorkerID != nil {
				if w, ok := m.workers[*acc.WorkerID]; ok {
					wCopy := *w
					accCopy.Worker = &wCopy
				}
			}
			return &accCopy, nil
		}
	}

	return nil, domain.ErrWorkerNotFound
}

func (m *MemoryRepository) GetAccountByID(ctx context.Context, accountID string) (*domain.WorkerAccount, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	accountID = strings.TrimSpace(accountID)
	if acc, ok := m.accounts[accountID]; ok {
		accCopy := *acc
		if acc.WorkerID != nil {
			if w, ok := m.workers[*acc.WorkerID]; ok {
				wCopy := *w
				accCopy.Worker = &wCopy
			}
		}
		return &accCopy, nil
	}

	return nil, domain.ErrWorkerNotFound
}

func (m *MemoryRepository) RecordFailedLogin(ctx context.Context, accountID string, maxAttempts int, lockDuration time.Duration) (int, *time.Time, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	accountID = strings.TrimSpace(accountID)
	acc, ok := m.accounts[accountID]
	if !ok {
		return 0, nil, domain.ErrWorkerNotFound
	}

	now := time.Now().UTC()
	if acc.LockedUntil != nil && now.After(*acc.LockedUntil) {
		acc.FailedLoginAttempts = 0
		acc.LockedUntil = nil
	}

	acc.FailedLoginAttempts++
	acc.UpdatedAt = now
	if maxAttempts > 0 && acc.FailedLoginAttempts >= maxAttempts {
		until := now.Add(lockDuration)
		acc.LockedUntil = &until
	}

	var lockedCopy *time.Time
	if acc.LockedUntil != nil {
		u := *acc.LockedUntil
		lockedCopy = &u
	}
	return acc.FailedLoginAttempts, lockedCopy, nil
}

func (m *MemoryRepository) ResetFailedLogin(ctx context.Context, accountID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	accountID = strings.TrimSpace(accountID)
	acc, ok := m.accounts[accountID]
	if !ok {
		return domain.ErrWorkerNotFound
	}

	acc.FailedLoginAttempts = 0
	acc.LockedUntil = nil
	acc.UpdatedAt = time.Now().UTC()
	return nil
}

func (m *MemoryRepository) UpdateAccountPasswordHash(ctx context.Context, accountID string, newHash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	accountID = strings.TrimSpace(accountID)
	acc, ok := m.accounts[accountID]
	if !ok {
		return domain.ErrWorkerNotFound
	}

	acc.PasswordHash = newHash
	acc.UpdatedAt = time.Now().UTC()
	return nil
}

func (m *MemoryRepository) ListPublicWorkers(ctx context.Context) ([]domain.Worker, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var workers []domain.Worker
	for _, w := range m.workers {
		if w.IsActive {
			wCopy := *w
			workers = append(workers, wCopy)
		}
	}
	return workers, nil
}





