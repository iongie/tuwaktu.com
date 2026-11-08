package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
)

type AnalyticsService interface {
	TrackEvent(ctx context.Context, payload *domain.TrackEventPayload) error
	GetAdminSummary(ctx context.Context, days int) (*domain.AdminAnalyticsSummary, error)
}

type analyticsService struct {
	repo repository.AnalyticsRepository
}

func NewAnalyticsService(repo repository.AnalyticsRepository) AnalyticsService {
	return &analyticsService{repo: repo}
}

// TrackEvent memvalidasi dan mencatat event telemetri interaksi pengguna
func (s *analyticsService) TrackEvent(ctx context.Context, payload *domain.TrackEventPayload) error {
	if payload == nil {
		return errors.New("payload event tidak boleh kosong")
	}

	eventName := strings.TrimSpace(payload.EventName)
	if eventName == "" {
		return errors.New("nama event (event_name) wajib diisi")
	}

	// Batasi panjang string nama event dan entity
	if len(eventName) > 50 {
		eventName = eventName[:50]
	}
	entityType := strings.TrimSpace(payload.EntityType)
	if len(entityType) > 50 {
		entityType = entityType[:50]
	}
	entityID := strings.TrimSpace(payload.EntityID)
	if len(entityID) > 100 {
		entityID = entityID[:100]
	}

	var metadataStr string
	if payload.Metadata != nil && len(payload.Metadata) > 0 {
		bytes, err := json.Marshal(payload.Metadata)
		if err == nil {
			metadataStr = string(bytes)
		}
	}

	event := &domain.AnalyticsEvent{
		EventName:  eventName,
		EntityType: entityType,
		EntityID:   entityID,
		Metadata:   metadataStr,
		CreatedAt:  time.Now(),
	}

	return s.repo.RecordEvent(ctx, event)
}

// GetAdminSummary mengambil ringkasan data analitik untuk panel admin
func (s *analyticsService) GetAdminSummary(ctx context.Context, days int) (*domain.AdminAnalyticsSummary, error) {
	if days < 0 {
		days = 0
	}
	return s.repo.GetSummary(ctx, days)
}

