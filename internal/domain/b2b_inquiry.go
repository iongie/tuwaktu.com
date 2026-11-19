package domain

import (
	"encoding/json"
	"time"
)

const (
	B2BPropertyKos        = "KOS"
	B2BPropertyKantor     = "KANTOR"
	B2BPropertyRukoKafe   = "RUKO_KAFE"
	B2BPropertyApartemen  = "APARTEMEN"
	B2BPropertyLainnya    = "LAINNYA"

	B2BPlanRutinProperti = "RUTIN_PROPERTI"
	B2BPlanMultiLokasi   = "MULTI_LOKASI"

	B2BFreqMingguan    = "MINGGUAN"
	B2BFreqBulanan     = "BULANAN"
	B2BFreqDwiBulanan  = "DWI_BULANAN"
	B2BFreqTribulanan  = "TRIBULANAN"

	B2BStatusNew          = "NEW"
	B2BStatusContacted    = "CONTACTED"
	B2BStatusProposalSent = "PROPOSAL_SENT"
	B2BStatusActive       = "ACTIVE"
	B2BStatusPaused       = "PAUSED"
	B2BStatusRejected     = "REJECTED"

	B2BPaymentUnpaid              = "UNPAID"
	B2BPaymentWaitingConfirmation = "WAITING_CONFIRMATION"
	B2BPaymentPaid                = "PAID"
	B2BPaymentOverdue             = "OVERDUE"
)

type B2BPropertyInquiry struct {
	ID                 string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	InquiryCode        string     `gorm:"type:varchar(32);uniqueIndex;not null" json:"inquiry_code"`
	BusinessName       string     `gorm:"type:varchar(150);not null" json:"business_name"`
	PropertyType       string     `gorm:"type:varchar(40);not null" json:"property_type"`
	ContactName        string     `gorm:"type:varchar(120);not null" json:"contact_name"`
	ContactWhatsApp    string     `gorm:"column:contact_whatsapp;type:varchar(30);not null" json:"contact_whatsapp"`
	ContactEmail       string     `gorm:"type:varchar(150);not null;default:''" json:"contact_email"`
	CityZone           string     `gorm:"type:varchar(100);not null" json:"city_zone"`
	PropertyAddress    string     `gorm:"type:text;not null" json:"property_address"`
	PlanTier           string     `gorm:"type:varchar(40);not null" json:"plan_tier"`
	ServiceFocus       string     `gorm:"type:varchar(120);not null" json:"service_focus"`
	UnitCount          int        `gorm:"not null" json:"unit_count"`
	VisitFrequency     string     `gorm:"type:varchar(30);not null" json:"visit_frequency"`
	PreferredStartDate *time.Time `gorm:"column:preferred_start_date;type:date" json:"-"`
	PreferredStartStr  string     `gorm:"-" json:"-"`
	Notes              string     `gorm:"type:text;not null;default:''" json:"notes"`
	EstimatedMonthlyFee float64   `gorm:"type:numeric(12,2);not null;default:0" json:"estimated_monthly_fee"`
	AgreedMonthlyFee   *float64   `gorm:"type:numeric(12,2)" json:"agreed_monthly_fee,omitempty"`
	Status             string     `gorm:"type:varchar(30);not null;default:'NEW'" json:"status"`
	PaymentStatus      string     `gorm:"type:varchar(30);not null;default:'UNPAID'" json:"payment_status"`
	PaymentReference   string     `gorm:"type:varchar(120);not null;default:''" json:"payment_reference"`
	PaidAt             *time.Time `json:"paid_at,omitempty"`
	AdminNotes         string     `gorm:"type:text;not null;default:''" json:"admin_notes"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func (B2BPropertyInquiry) TableName() string {
	return "b2b_property_inquiries"
}

func (b B2BPropertyInquiry) MarshalJSON() ([]byte, error) {
	type Alias B2BPropertyInquiry
	dateStr := b.PreferredStartStr
	if dateStr == "" && b.PreferredStartDate != nil && !b.PreferredStartDate.IsZero() {
		dateStr = b.PreferredStartDate.Format("2006-01-02")
	}
	var ptrDate *string
	if dateStr != "" {
		ptrDate = &dateStr
	}
	return json.Marshal(&struct {
		Alias
		PreferredStartDate *string `json:"preferred_start_date,omitempty"`
	}{
		Alias:              (Alias)(b),
		PreferredStartDate: ptrDate,
	})
}

type CreateB2BInquiryPayload struct {
	BusinessName       string `json:"business_name"`
	PropertyType       string `json:"property_type"`
	ContactName        string `json:"contact_name"`
	ContactWhatsApp    string `json:"contact_whatsapp"`
	ContactEmail       string `json:"contact_email"`
	CityZone           string `json:"city_zone"`
	PropertyAddress    string `json:"property_address"`
	PlanTier           string `json:"plan_tier"`
	ServiceFocus       string `json:"service_focus"`
	UnitCount          int    `json:"unit_count"`
	VisitFrequency     string `json:"visit_frequency"`
	PreferredStartDate string `json:"preferred_start_date"`
	Notes              string `json:"notes"`
	AltchaPayload      string `json:"altcha_payload"`
}

type CreateB2BInquiryResponse struct {
	Inquiry             *B2BPropertyInquiry `json:"inquiry"`
	AdminWhatsAppNumber string              `json:"admin_whatsapp_number"`
	WhatsAppShareURL    string              `json:"whatsapp_share_url"`
	WhatsAppWebURL      string              `json:"whatsapp_web_url"`
	WhatsAppMessage     string              `json:"whatsapp_message"`
}

type UpdateB2BInquiryAdminPayload struct {
	Status           *string  `json:"status"`
	PaymentStatus    *string  `json:"payment_status"`
	AgreedMonthlyFee *float64 `json:"agreed_monthly_fee"`
	PaymentReference *string  `json:"payment_reference"`
	AdminNotes       *string  `json:"admin_notes"`
}

type B2BInquiryFilter struct {
	Status        string
	PaymentStatus string
	Query         string
}

type B2BInquirySummaryStats struct {
	TotalCount           int64   `json:"total_count"`
	PendingFollowUpCount int64   `json:"pending_follow_up_count"`
	ActiveContractCount  int64   `json:"active_contract_count"`
	PaidMonthlyRevenue   float64 `json:"paid_monthly_revenue"`
}

type AdminB2BInquiryListResponse struct {
	Items []B2BPropertyInquiry   `json:"items"`
	Stats B2BInquirySummaryStats `json:"stats"`
}

func IsValidB2BPropertyType(val string) bool {
	switch val {
	case B2BPropertyKos, B2BPropertyKantor, B2BPropertyRukoKafe, B2BPropertyApartemen, B2BPropertyLainnya:
		return true
	default:
		return false
	}
}

func IsValidB2BPlanTier(val string) bool {
	switch val {
	case B2BPlanRutinProperti, B2BPlanMultiLokasi:
		return true
	default:
		return false
	}
}

func IsValidB2BVisitFrequency(val string) bool {
	switch val {
	case B2BFreqMingguan, B2BFreqBulanan, B2BFreqDwiBulanan, B2BFreqTribulanan:
		return true
	default:
		return false
	}
}

func IsValidB2BInquiryStatus(val string) bool {
	switch val {
	case B2BStatusNew, B2BStatusContacted, B2BStatusProposalSent, B2BStatusActive, B2BStatusPaused, B2BStatusRejected:
		return true
	default:
		return false
	}
}

func IsValidB2BPaymentStatus(val string) bool {
	switch val {
	case B2BPaymentUnpaid, B2BPaymentWaitingConfirmation, B2BPaymentPaid, B2BPaymentOverdue:
		return true
	default:
		return false
	}
}
