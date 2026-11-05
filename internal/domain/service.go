package domain

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Service represents the full database entity for a worker service
type Service struct {
	ID              string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID        string    `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	Name            string    `json:"name" db:"name" gorm:"type:varchar(150);not null"`
	Description     string    `json:"description" db:"description" gorm:"type:text"`
	Price           float64   `json:"price" db:"price" gorm:"type:numeric(12,2);not null"`
	BasePrice       float64   `json:"base_price" db:"base_price" gorm:"type:numeric(12,2);default:0.00"`
	RateType        string    `json:"rate_type" db:"rate_type" gorm:"type:varchar(20);default:'HOURLY'"`
	DurationMinutes int       `json:"duration_minutes" db:"duration_minutes" gorm:"type:int;not null;default:60"`
	IsActive        bool      `json:"is_active" db:"is_active" gorm:"index"`
	CreatedAt       time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
}

func (Service) TableName() string {
	return "services"
}

// BeforeCreate ensures ID is generated as UUIDv7 if not already specified
func (s *Service) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(s.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for service: %w", err)
		}
		s.ID = id.String()
	}
	return nil
}

// PublicService represents the public facing service information (name, description, price, duration)
type PublicService struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	Price           float64 `json:"price"`
	BasePrice       float64 `json:"base_price"`
	RateType        string  `json:"rate_type"`
	DurationMinutes int     `json:"duration_minutes"`
}

// ToPublic converts a Service domain model to PublicService
func (s *Service) ToPublic() PublicService {
	rateType := strings.ToUpper(strings.TrimSpace(s.RateType))
	if rateType == "" {
		rateType = "HOURLY"
	}
	basePrice := s.BasePrice
	if basePrice == 0 && s.Price > 0 {
		basePrice = s.Price
	}
	return PublicService{
		ID:              s.ID,
		Name:            s.Name,
		Description:     s.Description,
		Price:           s.Price,
		BasePrice:       basePrice,
		RateType:        rateType,
		DurationMinutes: s.DurationMinutes,
	}
}

// CreateServicePayload merepresentasikan payload request untuk membuat paket layanan pekerja baru
type CreateServicePayload struct {
	WorkerID        string  `json:"worker_id,omitempty"`
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	Price           float64 `json:"price"`
	BasePrice       float64 `json:"base_price,omitempty"`
	RateType        string  `json:"rate_type,omitempty"`
	DurationMinutes int     `json:"duration_minutes"`
	IsActive        *bool   `json:"is_active,omitempty"`
}

// UpdateServicePayload merepresentasikan payload request untuk memperbarui paket layanan pekerja
type UpdateServicePayload struct {
	WorkerID        string   `json:"worker_id,omitempty"`
	Name            *string  `json:"name,omitempty"`
	Description     *string  `json:"description,omitempty"`
	Price           *float64 `json:"price,omitempty"`
	BasePrice       *float64 `json:"base_price,omitempty"`
	RateType        *string  `json:"rate_type,omitempty"`
	DurationMinutes *int     `json:"duration_minutes,omitempty"`
	IsActive        *bool    `json:"is_active,omitempty"`
}
