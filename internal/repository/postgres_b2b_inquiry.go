package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tuwaktu.com/internal/domain"
)

type PostgresB2BInquiryRepository struct {
	db *gorm.DB
}

func NewPostgresB2BInquiryRepository(db *gorm.DB) *PostgresB2BInquiryRepository {
	return &PostgresB2BInquiryRepository{db: db}
}

func (r *PostgresB2BInquiryRepository) Create(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if inquiry == nil {
		return domain.ErrInvalidInput
	}
	if strings.TrimSpace(inquiry.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("membuat UUID pengajuan klien bisnis: %w", err)
		}
		inquiry.ID = id.String()
	}
	if err := r.db.WithContext(ctx).Create(inquiry).Error; err != nil {
		return fmt.Errorf("menyimpan pengajuan klien bisnis: %w", err)
	}
	return nil
}

func (r *PostgresB2BInquiryRepository) List(ctx context.Context, filter domain.B2BInquiryFilter) ([]domain.B2BPropertyInquiry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	query := r.db.WithContext(ctx).Model(&domain.B2BPropertyInquiry{})

	if status := strings.ToUpper(strings.TrimSpace(filter.Status)); status != "" && status != "ALL" {
		query = query.Where("status = ?", status)
	}
	if payStatus := strings.ToUpper(strings.TrimSpace(filter.PaymentStatus)); payStatus != "" && payStatus != "ALL" {
		query = query.Where("payment_status = ?", payStatus)
	}
	if q := strings.TrimSpace(filter.Query); q != "" {
		like := "%" + q + "%"
		query = query.Where(
			"inquiry_code ILIKE ? OR business_name ILIKE ? OR contact_name ILIKE ? OR city_zone ILIKE ?",
			like, like, like, like,
		)
	}

	var items []domain.B2BPropertyInquiry
	if err := query.Order("created_at DESC").Find(&items).Error; err != nil {
		return nil, fmt.Errorf("mengambil daftar pengajuan klien bisnis: %w", err)
	}
	if items == nil {
		items = []domain.B2BPropertyInquiry{}
	}
	return items, nil
}

func (r *PostgresB2BInquiryRepository) GetByID(ctx context.Context, id string) (*domain.B2BPropertyInquiry, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return nil, domain.ErrB2BInquiryNotFound
	}

	var item domain.B2BPropertyInquiry
	err := r.db.WithContext(ctx).Where("id = ?", cleanID).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrB2BInquiryNotFound
		}
		return nil, fmt.Errorf("mengambil detail pengajuan klien bisnis: %w", err)
	}
	return &item, nil
}

func (r *PostgresB2BInquiryRepository) Update(ctx context.Context, inquiry *domain.B2BPropertyInquiry) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if inquiry == nil || strings.TrimSpace(inquiry.ID) == "" {
		return domain.ErrInvalidInput
	}

	result := r.db.WithContext(ctx).Save(inquiry)
	if result.Error != nil {
		return fmt.Errorf("memperbarui pengajuan klien bisnis: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return domain.ErrB2BInquiryNotFound
	}
	return nil
}

func (r *PostgresB2BInquiryRepository) GetSummaryStats(ctx context.Context) (*domain.B2BInquirySummaryStats, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	type aggRow struct {
		TotalCount           int64   `gorm:"column:total_count"`
		PendingFollowUpCount int64   `gorm:"column:pending_follow_up_count"`
		ActiveContractCount  int64   `gorm:"column:active_contract_count"`
		PaidMonthlyRevenue   float64 `gorm:"column:paid_monthly_revenue"`
	}

	var agg aggRow
	err := r.db.WithContext(ctx).
		Model(&domain.B2BPropertyInquiry{}).
		Select(`
			COUNT(*) AS total_count,
			COUNT(*) FILTER (WHERE status IN ('NEW', 'CONTACTED', 'PROPOSAL_SENT')) AS pending_follow_up_count,
			COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_contract_count,
			COALESCE(SUM(COALESCE(agreed_monthly_fee, estimated_monthly_fee)) FILTER (WHERE payment_status = 'PAID' AND status != 'REJECTED'), 0) AS paid_monthly_revenue
		`).
		Scan(&agg).Error
	if err != nil {
		return nil, fmt.Errorf("menghitung statistik pengajuan klien bisnis: %w", err)
	}

	return &domain.B2BInquirySummaryStats{
		TotalCount:           agg.TotalCount,
		PendingFollowUpCount: agg.PendingFollowUpCount,
		ActiveContractCount:  agg.ActiveContractCount,
		PaidMonthlyRevenue:   agg.PaidMonthlyRevenue,
	}, nil
}

