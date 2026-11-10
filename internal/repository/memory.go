package repository

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
)

type MemoryRepository struct {
	mu               sync.RWMutex
	workers          map[string]*domain.Worker
	services         map[string]*domain.Service
	bookings         map[string]*domain.Booking
	schedules        map[string]map[int]*domain.WorkerSchedule
	accounts         map[string]*domain.WorkerAccount
	reviews          map[string]*domain.Review
	events           []*domain.AnalyticsEvent
	activationTokens map[string]*domain.WorkerActivationToken
	resetTokens      map[string]*domain.WorkerCredentialResetToken
	dateOverrides    map[string]map[string]*domain.WorkerDateOverride
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		workers:          make(map[string]*domain.Worker),
		services:         make(map[string]*domain.Service),
		bookings:         make(map[string]*domain.Booking),
		schedules:        make(map[string]map[int]*domain.WorkerSchedule),
		accounts:         make(map[string]*domain.WorkerAccount),
		reviews:          make(map[string]*domain.Review),
		events:           make([]*domain.AnalyticsEvent, 0),
		activationTokens: make(map[string]*domain.WorkerActivationToken),
		resetTokens:      make(map[string]*domain.WorkerCredentialResetToken),
		dateOverrides:    make(map[string]map[string]*domain.WorkerDateOverride),
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
		for _, acc := range m.accounts {
			if acc.WorkerID != nil && *acc.WorkerID == w.ID {
				acc.Email = w.Email
			}
		}
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

func (m *MemoryRepository) GetWorkerDateOverrides(ctx context.Context, idOrSlug string, fromDate, toDate string) ([]domain.WorkerDateOverride, error) {
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

	var results []domain.WorkerDateOverride
	mDates, ok := m.dateOverrides[w.ID]
	if !ok {
		return results, nil
	}

	for dStr, item := range mDates {
		if strings.TrimSpace(fromDate) != "" && dStr < strings.TrimSpace(fromDate) {
			continue
		}
		if strings.TrimSpace(toDate) != "" && dStr > strings.TrimSpace(toDate) {
			continue
		}
		itemCopy := *item
		itemCopy.DateStr = dStr
		results = append(results, itemCopy)
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].DateStr < results[j].DateStr
	})

	return results, nil
}

func (m *MemoryRepository) GetWorkerDateOverrideByDate(ctx context.Context, workerID string, date string) (*domain.WorkerDateOverride, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	workerID = strings.TrimSpace(workerID)
	date = strings.TrimSpace(date)
	if workerID == "" || date == "" {
		return nil, domain.ErrInvalidInput
	}

	mDates, ok := m.dateOverrides[workerID]
	if !ok {
		return nil, nil
	}

	item, exists := mDates[date]
	if !exists {
		return nil, nil
	}

	itemCopy := *item
	itemCopy.DateStr = date
	return &itemCopy, nil
}

func (m *MemoryRepository) UpsertWorkerDateOverride(ctx context.Context, override *domain.WorkerDateOverride) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if override == nil {
		return domain.ErrInvalidInput
	}
	workerID := strings.TrimSpace(override.WorkerID)
	if workerID == "" {
		return fmt.Errorf("%w: worker_id wajib diisi", domain.ErrInvalidInput)
	}

	dateStr := strings.TrimSpace(override.DateStr)
	if dateStr == "" && !override.OverrideDate.IsZero() {
		dateStr = override.OverrideDate.Format("2006-01-02")
	}
	if dateStr == "" {
		return fmt.Errorf("%w: override_date wajib diisi", domain.ErrInvalidInput)
	}

	if _, ok := m.dateOverrides[workerID]; !ok {
		m.dateOverrides[workerID] = make(map[string]*domain.WorkerDateOverride)
	}

	now := time.Now().UTC()
	item := *override
	if strings.TrimSpace(item.ID) == "" {
		if id, err := uuid.NewV7(); err == nil {
			item.ID = id.String()
		}
	}
	if item.CreatedAt.IsZero() {
		item.CreatedAt = now
	}
	item.UpdatedAt = now
	item.DateStr = dateStr
	if item.OverrideDate.IsZero() {
		if parsed, err := time.Parse("2006-01-02", dateStr); err == nil {
			item.OverrideDate = parsed
		}
	}

	m.dateOverrides[workerID][dateStr] = &item
	return nil
}

func (m *MemoryRepository) DeleteWorkerDateOverride(ctx context.Context, workerID string, date string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	workerID = strings.TrimSpace(workerID)
	date = strings.TrimSpace(date)
	if workerID == "" || date == "" {
		return domain.ErrInvalidInput
	}

	if mDates, ok := m.dateOverrides[workerID]; ok {
		delete(mDates, date)
	}
	return nil
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

func (m *MemoryRepository) GetWorkerBookings(ctx context.Context, workerID string, limit int) ([]domain.Booking, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	workerID = strings.TrimSpace(workerID)
	if limit <= 0 {
		limit = 20
	}

	var results []domain.Booking
	for _, b := range m.bookings {
		if b.WorkerID == workerID {
			bCopy := *b
			if bCopy.Service == nil && bCopy.ServiceID != "" {
				if s, exists := m.services[bCopy.ServiceID]; exists {
					bCopy.Service = s
				}
			}
			results = append(results, bCopy)
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].CreatedAt.After(results[j].CreatedAt)
	})

	if len(results) > limit {
		results = results[:limit]
	}

	if results == nil {
		results = []domain.Booking{}
	}

	return results, nil
}

func (m *MemoryRepository) UpdateBookingStatus(ctx context.Context, workerID string, bookingID string, status string) (*domain.Booking, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	workerID = strings.TrimSpace(workerID)
	bookingID = strings.TrimSpace(bookingID)
	status = strings.ToUpper(strings.TrimSpace(status))

	validStatuses := map[string]bool{
		"PENDING_WA": true,
		"CONFIRMED":  true,
		"COMPLETED":  true,
		"CANCELLED":  true,
	}
	if !validStatuses[status] {
		return nil, domain.ErrInvalidBookingStatus
	}

	b, exists := m.bookings[bookingID]
	if !exists || b.WorkerID != workerID {
		return nil, domain.ErrBookingNotFound
	}

	b.Status = status
	b.UpdatedAt = time.Now().UTC()

	bCopy := *b
	if bCopy.Service == nil && bCopy.ServiceID != "" {
		if s, sExists := m.services[bCopy.ServiceID]; sExists {
			bCopy.Service = s
		}
	}

	return &bCopy, nil
}

func (m *MemoryRepository) GetBookingByCode(ctx context.Context, bookingCode string) (*domain.Booking, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	bookingCode = strings.TrimSpace(bookingCode)
	if bookingCode == "" {
		return nil, domain.ErrBookingNotFound
	}

	for _, b := range m.bookings {
		if strings.EqualFold(b.BookingCode, bookingCode) {
			bCopy := *b
			if bCopy.Service == nil && bCopy.ServiceID != "" {
				if s, exists := m.services[bCopy.ServiceID]; exists {
					bCopy.Service = s
				}
			}
			if bCopy.Worker == nil && bCopy.WorkerID != "" {
				if w, exists := m.workers[bCopy.WorkerID]; exists {
					bCopy.Worker = w
				}
			}
			return &bCopy, nil
		}
	}

	return nil, domain.ErrBookingNotFound
}

func (m *MemoryRepository) CreateReviewTx(ctx context.Context, review *domain.Review) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, rev := range m.reviews {
		if rev.BookingID == review.BookingID {
			return domain.ErrBookingAlreadyReviewed
		}
	}

	if strings.TrimSpace(review.ID) == "" {
		review.ID = uuid.New().String()
	}
	now := time.Now()
	review.CreatedAt = now
	review.UpdatedAt = now

	revCopy := *review
	m.reviews[review.ID] = &revCopy

	if b, exists := m.bookings[review.BookingID]; exists {
		b.ReviewedAt = &now
	}

	// Recalculate worker rating
	totalScore := 0
	reviewCount := 0
	for _, rev := range m.reviews {
		if rev.WorkerID == review.WorkerID {
			totalScore += rev.Rating
			reviewCount++
		}
	}
	if w, exists := m.workers[review.WorkerID]; exists {
		if reviewCount > 0 {
			w.Rating = float64(totalScore) / float64(reviewCount)
		} else {
			w.Rating = 0
		}
		w.ReviewCount = reviewCount
	}

	return nil
}

func (m *MemoryRepository) GetReviewByBookingID(ctx context.Context, bookingID string) (*domain.Review, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, rev := range m.reviews {
		if rev.BookingID == bookingID {
			cp := *rev
			return &cp, nil
		}
	}
	return nil, nil
}

func (m *MemoryRepository) GetPublicReviewsByWorkerSlug(ctx context.Context, slug string, limit, offset int) ([]domain.PublicReviewItem, int64, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var workerID string
	for _, w := range m.workers {
		if strings.EqualFold(w.Slug, slug) {
			workerID = w.ID
			break
		}
	}
	if workerID == "" {
		return nil, 0, domain.ErrWorkerNotFound
	}

	var matching []*domain.Review
	for _, rev := range m.reviews {
		if rev.WorkerID == workerID {
			matching = append(matching, rev)
		}
	}

	sort.Slice(matching, func(i, j int) bool {
		return matching[i].CreatedAt.After(matching[j].CreatedAt)
	})

	total := int64(len(matching))
	if offset > len(matching) {
		return []domain.PublicReviewItem{}, total, nil
	}
	end := offset + limit
	if end > len(matching) || limit <= 0 {
		end = len(matching)
	}

	var items []domain.PublicReviewItem
	for _, rev := range matching[offset:end] {
		svcName := "Layanan"
		if b, exists := m.bookings[rev.BookingID]; exists {
			if s, sExists := m.services[b.ServiceID]; sExists {
				svcName = s.Name
			}
		}
		items = append(items, domain.PublicReviewItem{
			ID:                rev.ID,
			ClientDisplayName: domain.FormatClientDisplayName(rev.ClientName, rev.IsAnonymous),
			Rating:            rev.Rating,
			Comment:           rev.Comment,
			ServiceName:       svcName,
			CreatedAt:         rev.CreatedAt,
		})
	}

	return items, total, nil
}

func (m *MemoryRepository) GetWorkerDashboardReviews(ctx context.Context, workerID string, limit, offset int) ([]domain.WorkerDashboardReviewItem, int64, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var matching []*domain.Review
	for _, rev := range m.reviews {
		if rev.WorkerID == workerID {
			matching = append(matching, rev)
		}
	}

	sort.Slice(matching, func(i, j int) bool {
		return matching[i].CreatedAt.After(matching[j].CreatedAt)
	})

	total := int64(len(matching))
	if offset > len(matching) {
		return []domain.WorkerDashboardReviewItem{}, total, nil
	}
	end := offset + limit
	if end > len(matching) || limit <= 0 {
		end = len(matching)
	}

	var items []domain.WorkerDashboardReviewItem
	for _, rev := range matching[offset:end] {
		svcName := "Layanan"
		bCode := ""
		bDate := rev.CreatedAt
		if b, exists := m.bookings[rev.BookingID]; exists {
			bCode = b.BookingCode
			bDate = b.BookingDate
			if s, sExists := m.services[b.ServiceID]; sExists {
				svcName = s.Name
			}
		}
		items = append(items, domain.WorkerDashboardReviewItem{
			ID:          rev.ID,
			BookingCode: bCode,
			ClientName:  rev.ClientName,
			IsAnonymous: rev.IsAnonymous,
			Rating:      rev.Rating,
			Comment:     rev.Comment,
			ServiceName: svcName,
			BookingDate: bDate,
			CreatedAt:   rev.CreatedAt,
		})
	}

	return items, total, nil
}

func (m *MemoryRepository) GetWorkerRatingStats(ctx context.Context, workerID string) (float64, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	totalScore := 0
	count := 0
	for _, rev := range m.reviews {
		if rev.WorkerID == workerID {
			totalScore += rev.Rating
			count++
		}
	}
	if count == 0 {
		return 0, 0, nil
	}
	return float64(totalScore) / float64(count), count, nil
}

func (m *MemoryRepository) RecordEvent(ctx context.Context, event *domain.AnalyticsEvent) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if event.ID == "" {
		event.ID = uuid.NewString()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now()
	}
	m.events = append(m.events, event)
	return nil
}

func (m *MemoryRepository) GetSummary(ctx context.Context, days int) (*domain.AdminAnalyticsSummary, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	summary := &domain.AdminAnalyticsSummary{
		BookingStatusBreakdown: make(map[string]int64),
		TopWorkers:             []domain.AnalyticsWorkerMetric{},
		TopSearches:            []domain.AnalyticsSearchMetric{},
		TopCities:              []domain.AnalyticsCityMetric{},
		DaysRange:              days,
	}

	useTimeFilter := days > 0
	var cutoff time.Time
	if useTimeFilter {
		cutoff = time.Now().AddDate(0, 0, -days)
	}

	workerClicks := make(map[string]int64)
	workerViews := make(map[string]int64)
	searchCounts := make(map[string]map[string]int64)
	cityStats := make(map[string]*struct {
		totalActivity  int64
		profileViews   int64
		searches       int64
		whatsappClicks int64
	})
	var totalCityActivity int64

	for _, ev := range m.events {
		if useTimeFilter && ev.CreatedAt.Before(cutoff) {
			continue
		}

		meta := ev.GetMetadataMap()
		cityName := ""
		if c, ok := meta["city"].(string); ok && strings.TrimSpace(c) != "" {
			cityName = strings.TrimSpace(c)
		} else if loc, ok := meta["location"].(string); ok && strings.TrimSpace(loc) != "" {
			cityName = strings.TrimSpace(loc)
		}

		if cityName != "" {
			stat := cityStats[cityName]
			if stat == nil {
				stat = &struct {
					totalActivity  int64
					profileViews   int64
					searches       int64
					whatsappClicks int64
				}{}
				cityStats[cityName] = stat
			}
			stat.totalActivity++
			totalCityActivity++

			switch ev.EventName {
			case domain.EventPageViewWorker:
				stat.profileViews++
			case domain.EventSearchPerformed:
				stat.searches++
			case domain.EventWhatsAppClick:
				stat.whatsappClicks++
			}
		}

		switch ev.EventName {
		case domain.EventWhatsAppClick:
			summary.TotalWhatsAppClicks++
			if ev.EntityID != "" {
				workerClicks[ev.EntityID]++
			}
		case domain.EventPageViewWorker:
			summary.TotalProfileViews++
			if ev.EntityID != "" {
				workerViews[ev.EntityID]++
			}
		case domain.EventSearchPerformed:
			summary.TotalSearches++
			qStr, _ := meta["query"].(string)
			locStr, _ := meta["location"].(string)
			qStr = strings.TrimSpace(qStr)
			locStr = strings.TrimSpace(locStr)
			if qStr != "" || locStr != "" {
				key := strings.ToLower(qStr) + "|||" + strings.ToLower(locStr)
				if searchCounts[key] == nil {
					searchCounts[key] = map[string]int64{"count": 0}
				}
				searchCounts[key]["count"]++
			}
		}
	}

	for _, b := range m.bookings {
		if useTimeFilter && b.CreatedAt.Before(cutoff) {
			continue
		}
		summary.TotalBookings++
		summary.BookingStatusBreakdown[b.Status]++
	}

	for _, w := range m.workers {
		clicks := workerClicks[w.ID] + workerClicks[w.Slug]
		views := workerViews[w.ID] + workerViews[w.Slug]
		summary.TopWorkers = append(summary.TopWorkers, domain.AnalyticsWorkerMetric{
			WorkerID:       w.ID,
			WorkerSlug:     w.Slug,
			WorkerName:     w.Name,
			Zone:           w.Zone,
			WhatsAppClicks: clicks,
			ProfileViews:   views,
		})
	}

	sort.Slice(summary.TopWorkers, func(i, j int) bool {
		if summary.TopWorkers[i].WhatsAppClicks == summary.TopWorkers[j].WhatsAppClicks {
			return summary.TopWorkers[i].ProfileViews > summary.TopWorkers[j].ProfileViews
		}
		return summary.TopWorkers[i].WhatsAppClicks > summary.TopWorkers[j].WhatsAppClicks
	})
	if len(summary.TopWorkers) > 5 {
		summary.TopWorkers = summary.TopWorkers[:5]
	}

	for k, v := range searchCounts {
		parts := strings.Split(k, "|||")
		summary.TopSearches = append(summary.TopSearches, domain.AnalyticsSearchMetric{
			Query:    parts[0],
			Location: parts[1],
			Count:    v["count"],
		})
	}
	sort.Slice(summary.TopSearches, func(i, j int) bool {
		return summary.TopSearches[i].Count > summary.TopSearches[j].Count
	})
	if len(summary.TopSearches) > 5 {
		summary.TopSearches = summary.TopSearches[:5]
	}

	for name, stat := range cityStats {
		pct := 0.0
		if totalCityActivity > 0 {
			pct = float64(stat.totalActivity) / float64(totalCityActivity) * 100
			pct = float64(int(pct*10+0.5)) / 10.0
		}
		summary.TopCities = append(summary.TopCities, domain.AnalyticsCityMetric{
			City:           name,
			TotalActivity:  stat.totalActivity,
			ProfileViews:   stat.profileViews,
			Searches:       stat.searches,
			WhatsAppClicks: stat.whatsappClicks,
			Percentage:     pct,
		})
	}
	sort.Slice(summary.TopCities, func(i, j int) bool {
		return summary.TopCities[i].TotalActivity > summary.TopCities[j].TotalActivity
	})
	if len(summary.TopCities) > 8 {
		summary.TopCities = summary.TopCities[:8]
	}

	return summary, nil
}

// CreateActivationToken menyimpan token aktivasi ke in-memory store
func (m *MemoryRepository) CreateActivationToken(ctx context.Context, token *domain.WorkerActivationToken) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if token.ID == "" {
		token.ID = uuid.NewString()
	}
	m.activationTokens[token.TokenHash] = token
	return nil
}

// GetActivationTokenByHash mencari token aktivasi berdasarkan hash
func (m *MemoryRepository) GetActivationTokenByHash(ctx context.Context, tokenHash string) (*domain.WorkerActivationToken, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	token, ok := m.activationTokens[tokenHash]
	if !ok {
		return nil, domain.ErrWorkerNotFound
	}
	return token, nil
}

// MarkActivationTokenUsed menandai token aktivasi digunakan dan mengaktifkan akun pekerja
func (m *MemoryRepository) MarkActivationTokenUsed(ctx context.Context, tokenID string, workerID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var targetToken *domain.WorkerActivationToken
	for _, t := range m.activationTokens {
		if t.ID == tokenID {
			targetToken = t
			break
		}
	}

	if targetToken == nil {
		return domain.ErrWorkerNotFound
	}
	if targetToken.IsUsed {
		return fmt.Errorf("token aktivasi sudah digunakan atau tidak valid")
	}

	now := time.Now().UTC()
	targetToken.IsUsed = true
	targetToken.UsedAt = &now

	// Aktifkan worker
	if w, ok := m.workers[workerID]; ok {
		w.IsActive = true
	}

	// Aktifkan worker_account
	for _, acc := range m.accounts {
		if acc.WorkerID != nil && *acc.WorkerID == workerID {
			acc.AccountStatus = domain.AccountStatusActive
		}
	}

	return nil
}

// CreateCredentialResetToken menyimpan permohonan reset ke in-memory store
func (m *MemoryRepository) CreateCredentialResetToken(ctx context.Context, token *domain.WorkerCredentialResetToken) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if token.ID == "" {
		token.ID = uuid.NewString()
	}
	m.resetTokens[token.ID] = token
	return nil
}

// GetActiveResetTokenByPhone mencari token permohonan reset aktif di in-memory store
func (m *MemoryRepository) GetActiveResetTokenByPhone(ctx context.Context, phone string, now time.Time) (*domain.WorkerCredentialResetToken, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, t := range m.resetTokens {
		if t.PhoneNumber == phone && t.RequestExpiresAt.After(now) && !t.IsApproved && !t.IsUsed {
			return t, nil
		}
	}
	return nil, nil
}

// GetResetTokenByRequestHash mencari permohonan reset berdasarkan request_token_hash
func (m *MemoryRepository) GetResetTokenByRequestHash(ctx context.Context, hash string) (*domain.WorkerCredentialResetToken, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, t := range m.resetTokens {
		if t.RequestTokenHash == hash {
			if t.WorkerID != nil {
				t.Worker = m.workers[*t.WorkerID]
			}
			t.Account = m.accounts[t.AccountID]
			return t, nil
		}
	}
	return nil, domain.ErrWorkerNotFound
}

// ApproveResetToken memperbarui status token permohonan menjadi disetujui di in-memory store
func (m *MemoryRepository) ApproveResetToken(ctx context.Context, id string, adminID string, executionHash string, executionExpiresAt time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	t, ok := m.resetTokens[id]
	if !ok || t.IsApproved {
		return fmt.Errorf("permohonan reset tidak ditemukan atau sudah pernah disetujui")
	}

	now := time.Now().UTC()
	t.IsApproved = true
	t.ApprovedAt = &now
	t.ApprovedByAdminID = &adminID
	t.ExecutionTokenHash = &executionHash
	t.ExecutionExpiresAt = &executionExpiresAt
	return nil
}

// GetResetTokenByExecutionHash mencari token reset berdasarkan execution_token_hash
func (m *MemoryRepository) GetResetTokenByExecutionHash(ctx context.Context, hash string) (*domain.WorkerCredentialResetToken, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, t := range m.resetTokens {
		if t.ExecutionTokenHash != nil && *t.ExecutionTokenHash == hash {
			if t.WorkerID != nil {
				t.Worker = m.workers[*t.WorkerID]
			}
			t.Account = m.accounts[t.AccountID]
			return t, nil
		}
	}
	return nil, domain.ErrWorkerNotFound
}

// MarkResetTokenUsed menandai token reset telah digunakan dan memperbarui kredensial akun
func (m *MemoryRepository) MarkResetTokenUsed(ctx context.Context, id string, accountID string, newPasswordHash string, newPhone string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	t, ok := m.resetTokens[id]
	if !ok || t.IsUsed {
		return fmt.Errorf("token reset sudah pernah digunakan atau tidak valid")
	}

	now := time.Now().UTC()
	t.IsUsed = true
	t.UsedAt = &now

	acc, ok := m.accounts[accountID]
	if !ok {
		return domain.ErrWorkerNotFound
	}
	acc.PasswordHash = newPasswordHash
	acc.FailedLoginAttempts = 0
	acc.LockedUntil = nil
	acc.UpdatedAt = now

	if strings.TrimSpace(newPhone) != "" {
		cleanPhone := strings.TrimSpace(newPhone)
		acc.PhoneNumber = cleanPhone
		if acc.WorkerID != nil {
			if w, ok := m.workers[*acc.WorkerID]; ok {
				w.WhatsAppNumber = cleanPhone
				w.UpdatedAt = now
			}
		}
	}

	return nil
}








