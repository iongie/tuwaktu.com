package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestAnalyticsService_TrackEvent(t *testing.T) {
	repo := repository.NewMemoryRepository()
	svc := service.NewAnalyticsService(repo)
	ctx := context.Background()

	t.Run("gagal jika payload nil", func(t *testing.T) {
		err := svc.TrackEvent(ctx, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "payload event tidak boleh kosong")
	})

	t.Run("gagal jika event_name kosong", func(t *testing.T) {
		err := svc.TrackEvent(ctx, &domain.TrackEventPayload{
			EventName: "  ",
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "nama event (event_name) wajib diisi")
	})

	t.Run("berhasil mencatat event whatsapp click", func(t *testing.T) {
		err := svc.TrackEvent(ctx, &domain.TrackEventPayload{
			EventName:  domain.EventWhatsAppClick,
			EntityType: domain.EntityTypeWorker,
			EntityID:   "budi-santoso",
			Metadata: map[string]interface{}{
				"source": "worker_booking_page",
			},
		})
		assert.NoError(t, err)

		summary, err := svc.GetAdminSummary(ctx, 30)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), summary.TotalWhatsAppClicks)
	})

	t.Run("berhasil mencatat event search performed", func(t *testing.T) {
		err := svc.TrackEvent(ctx, &domain.TrackEventPayload{
			EventName:  domain.EventSearchPerformed,
			EntityType: domain.EntityTypeSearch,
			Metadata: map[string]interface{}{
				"query":    "AC Inverter",
				"location": "Jakarta Selatan",
			},
		})
		assert.NoError(t, err)

		summary, err := svc.GetAdminSummary(ctx, 7)
		assert.NoError(t, err)
		assert.Equal(t, int64(1), summary.TotalSearches)
		assert.NotEmpty(t, summary.TopSearches)
		assert.Equal(t, "ac inverter", summary.TopSearches[0].Query)
		assert.Equal(t, "jakarta selatan", summary.TopSearches[0].Location)
	})
}

func TestAnalyticsService_GetAdminSummary(t *testing.T) {
	repo := repository.NewMemoryRepository()
	svc := service.NewAnalyticsService(repo)
	ctx := context.Background()

	// Seed pekerja
	w := &domain.Worker{
		ID:       "w-1",
		Slug:     "budi-santoso",
		Name:     "Budi Santoso",
		Zone:     "Jakarta Selatan",
		IsActive: true,
	}
	repo.SeedWorker(w)

	// Seed booking
	b := &domain.Booking{
		ID:          "b-1",
		WorkerID:    "w-1",
		Status:      "CONFIRMED",
		BookingDate: time.Now().AddDate(0, 0, 2),
		CreatedAt:   time.Now(),
	}
	repo.SeedBooking(b)

	// Track beberapa event
	_ = svc.TrackEvent(ctx, &domain.TrackEventPayload{
		EventName:  domain.EventWhatsAppClick,
		EntityType: domain.EntityTypeWorker,
		EntityID:   "budi-santoso",
	})
	_ = svc.TrackEvent(ctx, &domain.TrackEventPayload{
		EventName:  domain.EventPageViewWorker,
		EntityType: domain.EntityTypeWorker,
		EntityID:   "budi-santoso",
	})

	summary, err := svc.GetAdminSummary(ctx, 30)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), summary.TotalWhatsAppClicks)
	assert.Equal(t, int64(1), summary.TotalProfileViews)
	assert.Equal(t, int64(1), summary.TotalBookings)
	assert.Equal(t, int64(1), summary.BookingStatusBreakdown["CONFIRMED"])
	assert.NotEmpty(t, summary.TopWorkers)
	assert.Equal(t, "Budi Santoso", summary.TopWorkers[0].WorkerName)
}
