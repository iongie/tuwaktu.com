package domain_test

import (
	"encoding/json"
	"testing"
	"time"

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
