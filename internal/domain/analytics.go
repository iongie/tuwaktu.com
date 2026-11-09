package domain

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	EventWhatsAppClick   = "whatsapp_click"
	EventPageViewWorker  = "page_view_worker"
	EventSearchPerformed = "search_performed"
	EventBookingCreated  = "booking_created"

	EntityTypeWorker   = "worker"
	EntityTypeSearch   = "search"
	EntityTypeBooking  = "booking"
	EntityTypeCategory = "category"
)

// AnalyticsEvent merepresentasikan entitas pencatatan telemetri kejadian interaksi bisnis
type AnalyticsEvent struct {
	ID         string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	EventName  string    `json:"event_name" db:"event_name" gorm:"type:varchar(50);not null;index:idx_analytics_events_name_created"`
	EntityType string    `json:"entity_type,omitempty" db:"entity_type" gorm:"type:varchar(50);index:idx_analytics_events_entity"`
	EntityID   string    `json:"entity_id,omitempty" db:"entity_id" gorm:"type:varchar(100);index:idx_analytics_events_entity"`
	Metadata   string    `json:"metadata,omitempty" db:"metadata" gorm:"type:jsonb"`
	CreatedAt  time.Time `json:"created_at" db:"created_at" gorm:"default:CURRENT_TIMESTAMP;index:idx_analytics_events_name_created"`
}

func (AnalyticsEvent) TableName() string {
	return "analytics_events"
}

func (e *AnalyticsEvent) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(e.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for analytics_event: %w", err)
		}
		e.ID = id.String()
	}
	return nil
}

// TrackEventPayload payload masukan dari klien untuk mencatat suatu event telemetri
type TrackEventPayload struct {
	EventName  string                 `json:"event_name"`
	EntityType string                 `json:"entity_type,omitempty"`
	EntityID   string                 `json:"entity_id,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// AnalyticsWorkerMetric proyeksi metrik interaksi per mitra
type AnalyticsWorkerMetric struct {
	WorkerID       string `json:"worker_id"`
	WorkerSlug     string `json:"worker_slug"`
	WorkerName     string `json:"worker_name"`
	Zone           string `json:"zone"`
	WhatsAppClicks int64  `json:"whatsapp_clicks"`
	ProfileViews   int64  `json:"profile_views"`
}

// AnalyticsSearchMetric proyeksi metrik tren pencarian
type AnalyticsSearchMetric struct {
	Query    string `json:"query"`
	Location string `json:"location"`
	Count    int64  `json:"count"`
}

// AnalyticsCityMetric proyeksi metrik persebaran aktivitas pengguna per wilayah/kota ala Umami
type AnalyticsCityMetric struct {
	City           string  `json:"city"`
	TotalActivity  int64   `json:"total_activity"`
	ProfileViews   int64   `json:"profile_views"`
	Searches       int64   `json:"searches"`
	WhatsAppClicks int64   `json:"whatsapp_clicks"`
	Percentage     float64 `json:"percentage"`
}

// AdminAnalyticsSummary ringkasan agregasi data analitik platform untuk panel admin
type AdminAnalyticsSummary struct {
	TotalWhatsAppClicks    int64                   `json:"total_whatsapp_clicks"`
	TotalBookings          int64                   `json:"total_bookings"`
	TotalProfileViews      int64                   `json:"total_profile_views"`
	TotalSearches          int64                   `json:"total_searches"`
	TopWorkers             []AnalyticsWorkerMetric `json:"top_workers"`
	TopSearches            []AnalyticsSearchMetric `json:"top_searches"`
	TopCities              []AnalyticsCityMetric   `json:"top_cities"`
	BookingStatusBreakdown map[string]int64        `json:"booking_status_breakdown"`
	DaysRange              int                     `json:"days_range"`
}

// Helper method untuk parsing metadata string menjadi map
func (e *AnalyticsEvent) GetMetadataMap() map[string]interface{} {
	if strings.TrimSpace(e.Metadata) == "" {
		return make(map[string]interface{})
	}
	var res map[string]interface{}
	if err := json.Unmarshal([]byte(e.Metadata), &res); err != nil {
		return make(map[string]interface{})
	}
	return res
}

