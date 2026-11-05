package domain_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
)

func TestWorker_ToPublic(t *testing.T) {
	worker := &domain.Worker{
		ID:          "worker-1",
		Slug:        "test-slug",
		Name:        "Test Name",
		Bio:         "Bio test",
		AvatarURL:   "https://example.com/avatar.jpg",
		Rating:      4.75,
		ReviewCount: 10,
		Zone:        "Jakarta Pusat",
		PhoneNumber: "+62812345678",
		Email:       "test@worker.com",
		Address:     "Private Address",
	}

	services := []domain.PublicService{
		{
			ID:              "srv-1",
			Name:            "Srv Name",
			Description:     "Srv Desc",
			Price:           50000,
			DurationMinutes: 30,
		},
	}

	pub := worker.ToPublic(services)
	assert.Equal(t, worker.ID, pub.ID)
	assert.Equal(t, worker.Slug, pub.Slug)
	assert.Equal(t, worker.Name, pub.Name)
	assert.Equal(t, worker.Bio, pub.Bio)
	assert.Equal(t, worker.AvatarURL, pub.AvatarURL)
	assert.Equal(t, worker.Rating, pub.Rating)
	assert.Equal(t, worker.ReviewCount, pub.ReviewCount)
	assert.Equal(t, worker.Zone, pub.Zone)
	assert.Equal(t, services, pub.Services)

	// Test nil services produces empty slice not nil
	pubNil := worker.ToPublic(nil)
	assert.NotNil(t, pubNil.Services)
	assert.Empty(t, pubNil.Services)
}

func TestService_ToPublic(t *testing.T) {
	srv := &domain.Service{
		ID:              "srv-1",
		WorkerID:        "w-1",
		Name:            "Cleaning",
		Description:     "Full cleaning",
		Price:           120000,
		DurationMinutes: 90,
		IsActive:        true,
	}

	pub := srv.ToPublic()
	assert.Equal(t, srv.ID, pub.ID)
	assert.Equal(t, srv.Name, pub.Name)
	assert.Equal(t, srv.Description, pub.Description)
	assert.Equal(t, srv.Price, pub.Price)
	assert.Equal(t, srv.DurationMinutes, pub.DurationMinutes)
}

func TestCreateBookingRequest_Validate(t *testing.T) {
	futureRFC3339 := time.Now().Add(10 * time.Hour).Format(time.RFC3339)
	futureStandard := time.Now().Add(10 * time.Hour).Format("2006-01-02 15:04:05")

	validReq := domain.CreateBookingRequest{
		WorkerID:    "w-1",
		ServiceID:   "s-1",
		ClientName:  "Andi",
		ClientPhone: "08123456789",
		Location:    "Jl. Sudirman",
		Zone:        "Jakarta",
		BookingDate: futureRFC3339,
	}

	t.Run("valid RFC3339 date", func(t *testing.T) {
		parsed, err := validReq.Validate()
		require.NoError(t, err)
		assert.False(t, parsed.IsZero())
	})

	t.Run("valid alternative date format", func(t *testing.T) {
		req := validReq
		req.BookingDate = futureStandard
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.False(t, parsed.IsZero())
	})

	t.Run("valid date-only format", func(t *testing.T) {
		req := validReq
		req.BookingDate = "2028-12-01"
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.False(t, parsed.IsZero())
	})

	t.Run("empty client_name fails", func(t *testing.T) {
		req := validReq
		req.ClientName = "  "
		_, err := req.Validate()
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("empty service_id fails", func(t *testing.T) {
		req := validReq
		req.ServiceID = "  "
		_, err := req.Validate()
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("empty location and zone fails", func(t *testing.T) {
		req := validReq
		req.Location = ""
		req.Zone = ""
		_, err := req.Validate()
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("location provided without zone falls back gracefully", func(t *testing.T) {
		req := validReq
		req.Location = "Jl. Thamrin"
		req.Zone = ""
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.False(t, parsed.IsZero())
		assert.Equal(t, "Jl. Thamrin", req.Zone)
	})

	t.Run("zone provided without location falls back gracefully", func(t *testing.T) {
		req := validReq
		req.Location = ""
		req.Zone = "Jakarta Selatan"
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.False(t, parsed.IsZero())
		assert.Equal(t, "Jakarta Selatan", req.Location)
	})

	t.Run("empty booking date defaults to future date", func(t *testing.T) {
		req := validReq
		req.BookingDate = ""
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.True(t, parsed.After(time.Now()))
	})

	t.Run("past booking date (> 15 min ago) rejected", func(t *testing.T) {
		req := validReq
		req.BookingDate = time.Now().Add(-2 * time.Hour).Format(time.RFC3339)
		_, err := req.Validate()
		assert.ErrorIs(t, err, domain.ErrPastBookingDate)
	})

	t.Run("Indonesian aliases unmarshaling", func(t *testing.T) {
		jsonPayload := `{"nama_klien":"Budi Santoso","lokasi":"Jakarta Selatan","zona":"Jakarta Selatan","pilihan_layanan":"srv-999"}`
		var req domain.CreateBookingRequest
		err := json.Unmarshal([]byte(jsonPayload), &req)
		require.NoError(t, err)
		assert.Equal(t, "Budi Santoso", req.ClientName)
		assert.Equal(t, "Jakarta Selatan", req.Location)
		assert.Equal(t, "Jakarta Selatan", req.Zone)
		assert.Equal(t, "srv-999", req.ServiceID)
	})
}

func TestEntities_UUIDv7BeforeCreate(t *testing.T) {
	t.Run("Worker BeforeCreate generates valid UUIDv7 when ID is empty", func(t *testing.T) {
		w := &domain.Worker{
			Name: "Worker Test",
		}
		err := w.BeforeCreate(nil)
		require.NoError(t, err)
		require.NotEmpty(t, w.ID)

		parsed, err := uuid.Parse(w.ID)
		require.NoError(t, err)
		assert.Equal(t, uuid.Version(7), parsed.Version())
	})

	t.Run("Worker BeforeCreate preserves existing ID", func(t *testing.T) {
		customID := "custom-worker-id"
		w := &domain.Worker{
			ID:   customID,
			Name: "Worker Test",
		}
		err := w.BeforeCreate(nil)
		require.NoError(t, err)
		assert.Equal(t, customID, w.ID)
	})

	t.Run("Service BeforeCreate generates valid UUIDv7 when ID is empty", func(t *testing.T) {
		s := &domain.Service{
			Name: "Service Test",
		}
		err := s.BeforeCreate(nil)
		require.NoError(t, err)
		require.NotEmpty(t, s.ID)

		parsed, err := uuid.Parse(s.ID)
		require.NoError(t, err)
		assert.Equal(t, uuid.Version(7), parsed.Version())
	})

	t.Run("Booking BeforeCreate generates valid UUIDv7 when ID is empty", func(t *testing.T) {
		b := &domain.Booking{
			ClientName: "Booking Test",
		}
		err := b.BeforeCreate(nil)
		require.NoError(t, err)
		require.NotEmpty(t, b.ID)

		parsed, err := uuid.Parse(b.ID)
		require.NoError(t, err)
		assert.Equal(t, uuid.Version(7), parsed.Version())
	})

	t.Run("WorkerSchedule BeforeCreate generates valid UUIDv7 when ID is empty", func(t *testing.T) {
		sc := &domain.WorkerSchedule{
			WorkerID:  "w-123",
			DayOfWeek: 1,
		}
		err := sc.BeforeCreate(nil)
		require.NoError(t, err)
		require.NotEmpty(t, sc.ID)

		parsed, err := uuid.Parse(sc.ID)
		require.NoError(t, err)
		assert.Equal(t, uuid.Version(7), parsed.Version())
	})

	t.Run("WorkerSchedule BeforeCreate preserves existing ID", func(t *testing.T) {
		customID := "custom-schedule-id"
		sc := &domain.WorkerSchedule{
			ID:        customID,
			WorkerID:  "w-123",
			DayOfWeek: 1,
		}
		err := sc.BeforeCreate(nil)
		require.NoError(t, err)
		assert.Equal(t, customID, sc.ID)
	})
}

func TestCreateBookingRequest_ISOAndWIBDateParsing(t *testing.T) {
	validReq := domain.CreateBookingRequest{
		ClientName: "Andi",
		ServiceID:  "srv-1",
		Location:   "Jakarta",
	}

	t.Run("parses ISO format without timezone into WIB location", func(t *testing.T) {
		req := validReq
		// 2026-11-20T08:00:00 without offset
		req.BookingDate = "2026-11-20T08:00:00"
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.Equal(t, 2026, parsed.Year())
		assert.Equal(t, time.November, parsed.Month())
		assert.Equal(t, 20, parsed.Day())
		assert.Equal(t, 8, parsed.Hour())
		assert.Equal(t, 0, parsed.Minute())
		// Location should be WIB (+07:00)
		_, offset := parsed.Zone()
		assert.Equal(t, 7*3600, offset)
	})

	t.Run("parses standard RFC3339 format correctly", func(t *testing.T) {
		req := validReq
		req.BookingDate = "2026-11-20T08:00:00Z"
		parsed, err := req.Validate()
		require.NoError(t, err)
		assert.Equal(t, 8, parsed.UTC().Hour())
	})
}

func TestSanitizeAndValidateWhatsAppNumber(t *testing.T) {
	t.Run("valid international numbers with country code 62", func(t *testing.T) {
		clean, err := domain.SanitizeAndValidateWhatsAppNumber("+62 812-3456-7890")
		require.NoError(t, err)
		assert.Equal(t, "6281234567890", clean)

		clean, err = domain.SanitizeAndValidateWhatsAppNumber("6281234567890")
		require.NoError(t, err)
		assert.Equal(t, "6281234567890", clean)

		clean, err = domain.SanitizeAndValidateWhatsAppNumber("+62 (812) 345-6789")
		require.NoError(t, err)
		assert.Equal(t, "628123456789", clean)
	})

	t.Run("valid international numbers with other country codes", func(t *testing.T) {
		clean, err := domain.SanitizeAndValidateWhatsAppNumber("+1 415 555 2671")
		require.NoError(t, err)
		assert.Equal(t, "14155552671", clean)

		clean, err = domain.SanitizeAndValidateWhatsAppNumber("+65 9123 4567")
		require.NoError(t, err)
		assert.Equal(t, "6591234567", clean)
	})

	t.Run("invalid numbers starting with 0 returns descriptive error", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("081234567890")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nomor WhatsApp wajib diawali kode negara")
	})

	t.Run("invalid length too short", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("628123")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "10 hingga 16 digit")
	})

	t.Run("invalid length too long", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("628123456789012345678")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "10 hingga 16 digit")
	})

	t.Run("invalid characters", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("62812abc3456")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "hanya boleh berisi angka")
	})

	t.Run("empty string returns error", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("   ")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "nomor WhatsApp wajib diisi")
	})

	t.Run("invalid plus sign in middle or multiple plus signs", func(t *testing.T) {
		_, err := domain.SanitizeAndValidateWhatsAppNumber("62812+3456789")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tanda plus (+) hanya boleh berada di awal")

		_, err = domain.SanitizeAndValidateWhatsAppNumber("+62+8123456789")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "tanda plus (+) hanya boleh berada di awal")
	})
}

func TestWorkerProfileUpdate_UnmarshalJSON_WhatsApp(t *testing.T) {
	t.Run("unmarshals whatsappNumber and aliases correctly", func(t *testing.T) {
		jsonStr := `{"name":"Budi","whatsapp_number":"6281234567890"}`
		var update domain.WorkerProfileUpdate
		err := json.Unmarshal([]byte(jsonStr), &update)
		require.NoError(t, err)
		assert.Equal(t, "6281234567890", update.WhatsAppNumber)

		jsonStrCamel := `{"name":"Budi","whatsappNumber":"6281234567890"}`
		var updateCamel domain.WorkerProfileUpdate
		err = json.Unmarshal([]byte(jsonStrCamel), &updateCamel)
		require.NoError(t, err)
		assert.Equal(t, "6281234567890", updateCamel.WhatsAppNumber)

		jsonStrIndo := `{"nama":"Budi","nomor_wa":"6281234567890"}`
		var updateIndo domain.WorkerProfileUpdate
		err = json.Unmarshal([]byte(jsonStrIndo), &updateIndo)
		require.NoError(t, err)
		assert.Equal(t, "Budi", updateIndo.Name)
		assert.Equal(t, "6281234567890", updateIndo.WhatsAppNumber)
	})
}

func TestAuthRegisterPayload_UnmarshalJSON(t *testing.T) {
	t.Run("berhasil unmarshal JSON standar snake_case dengan zone saja", func(t *testing.T) {
		jsonStr := `{
			"name": "Budi Santoso",
			"specialty_id": "ac-electric",
			"specialty_label": "Teknisi AC & Kelistrikan",
			"whatsapp_number": "6281234567890",
			"zone": "Jakarta Selatan",
			"slug": "budi-santoso",
			"pin": "123456"
		}`
		var payload domain.AuthRegisterPayload
		err := json.Unmarshal([]byte(jsonStr), &payload)
		require.NoError(t, err)
		assert.Equal(t, "Budi Santoso", payload.Name)
		assert.Equal(t, "Budi Santoso", payload.FullName)
		assert.Equal(t, "ac-electric", payload.SpecialtyID)
		assert.Equal(t, "Teknisi AC & Kelistrikan", payload.SpecialtyLabel)
		assert.Equal(t, "6281234567890", payload.WhatsAppNumber)
		assert.Equal(t, "6281234567890", payload.PhoneNumber)
		assert.Equal(t, "Jakarta Selatan", payload.Zone)
		assert.Equal(t, "Jakarta Selatan", payload.Basecamp)
		assert.Equal(t, "budi-santoso", payload.Slug)
		assert.Equal(t, "123456", payload.PIN)
		assert.Equal(t, "123456", payload.Password)
	})

	t.Run("berhasil unmarshal JSON camelCase dan alias frontend dengan basecamp saja", func(t *testing.T) {
		jsonStr := `{
			"fullName": "Sarah Melinda",
			"specialtyId": "cleaning",
			"specialtyLabel": "Spesialis Kebersihan Hunian",
			"waNumber": "6289876543210",
			"basecamp": "Bandung Kota",
			"customSlug": "sarah-cleaning",
			"workerPin": "654321"
		}`
		var payload domain.AuthRegisterPayload
		err := json.Unmarshal([]byte(jsonStr), &payload)
		require.NoError(t, err)
		assert.Equal(t, "Sarah Melinda", payload.Name)
		assert.Equal(t, "Sarah Melinda", payload.FullName)
		assert.Equal(t, "cleaning", payload.SpecialtyID)
		assert.Equal(t, "Spesialis Kebersihan Hunian", payload.SpecialtyLabel)
		assert.Equal(t, "6289876543210", payload.WhatsAppNumber)
		assert.Equal(t, "6289876543210", payload.PhoneNumber)
		assert.Equal(t, "Bandung Kota", payload.Zone)
		assert.Equal(t, "Bandung Kota", payload.Basecamp)
		assert.Equal(t, "sarah-cleaning", payload.Slug)
		assert.Equal(t, "654321", payload.PIN)
		assert.Equal(t, "654321", payload.Password)
	})

	t.Run("berhasil unmarshal kombinasi phone_number dan password", func(t *testing.T) {
		jsonStr := `{
			"name": "Doni",
			"phone_number": "628111222333",
			"zone": "Surabaya",
			"slug": "doni-servis",
			"password": "secretpassword"
		}`
		var payload domain.AuthRegisterPayload
		err := json.Unmarshal([]byte(jsonStr), &payload)
		require.NoError(t, err)
		assert.Equal(t, "Doni", payload.Name)
		assert.Equal(t, "628111222333", payload.WhatsAppNumber)
		assert.Equal(t, "Surabaya", payload.Zone)
		assert.Equal(t, "Surabaya", payload.Basecamp)
		assert.Equal(t, "doni-servis", payload.Slug)
		assert.Equal(t, "secretpassword", payload.PIN)
		assert.Equal(t, "secretpassword", payload.Password)
	})
}



