package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"tuwaktu.com/internal/domain"
)

type PostgresReviewRepository struct {
	db *gorm.DB
}

func NewPostgresReviewRepository(db *gorm.DB) *PostgresReviewRepository {
	return &PostgresReviewRepository{db: db}
}

// CreateReviewTx executes storing review, updating booking reviewed_at, and recalculating worker ratings atomically
func (r *PostgresReviewRepository) CreateReviewTx(ctx context.Context, review *domain.Review) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Check if booking already reviewed
		var count int64
		if err := tx.Model(&domain.Review{}).Where("booking_id = ?", review.BookingID).Count(&count).Error; err != nil {
			return fmt.Errorf("checking existing review: %w", err)
		}
		if count > 0 {
			return domain.ErrBookingAlreadyReviewed
		}

		// 2. Insert Review record
		if err := tx.Create(review).Error; err != nil {
			return fmt.Errorf("creating review: %w", err)
		}

		// 3. Mark booking as reviewed
		now := time.Now()
		if err := tx.Model(&domain.Booking{}).
			Where("id = ?", review.BookingID).
			Update("reviewed_at", now).Error; err != nil {
			return fmt.Errorf("updating booking reviewed_at: %w", err)
		}

		// 4. Calculate new average rating and review count
		type RatingAggregate struct {
			AvgRating   float64 `gorm:"column:avg_rating"`
			ReviewCount int     `gorm:"column:review_count"`
		}
		var agg RatingAggregate
		err := tx.Model(&domain.Review{}).
			Select("COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating, COUNT(id) as review_count").
			Where("worker_id = ?", review.WorkerID).
			Scan(&agg).Error
		if err != nil {
			return fmt.Errorf("calculating worker rating aggregate: %w", err)
		}

		// 5. Update worker aggregate
		if err := tx.Model(&domain.Worker{}).
			Where("id = ?", review.WorkerID).
			Updates(map[string]interface{}{
				"rating":       agg.AvgRating,
				"review_count": agg.ReviewCount,
				"updated_at":   now,
			}).Error; err != nil {
			return fmt.Errorf("updating worker rating aggregate: %w", err)
		}

		return nil
	})
}

// GetReviewByBookingID returns a review by its booking id
func (r *PostgresReviewRepository) GetReviewByBookingID(ctx context.Context, bookingID string) (*domain.Review, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	var rev domain.Review
	err := r.db.WithContext(ctx).
		Where("booking_id = ?", bookingID).
		First(&rev).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("querying review by booking id: %w", err)
	}
	return &rev, nil
}

// GetPublicReviewsByWorkerSlug returns public reviews with anonymized names for worker profile
func (r *PostgresReviewRepository) GetPublicReviewsByWorkerSlug(ctx context.Context, slug string, limit, offset int) ([]domain.PublicReviewItem, int64, error) {
	if err := ctx.Err(); err != nil {
		return nil, 0, err
	}
	slug = strings.ToLower(strings.TrimSpace(slug))

	// Find worker ID first
	var w domain.Worker
	if err := r.db.WithContext(ctx).Select("id").Where("LOWER(slug) = ?", slug).First(&w).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, domain.ErrWorkerNotFound
		}
		return nil, 0, fmt.Errorf("querying worker id by slug: %w", err)
	}

	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var total int64
	db := r.db.WithContext(ctx).Model(&domain.Review{}).Where("worker_id = ?", w.ID)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("counting worker reviews: %w", err)
	}

	var reviews []domain.Review
	err := r.db.WithContext(ctx).
		Preload("Booking.Service").
		Where("worker_id = ?", w.ID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error
	if err != nil {
		return nil, 0, fmt.Errorf("querying worker reviews: %w", err)
	}

	items := make([]domain.PublicReviewItem, 0, len(reviews))
	for _, rev := range reviews {
		svcName := "Layanan Umum"
		if rev.Booking != nil && rev.Booking.Service != nil && rev.Booking.Service.Name != "" {
			svcName = rev.Booking.Service.Name
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

// GetWorkerDashboardReviews returns all reviews received by the authenticated worker
func (r *PostgresReviewRepository) GetWorkerDashboardReviews(ctx context.Context, workerID string, limit, offset int) ([]domain.WorkerDashboardReviewItem, int64, error) {
	if err := ctx.Err(); err != nil {
		return nil, 0, err
	}
	workerID = strings.TrimSpace(workerID)

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	var total int64
	db := r.db.WithContext(ctx).Model(&domain.Review{}).Where("worker_id = ?", workerID)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("counting worker dashboard reviews: %w", err)
	}

	var reviews []domain.Review
	err := r.db.WithContext(ctx).
		Preload("Booking.Service").
		Where("worker_id = ?", workerID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error
	if err != nil {
		return nil, 0, fmt.Errorf("querying dashboard reviews: %w", err)
	}

	items := make([]domain.WorkerDashboardReviewItem, 0, len(reviews))
	for _, rev := range reviews {
		svcName := "Layanan"
		bCode := ""
		bDate := rev.CreatedAt
		if rev.Booking != nil {
			bCode = rev.Booking.BookingCode
			bDate = rev.Booking.BookingDate
			if rev.Booking.Service != nil && rev.Booking.Service.Name != "" {
				svcName = rev.Booking.Service.Name
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

// GetWorkerRatingStats returns aggregated rating and count
func (r *PostgresReviewRepository) GetWorkerRatingStats(ctx context.Context, workerID string) (float64, int, error) {
	type RatingAggregate struct {
		AvgRating   float64 `gorm:"column:avg_rating"`
		ReviewCount int     `gorm:"column:review_count"`
	}
	var agg RatingAggregate
	err := r.db.WithContext(ctx).Model(&domain.Review{}).
		Select("COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating, COUNT(id) as review_count").
		Where("worker_id = ?", workerID).
		Scan(&agg).Error
	if err != nil {
		return 0, 0, fmt.Errorf("calculating rating stats: %w", err)
	}
	return agg.AvgRating, agg.ReviewCount, nil
}

