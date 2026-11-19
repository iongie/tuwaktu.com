package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"net/url"
	"os"
	"strings"
	"time"

	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/sanitize"
	"tuwaktu.com/internal/repository"
)

type B2BInquiryService interface {
	CreatePublicInquiry(ctx context.Context, payload *domain.CreateB2BInquiryPayload) (*domain.CreateB2BInquiryResponse, error)
	ListAdminInquiries(ctx context.Context, filter domain.B2BInquiryFilter) (*domain.AdminB2BInquiryListResponse, error)
	GetInquiryByID(ctx context.Context, id string) (*domain.B2BPropertyInquiry, error)
	UpdateInquiryByAdmin(ctx context.Context, id string, payload *domain.UpdateB2BInquiryAdminPayload) (*domain.B2BPropertyInquiry, error)
}

type b2bInquiryService struct {
	repo repository.B2BInquiryRepository
}

func NewB2BInquiryService(repo repository.B2BInquiryRepository) B2BInquiryService {
	return &b2bInquiryService{repo: repo}
}

func CalculateB2BEstimatedMonthlyFee(planTier string, unitCount int, visitFrequency string) float64 {
	if unitCount <= 0 {
		unitCount = 1
	}

	var base float64 = 150000
	var perUnit float64 = 25000
	if planTier == domain.B2BPlanMultiLokasi {
		base = 450000
		perUnit = 20000
	}

	var mult float64 = 1.0
	switch visitFrequency {
	case domain.B2BFreqMingguan:
		mult = 2.0
	case domain.B2BFreqBulanan:
		mult = 1.0
	case domain.B2BFreqDwiBulanan:
		mult = 0.65
	case domain.B2BFreqTribulanan:
		mult = 0.5
	}

	raw := (base + float64(unitCount)*perUnit) * mult
	return math.Round(raw/1000.0) * 1000.0
}

func normalizeClientWhatsApp(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", fmt.Errorf("%w: nomor WhatsApp PIC (contact_whatsapp) wajib diisi", domain.ErrInvalidInput)
	}

	if strings.HasPrefix(trimmed, "0") {
		trimmed = "62" + trimmed[1:]
	} else if strings.HasPrefix(trimmed, "8") {
		trimmed = "62" + trimmed
	}

	clean, err := domain.SanitizeAndValidateWhatsAppNumber(trimmed)
	if err != nil {
		return "", err
	}
	return clean, nil
}

func generateB2BInquiryCode(now time.Time) string {
	b := make([]byte, 2)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("B2B-%s-%04d", now.Format("20060102"), now.UnixNano()%10000)
	}
	return fmt.Sprintf("B2B-%s-%s", now.Format("20060102"), strings.ToUpper(hex.EncodeToString(b)))
}

func formatRupiahID(amount float64) string {
	n := int64(math.Round(amount))
	if n < 0 {
		n = 0
	}
	s := fmt.Sprintf("%d", n)
	var out []byte
	count := 0
	for i := len(s) - 1; i >= 0; i-- {
		if count > 0 && count%3 == 0 {
			out = append(out, '.')
		}
		out = append(out, s[i])
		count++
	}
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return "Rp " + string(out)
}

func formatB2BPlanLabel(tier string) string {
	if tier == domain.B2BPlanMultiLokasi {
		return "Paket Multi-Lokasi / Kantor"
	}
	return "Paket Rutin Properti"
}

func formatB2BFreqLabel(freq string) string {
	switch freq {
	case domain.B2BFreqMingguan:
		return "Mingguan"
	case domain.B2BFreqBulanan:
		return "Bulanan"
	case domain.B2BFreqDwiBulanan:
		return "2 Bulan Sekali"
	case domain.B2BFreqTribulanan:
		return "3 Bulan Sekali"
	default:
		return freq
	}
}

func (s *b2bInquiryService) CreatePublicInquiry(ctx context.Context, payload *domain.CreateB2BInquiryPayload) (*domain.CreateB2BInquiryResponse, error) {
	if payload == nil {
		return nil, fmt.Errorf("%w: data pengajuan tidak boleh kosong", domain.ErrInvalidInput)
	}

	businessName := sanitize.SanitizeText(payload.BusinessName, 150)
	if err := sanitize.ValidateLength(businessName, "nama usaha atau properti (business_name)", 2, 150); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrInvalidInput, err.Error())
	}

	propertyType := strings.ToUpper(strings.TrimSpace(payload.PropertyType))
	if !domain.IsValidB2BPropertyType(propertyType) {
		return nil, fmt.Errorf("%w: tipe properti (property_type) tidak valid", domain.ErrInvalidInput)
	}

	contactName := sanitize.SanitizeText(payload.ContactName, 120)
	if err := sanitize.ValidateLength(contactName, "nama penanggung jawab (contact_name)", 2, 120); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrInvalidInput, err.Error())
	}

	contactWA, err := normalizeClientWhatsApp(payload.ContactWhatsApp)
	if err != nil {
		return nil, err
	}

	contactEmail := sanitize.SanitizeText(payload.ContactEmail, 150)
	if contactEmail != "" && !strings.Contains(contactEmail, "@") {
		return nil, fmt.Errorf("%w: format email kontak (contact_email) tidak valid", domain.ErrInvalidInput)
	}

	cityZone := sanitize.SanitizeText(payload.CityZone, 100)
	if err := sanitize.ValidateLength(cityZone, "kota atau wilayah (city_zone)", 2, 100); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrInvalidInput, err.Error())
	}

	propertyAddress := sanitize.SanitizeText(payload.PropertyAddress, 500)
	if err := sanitize.ValidateLength(propertyAddress, "alamat lengkap properti (property_address)", 10, 500); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrInvalidInput, err.Error())
	}

	planTier := strings.ToUpper(strings.TrimSpace(payload.PlanTier))
	if !domain.IsValidB2BPlanTier(planTier) {
		return nil, fmt.Errorf("%w: pilihan paket (plan_tier) tidak valid", domain.ErrInvalidInput)
	}

	serviceFocus := sanitize.SanitizeText(payload.ServiceFocus, 120)
	if err := sanitize.ValidateLength(serviceFocus, "fokus layanan (service_focus)", 3, 120); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrInvalidInput, err.Error())
	}

	if payload.UnitCount <= 0 || payload.UnitCount > 2000 {
		return nil, fmt.Errorf("%w: jumlah unit atau ruangan (unit_count) harus antara 1 sampai 2000", domain.ErrInvalidInput)
	}

	visitFreq := strings.ToUpper(strings.TrimSpace(payload.VisitFrequency))
	if !domain.IsValidB2BVisitFrequency(visitFreq) {
		return nil, fmt.Errorf("%w: frekuensi kunjungan (visit_frequency) tidak valid", domain.ErrInvalidInput)
	}

	var startDate *time.Time
	rawStart := strings.TrimSpace(payload.PreferredStartDate)
	if rawStart != "" {
		parsed, parseErr := time.Parse("2006-01-02", rawStart)
		if parseErr != nil {
			return nil, fmt.Errorf("%w: format tanggal mulai (preferred_start_date) harus YYYY-MM-DD", domain.ErrInvalidInput)
		}
		startDate = &parsed
	}

	notes := sanitize.SanitizeText(payload.Notes, 1000)
	estimatedFee := CalculateB2BEstimatedMonthlyFee(planTier, payload.UnitCount, visitFreq)
	now := time.Now().UTC()
	code := generateB2BInquiryCode(now)

	inquiry := &domain.B2BPropertyInquiry{
		InquiryCode:         code,
		BusinessName:        businessName,
		PropertyType:        propertyType,
		ContactName:         contactName,
		ContactWhatsApp:     contactWA,
		ContactEmail:        contactEmail,
		CityZone:            cityZone,
		PropertyAddress:     propertyAddress,
		PlanTier:            planTier,
		ServiceFocus:        serviceFocus,
		UnitCount:           payload.UnitCount,
		VisitFrequency:      visitFreq,
		PreferredStartDate:  startDate,
		PreferredStartStr:   rawStart,
		Notes:               notes,
		EstimatedMonthlyFee: estimatedFee,
		Status:              domain.B2BStatusNew,
		PaymentStatus:       domain.B2BPaymentUnpaid,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	if err := s.repo.Create(ctx, inquiry); err != nil {
		return nil, err
	}

	adminWA := normalizeAdminWhatsAppNumber(os.Getenv("ADMIN_WHATSAPP_NUMBER"))
	waMessage := fmt.Sprintf(
		"Halo Admin Tuwaktu, saya %s dari %s baru saja mengajukan Paket Klien Bisnis (%s).\n\n"+
			"- Kode Pengajuan: %s\n"+
			"- Paket: %s\n"+
			"- Fokus Layanan: %s (%d unit)\n"+
			"- Jadwal Rutin: %s\n"+
			"- Wilayah: %s\n"+
			"- Estimasi Awal: %s/bulan\n\n"+
			"Mohon tindak lanjut untuk jadwal survei dan penawaran resminya. Terima kasih!",
		contactName,
		businessName,
		propertyType,
		code,
		formatB2BPlanLabel(planTier),
		serviceFocus,
		payload.UnitCount,
		formatB2BFreqLabel(visitFreq),
		cityZone,
		formatRupiahID(estimatedFee),
	)

	shareURL := fmt.Sprintf("https://wa.me/%s?text=%s", adminWA, url.QueryEscape(waMessage))
	webURL := fmt.Sprintf("https://web.whatsapp.com/send?phone=%s&text=%s", adminWA, url.QueryEscape(waMessage))

	return &domain.CreateB2BInquiryResponse{
		Inquiry:             inquiry,
		AdminWhatsAppNumber: adminWA,
		WhatsAppShareURL:    shareURL,
		WhatsAppWebURL:      webURL,
		WhatsAppMessage:     waMessage,
	}, nil
}

func (s *b2bInquiryService) ListAdminInquiries(ctx context.Context, filter domain.B2BInquiryFilter) (*domain.AdminB2BInquiryListResponse, error) {
	items, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	stats, err := s.repo.GetSummaryStats(ctx)
	if err != nil {
		return nil, err
	}
	return &domain.AdminB2BInquiryListResponse{
		Items: items,
		Stats: *stats,
	}, nil
}

func (s *b2bInquiryService) GetInquiryByID(ctx context.Context, id string) (*domain.B2BPropertyInquiry, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *b2bInquiryService) UpdateInquiryByAdmin(ctx context.Context, id string, payload *domain.UpdateB2BInquiryAdminPayload) (*domain.B2BPropertyInquiry, error) {
	if payload == nil {
		return nil, fmt.Errorf("%w: data pembaruan pengajuan tidak boleh kosong", domain.ErrInvalidInput)
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if payload.Status != nil {
		nextStatus := strings.ToUpper(strings.TrimSpace(*payload.Status))
		if !domain.IsValidB2BInquiryStatus(nextStatus) {
			return nil, domain.ErrInvalidB2BStatus
		}
		existing.Status = nextStatus
	}

	if payload.PaymentStatus != nil {
		nextPayStatus := strings.ToUpper(strings.TrimSpace(*payload.PaymentStatus))
		if !domain.IsValidB2BPaymentStatus(nextPayStatus) {
			return nil, domain.ErrInvalidB2BPaymentStatus
		}
		existing.PaymentStatus = nextPayStatus
		if nextPayStatus == domain.B2BPaymentPaid {
			if existing.PaidAt == nil {
				now := time.Now().UTC()
				existing.PaidAt = &now
			}
		} else if nextPayStatus == domain.B2BPaymentUnpaid {
			existing.PaidAt = nil
		}
	}

	if payload.AgreedMonthlyFee != nil {
		if *payload.AgreedMonthlyFee < 0 {
			return nil, fmt.Errorf("%w: nominal biaya bulanan disepakati tidak boleh negatif", domain.ErrInvalidInput)
		}
		val := *payload.AgreedMonthlyFee
		existing.AgreedMonthlyFee = &val
	}

	if payload.PaymentReference != nil {
		existing.PaymentReference = sanitize.SanitizeText(*payload.PaymentReference, 120)
	}

	if payload.AdminNotes != nil {
		existing.AdminNotes = sanitize.SanitizeText(*payload.AdminNotes, 1000)
	}

	existing.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

