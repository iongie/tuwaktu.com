package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tuwaktu.com/internal/pkg/sanitize"
)

// Review represents client feedback and rating for a completed booking
type Review struct {
	ID          string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	BookingID   string    `json:"booking_id" db:"booking_id" gorm:"type:uuid;not null;uniqueIndex"`
	WorkerID    string    `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	ClientName  string    `json:"client_name" db:"client_name" gorm:"type:varchar(150);not null"`
	IsAnonymous bool      `json:"is_anonymous" db:"is_anonymous" gorm:"type:boolean;default:false"`
	Rating      int       `json:"rating" db:"rating" gorm:"type:int;not null;index"`
	Comment     string    `json:"comment" db:"comment" gorm:"type:text;not null"`
	CreatedAt   time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`

	Booking *Booking `json:"booking,omitempty" gorm:"foreignKey:BookingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Worker  *Worker  `json:"worker,omitempty" gorm:"foreignKey:WorkerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (Review) TableName() string {
	return "reviews"
}

// BeforeCreate generates a UUIDv7 if ID is empty
func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(r.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return err
		}
		r.ID = id.String()
	}
	return nil
}

// ReviewInvitationDetail represents safe booking information exposed to the client review page
type ReviewInvitationDetail struct {
	BookingCode  string    `json:"booking_code"`
	WorkerName   string    `json:"worker_name"`
	WorkerSlug   string    `json:"worker_slug"`
	WorkerAvatar string    `json:"worker_avatar"`
	WorkerZone   string    `json:"worker_zone"`
	ServiceName  string    `json:"service_name"`
	BookingDate  time.Time `json:"booking_date"`
	ClientName   string    `json:"client_name"`
	IsReviewed   bool      `json:"is_reviewed"`
}

// SubmitReviewRequest represents payload submitted by the client
type SubmitReviewRequest struct {
	BookingCode string `json:"booking_code"`
	Token       string `json:"token"`
	Rating      int    `json:"rating"`
	Comment     string `json:"comment"`
	IsAnonymous bool   `json:"is_anonymous"`
}

// Validate checks request validity
func (req *SubmitReviewRequest) Validate() error {
	if strings.TrimSpace(req.BookingCode) == "" {
		return ErrInvalidInput
	}
	if strings.TrimSpace(req.Token) == "" {
		return ErrInvalidReviewToken
	}
	if req.Rating < 1 || req.Rating > 5 {
		return ErrInvalidRating
	}
	cleanedComment := sanitize.SanitizeText(req.Comment, 1000)
	if len([]rune(cleanedComment)) < 5 {
		return ErrReviewCommentTooShort
	}
	if len([]rune(cleanedComment)) > 1000 {
		return ErrInvalidInput
	}
	req.Comment = cleanedComment
	return nil
}

// PublicReviewItem represents a review displayed publicly on the worker profile
type PublicReviewItem struct {
	ID                string    `json:"id"`
	ClientDisplayName string    `json:"client_display_name"`
	Rating            int       `json:"rating"`
	Comment           string    `json:"comment"`
	ServiceName       string    `json:"service_name"`
	CreatedAt         time.Time `json:"created_at"`
}

// FormatClientDisplayName anonymizes client name if required
func FormatClientDisplayName(rawName string, isAnonymous bool) string {
	trimmed := strings.TrimSpace(rawName)
	if !isAnonymous || trimmed == "" {
		if trimmed == "" {
			return "Pelanggan Terverifikasi"
		}
		return trimmed
	}
	words := strings.Fields(trimmed)
	if len(words) == 1 {
		runes := []rune(words[0])
		if len(runes) <= 2 {
			return words[0] + " (Pelanggan)"
		}
		return string(runes[0]) + "***"
	}
	// "Budi Santoso" -> "Budi S."
	first := words[0]
	lastRune := []rune(words[len(words)-1])[0]
	return first + " " + string(lastRune) + "."
}

// WorkerDashboardReviewItem represents a review item displayed on worker dashboard
type WorkerDashboardReviewItem struct {
	ID          string    `json:"id"`
	BookingCode string    `json:"booking_code"`
	ClientName  string    `json:"client_name"`
	IsAnonymous bool      `json:"is_anonymous"`
	Rating      int       `json:"rating"`
	Comment     string    `json:"comment"`
	ServiceName string    `json:"service_name"`
	BookingDate time.Time `json:"booking_date"`
	CreatedAt   time.Time `json:"created_at"`
}

