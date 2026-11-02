package domain

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Booking represents the database entity for a booking order
type Booking struct {
	ID          string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	BookingCode string    `json:"booking_code" db:"booking_code" gorm:"uniqueIndex;type:varchar(50);not null"`
	WorkerID    string    `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	ServiceID   string    `json:"service_id" db:"service_id" gorm:"type:uuid;not null;index"`
	ClientName  string    `json:"client_name" db:"client_name" gorm:"type:varchar(150);not null"`
	ClientPhone string    `json:"client_phone" db:"client_phone" gorm:"type:varchar(30);default:''"`
	ClientEmail string    `json:"client_email" db:"client_email" gorm:"type:varchar(150);default:''"`
	Location    string    `json:"location" db:"location" gorm:"type:text;not null"`
	Zone        string    `json:"zone" db:"zone" gorm:"type:varchar(100);not null"`
	BookingDate time.Time `json:"booking_date" db:"booking_date" gorm:"not null"`
	Notes       string    `json:"notes" db:"notes" gorm:"type:text;default:''"`
	TotalPrice  float64   `json:"total_price" db:"total_price" gorm:"type:numeric(12,2);not null"`
	Status      string    `json:"status" db:"status" gorm:"type:varchar(50);default:'PENDING';index"`
	CreatedAt   time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
	Worker      *Worker   `json:"worker,omitempty" gorm:"foreignKey:WorkerID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Service     *Service  `json:"service,omitempty" gorm:"foreignKey:ServiceID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}

func (Booking) TableName() string {
	return "bookings"
}

// BeforeCreate ensures ID is generated as UUIDv7 if not already specified
func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(b.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for booking: %w", err)
		}
		b.ID = id.String()
	}
	return nil
}

// CreateBookingRequest represents client payload to create a new booking
type CreateBookingRequest struct {
	WorkerID    string `json:"worker_id"`
	WorkerSlug  string `json:"worker_slug"`
	ServiceID   string `json:"service_id"`
	ClientName  string `json:"client_name"`
	ClientPhone string `json:"client_phone"`
	ClientEmail string `json:"client_email"`
	Location    string `json:"location"`
	Zone        string `json:"zone"`
	BookingDate string   `json:"booking_date"` // RFC3339 format, e.g. 2026-11-03T10:00:00Z; defaults to future date if omitted
	Notes       string   `json:"notes"`
	ClientLat   *float64 `json:"client_lat,omitempty"`
	ClientLng   *float64 `json:"client_lng,omitempty"`
}

// UnmarshalJSON supports both standard English keys and Indonesian aliases
func (r *CreateBookingRequest) UnmarshalJSON(data []byte) error {
	type Alias CreateBookingRequest
	aux := &struct {
		NamaKlien      string `json:"nama_klien"`
		Nama           string `json:"nama"`
		ClientNameAlt  string `json:"clientName"`
		Lokasi         string `json:"lokasi"`
		Alamat         string `json:"alamat"`
		Zona           string `json:"zona"`
		PilihanLayanan string `json:"pilihan_layanan"`
		LayananID      string `json:"layanan_id"`
		ServiceIDAlt   string `json:"serviceId"`
		PekerjaID      string `json:"pekerja_id"`
		PekerjaSlug    string `json:"pekerja_slug"`
		WorkerIDAlt    string `json:"workerId"`
		WorkerSlugAlt  string `json:"workerSlug"`
		Telepon        string `json:"telepon"`
		NomorTelepon   string `json:"nomor_telepon"`
		Phone          string `json:"phone"`
		ClientPhoneAlt string `json:"clientPhone"`
		EmailAlt       string `json:"email"`
		ClientEmailAlt string `json:"clientEmail"`
		TanggalBooking string `json:"tanggal_booking"`
		BookingDateAlt string   `json:"bookingDate"`
		Jadwal         string   `json:"jadwal"`
		Catatan        string   `json:"catatan"`
		ClientLatAlt   *float64 `json:"clientLat"`
		Latitude       *float64 `json:"lat"`
		ClientLngAlt   *float64 `json:"clientLng"`
		Longitude      *float64 `json:"lng"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if r.ClientName == "" {
		if aux.NamaKlien != "" {
			r.ClientName = aux.NamaKlien
		} else if aux.Nama != "" {
			r.ClientName = aux.Nama
		} else if aux.ClientNameAlt != "" {
			r.ClientName = aux.ClientNameAlt
		}
	}
	if r.Location == "" {
		if aux.Lokasi != "" {
			r.Location = aux.Lokasi
		} else if aux.Alamat != "" {
			r.Location = aux.Alamat
		}
	}
	if r.Zone == "" {
		if aux.Zona != "" {
			r.Zone = aux.Zona
		}
	}
	if r.ServiceID == "" {
		if aux.PilihanLayanan != "" {
			r.ServiceID = aux.PilihanLayanan
		} else if aux.LayananID != "" {
			r.ServiceID = aux.LayananID
		} else if aux.ServiceIDAlt != "" {
			r.ServiceID = aux.ServiceIDAlt
		}
	}
	if r.WorkerID == "" {
		if aux.PekerjaID != "" {
			r.WorkerID = aux.PekerjaID
		} else if aux.WorkerIDAlt != "" {
			r.WorkerID = aux.WorkerIDAlt
		}
	}
	if r.WorkerSlug == "" {
		if aux.PekerjaSlug != "" {
			r.WorkerSlug = aux.PekerjaSlug
		} else if aux.WorkerSlugAlt != "" {
			r.WorkerSlug = aux.WorkerSlugAlt
		}
	}
	if r.ClientPhone == "" {
		if aux.NomorTelepon != "" {
			r.ClientPhone = aux.NomorTelepon
		} else if aux.Telepon != "" {
			r.ClientPhone = aux.Telepon
		} else if aux.Phone != "" {
			r.ClientPhone = aux.Phone
		} else if aux.ClientPhoneAlt != "" {
			r.ClientPhone = aux.ClientPhoneAlt
		}
	}
	if r.ClientEmail == "" {
		if aux.EmailAlt != "" {
			r.ClientEmail = aux.EmailAlt
		} else if aux.ClientEmailAlt != "" {
			r.ClientEmail = aux.ClientEmailAlt
		}
	}
	if r.BookingDate == "" {
		if aux.TanggalBooking != "" {
			r.BookingDate = aux.TanggalBooking
		} else if aux.Jadwal != "" {
			r.BookingDate = aux.Jadwal
		} else if aux.BookingDateAlt != "" {
			r.BookingDate = aux.BookingDateAlt
		}
	}
	if r.Notes == "" && aux.Catatan != "" {
		r.Notes = aux.Catatan
	}
	if r.ClientLat == nil {
		if aux.ClientLatAlt != nil {
			r.ClientLat = aux.ClientLatAlt
		} else if aux.Latitude != nil {
			r.ClientLat = aux.Latitude
		}
	}
	if r.ClientLng == nil {
		if aux.ClientLngAlt != nil {
			r.ClientLng = aux.ClientLngAlt
		} else if aux.Longitude != nil {
			r.ClientLng = aux.Longitude
		}
	}

	return nil
}

// Validate checks request validity and parses the booking date
func (r *CreateBookingRequest) Validate() (time.Time, error) {
	if strings.TrimSpace(r.ClientName) == "" {
		return time.Time{}, fmt.Errorf("%w: nama klien (client_name) wajib diisi", ErrInvalidInput)
	}
	if strings.TrimSpace(r.ServiceID) == "" {
		return time.Time{}, fmt.Errorf("%w: pilihan layanan (service_id) wajib diisi", ErrInvalidInput)
	}
	if strings.TrimSpace(r.Location) == "" && strings.TrimSpace(r.Zone) == "" {
		return time.Time{}, fmt.Errorf("%w: lokasi atau zona wajib diisi", ErrInvalidInput)
	}

	if strings.TrimSpace(r.Location) == "" {
		r.Location = strings.TrimSpace(r.Zone)
	}
	if strings.TrimSpace(r.Zone) == "" {
		r.Zone = strings.TrimSpace(r.Location)
	}

	trimmedDate := strings.TrimSpace(r.BookingDate)
	if trimmedDate == "" {
		// Default to tomorrow 10:00 AM UTC
		defaultDate := time.Now().Add(24 * time.Hour).Truncate(time.Hour)
		return defaultDate, nil
	}

	parsedDate, err := parseBookingDate(trimmedDate)
	if err != nil {
		return time.Time{}, fmt.Errorf("%w: format booking_date tidak valid, gunakan format RFC3339 (contoh: 2026-11-03T10:00:00Z)", ErrInvalidInput)
	}

	// Allow 15 minutes grace period for network latency or clock skew
	if parsedDate.Before(time.Now().Add(-15 * time.Minute)) {
		return time.Time{}, ErrPastBookingDate
	}

	return parsedDate, nil
}

func parseBookingDate(val string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02T15:04",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, val); err == nil {
			return t, nil
		}
	}
	return time.Time{}, errors.New("format tanggal tidak dikenali")
}

// PublicBookingResponse represents the public response payload for a confirmed booking creation
type PublicBookingResponse struct {
	BookingCode  string    `json:"booking_code"`
	WorkerID     string    `json:"worker_id"`
	WorkerName   string    `json:"worker_name"`
	ServiceID    string    `json:"service_id"`
	ServiceName  string    `json:"service_name"`
	ClientName   string    `json:"client_name"`
	Location     string    `json:"location"`
	Zone         string    `json:"zone"`
	BookingDate  time.Time `json:"booking_date"`
	Notes        string    `json:"notes,omitempty"`
	TotalPrice   float64   `json:"total_price"`
	TransportFee float64   `json:"transport_fee,omitempty"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// CalculateFeeRequest represents the payload to calculate booking fee based on distance
type CalculateFeeRequest struct {
	WorkerID   string   `json:"worker_id"`
	WorkerSlug string   `json:"worker_slug"`
	ServiceID  string   `json:"service_id"`
	ClientLat  *float64 `json:"client_lat"`
	ClientLng  *float64 `json:"client_lng"`
}

// UnmarshalJSON supports Indonesian aliases and camelCase
func (r *CalculateFeeRequest) UnmarshalJSON(data []byte) error {
	type Alias CalculateFeeRequest
	aux := &struct {
		WorkerIDAlt    string   `json:"workerId"`
		PekerjaID      string   `json:"pekerja_id"`
		WorkerSlugAlt  string   `json:"workerSlug"`
		PekerjaSlug    string   `json:"pekerja_slug"`
		ServiceIDAlt   string   `json:"serviceId"`
		LayananID      string   `json:"layanan_id"`
		PilihanLayanan string   `json:"pilihan_layanan"`
		ClientLatAlt   *float64 `json:"clientLat"`
		Latitude       *float64 `json:"lat"`
		ClientLngAlt   *float64 `json:"clientLng"`
		Longitude      *float64 `json:"lng"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if r.WorkerID == "" {
		if aux.WorkerIDAlt != "" {
			r.WorkerID = aux.WorkerIDAlt
		} else if aux.PekerjaID != "" {
			r.WorkerID = aux.PekerjaID
		}
	}
	if r.WorkerSlug == "" {
		if aux.WorkerSlugAlt != "" {
			r.WorkerSlug = aux.WorkerSlugAlt
		} else if aux.PekerjaSlug != "" {
			r.WorkerSlug = aux.PekerjaSlug
		}
	}
	if r.ServiceID == "" {
		if aux.ServiceIDAlt != "" {
			r.ServiceID = aux.ServiceIDAlt
		} else if aux.LayananID != "" {
			r.ServiceID = aux.LayananID
		} else if aux.PilihanLayanan != "" {
			r.ServiceID = aux.PilihanLayanan
		}
	}
	if r.ClientLat == nil {
		if aux.ClientLatAlt != nil {
			r.ClientLat = aux.ClientLatAlt
		} else if aux.Latitude != nil {
			r.ClientLat = aux.Latitude
		}
	}
	if r.ClientLng == nil {
		if aux.ClientLngAlt != nil {
			r.ClientLng = aux.ClientLngAlt
		} else if aux.Longitude != nil {
			r.ClientLng = aux.Longitude
		}
	}

	return nil
}

// FeeCalculationResponse represents the response containing pricing breakdown and radius validation
type FeeCalculationResponse struct {
	DistanceKM     float64 `json:"distance_km"`
	MaxRadiusKM    float64 `json:"max_radius_km"`
	FreeRadiusKM   float64 `json:"free_radius_km"`
	ServicePrice   float64 `json:"service_price"`
	ExtraFeePerKM  int     `json:"extra_fee_per_km"`
	TransportFee   float64 `json:"transport_fee"`
	TotalPrice     float64 `json:"total_price"`
	IsWithinRadius bool    `json:"is_within_radius"`
}

