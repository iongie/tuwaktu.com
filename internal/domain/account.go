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
	RoleAdmin  = "ADMIN"
	RoleWorker = "WORKER"

	AccountStatusActive    = "ACTIVE"
	AccountStatusSuspended = "SUSPENDED"
)

// WorkerAccount merepresentasikan entitas akun login untuk pekerja maupun admin
type WorkerAccount struct {
	ID                 string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID           *string   `json:"worker_id,omitempty" db:"worker_id" gorm:"type:uuid;index"`
	Email              string    `json:"email" db:"email" gorm:"uniqueIndex;type:varchar(150);not null"`
	PhoneNumber        string    `json:"phone_number" db:"phone_number" gorm:"uniqueIndex;type:varchar(30)"`
	PasswordHash       string    `json:"-" db:"password_hash" gorm:"type:varchar(255);not null"`
	Role               string    `json:"role" db:"role" gorm:"type:varchar(20);not null;default:'WORKER'"`
	AccountStatus      string    `json:"account_status" db:"account_status" gorm:"type:varchar(20);not null;default:'ACTIVE'"`
	MustChangePassword bool      `json:"must_change_password" db:"must_change_password" gorm:"type:boolean;not null;default:true"`
	CreatedAt          time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`

	// Relasi opsional ke entitas Worker
	Worker *Worker `json:"worker,omitempty" gorm:"foreignKey:WorkerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (WorkerAccount) TableName() string {
	return "worker_accounts"
}

func (a *WorkerAccount) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(a.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker_account: %w", err)
		}
		a.ID = id.String()
	}
	return nil
}

// AdminCreateWorkerPayload adalah payload untuk pembuatan mitra baru dari panel admin
type AdminCreateWorkerPayload struct {
	Name              string   `json:"name"`
	Bio               string   `json:"bio"`
	Zone              string   `json:"zone"`
	BasePrice         float64  `json:"base_price"`
	RateType          string   `json:"rate_type"`
	Lat               *float64 `json:"lat,omitempty"`
	Lng               *float64 `json:"lng,omitempty"`
	MaxRadiusKM       float64  `json:"max_radius_km"`
	FreeRadiusKM      float64  `json:"free_radius_km"`
	ExtraFeePerKM     int      `json:"extra_fee_per_km"`
	PhoneNumber       string   `json:"phone_number"`
	WhatsAppNumber    string   `json:"whatsapp_number"`
	Email             string   `json:"email"`
	Address           string   `json:"address"`
	TemporaryPassword string   `json:"temporary_password,omitempty"`
}

// AdminWorkerCreatedResponse mengembalikan hasil onboarding mitra beserta kredensial sementara
type AdminWorkerCreatedResponse struct {
	Account           WorkerAccount `json:"account"`
	Worker            Worker        `json:"worker"`
	TemporaryPassword string        `json:"temporary_password"`
	InvitationText    string        `json:"invitation_text"`
}

// AdminWorkerListItem adalah model proyeksi data mitra untuk tabel panel admin
type AdminWorkerListItem struct {
	AccountID          string    `json:"account_id"`
	WorkerID           string    `json:"worker_id"`
	Slug               string    `json:"slug"`
	Name               string    `json:"name"`
	Bio                string    `json:"bio"`
	Zone               string    `json:"zone"`
	BasePrice          float64   `json:"base_price"`
	RateType           string    `json:"rate_type"`
	AvatarURL          string    `json:"avatar_url"`
	Rating             float64   `json:"rating"`
	ReviewCount        int       `json:"review_count"`
	PhoneNumber        string    `json:"phone_number"`
	WhatsAppNumber     string    `json:"whatsapp_number"`
	Email              string    `json:"email"`
	Role               string    `json:"role"`
	AccountStatus      string    `json:"account_status"`
	MustChangePassword bool      `json:"must_change_password"`
	CreatedAt          time.Time `json:"created_at"`
}

// AdminStats merepresentasikan agregasi metrik statistik platform untuk panel admin
type AdminStats struct {
	TotalWorkers     int64 `json:"total_workers"`
	ActiveWorkers    int64 `json:"active_workers"`
	SuspendedWorkers int64 `json:"suspended_workers"`
	TotalBookings    int64 `json:"total_bookings"`
}

// AdminUpdateWorkerStatusPayload payload untuk mengubah status aktif/nonaktif mitra
type AdminUpdateWorkerStatusPayload struct {
	Status string `json:"status"`
}

// AuthLoginPayload payload untuk login mitra atau admin
type AuthLoginPayload struct {
	Identifier    string `json:"identifier"` // Email atau nomor WhatsApp
	Password      string `json:"password"`
	AltchaPayload string `json:"altcha_payload,omitempty"`
}

func (p *AuthLoginPayload) UnmarshalJSON(data []byte) error {
	type Alias AuthLoginPayload
	aux := &struct {
		AltchaPayloadAlt string `json:"altchaPayload"`
		AltchaAlt        string `json:"altcha"`
		*Alias
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.AltchaPayload == "" {
		if aux.AltchaPayloadAlt != "" {
			p.AltchaPayload = aux.AltchaPayloadAlt
		} else if aux.AltchaAlt != "" {
			p.AltchaPayload = aux.AltchaAlt
		}
	}
	return nil
}

// AuthUserSession informasi sesi pengguna yang terautentikasi
type AuthUserSession struct {
	ID                 string  `json:"id"`
	WorkerID           *string `json:"worker_id,omitempty"`
	WorkerSlug         string  `json:"worker_slug,omitempty"`
	Slug               string  `json:"slug,omitempty"`
	Name               string  `json:"name"`
	Email              string  `json:"email"`
	PhoneNumber        string  `json:"phone_number"`
	Role               string  `json:"role"`
	AccountStatus      string  `json:"account_status"`
	MustChangePassword bool    `json:"must_change_password"`
}

// AuthLoginResponse respons setelah autentikasi sukses
type AuthLoginResponse struct {
	Token   string          `json:"token"`
	Session AuthUserSession `json:"session"`
}

// AuthRegisterPayload payload untuk pendaftaran mandiri mitra baru
type AuthRegisterPayload struct {
	Name           string `json:"name"`
	FullName       string `json:"full_name,omitempty"`
	SpecialtyID    string `json:"specialty_id"`
	SpecialtyLabel string `json:"specialty_label"`
	PhoneNumber    string `json:"phone_number"`
	WhatsAppNumber string `json:"whatsapp_number,omitempty"`
	Zone           string `json:"zone"`
	Basecamp       string `json:"basecamp,omitempty"`
	Slug           string `json:"slug"`
	PIN            string `json:"pin"`
	Password       string `json:"password,omitempty"`
	AltchaPayload  string `json:"altcha_payload,omitempty"`
}

// UnmarshalJSON menangani deserialisasi fleksibel dengan berbagai variasi nama field (snake_case, camelCase, alias)
func (p *AuthRegisterPayload) UnmarshalJSON(data []byte) error {
	type Alias AuthRegisterPayload
	aux := &struct {
		FullNameAlt       string `json:"fullName"`
		SpecialtyIDAlt    string `json:"specialtyId"`
		SpecialtyLabelAlt string `json:"specialtyLabel"`
		PhoneNumberAlt    string `json:"phoneNumber"`
		WaNumberAlt       string `json:"waNumber"`
		WhatsAppNumberAlt string `json:"whatsAppNumber"`
		CustomSlugAlt     string `json:"customSlug"`
		WorkerPinAlt      string `json:"workerPin"`
		AltchaPayloadAlt  string `json:"altchaPayload"`
		AltchaAlt         string `json:"altcha"`
		*Alias
	}{
		Alias: (*Alias)(p),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if p.AltchaPayload == "" {
		if aux.AltchaPayloadAlt != "" {
			p.AltchaPayload = aux.AltchaPayloadAlt
		} else if aux.AltchaAlt != "" {
			p.AltchaPayload = aux.AltchaAlt
		}
	}

	if p.Name == "" {
		if p.FullName != "" {
			p.Name = p.FullName
		} else if aux.FullNameAlt != "" {
			p.Name = aux.FullNameAlt
		}
	}
	if p.FullName == "" {
		p.FullName = p.Name
	}

	if p.SpecialtyID == "" && aux.SpecialtyIDAlt != "" {
		p.SpecialtyID = aux.SpecialtyIDAlt
	}
	if p.SpecialtyLabel == "" && aux.SpecialtyLabelAlt != "" {
		p.SpecialtyLabel = aux.SpecialtyLabelAlt
	}

	if p.WhatsAppNumber == "" {
		if aux.WaNumberAlt != "" {
			p.WhatsAppNumber = aux.WaNumberAlt
		} else if aux.WhatsAppNumberAlt != "" {
			p.WhatsAppNumber = aux.WhatsAppNumberAlt
		} else if p.PhoneNumber != "" {
			p.WhatsAppNumber = p.PhoneNumber
		} else if aux.PhoneNumberAlt != "" {
			p.WhatsAppNumber = aux.PhoneNumberAlt
		}
	}
	if p.PhoneNumber == "" {
		if aux.PhoneNumberAlt != "" {
			p.PhoneNumber = aux.PhoneNumberAlt
		} else if p.WhatsAppNumber != "" {
			p.PhoneNumber = p.WhatsAppNumber
		}
	}

	if p.Zone == "" {
		if p.Basecamp != "" {
			p.Zone = p.Basecamp
		}
	}
	if p.Basecamp == "" {
		p.Basecamp = p.Zone
	}

	if p.Slug == "" && aux.CustomSlugAlt != "" {
		p.Slug = aux.CustomSlugAlt
	}

	if p.PIN == "" {
		if p.Password != "" {
			p.PIN = p.Password
		} else if aux.WorkerPinAlt != "" {
			p.PIN = aux.WorkerPinAlt
		}
	}
	if p.Password == "" && p.PIN != "" {
		p.Password = p.PIN
	}

	return nil
}

