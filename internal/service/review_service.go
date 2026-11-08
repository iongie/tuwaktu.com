package service

import (
	"context"
	"strings"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

type ReviewService interface {
	GetReviewInvitation(ctx context.Context, bookingCode, token string) (*domain.ReviewInvitationDetail, error)
	SubmitReview(ctx context.Context, req domain.SubmitReviewRequest) (*domain.Review, error)
	GetPublicReviews(ctx context.Context, workerSlug string, limit, offset int) ([]domain.PublicReviewItem, int64, error)
	GetWorkerDashboardReviews(ctx context.Context, workerIDOrSlug string, limit, offset int) ([]domain.WorkerDashboardReviewItem, int64, error)
}

type reviewService struct {
	reviewRepo  repository.ReviewRepository
	bookingRepo repository.BookingRepository
	workerRepo  repository.WorkerRepository
}

func NewReviewService(
	reviewRepo repository.ReviewRepository,
	bookingRepo repository.BookingRepository,
	workerRepo repository.WorkerRepository,
) ReviewService {
	return &reviewService{
		reviewRepo:  reviewRepo,
		bookingRepo: bookingRepo,
		workerRepo:  workerRepo,
	}
}

func (s *reviewService) GetReviewInvitation(ctx context.Context, bookingCode, token string) (*domain.ReviewInvitationDetail, error) {
	bookingCode = strings.TrimSpace(bookingCode)
	token = strings.TrimSpace(token)
	if bookingCode == "" || token == "" {
		return nil, domain.ErrInvalidReviewToken
	}

	b, err := s.bookingRepo.GetBookingByCode(ctx, bookingCode)
	if err != nil {
		return nil, domain.ErrBookingNotFound
	}

	// Verify token match
	if b.ReviewToken == "" || !strings.EqualFold(b.ReviewToken, token) {
		return nil, domain.ErrInvalidReviewToken
	}

	// Check status
	if !strings.EqualFold(b.Status, "COMPLETED") {
		return nil, domain.ErrBookingNotCompleted
	}

	// Check if already reviewed
	if b.ReviewedAt != nil {
		return nil, domain.ErrBookingAlreadyReviewed
	}
	existing, _ := s.reviewRepo.GetReviewByBookingID(ctx, b.ID)
	if existing != nil {
		return nil, domain.ErrBookingAlreadyReviewed
	}

	workerName := "Teknisi"
	workerSlug := ""
	workerAvatar := ""
	workerZone := b.Zone
	if b.Worker != nil {
		workerName = b.Worker.Name
		workerSlug = b.Worker.Slug
		workerAvatar = b.Worker.AvatarURL
		if b.Worker.Zone != "" {
			workerZone = b.Worker.Zone
		}
	} else if s.workerRepo != nil {
		if w, err := s.workerRepo.GetByID(ctx, b.WorkerID); err == nil && w != nil {
			workerName = w.Name
			workerSlug = w.Slug
			workerAvatar = w.AvatarURL
			if w.Zone != "" {
				workerZone = w.Zone
			}
		}
	}

	serviceName := "Layanan"
	if b.Service != nil && b.Service.Name != "" {
		serviceName = b.Service.Name
	}

	return &domain.ReviewInvitationDetail{
		BookingCode:  b.BookingCode,
		WorkerName:   workerName,
		WorkerSlug:   workerSlug,
		WorkerAvatar: workerAvatar,
		WorkerZone:   workerZone,
		ServiceName:  serviceName,
		BookingDate:  b.BookingDate,
		ClientName:   b.ClientName,
		IsReviewed:   false,
	}, nil
}

func (s *reviewService) SubmitReview(ctx context.Context, req domain.SubmitReviewRequest) (*domain.Review, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	b, err := s.bookingRepo.GetBookingByCode(ctx, req.BookingCode)
	if err != nil {
		return nil, domain.ErrBookingNotFound
	}

	if b.ReviewToken == "" || !strings.EqualFold(b.ReviewToken, req.Token) {
		return nil, domain.ErrInvalidReviewToken
	}

	if !strings.EqualFold(b.Status, "COMPLETED") {
		return nil, domain.ErrBookingNotCompleted
	}

	if b.ReviewedAt != nil {
		return nil, domain.ErrBookingAlreadyReviewed
	}
	existing, _ := s.reviewRepo.GetReviewByBookingID(ctx, b.ID)
	if existing != nil {
		return nil, domain.ErrBookingAlreadyReviewed
	}

	review := &domain.Review{
		BookingID:   b.ID,
		WorkerID:    b.WorkerID,
		ClientName:  b.ClientName,
		IsAnonymous: req.IsAnonymous,
		Rating:      req.Rating,
		Comment:     strings.TrimSpace(req.Comment),
	}

	if err := s.reviewRepo.CreateReviewTx(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

func (s *reviewService) GetPublicReviews(ctx context.Context, workerSlug string, limit, offset int) ([]domain.PublicReviewItem, int64, error) {
	workerSlug = strings.TrimSpace(workerSlug)
	if workerSlug == "" {
		return nil, 0, domain.ErrInvalidInput
	}
	return s.reviewRepo.GetPublicReviewsByWorkerSlug(ctx, workerSlug, limit, offset)
}

func (s *reviewService) GetWorkerDashboardReviews(ctx context.Context, workerIDOrSlug string, limit, offset int) ([]domain.WorkerDashboardReviewItem, int64, error) {
	workerIDOrSlug = strings.TrimSpace(workerIDOrSlug)
	if workerIDOrSlug == "" {
		return nil, 0, domain.ErrInvalidInput
	}

	workerID := workerIDOrSlug
	if s.workerRepo != nil {
		if w, err := s.workerRepo.GetBySlug(ctx, workerIDOrSlug); err == nil && w != nil {
			workerID = w.ID
		}
	}

	return s.reviewRepo.GetWorkerDashboardReviews(ctx, workerID, limit, offset)
}

