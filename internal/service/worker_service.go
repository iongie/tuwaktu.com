package service

import (
	"context"
	"fmt"
	"strings"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

type WorkerService interface {
	GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error)
	UpdateWorkerProfile(ctx context.Context, id string, req *domain.WorkerProfileUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerRates(ctx context.Context, req *domain.WorkerRateUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerLocationSettings(ctx context.Context, req *domain.WorkerLocationSettingsUpdate) (*domain.PublicWorkerProfile, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerScheduleItem, error)
	UpdateWorkerSchedules(ctx context.Context, idOrSlug string, req []domain.WorkerScheduleItem) ([]domain.WorkerScheduleItem, error)
}

type workerService struct {
	repo repository.WorkerRepository
}

func NewWorkerService(repo repository.WorkerRepository) WorkerService {
	return &workerService{repo: repo}
}

func (s *workerService) GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error) {
	slug = strings.ToLower(strings.TrimSpace(slug))
	if slug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, worker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, s := range services {
		publicServices[i] = s.ToPublic()
	}

	profile := worker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) UpdateWorkerProfile(ctx context.Context, id string, req *domain.WorkerProfileUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if id == "" || req == nil {
		return nil, domain.ErrInvalidInput
	}
	if strings.TrimSpace(req.Name) == "" {
		return nil, domain.ErrInvalidInput
	}
	if strings.TrimSpace(req.WhatsAppNumber) != "" {
		sanitized, err := domain.SanitizeAndValidateWhatsAppNumber(req.WhatsAppNumber)
		if err != nil {
			return nil, err
		}
		req.WhatsAppNumber = sanitized
	}

	updatedWorker, err := s.repo.UpdateProfile(ctx, id, req)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) UpdateWorkerRates(ctx context.Context, req *domain.WorkerRateUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID := strings.TrimSpace(req.WorkerID)
	if workerID == "" {
		workerID = strings.TrimSpace(req.ID)
	}
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}
	if req.BasePrice <= 0 {
		return nil, domain.ErrInvalidBasePrice
	}
	rateType := strings.ToUpper(strings.TrimSpace(req.RateType))
	if rateType != "HOURLY" && rateType != "UNIT" {
		return nil, domain.ErrInvalidRateType
	}

	updatedWorker, err := s.repo.UpdateRates(ctx, workerID, req.BasePrice, rateType)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) UpdateWorkerLocationSettings(ctx context.Context, req *domain.WorkerLocationSettingsUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID := strings.TrimSpace(req.WorkerID)
	if workerID == "" {
		workerID = strings.TrimSpace(req.ID)
	}
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}

	if req.MaxRadiusKM <= 0 {
		return nil, domain.ErrInvalidInput
	}
	if req.FreeRadiusKM < 0 {
		return nil, domain.ErrInvalidInput
	}
	if req.FreeRadiusKM > req.MaxRadiusKM {
		return nil, fmt.Errorf("%w: radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal", domain.ErrInvalidInput)
	}
	if req.ExtraFeePerKM < 0 {
		return nil, domain.ErrInvalidInput
	}
	if (req.Lat != nil && req.Lng == nil) || (req.Lat == nil && req.Lng != nil) {
		return nil, fmt.Errorf("%w: titik lintang dan bujur harus diisi bersamaan", domain.ErrInvalidInput)
	}
	if req.Lat != nil && (*req.Lat < -90.0 || *req.Lat > 90.0) {
		return nil, domain.ErrInvalidInput
	}
	if req.Lng != nil && (*req.Lng < -180.0 || *req.Lng > 180.0) {
		return nil, domain.ErrInvalidInput
	}

	updatedWorker, err := s.repo.UpdateLocationSettings(ctx, workerID, req)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerScheduleItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	schedules, err := s.repo.GetWorkerSchedules(ctx, idOrSlug)
	if err != nil {
		return nil, err
	}

	items := make([]domain.WorkerScheduleItem, len(schedules))
	for i, sc := range schedules {
		items[i] = domain.WorkerScheduleItem{
			DayOfWeek:     sc.DayOfWeek,
			DayName:       domain.GetDayName(sc.DayOfWeek),
			IsActive:      sc.IsActive,
			SlotMorning:   sc.SlotMorning,
			SlotAfternoon: sc.SlotAfternoon,
			SlotEvening:   sc.SlotEvening,
		}
	}

	return items, nil
}

func (s *workerService) UpdateWorkerSchedules(ctx context.Context, idOrSlug string, req []domain.WorkerScheduleItem) ([]domain.WorkerScheduleItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}
	if len(req) == 0 {
		return nil, fmt.Errorf("%w: konfigurasi jadwal kerja tidak boleh kosong", domain.ErrInvalidInput)
	}

	entities := make([]domain.WorkerSchedule, len(req))
	for i, item := range req {
		if item.DayOfWeek < 0 || item.DayOfWeek > 6 {
			return nil, domain.ErrInvalidScheduleDay
		}
		entities[i] = domain.WorkerSchedule{
			DayOfWeek:     item.DayOfWeek,
			IsActive:      item.IsActive,
			SlotMorning:   item.SlotMorning,
			SlotAfternoon: item.SlotAfternoon,
			SlotEvening:   item.SlotEvening,
		}
	}

	updated, err := s.repo.UpdateWorkerSchedules(ctx, idOrSlug, entities)
	if err != nil {
		return nil, err
	}

	items := make([]domain.WorkerScheduleItem, len(updated))
	for i, sc := range updated {
		items[i] = domain.WorkerScheduleItem{
			DayOfWeek:     sc.DayOfWeek,
			DayName:       domain.GetDayName(sc.DayOfWeek),
			IsActive:      sc.IsActive,
			SlotMorning:   sc.SlotMorning,
			SlotAfternoon: sc.SlotAfternoon,
			SlotEvening:   sc.SlotEvening,
		}
	}

	return items, nil
}


