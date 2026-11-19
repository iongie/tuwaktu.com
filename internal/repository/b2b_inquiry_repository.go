package repository

import (
	"context"

	"tuwaktu.com/internal/domain"
)

type B2BInquiryRepository interface {
	Create(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error
	List(ctx context.Context, filter domain.B2BInquiryFilter) ([]domain.B2BPropertyInquiry, error)
	GetByID(ctx context.Context, id string) (*domain.B2BPropertyInquiry, error)
	Update(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error
	GetSummaryStats(ctx context.Context) (*domain.B2BInquirySummaryStats, error)
}

