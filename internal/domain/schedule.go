package domain

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Slot Type constants and standard slot time ranges
const (
	SlotMorning   = "MORNING"
	SlotAfternoon = "AFTERNOON"
	SlotEvening   = "EVENING"

	SlotMorningStart = "08:00"
	SlotMorningEnd   = "11:30"

	SlotAfternoonStart = "13:00"
	SlotAfternoonEnd   = "16:30"

	SlotEveningStart = "17:00"
	SlotEveningEnd   = "20:30"

	TransitBufferDuration = 60 * time.Minute
)

// IndonesianDayNames: index corresponds to time.Weekday (0=Minggu, 1=Senin, ..., 6=Sabtu)
var IndonesianDayNames = []string{
	"Minggu",
	"Senin",
	"Selasa",
	"Rabu",
	"Kamis",
	"Jumat",
	"Sabtu",
}

// GetDayName returns the Indonesian day name for day_of_week index (0-6)
func GetDayName(day int) string {
	if day >= 0 && day < len(IndonesianDayNames) {
		return IndonesianDayNames[day]
	}
	return "Hari Tidak Valid"
}

// WorkerSchedule represents the database entity for a worker's schedule configuration
type WorkerSchedule struct {
	ID            string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID      string    `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	DayOfWeek     int       `json:"day_of_week" db:"day_of_week" gorm:"type:int;not null"`
	DayName       string    `json:"day_name" gorm:"-"`
	IsActive      bool      `json:"is_active" db:"is_active" gorm:"type:boolean;not null"`
	SlotMorning   bool      `json:"slot_morning" db:"slot_morning" gorm:"type:boolean;not null"`
	SlotAfternoon bool      `json:"slot_afternoon" db:"slot_afternoon" gorm:"type:boolean;not null"`
	SlotEvening   bool      `json:"slot_evening" db:"slot_evening" gorm:"type:boolean;not null"`
	CreatedAt     time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
}

func (WorkerSchedule) TableName() string {
	return "worker_schedules"
}

// BeforeCreate ensures ID is generated as UUIDv7 if not already specified
func (s *WorkerSchedule) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(s.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker_schedule: %w", err)
		}
		s.ID = id.String()
	}
	return nil
}

// WorkerScheduleItem represents an input/output payload for a specific day's schedule
type WorkerScheduleItem struct {
	DayOfWeek     int    `json:"day_of_week"`
	DayName       string `json:"day_name,omitempty"`
	IsActive      bool   `json:"is_active"`
	SlotMorning   bool   `json:"slot_morning"`
	SlotAfternoon bool   `json:"slot_afternoon"`
	SlotEvening   bool   `json:"slot_evening"`
}

func (item *WorkerScheduleItem) UnmarshalJSON(data []byte) error {
	type Alias WorkerScheduleItem
	aux := &struct {
		DayOfWeekAlt     *int  `json:"dayOfWeek"`
		Hari             *int  `json:"hari"`
		HariKe           *int  `json:"hari_ke"`
		IsActiveAlt      *bool `json:"isActive"`
		Aktif            *bool `json:"aktif"`
		SlotMorningAlt   *bool `json:"slotMorning"`
		Pagi             *bool `json:"pagi"`
		SlotPagi         *bool `json:"slot_pagi"`
		SlotAfternoonAlt *bool `json:"slotAfternoon"`
		Siang            *bool `json:"siang"`
		SlotSiang        *bool `json:"slot_siang"`
		SlotEveningAlt   *bool `json:"slotEvening"`
		Sore             *bool `json:"sore"`
		SlotSore         *bool `json:"slot_sore"`
		*Alias
	}{
		Alias: (*Alias)(item),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	if aux.DayOfWeekAlt != nil {
		item.DayOfWeek = *aux.DayOfWeekAlt
	} else if aux.Hari != nil {
		item.DayOfWeek = *aux.Hari
	} else if aux.HariKe != nil {
		item.DayOfWeek = *aux.HariKe
	}

	if aux.IsActiveAlt != nil {
		item.IsActive = *aux.IsActiveAlt
	} else if aux.Aktif != nil {
		item.IsActive = *aux.Aktif
	}

	if aux.SlotMorningAlt != nil {
		item.SlotMorning = *aux.SlotMorningAlt
	} else if aux.Pagi != nil {
		item.SlotMorning = *aux.Pagi
	} else if aux.SlotPagi != nil {
		item.SlotMorning = *aux.SlotPagi
	}

	if aux.SlotAfternoonAlt != nil {
		item.SlotAfternoon = *aux.SlotAfternoonAlt
	} else if aux.Siang != nil {
		item.SlotAfternoon = *aux.Siang
	} else if aux.SlotSiang != nil {
		item.SlotAfternoon = *aux.SlotSiang
	}

	if aux.SlotEveningAlt != nil {
		item.SlotEvening = *aux.SlotEveningAlt
	} else if aux.Sore != nil {
		item.SlotEvening = *aux.Sore
	} else if aux.SlotSore != nil {
		item.SlotEvening = *aux.SlotSore
	}

	return nil
}

// UpdateWorkerSchedulesRequest represents the request body to update schedules
type UpdateWorkerSchedulesRequest struct {
	WorkerID  string               `json:"worker_id"`
	Schedules []WorkerScheduleItem `json:"schedules"`
}

func (r *UpdateWorkerSchedulesRequest) UnmarshalJSON(data []byte) error {
	// Support receiving a JSON array directly: [ {day_of_week: ...}, ... ]
	trimmed := strings.TrimSpace(string(data))
	if strings.HasPrefix(trimmed, "[") {
		var items []WorkerScheduleItem
		if err := json.Unmarshal(data, &items); err != nil {
			return err
		}
		r.Schedules = items
		return nil
	}

	type Alias UpdateWorkerSchedulesRequest
	aux := &struct {
		WorkerIDAlt string               `json:"workerId"`
		PekerjaID   string               `json:"pekerja_id"`
		Jadwal      []WorkerScheduleItem `json:"jadwal"`
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

	if len(r.Schedules) == 0 && len(aux.Jadwal) > 0 {
		r.Schedules = aux.Jadwal
	}

	return nil
}

// AvailableTimeSlot represents the status and timing for a single slot in AvailableSlotsResponse
type AvailableTimeSlot struct {
	SlotType  string `json:"slot_type"`  // MORNING, AFTERNOON, EVENING
	Name      string `json:"name"`       // Pagi, Siang, Sore
	StartTime string `json:"start_time"` // 08:00
	EndTime   string `json:"end_time"`   // 11:30
	Available bool   `json:"available"`  // true / false
	Reason    string `json:"reason"`     // descriptive reason if unavailable, or "Tersedia"
}

// AvailableSlotsResponse represents the full response for GET /api/v1/public/workers/:slug/available-slots
type AvailableSlotsResponse struct {
	WorkerID     string              `json:"worker_id"`
	WorkerSlug   string              `json:"worker_slug"`
	WorkerName   string              `json:"worker_name"`
	Date         string              `json:"date"` // YYYY-MM-DD
	DayOfWeek    int                 `json:"day_of_week"`
	DayName      string              `json:"day_name"`
	IsWorkingDay bool                `json:"is_working_day"`
	Slots        []AvailableTimeSlot `json:"slots"`
}

// WorkerDateOverride represents a date-specific override for full-day holidays or locked slots
type WorkerDateOverride struct {
	ID            string    `json:"id" db:"id" gorm:"primaryKey;type:uuid"`
	WorkerID      string    `json:"worker_id" db:"worker_id" gorm:"type:uuid;not null;index"`
	OverrideDate  time.Time `json:"-" db:"override_date" gorm:"type:date;not null"`
	DateStr       string    `json:"override_date" gorm:"-"`
	IsHoliday     bool      `json:"is_holiday" db:"is_holiday" gorm:"type:boolean;not null;default:false"`
	IsSlot1Locked bool      `json:"is_slot1_locked" db:"is_slot1_locked" gorm:"type:boolean;not null;default:false"`
	IsSlot2Locked bool      `json:"is_slot2_locked" db:"is_slot2_locked" gorm:"type:boolean;not null;default:false"`
	IsSlot3Locked bool      `json:"is_slot3_locked" db:"is_slot3_locked" gorm:"type:boolean;not null;default:false"`
	Note          string    `json:"note,omitempty" db:"note" gorm:"type:varchar(255)"`
	CreatedAt     time.Time `json:"created_at" db:"created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at;default:CURRENT_TIMESTAMP"`
}

func (WorkerDateOverride) TableName() string {
	return "worker_date_overrides"
}

// BeforeCreate ensures ID is generated as UUIDv7 if not already specified
func (o *WorkerDateOverride) BeforeCreate(tx *gorm.DB) error {
	if strings.TrimSpace(o.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("generating uuidv7 for worker_date_override: %w", err)
		}
		o.ID = id.String()
	}
	return nil
}

// AfterFind formats OverrideDate to DateStr as YYYY-MM-DD
func (o *WorkerDateOverride) AfterFind(tx *gorm.DB) error {
	if !o.OverrideDate.IsZero() {
		o.DateStr = o.OverrideDate.Format("2006-01-02")
	}
	return nil
}

func (o WorkerDateOverride) MarshalJSON() ([]byte, error) {
	type Alias WorkerDateOverride
	dateStr := o.DateStr
	if dateStr == "" && !o.OverrideDate.IsZero() {
		dateStr = o.OverrideDate.Format("2006-01-02")
	}
	return json.Marshal(&struct {
		Alias
		OverrideDate string `json:"override_date"`
	}{
		Alias:        (Alias)(o),
		OverrideDate: dateStr,
	})
}

// UpsertWorkerDateOverrideRequest represents request body to create/update date override
type UpsertWorkerDateOverrideRequest struct {
	WorkerID      string `json:"worker_id"`
	OverrideDate  string `json:"override_date"`
	IsHoliday     bool   `json:"is_holiday"`
	IsSlot1Locked bool   `json:"is_slot1_locked"`
	IsSlot2Locked bool   `json:"is_slot2_locked"`
	IsSlot3Locked bool   `json:"is_slot3_locked"`
	Note          string `json:"note,omitempty"`
}

