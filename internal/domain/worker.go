package domain

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

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
	// Rates fields
	BasePrice float64 `json:"base_price" db:"base_price" gorm:"type:numeric(12,2);default:0.00"`
	RateType  string  `json:"rate_type" db:"rate_type" gorm:"type:varchar(20);default:'HOURLY'"`
	// Location & radius fields
	Lat           *float64 `json:"lat" db:"lat" gorm:"type:numeric(10,7)"`
	Lng           *float64 `json:"lng" db:"lng" gorm:"type:numeric(10,7)"`
	MaxRadiusKM   float64  `json:"max_radius_km" db:"max_radius_km" gorm:"type:numeric(6,2);default:10.00"`
	FreeRadiusKM  float64  `json:"free_radius_km" db:"free_radius_km" gorm:"type:numeric(6,2);default:3.00"`
	ExtraFeePerKM int      `json:"extra_fee_per_km" db:"extra_fee_per_km" gorm:"type:int;default:0"`
	// Sensitive private fields - MUST NEVER be exposed in public endpoints
	PhoneNumber    string    `json:"phone_number" db:"phone_number" gorm:"type:varchar(30);not null;default:''"`
	WhatsAppNumber string    `json:"whatsapp_number" db:"whatsapp_number" gorm:"column:whatsapp_number;type:varchar(30);default:''"`
	Email          string    `json:"email" db:"email" gorm:"type:varchar(150);not null;default:''"`
	Address        string    `json:"address" db:"address" gorm:"type:text;default:''"`
	IsActive       bool      `json:"is_active" db:"is_active" gorm:"index"`
	CreatedAt      time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
	Services       []Service `json:"services,omitempty" gorm:"foreignKey:WorkerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (Worker) TableName() string {
	return "workers"
}

// BeforeCreate ensures ID is generated as UUIDv7 if not already specified
func (w *Worker) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(w.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker: %w", err)
		}
		w.ID = id.String()
	}
	return nil
}

// PublicWorkerProfile represents the sanitized public view of a worker
// strictly excluding sensitive private data like phone number, email, address, etc.
// whatsapp_number is exposed intentionally for WhatsApp booking redirects.
type PublicWorkerProfile struct {
	ID             string          `json:"id"`
	Slug           string          `json:"slug"`
	Name           string          `json:"name"`
	Bio            string          `json:"bio"`
	AvatarURL      string          `json:"avatar_url"`
	Rating         float64         `json:"rating"`
	ReviewCount    int             `json:"review_count"`
	Zone           string          `json:"zone"`
	BasePrice      float64         `json:"base_price"`
	RateType       string          `json:"rate_type"`
	Lat            *float64        `json:"lat,omitempty"`
	Lng            *float64        `json:"lng,omitempty"`
	MaxRadiusKM    float64         `json:"max_radius_km"`
	FreeRadiusKM   float64         `json:"free_radius_km"`
	ExtraFeePerKM  int             `json:"extra_fee_per_km"`
	WhatsAppNumber string          `json:"whatsapp_number,omitempty"`
	Services       []PublicService `json:"services"`
}

// EffectiveBasePrice menghitung tarif dasar terendah dari katalog layanan aktif pekerja
func (w *Worker) EffectiveBasePrice() float64 {
	minPrice := 0.0
	for _, s := range w.Services {
		if s.IsActive && s.Price > 0 {
			if minPrice == 0 || s.Price < minPrice {
				minPrice = s.Price
			}
		}
	}
	if minPrice > 0 {
		return minPrice
	}
	return w.BasePrice
}

// ToPublic creates a PublicWorkerProfile ensuring no sensitive data is leaked
func (w *Worker) ToPublic(services []PublicService) PublicWorkerProfile {
	if services == nil {
		services = []PublicService{}
	}
	rateType := strings.ToUpper(strings.TrimSpace(w.RateType))
	if rateType == "" {
		rateType = "HOURLY"
	}
	maxRadius := w.MaxRadiusKM
	if maxRadius <= 0 {
		maxRadius = 10.0
	}
	freeRadius := w.FreeRadiusKM
	if freeRadius < 0 {
		freeRadius = 3.0
	}
	basePrice := w.BasePrice
	if basePrice == 0 {
		if len(services) > 0 {
			minPrice := 0.0
			for _, s := range services {
				if s.Price > 0 && (minPrice == 0 || s.Price < minPrice) {
					minPrice = s.Price
				}
			}
			if minPrice > 0 {
				basePrice = minPrice
			}
		} else if len(w.Services) > 0 {
			basePrice = w.EffectiveBasePrice()
		}
	}

	return PublicWorkerProfile{
		ID:             w.ID,
		Slug:           w.Slug,
		Name:           w.Name,
		Bio:            w.Bio,
		AvatarURL:      w.AvatarURL,
		Rating:         w.Rating,
		ReviewCount:    w.ReviewCount,
		Zone:           w.Zone,
		BasePrice:      basePrice,
		RateType:       rateType,
		Lat:            w.Lat,
		Lng:            w.Lng,
		MaxRadiusKM:    maxRadius,
		FreeRadiusKM:   freeRadius,
		ExtraFeePerKM:  w.ExtraFeePerKM,
		WhatsAppNumber: w.WhatsAppNumber,
		Services:       services,
	}
}

// WorkerProfileUpdate represents the payload to update worker profile details
type WorkerProfileUpdate struct {
	WorkerID       string `json:"worker_id,omitempty"`
	ID             string `json:"id,omitempty"`
	Name           string `json:"name"`
	Bio            string `json:"bio"`
	AvatarURL      string `json:"avatar_url"`
	Zone           string `json:"zone"`
	PhoneNumber    string `json:"phone_number,omitempty"`
	WhatsAppNumber string `json:"whatsapp_number,omitempty"`
	Email          string `json:"email,omitempty"`
	Address        string `json:"address,omitempty"`
}

// UnmarshalJSON supports snake_case, camelCase, and Indonesian aliases
func (u *WorkerProfileUpdate) UnmarshalJSON(data []byte) error {
	type Alias WorkerProfileUpdate
	aux := &struct {
		WorkerIDAlt   string `json:"workerId"`
		PekerjaID     string `json:"pekerja_id"`
		PekerjaSlug   string `json:"pekerja_slug"`
		WorkerSlug    string `json:"worker_slug"`
		Nama          string `json:"nama"`
		NamaPekerja   string `json:"nama_pekerja"`
		WhatsAppAlt   string `json:"whatsappNumber"`
		NomorWA       string `json:"nomor_wa"`
		NomorWhatsApp string `json:"nomor_whatsapp"`
		WA            string `json:"wa"`
		WhatsApp      string `json:"whatsapp"`
		Telepon       string `json:"telepon"`
		NomorTelepon  string `json:"nomor_telepon"`
		PhoneAlt      string `json:"phone"`
		Alamat        string `json:"alamat"`
		Zona          string `json:"zona"`
		*Alias
	}{
		Alias: (*Alias)(u),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if u.WorkerID == "" {
		if aux.WorkerIDAlt != "" {
			u.WorkerID = aux.WorkerIDAlt
		} else if aux.PekerjaID != "" {
			u.WorkerID = aux.PekerjaID
		} else if aux.WorkerSlug != "" {
			u.WorkerID = aux.WorkerSlug
		} else if aux.PekerjaSlug != "" {
			u.WorkerID = aux.PekerjaSlug
		}
	}

	if u.Name == "" {
		if aux.Nama != "" {
			u.Name = aux.Nama
		} else if aux.NamaPekerja != "" {
			u.Name = aux.NamaPekerja
		}
	}

	if u.WhatsAppNumber == "" {
		if aux.WhatsAppAlt != "" {
			u.WhatsAppNumber = aux.WhatsAppAlt
		} else if aux.NomorWhatsApp != "" {
			u.WhatsAppNumber = aux.NomorWhatsApp
		} else if aux.NomorWA != "" {
			u.WhatsAppNumber = aux.NomorWA
		} else if aux.WhatsApp != "" {
			u.WhatsAppNumber = aux.WhatsApp
		} else if aux.WA != "" {
			u.WhatsAppNumber = aux.WA
		}
	}

	if u.PhoneNumber == "" {
		if aux.NomorTelepon != "" {
			u.PhoneNumber = aux.NomorTelepon
		} else if aux.Telepon != "" {
			u.PhoneNumber = aux.Telepon
		} else if aux.PhoneAlt != "" {
			u.PhoneNumber = aux.PhoneAlt
		}
	}

	if u.Zone == "" && aux.Zona != "" {
		u.Zone = aux.Zona
	}
	if u.Address == "" && aux.Alamat != "" {
		u.Address = aux.Alamat
	}

	return nil
}

// SanitizeAndValidateWhatsAppNumber validates and sanitizes a WhatsApp phone number.
// Strips non-digit characters (+, -, space, parens, etc.).
// Ensures the number starts with a country code (not '0') and contains 10-16 digits.
func SanitizeAndValidateWhatsAppNumber(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", fmt.Errorf("%w: nomor WhatsApp wajib diisi", ErrInvalidInput)
	}

	if strings.Count(trimmed, "+") > 1 || (strings.Contains(trimmed, "+") && !strings.HasPrefix(trimmed, "+")) {
		return "", fmt.Errorf("%w: tanda plus (+) hanya boleh berada di awal nomor sebagai awalan kode negara", ErrInvalidInput)
	}

	var digits strings.Builder
	for _, ch := range trimmed {
		if ch >= '0' && ch <= '9' {
			digits.WriteRune(ch)
		} else if ch != '+' && ch != '-' && ch != ' ' && ch != '.' && ch != '(' && ch != ')' {
			return "", fmt.Errorf("%w: nomor WhatsApp hanya boleh berisi angka dan kode negara (contoh: 62812...)", ErrInvalidInput)
		}
	}

	clean := digits.String()
	if len(clean) == 0 {
		return "", fmt.Errorf("%w: nomor WhatsApp wajib diisi dengan angka", ErrInvalidInput)
	}

	if strings.HasPrefix(clean, "0") {
		return "", fmt.Errorf("%w: nomor WhatsApp wajib diawali kode negara (contoh: 62812...) tanpa awalan 0", ErrInvalidInput)
	}

	if len(clean) < 10 || len(clean) > 16 {
		return "", fmt.Errorf("%w: nomor WhatsApp harus terdiri dari 10 hingga 16 digit angka dengan kode negara", ErrInvalidInput)
	}

	return clean, nil
}

// WorkerRateUpdate represents the payload to update worker rates
type WorkerRateUpdate struct {
	WorkerID  string  `json:"worker_id"`
	ID        string  `json:"id,omitempty"`
	BasePrice float64 `json:"base_price"`
	RateType  string  `json:"rate_type"`
}

// WorkerLocationSettingsUpdate represents the payload to update worker location and radius settings
type WorkerLocationSettingsUpdate struct {
	WorkerID      string   `json:"worker_id"`
	ID            string   `json:"id,omitempty"`
	Lat           *float64 `json:"lat"`
	Lng           *float64 `json:"lng"`
	MaxRadiusKM   float64  `json:"max_radius_km"`
	FreeRadiusKM  float64  `json:"free_radius_km"`
	ExtraFeePerKM int      `json:"extra_fee_per_km"`
}

// UnmarshalJSON supports snake_case, camelCase, and Indonesian field aliases
func (u *WorkerLocationSettingsUpdate) UnmarshalJSON(data []byte) error {
	type Alias WorkerLocationSettingsUpdate
	aux := &struct {
		WorkerIDAlt     string   `json:"workerId"`
		PekerjaID       string   `json:"pekerja_id"`
		PekerjaSlug     string   `json:"pekerja_slug"`
		WorkerSlug      string   `json:"worker_slug"`
		Latitude        *float64 `json:"latitude"`
		Longitude       *float64 `json:"longitude"`
		MaxRadiusAlt    *float64 `json:"maxRadiusKm"`
		JarakMaksimal   *float64 `json:"jarak_maksimal_km"`
		FreeRadiusAlt   *float64 `json:"freeRadiusKm"`
		RadiusGratis    *float64 `json:"radius_gratis_km"`
		ExtraFeeAlt     *int     `json:"extraFeePerKm"`
		TarifPerKM      *int     `json:"tarif_per_km"`
		OngkirPerKM     *int     `json:"ongkir_per_km"`
		*Alias
	}{
		Alias: (*Alias)(u),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if u.WorkerID == "" {
		if aux.WorkerIDAlt != "" {
			u.WorkerID = aux.WorkerIDAlt
		} else if aux.PekerjaID != "" {
			u.WorkerID = aux.PekerjaID
		} else if aux.WorkerSlug != "" {
			u.WorkerID = aux.WorkerSlug
		} else if aux.PekerjaSlug != "" {
			u.WorkerID = aux.PekerjaSlug
		}
	}

	if u.Lat == nil && aux.Latitude != nil {
		u.Lat = aux.Latitude
	}
	if u.Lng == nil && aux.Longitude != nil {
		u.Lng = aux.Longitude
	}

	if u.MaxRadiusKM == 0 {
		if aux.MaxRadiusAlt != nil {
			u.MaxRadiusKM = *aux.MaxRadiusAlt
		} else if aux.JarakMaksimal != nil {
			u.MaxRadiusKM = *aux.JarakMaksimal
		}
	}

	if u.FreeRadiusKM == 0 {
		if aux.FreeRadiusAlt != nil {
			u.FreeRadiusKM = *aux.FreeRadiusAlt
		} else if aux.RadiusGratis != nil {
			u.FreeRadiusKM = *aux.RadiusGratis
		}
	}

	if u.ExtraFeePerKM == 0 {
		if aux.ExtraFeeAlt != nil {
			u.ExtraFeePerKM = *aux.ExtraFeeAlt
		} else if aux.TarifPerKM != nil {
			u.ExtraFeePerKM = *aux.TarifPerKM
		} else if aux.OngkirPerKM != nil {
			u.ExtraFeePerKM = *aux.OngkirPerKM
		}
	}

	return nil
}
