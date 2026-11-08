package repository

import (
	"context"

	"tuwaktu.com/internal/domain"
)

type AnalyticsRepository interface {
	RecordEvent(ctx context.Context, event *domain.AnalyticsEvent) error
	GetSummary(ctx context.Context, days int) (*domain.AdminAnalyticsSummary, error)
}

