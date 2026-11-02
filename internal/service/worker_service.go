package service

import (
	"context"
	"strings"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

type WorkerService interface {
	GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error)
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
