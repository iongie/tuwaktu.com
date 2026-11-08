package domain

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Category merepresentasikan entitas kategori keahlian teknisi pada database
type Category struct {
	ID              string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	Slug            string    `json:"slug" db:"slug" gorm:"uniqueIndex;type:varchar(100);not null"`
	Name            string    `json:"name" db:"name" gorm:"type:varchar(150);not null"`
	Description     string    `json:"description" db:"description" gorm:"type:text"`
	Icon            string    `json:"icon" db:"icon" gorm:"type:varchar(100);not null;default:'build'"`
	StartingPrice   float64   `json:"starting_price" db:"starting_price" gorm:"type:numeric(12,2);not null;default:0.00"`
	PriceUnit       string    `json:"price_unit" db:"price_unit" gorm:"type:varchar(50);not null;default:'kunjungan'"`
	AvailabilityTag string    `json:"availability_tag" db:"availability_tag" gorm:"type:varchar(100);default:'Tersedia di Katalog'"`
	HighlightTag    string    `json:"highlight_tag" db:"highlight_tag" gorm:"type:varchar(100);default:''"`
	IsActive        bool      `json:"is_active" db:"is_active" gorm:"index;default:true"`
	SortOrder       int       `json:"sort_order" db:"sort_order" gorm:"index;default:0"`
	CreatedAt       time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
}

func (Category) TableName() string {
	return "categories"
}

// BeforeCreate memastikan ID terisi UUIDv7 jika belum ada
func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(c.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for category: %w", err)
		}
		c.ID = id.String()
	}
	return nil
}

// PublicCategory merepresentasikan proyeksi publik kategori untuk halaman beranda
type PublicCategory struct {
	ID              string  `json:"id"`
	Slug            string  `json:"slug"`
	Name            string  `json:"name"`
	Title           string  `json:"title"` // Alias kompatibel untuk frontend
	Description     string  `json:"description"`
	Icon            string  `json:"icon"`
	StartingPrice   float64 `json:"starting_price"`
	PriceUnit       string  `json:"price_unit"`
	AvailabilityTag string  `json:"availability_tag"`
	HighlightTag    string  `json:"highlight_tag"`
	SpecialistCount int     `json:"specialist_count,omitempty"`
}

// ToPublic memproyeksikan entitas Category menjadi PublicCategory
func (c *Category) ToPublic() PublicCategory {
	return PublicCategory{
		ID:              c.ID,
		Slug:            c.Slug,
		Name:            c.Name,
		Title:           c.Name,
		Description:     c.Description,
		Icon:            c.Icon,
		StartingPrice:   c.StartingPrice,
		PriceUnit:       c.PriceUnit,
		AvailabilityTag: c.AvailabilityTag,
		HighlightTag:    c.HighlightTag,
		SpecialistCount: 0,
	}
}

// CreateCategoryPayload adalah payload pembuatan kategori baru
type CreateCategoryPayload struct {
	Name            string   `json:"name"`
	Slug            string   `json:"slug,omitempty"`
	Description     string   `json:"description"`
	Icon            string   `json:"icon"`
	StartingPrice   *float64 `json:"starting_price"`
	PriceUnit       string   `json:"price_unit"`
	AvailabilityTag string   `json:"availability_tag"`
	HighlightTag    string   `json:"highlight_tag"`
	IsActive        *bool    `json:"is_active"`
	SortOrder       *int     `json:"sort_order"`
}

// UpdateCategoryPayload adalah payload pembaruan kategori
type UpdateCategoryPayload struct {
	Name            *string  `json:"name,omitempty"`
	Slug            *string  `json:"slug,omitempty"`
	Description     *string  `json:"description,omitempty"`
	Icon            *string  `json:"icon,omitempty"`
	StartingPrice   *float64 `json:"starting_price,omitempty"`
	PriceUnit       *string  `json:"price_unit,omitempty"`
	AvailabilityTag *string  `json:"availability_tag,omitempty"`
	HighlightTag    *string  `json:"highlight_tag,omitempty"`
	IsActive        *bool    `json:"is_active,omitempty"`
	SortOrder       *int     `json:"sort_order,omitempty"`
}
