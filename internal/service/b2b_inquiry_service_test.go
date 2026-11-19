package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func TestCalculateB2BEstimatedMonthlyFee(t *testing.T) {
	t.Run("menghitung estimasi paket rutin properti bulanan", func(t *testing.T) {
		// 150000 + (10 * 25000) = 400000 * 1.0 = 400000
		fee := service.CalculateB2BEstimatedMonthlyFee(domain.B2BPlanRutinProperti, 10, domain.B2BFreqBulanan)
		assert.Equal(t, float64(400000), fee)
	})

	t.Run("menghitung estimasi paket multi lokasi mingguan", func(t *testing.T) {
		// (450000 + (30 * 20000)) * 2.0 = 1050000 * 2.0 = 2100000
		fee := service.CalculateB2BEstimatedMonthlyFee(domain.B2BPlanMultiLokasi, 30, domain.B2BFreqMingguan)
		assert.Equal(t, float64(2100000), fee)
	})

	t.Run("membulatkan hasil dwi-bulanan ke ribuan terdekat", func(t *testing.T) {
		// (150000 + 15*25000) * 0.65 = 525000 * 0.65 = 341250 -> 341000
		fee := service.CalculateB2BEstimatedMonthlyFee(domain.B2BPlanRutinProperti, 15, domain.B2BFreqDwiBulanan)
		assert.Equal(t, float64(341000), fee)
	})
}

func TestB2BInquiryService_Lifecycle(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewMemoryB2BInquiryRepository()
	svc := service.NewB2BInquiryService(repo)
	t.Setenv("ADMIN_WHATSAPP_NUMBER", "085290040210")

	t.Run("menolak payload yang tidak valid dengan pesan Bahasa Indonesia", func(t *testing.T) {
		_, err := svc.CreatePublicInquiry(ctx, &domain.CreateB2BInquiryPayload{
			BusinessName:    "",
			PropertyType:    domain.B2BPropertyKos,
			ContactName:     "Rudi",
			ContactWhatsApp: "081234567890",
			CityZone:        "Jakarta Selatan",
			PropertyAddress: "Jl. Kemang Raya No. 10, Jakarta Selatan",
			PlanTier:        domain.B2BPlanRutinProperti,
			ServiceFocus:    "Cuci AC Rutin",
			UnitCount:       12,
			VisitFrequency:  domain.B2BFreqBulanan,
		})
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("berhasil menyimpan pengajuan publik, menormalisasi WhatsApp, dan membuat link WA admin", func(t *testing.T) {
		res, err := svc.CreatePublicInquiry(ctx, &domain.CreateB2BInquiryPayload{
			BusinessName:       "Kos Melati <b>Kemang</b>",
			PropertyType:       domain.B2BPropertyKos,
			ContactName:        "Ibu Ratna",
			ContactWhatsApp:    "081288992211",
			ContactEmail:       "ratna@kosmelati.id",
			CityZone:           "Jakarta Selatan",
			PropertyAddress:    "Jl. Kemang Timur No. 18, Jakarta Selatan",
			PlanTier:           domain.B2BPlanRutinProperti,
			ServiceFocus:       "Cuci AC & Cek Kelistrikan",
			UnitCount:          12,
			VisitFrequency:     domain.B2BFreqBulanan,
			PreferredStartDate: "2026-12-01",
			Notes:              "Akses gedung mulai pukul 09.00 WIB",
		})
		require.NoError(t, err)
		require.NotNil(t, res)
		require.NotNil(t, res.Inquiry)

		assert.NotEmpty(t, res.Inquiry.ID)
		assert.Contains(t, res.Inquiry.InquiryCode, "B2B-")
		assert.Equal(t, "Kos Melati Kemang", res.Inquiry.BusinessName)
		assert.Equal(t, "6281288992211", res.Inquiry.ContactWhatsApp)
		assert.Equal(t, float64(450000), res.Inquiry.EstimatedMonthlyFee)
		assert.Equal(t, domain.B2BStatusNew, res.Inquiry.Status)
		assert.Equal(t, domain.B2BPaymentUnpaid, res.Inquiry.PaymentStatus)
		assert.Equal(t, "6285290040210", res.AdminWhatsAppNumber)
		assert.Contains(t, res.WhatsAppShareURL, "https://wa.me/6285290040210?text=")
		assert.Contains(t, res.WhatsAppMessage, res.Inquiry.InquiryCode)
	})

	t.Run("admin dapat memperbarui status kontrak, nominal disepakati, dan menandai lunas", func(t *testing.T) {
		listRes, err := svc.ListAdminInquiries(ctx, domain.B2BInquiryFilter{})
		require.NoError(t, err)
		require.Len(t, listRes.Items, 1)
		assert.Equal(t, int64(1), listRes.Stats.TotalCount)
		assert.Equal(t, int64(1), listRes.Stats.PendingFollowUpCount)
		assert.Equal(t, float64(0), listRes.Stats.PaidMonthlyRevenue)

		targetID := listRes.Items[0].ID
		activeStatus := domain.B2BStatusActive
		paidStatus := domain.B2BPaymentPaid
		agreed := float64(520000)
		ref := "BCA-TRF-20261201-01"
		adminNotes := "Survei selesai, mulai minggu pertama"

		updated, err := svc.UpdateInquiryByAdmin(ctx, targetID, &domain.UpdateB2BInquiryAdminPayload{
			Status:           &activeStatus,
			PaymentStatus:    &paidStatus,
			AgreedMonthlyFee: &agreed,
			PaymentReference: &ref,
			AdminNotes:       &adminNotes,
		})
		require.NoError(t, err)
		assert.Equal(t, domain.B2BStatusActive, updated.Status)
		assert.Equal(t, domain.B2BPaymentPaid, updated.PaymentStatus)
		require.NotNil(t, updated.AgreedMonthlyFee)
		assert.Equal(t, float64(520000), *updated.AgreedMonthlyFee)
		assert.NotNil(t, updated.PaidAt)
		assert.Equal(t, "BCA-TRF-20261201-01", updated.PaymentReference)

		listAfter, err := svc.ListAdminInquiries(ctx, domain.B2BInquiryFilter{})
		require.NoError(t, err)
		assert.Equal(t, int64(0), listAfter.Stats.PendingFollowUpCount)
		assert.Equal(t, int64(1), listAfter.Stats.ActiveContractCount)
		assert.Equal(t, float64(520000), listAfter.Stats.PaidMonthlyRevenue)
	})
}

