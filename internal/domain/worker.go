package domain

import "time"

// Worker represents the full database entity for a worker, containing sensitive/private info
type Worker struct {
	ID          string  `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	Slug        string  `json:"slug" db:"slug" gorm:"uniqueIndex;type:varchar(100);not null"`
	Name        string  `json:"name" db:"name" gorm:"type:varchar(150);not null"`
	Bio         string  `json:"bio" db:"bio" gorm:"type:text"`
	AvatarURL   string  `json:"avatar_url" db:"avatar_url" gorm:"type:varchar(255)"`
	Rating      float64 `json:"rating" db:"rating" gorm:"type:numeric(3,2);default:0.00"`
	ReviewCount int     `json:"review_count" db:"review_count" gorm:"type:int;default:0"`
	Zone        string  `json:"zone" db:"zone" gorm:"type:varchar(100);not null"`
	// Sensitive private fields - MUST NEVER be exposed in public endpoints
	PhoneNumber string    `json:"phone_number" db:"phone_number" gorm:"type:varchar(30);not null;default:''"`
	Email       string    `json:"email" db:"email" gorm:"type:varchar(150);not null;default:''"`
	Address     string    `json:"address" db:"address" gorm:"type:text;default:''"`
	IsActive    bool      `json:"is_active" db:"is_active" gorm:"index"`
	CreatedAt   time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
	Services    []Service `json:"services,omitempty" gorm:"foreignKey:WorkerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (Worker) TableName() string {
	return "workers"
}

// PublicWorkerProfile represents the sanitized public view of a worker
// strictly excluding sensitive private data like phone number, email, address, etc.
type PublicWorkerProfile struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Bio         string          `json:"bio"`
	AvatarURL   string          `json:"avatar_url"`
	Rating      float64         `json:"rating"`
	ReviewCount int             `json:"review_count"`
	Zone        string          `json:"zone"`
	Services    []PublicService `json:"services"`
}

// ToPublic creates a PublicWorkerProfile ensuring no sensitive data is leaked
func (w *Worker) ToPublic(services []PublicService) PublicWorkerProfile {
	if services == nil {
		services = []PublicService{}
	}
	return PublicWorkerProfile{
		ID:          w.ID,
		Slug:        w.Slug,
		Name:        w.Name,
		Bio:         w.Bio,
		AvatarURL:   w.AvatarURL,
		Rating:      w.Rating,
		ReviewCount: w.ReviewCount,
		Zone:        w.Zone,
		Services:    services,
	}
}
