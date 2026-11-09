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
	AccountStatusPending   = "PENDING"
)

// WorkerAccount merepresentasikan entitas akun login untuk pekerja maupun admin
type WorkerAccount struct {
	ID                  string     `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID            *string    `json:"worker_id,omitempty" db:"worker_id" gorm:"type:uuid;index"`
	Email               string     `json:"email" db:"email" gorm:"type:varchar(150)"`
	PhoneNumber         string     `json:"phone_number" db:"phone_number" gorm:"uniqueIndex;type:varchar(30)"`
	PasswordHash        string     `json:"-" db:"password_hash" gorm:"type:varchar(255);not null"`
	Role                string     `json:"role" db:"role" gorm:"type:varchar(20);not null;default:'WORKER'"`
	AccountStatus       string     `json:"account_status" db:"account_status" gorm:"type:varchar(20);not null;default:'ACTIVE'"`
	MustChangePassword  bool       `json:"must_change_password" db:"must_change_password" gorm:"type:boolean;not null;default:true"`
	FailedLoginAttempts int        `json:"-" db:"failed_login_attempts" gorm:"type:int;not null;default:0"`
	LockedUntil         *time.Time `json:"-" db:"locked_until" gorm:"type:timestamptz"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`

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
	AvatarURL          string  `json:"avatar_url,omitempty"`
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

// WorkerActivationToken merepresentasikan entitas token aktivasi sekali pakai untuk pendaftaran mitra via WhatsApp
type WorkerActivationToken struct {
	ID        string     `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID  string     `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	TokenHash string     `json:"token_hash" db:"token_hash" gorm:"type:varchar(64);not null;uniqueIndex"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at" gorm:"type:timestamptz;not null"`
	IsUsed    bool       `json:"is_used" db:"is_used" gorm:"type:boolean;not null;default:false"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at" gorm:"type:timestamptz"`
	CreatedAt time.Time  `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
}

func (WorkerActivationToken) TableName() string {
	return "worker_activation_tokens"
}

func (t *WorkerActivationToken) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(t.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker_activation_token: %w", err)
		}
		t.ID = id.String()
	}
	return nil
}

// AuthRegisterResponse payload data respons saat mitra berhasil mendaftar dan menunggu aktivasi manual WhatsApp
type AuthRegisterResponse struct {
	WorkerID            string `json:"worker_id"`
	Name                string `json:"name"`
	Slug                string `json:"slug"`
	WhatsAppNumber      string `json:"whatsapp_number"`
	AdminWhatsAppNumber string `json:"admin_whatsapp_number"`
	ActivationURL       string `json:"activation_url"`
	WhatsAppShareURL    string `json:"whatsapp_share_url"`
	WhatsAppWebURL      string `json:"whatsapp_web_url"`
	WhatsAppMessage     string `json:"whatsapp_message"`
	ExpiresInMinutes    int    `json:"expires_in_minutes"`
}

const (
	ResetTypePIN   = "RESET_PIN"
	ResetTypePhone = "CHANGE_PHONE"
)

// WorkerCredentialResetToken merepresentasikan entitas permohonan dan eksekusi reset kredensial (PIN/Nomor)
type WorkerCredentialResetToken struct {
	ID                 string     `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	AccountID          string     `json:"account_id" db:"account_id" gorm:"type:uuid;not null;index"`
	WorkerID           *string    `json:"worker_id,omitempty" db:"worker_id" gorm:"type:uuid;index"`
	RequestType        string     `json:"request_type" db:"request_type" gorm:"type:varchar(30);not null;default:'RESET_PIN'"`
	PhoneNumber        string     `json:"phone_number" db:"phone_number" gorm:"type:varchar(30);not null;index"`
	RequestTokenHash   string     `json:"request_token_hash" db:"request_token_hash" gorm:"type:varchar(64);not null;uniqueIndex"`
	RequestExpiresAt   time.Time  `json:"request_expires_at" db:"request_expires_at" gorm:"type:timestamptz;not null"`
	IsApproved         bool       `json:"is_approved" db:"is_approved" gorm:"type:boolean;not null;default:false"`
	ApprovedAt         *time.Time `json:"approved_at,omitempty" db:"approved_at" gorm:"type:timestamptz"`
	ApprovedByAdminID  *string    `json:"approved_by_admin_id,omitempty" db:"approved_by_admin_id" gorm:"type:uuid"`
	ExecutionTokenHash *string    `json:"execution_token_hash,omitempty" db:"execution_token_hash" gorm:"type:varchar(64);uniqueIndex"`
	ExecutionExpiresAt *time.Time `json:"execution_expires_at,omitempty" db:"execution_expires_at" gorm:"type:timestamptz"`
	IsUsed             bool       `json:"is_used" db:"is_used" gorm:"type:boolean;not null;default:false"`
	UsedAt             *time.Time `json:"used_at,omitempty" db:"used_at" gorm:"type:timestamptz"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`

	Account *WorkerAccount `json:"account,omitempty" gorm:"foreignKey:AccountID"`
	Worker  *Worker        `json:"worker,omitempty" gorm:"foreignKey:WorkerID"`
}

func (WorkerCredentialResetToken) TableName() string {
	return "worker_credential_reset_tokens"
}

func (t *WorkerCredentialResetToken) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(t.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker_credential_reset_token: %w", err)
		}
		t.ID = id.String()
	}
	return nil
}

// CredentialResetRequestPayload payload pengajuan reset PIN atau ganti nomor WhatsApp
type CredentialResetRequestPayload struct {
	PhoneNumber   string `json:"phone_number"`
	RequestType   string `json:"request_type"` // RESET_PIN atau CHANGE_PHONE
	AltchaPayload string `json:"altcha_payload"`
}

// CredentialResetRequestResponse respons pengajuan reset kredensial untuk WhatsApp admin
type CredentialResetRequestResponse struct {
	WorkerName          string `json:"worker_name"`
	PhoneNumber         string `json:"phone_number"`
	AdminWhatsAppNumber string `json:"admin_whatsapp_number"`
	WhatsAppShareURL    string `json:"whatsapp_share_url"`
	WhatsAppWebURL      string `json:"whatsapp_web_url"`
	WhatsAppMessage     string `json:"whatsapp_message"`
	ExpiresInMinutes    int    `json:"expires_in_minutes"`
}

// AdminResetApprovalView data pratinjau verifikasi permohonan untuk Admin
type AdminResetApprovalView struct {
	RequestID   string    `json:"request_id"`
	WorkerID    string    `json:"worker_id"`
	WorkerName  string    `json:"worker_name"`
	WorkerPhone string    `json:"worker_phone"`
	RequestType string    `json:"request_type"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	IsApproved  bool      `json:"is_approved"`
}

// AdminApproveResetPayload payload persetujuan permohonan oleh Admin
type AdminApproveResetPayload struct {
	RequestToken string `json:"request_token"`
}

// AdminApproveResetResponse respons hasil persetujuan yang berisi tautan eksekusi untuk mitra
type AdminApproveResetResponse struct {
	WorkerName          string `json:"worker_name"`
	WorkerWhatsAppNumber string `json:"worker_whatsapp_number"`
	WhatsAppShareURL    string `json:"whatsapp_share_url"`
	WhatsAppWebURL      string `json:"whatsapp_web_url"`
	WhatsAppMessage     string `json:"whatsapp_message"`
	ExecutionURL        string `json:"execution_url"`
	ExpiresInMinutes    int    `json:"expires_in_minutes"`
}

// ExecuteCredentialResetPayload payload eksekusi pembaruan PIN atau nomor WhatsApp baru oleh mitra
type ExecuteCredentialResetPayload struct {
	ExecutionToken string `json:"execution_token"`
	PhoneNumber    string `json:"phone_number"`
	NewPIN         string `json:"new_pin"`
	NewPhoneNumber string `json:"new_phone_number,omitempty"`
	AltchaPayload  string `json:"altcha_payload"`
}


