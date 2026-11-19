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

type MemoryB2BInquiryRepository struct {
	mu    sync.RWMutex
	items map[string]*domain.B2BPropertyInquiry
}

func NewMemoryB2BInquiryRepository() *MemoryB2BInquiryRepository {
	return &MemoryB2BInquiryRepository{
		items: make(map[string]*domain.B2BPropertyInquiry),
	}
}

func cloneB2BInquiry(src *domain.B2BPropertyInquiry) domain.B2BPropertyInquiry {
	copyItem := *src
	if src.PreferredStartDate != nil {
		d := *src.PreferredStartDate
		copyItem.PreferredStartDate = &d
	}
	if src.AgreedMonthlyFee != nil {
		f := *src.AgreedMonthlyFee
		copyItem.AgreedMonthlyFee = &f
	}
	if src.PaidAt != nil {
		t := *src.PaidAt
		copyItem.PaidAt = &t
	}
	return copyItem
}

func (r *MemoryB2BInquiryRepository) Create(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now().UTC()
	if strings.TrimSpace(inquiry.ID) == "" {
		inquiry.ID = uuid.NewString()
	}
	if inquiry.CreatedAt.IsZero() {
		inquiry.CreatedAt = now
	}
	if inquiry.UpdatedAt.IsZero() {
		inquiry.UpdatedAt = now
	}

	copied := cloneB2BInquiry(inquiry)
	r.items[inquiry.ID] = &copied
	return nil
}

func (r *MemoryB2BInquiryRepository) List(ctx context.Context, filter domain.B2BInquiryFilter) ([]domain.B2BPropertyInquiry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	statusFilter := strings.ToUpper(strings.TrimSpace(filter.Status))
	payFilter := strings.ToUpper(strings.TrimSpace(filter.PaymentStatus))
	q := strings.ToLower(strings.TrimSpace(filter.Query))

	results := make([]domain.B2BPropertyInquiry, 0, len(r.items))
	for _, item := range r.items {
		if statusFilter != "" && statusFilter != "ALL" && item.Status != statusFilter {
			continue
		}
		if payFilter != "" && payFilter != "ALL" && item.PaymentStatus != payFilter {
			continue
		}
		if q != "" {
			matches := strings.Contains(strings.ToLower(item.InquiryCode), q) ||
				strings.Contains(strings.ToLower(item.BusinessName), q) ||
				strings.Contains(strings.ToLower(item.ContactName), q) ||
				strings.Contains(strings.ToLower(item.CityZone), q)
			if !matches {
				continue
			}
		}
		results = append(results, cloneB2BInquiry(item))
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].CreatedAt.After(results[j].CreatedAt)
	})
	return results, nil
}

func (r *MemoryB2BInquiryRepository) GetByID(ctx context.Context, id string) (*domain.B2BPropertyInquiry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	item, exists := r.items[strings.TrimSpace(id)]
	if !exists {
		return nil, domain.ErrB2BInquiryNotFound
	}
	copied := cloneB2BInquiry(item)
	return &copied, nil
}

func (r *MemoryB2BInquiryRepository) Update(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.items[inquiry.ID]; !exists {
		return domain.ErrB2BInquiryNotFound
	}

	inquiry.UpdatedAt = time.Now().UTC()
	copied := cloneB2BInquiry(inquiry)
	r.items[inquiry.ID] = &copied
	return nil
}

func (r *MemoryB2BInquiryRepository) GetSummaryStats(ctx context.Context) (*domain.B2BInquirySummaryStats, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	stats := &domain.B2BInquirySummaryStats{}
	for _, item := range r.items {
		stats.TotalCount++
		switch item.Status {
		case domain.B2BStatusNew, domain.B2BStatusContacted, domain.B2BStatusProposalSent:
			stats.PendingFollowUpCount++
		case domain.B2BStatusActive:
			stats.ActiveContractCount++
		}
		if item.PaymentStatus == domain.B2BPaymentPaid && item.Status != domain.B2BStatusRejected {
			if item.AgreedMonthlyFee != nil {
				stats.PaidMonthlyRevenue += *item.AgreedMonthlyFee
			} else {
				stats.PaidMonthlyRevenue += item.EstimatedMonthlyFee
			}
		}
	}
	return stats, nil
}
