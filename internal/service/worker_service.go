package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/pkg/slug"
	"tuwaktu.com/internal/repository"
)

type WorkerService interface {
	GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error)
	ListPublicWorkers(ctx context.Context) ([]domain.PublicWorkerProfile, error)
	UpdateWorkerProfile(ctx context.Context, id string, req *domain.WorkerProfileUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerRates(ctx context.Context, req *domain.WorkerRateUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerLocationSettings(ctx context.Context, req *domain.WorkerLocationSettingsUpdate) (*domain.PublicWorkerProfile, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerScheduleItem, error)
	UpdateWorkerSchedules(ctx context.Context, idOrSlug string, req []domain.WorkerScheduleItem) ([]domain.WorkerScheduleItem, error)
	CreateService(ctx context.Context, idOrSlug string, payload *domain.CreateServicePayload) (*domain.Service, error)
	UpdateService(ctx context.Context, idOrSlug string, serviceID string, payload *domain.UpdateServicePayload) (*domain.Service, error)
	DeleteService(ctx context.Context, idOrSlug string, serviceID string) error
	AddWorkerService(ctx context.Context, idOrSlug string, payload *domain.CreateServicePayload) (*domain.Service, error)
	UpdateWorkerService(ctx context.Context, idOrSlug string, serviceID string, payload *domain.UpdateServicePayload) (*domain.Service, error)
	DeleteWorkerService(ctx context.Context, idOrSlug string, serviceID string) error

	// Admin & Autentikasi
	OnboardWorker(ctx context.Context, payload *domain.AdminCreateWorkerPayload) (*domain.AdminWorkerCreatedResponse, error)
	RegisterWorker(ctx context.Context, payload *domain.AuthRegisterPayload) (*domain.AuthLoginResponse, error)
	ListWorkersForAdmin(ctx context.Context) ([]domain.AdminWorkerListItem, error)
	GetAdminStats(ctx context.Context) (*domain.AdminStats, error)
	SetWorkerStatus(ctx context.Context, workerID string, status string) error
	Authenticate(ctx context.Context, identifier string, password string) (*domain.AuthLoginResponse, error)
	GetSessionProfile(ctx context.Context, accountID string) (*domain.AuthUserSession, error)
}

type workerService struct {
	repo repository.WorkerRepository
}

func NewWorkerService(repo repository.WorkerRepository) WorkerService {
	return &workerService{repo: repo}
}

func (s *workerService) GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error) {
	slug = strings.ToLower(strings.TrimSpace(slug))
	if slug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, worker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, s := range services {
		publicServices[i] = s.ToPublic()
	}

	profile := worker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) ListPublicWorkers(ctx context.Context) ([]domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	workers, err := s.repo.ListPublicWorkers(ctx)
	if err != nil {
		return nil, err
	}

	profiles := make([]domain.PublicWorkerProfile, 0, len(workers))
	for _, w := range workers {
		if !w.IsActive {
			continue
		}
		services, err := s.repo.GetServicesByWorkerID(ctx, w.ID)
		if err != nil {
			services = []domain.Service{}
		}

		publicServices := make([]domain.PublicService, 0, len(services))
		for _, srv := range services {
			if srv.IsActive {
				publicServices = append(publicServices, srv.ToPublic())
			}
		}

		profiles = append(profiles, w.ToPublic(publicServices))
	}

	return profiles, nil
}

func (s *workerService) UpdateWorkerProfile(ctx context.Context, id string, req *domain.WorkerProfileUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	id = strings.TrimSpace(id)
	if id == "" || req == nil {
		return nil, domain.ErrInvalidInput
	}
	if strings.TrimSpace(req.Name) == "" {
		return nil, domain.ErrInvalidInput
	}
	if strings.TrimSpace(req.WhatsAppNumber) != "" {
		sanitized, err := domain.SanitizeAndValidateWhatsAppNumber(req.WhatsAppNumber)
		if err != nil {
			return nil, err
		}
		req.WhatsAppNumber = sanitized
	}

	updatedWorker, err := s.repo.UpdateProfile(ctx, id, req)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) UpdateWorkerRates(ctx context.Context, req *domain.WorkerRateUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID := strings.TrimSpace(req.WorkerID)
	if workerID == "" {
		workerID = strings.TrimSpace(req.ID)
	}
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}
	if req.BasePrice <= 0 {
		return nil, domain.ErrInvalidBasePrice
	}
	rateType := strings.ToUpper(strings.TrimSpace(req.RateType))
	if rateType != "HOURLY" && rateType != "UNIT" {
		return nil, domain.ErrInvalidRateType
	}

	updatedWorker, err := s.repo.UpdateRates(ctx, workerID, req.BasePrice, rateType)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) UpdateWorkerLocationSettings(ctx context.Context, req *domain.WorkerLocationSettingsUpdate) (*domain.PublicWorkerProfile, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID := strings.TrimSpace(req.WorkerID)
	if workerID == "" {
		workerID = strings.TrimSpace(req.ID)
	}
	if workerID == "" {
		return nil, domain.ErrInvalidInput
	}

	if req.MaxRadiusKM <= 0 {
		return nil, domain.ErrInvalidInput
	}
	if req.FreeRadiusKM < 0 {
		return nil, domain.ErrInvalidInput
	}
	if req.FreeRadiusKM > req.MaxRadiusKM {
		return nil, fmt.Errorf("%w: radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal", domain.ErrInvalidInput)
	}
	if req.ExtraFeePerKM < 0 {
		return nil, domain.ErrInvalidInput
	}
	if (req.Lat != nil && req.Lng == nil) || (req.Lat == nil && req.Lng != nil) {
		return nil, fmt.Errorf("%w: titik lintang dan bujur harus diisi bersamaan", domain.ErrInvalidInput)
	}
	if req.Lat != nil && (*req.Lat < -90.0 || *req.Lat > 90.0) {
		return nil, domain.ErrInvalidInput
	}
	if req.Lng != nil && (*req.Lng < -180.0 || *req.Lng > 180.0) {
		return nil, domain.ErrInvalidInput
	}

	updatedWorker, err := s.repo.UpdateLocationSettings(ctx, workerID, req)
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetServicesByWorkerID(ctx, updatedWorker.ID)
	if err != nil {
		return nil, err
	}

	publicServices := make([]domain.PublicService, len(services))
	for i, srv := range services {
		publicServices[i] = srv.ToPublic()
	}

	profile := updatedWorker.ToPublic(publicServices)
	return &profile, nil
}

func (s *workerService) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerScheduleItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	schedules, err := s.repo.GetWorkerSchedules(ctx, idOrSlug)
	if err != nil {
		return nil, err
	}

	items := make([]domain.WorkerScheduleItem, len(schedules))
	for i, sc := range schedules {
		items[i] = domain.WorkerScheduleItem{
			DayOfWeek:     sc.DayOfWeek,
			DayName:       domain.GetDayName(sc.DayOfWeek),
			IsActive:      sc.IsActive,
			SlotMorning:   sc.SlotMorning,
			SlotAfternoon: sc.SlotAfternoon,
			SlotEvening:   sc.SlotEvening,
		}
	}

	return items, nil
}

func (s *workerService) UpdateWorkerSchedules(ctx context.Context, idOrSlug string, req []domain.WorkerScheduleItem) ([]domain.WorkerScheduleItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}
	if len(req) == 0 {
		return nil, fmt.Errorf("%w: konfigurasi jadwal kerja tidak boleh kosong", domain.ErrInvalidInput)
	}

	entities := make([]domain.WorkerSchedule, len(req))
	for i, item := range req {
		if item.DayOfWeek < 0 || item.DayOfWeek > 6 {
			return nil, domain.ErrInvalidScheduleDay
		}
		entities[i] = domain.WorkerSchedule{
			DayOfWeek:     item.DayOfWeek,
			IsActive:      item.IsActive,
			SlotMorning:   item.SlotMorning,
			SlotAfternoon: item.SlotAfternoon,
			SlotEvening:   item.SlotEvening,
		}
	}

	updated, err := s.repo.UpdateWorkerSchedules(ctx, idOrSlug, entities)
	if err != nil {
		return nil, err
	}

	items := make([]domain.WorkerScheduleItem, len(updated))
	for i, sc := range updated {
		items[i] = domain.WorkerScheduleItem{
			DayOfWeek:     sc.DayOfWeek,
			DayName:       domain.GetDayName(sc.DayOfWeek),
			IsActive:      sc.IsActive,
			SlotMorning:   sc.SlotMorning,
			SlotAfternoon: sc.SlotAfternoon,
			SlotEvening:   sc.SlotEvening,
		}
	}

	return items, nil
}

func generateRandomPassword(length int) string {
	const charset = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"
	res := make([]byte, length)
	for i := range res {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			res[i] = charset[i%len(charset)]
		} else {
			res[i] = charset[n.Int64()]
		}
	}
	return string(res)
}

func (s *workerService) OnboardWorker(ctx context.Context, payload *domain.AdminCreateWorkerPayload) (*domain.AdminWorkerCreatedResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if payload == nil {
		return nil, domain.ErrInvalidInput
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		return nil, fmt.Errorf("%w: nama lengkap mitra wajib diisi", domain.ErrInvalidInput)
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" {
		return nil, fmt.Errorf("%w: alamat email mitra wajib diisi", domain.ErrInvalidInput)
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return nil, fmt.Errorf("%w: format alamat email tidak valid", domain.ErrInvalidInput)
	}

	rawWA := strings.TrimSpace(payload.WhatsAppNumber)
	if rawWA == "" {
		rawWA = strings.TrimSpace(payload.PhoneNumber)
	}
	if rawWA == "" {
		return nil, fmt.Errorf("%w: nomor WhatsApp mitra wajib diisi", domain.ErrInvalidInput)
	}

	sanitizedWA, err := domain.SanitizeAndValidateWhatsAppNumber(rawWA)
	if err != nil {
		return nil, err
	}

	// Cek apakah email sudah terdaftar sebelumnya
	existingAcc, err := s.repo.GetAccountByEmailOrPhone(ctx, email)
	if err == nil && existingAcc != nil {
		return nil, fmt.Errorf("%w: alamat email '%s' telah digunakan oleh akun lain", domain.ErrInvalidInput, email)
	}

	// Buat slug unik collision-free
	workerSlug, err := slug.GenerateUniqueSlug(ctx, name, func(ctx context.Context, checkSlug string) (bool, error) {
		_, err := s.repo.GetBySlug(ctx, checkSlug)
		if err == nil {
			return true, nil
		}
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return false, nil
		}
		return false, err
	})
	if err != nil {
		return nil, fmt.Errorf("membuat slug profil mitra: %w", err)
	}

	// Generate password sementara jika belum disediakan
	tempPassword := strings.TrimSpace(payload.TemporaryPassword)
	if tempPassword == "" {
		tempPassword = generateRandomPassword(10)
	}
	if len(tempPassword) < 8 {
		return nil, fmt.Errorf("%w: kata sandi sementara minimal 8 karakter", domain.ErrInvalidInput)
	}

	hashedPassword, err := auth.HashPassword(tempPassword)
	if err != nil {
		return nil, fmt.Errorf("melakukan hashing password: %w", err)
	}

	zone := strings.TrimSpace(payload.Zone)
	if zone == "" {
		zone = "Jakarta Selatan"
	}

	rateType := strings.ToUpper(strings.TrimSpace(payload.RateType))
	if rateType != "HOURLY" && rateType != "UNIT" {
		rateType = "HOURLY"
	}

	basePrice := payload.BasePrice
	if basePrice <= 0 {
		basePrice = 75000.00
	}

	maxRadius := payload.MaxRadiusKM
	if maxRadius <= 0 {
		maxRadius = 15.00
	}

	freeRadius := payload.FreeRadiusKM
	if freeRadius < 0 {
		freeRadius = 3.00
	}

	bio := strings.TrimSpace(payload.Bio)
	if bio == "" {
		bio = fmt.Sprintf("Mitra teknisi profesional terverifikasi di area %s.", zone)
	}

	avatarURL := strings.TrimSpace(payload.Address) // check or fallback
	if avatarURL == "" {
		avatarURL = "https://images.unsplash.com/photo-1540569014015-19a7be504e3a"
	}

	phone := strings.TrimSpace(payload.PhoneNumber)
	if phone == "" {
		phone = sanitizedWA
	}

	newWorker := domain.Worker{
		Slug:           workerSlug,
		Name:           name,
		Bio:            bio,
		AvatarURL:      avatarURL,
		Rating:         5.0,
		ReviewCount:    0,
		Zone:           zone,
		BasePrice:      basePrice,
		RateType:       rateType,
		Lat:            payload.Lat,
		Lng:            payload.Lng,
		MaxRadiusKM:    maxRadius,
		FreeRadiusKM:   freeRadius,
		ExtraFeePerKM:  payload.ExtraFeePerKM,
		PhoneNumber:    phone,
		WhatsAppNumber: sanitizedWA,
		Email:          email,
		Address:        strings.TrimSpace(payload.Address),
		IsActive:       true,
	}

	defaultSchedules := []domain.WorkerSchedule{
		{DayOfWeek: 0, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		{DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 2, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 3, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 4, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 5, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 6, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: false},
	}

	newAccount := domain.WorkerAccount{
		Email:              email,
		PhoneNumber:        sanitizedWA,
		PasswordHash:       hashedPassword,
		Role:               domain.RoleWorker,
		AccountStatus:      domain.AccountStatusActive,
		MustChangePassword: true,
	}

	if err := s.repo.CreateWorkerWithAccountTx(ctx, &newWorker, defaultSchedules, &newAccount); err != nil {
		return nil, fmt.Errorf("eksekusi transaksi onboarding mitra gagal: %w", err)
	}

	invitationText := fmt.Sprintf(
		"Halo Kak %s! Selamat bergabung sebagai Mitra Mandiri di Tuwaktu.\n\n"+
			"Berikut akses masuk ke Dasbor Kerja Anda:\n"+
			"• Tautan Masuk: https://tuwaktu.com/login\n"+
			"• ID Akun: %s\n"+
			"• Kata Sandi Sementara: %s\n\n"+
			"Tautan Halaman Profil Publik Anda:\n"+
			"https://tuwaktu.com/%s\n\n"+
			"Mohon segera masuk dan perbarui kata sandi Anda demi keamanan akun. Salam sukses bersama Tuwaktu!",
		newWorker.Name,
		newAccount.Email,
		tempPassword,
		newWorker.Slug,
	)

	return &domain.AdminWorkerCreatedResponse{
		Account:           newAccount,
		Worker:            newWorker,
		TemporaryPassword: tempPassword,
		InvitationText:    invitationText,
	}, nil
}

func (s *workerService) RegisterWorker(ctx context.Context, payload *domain.AuthRegisterPayload) (*domain.AuthLoginResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if payload == nil {
		return nil, domain.ErrInvalidInput
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = strings.TrimSpace(payload.FullName)
	}
	if name == "" {
		return nil, fmt.Errorf("%w: nama lengkap mitra wajib diisi", domain.ErrInvalidInput)
	}

	rawWA := strings.TrimSpace(payload.WhatsAppNumber)
	if rawWA == "" {
		rawWA = strings.TrimSpace(payload.PhoneNumber)
	}
	if rawWA == "" {
		return nil, fmt.Errorf("%w: nomor WhatsApp mitra wajib diisi", domain.ErrInvalidInput)
	}

	sanitizedWA, err := domain.SanitizeAndValidateWhatsAppNumber(rawWA)
	if err != nil {
		return nil, err
	}

	zone := strings.TrimSpace(payload.Zone)
	if zone == "" {
		zone = strings.TrimSpace(payload.Basecamp)
	}
	if zone == "" {
		return nil, fmt.Errorf("%w: zona atau basecamp operasional wajib diisi", domain.ErrInvalidInput)
	}

	rawSlug := strings.ToLower(strings.TrimSpace(payload.Slug))
	if rawSlug == "" {
		return nil, fmt.Errorf("%w: slug profil mitra wajib diisi", domain.ErrInvalidInput)
	}
	workerSlug := slug.GenerateSlug(rawSlug)
	if len(workerSlug) < 3 {
		return nil, fmt.Errorf("%w: slug profil minimal 3 karakter alfanumerik", domain.ErrInvalidInput)
	}

	pin := strings.TrimSpace(payload.PIN)
	if pin == "" {
		pin = strings.TrimSpace(payload.Password)
	}
	if len(pin) < 6 {
		return nil, fmt.Errorf("%w: PIN kedaulatan minimal 6 digit", domain.ErrInvalidInput)
	}

	// 1. Cek apakah nomor WhatsApp sudah terdaftar di worker_accounts
	existingAccPhone, errPhone := s.repo.GetAccountByEmailOrPhone(ctx, sanitizedWA)
	if errPhone == nil && existingAccPhone != nil {
		return nil, fmt.Errorf("%w: Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.", domain.ErrInvalidInput)
	}
	if errPhone != nil && !errors.Is(errPhone, domain.ErrWorkerNotFound) {
		return nil, fmt.Errorf("memeriksa akun nomor WhatsApp: %w", errPhone)
	}

	// 2. Cek apakah email terdaftar di worker_accounts
	email := fmt.Sprintf("%s@tuwaktu.com", workerSlug)
	existingAccEmail, errEmail := s.repo.GetAccountByEmailOrPhone(ctx, email)
	if errEmail == nil && existingAccEmail != nil {
		return nil, fmt.Errorf("%w: Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.", domain.ErrInvalidInput)
	}
	if errEmail != nil && !errors.Is(errEmail, domain.ErrWorkerNotFound) {
		return nil, fmt.Errorf("memeriksa akun email: %w", errEmail)
	}

	// 3. Cek keunikan slug di workers
	existingWorker, errWorker := s.repo.GetBySlug(ctx, workerSlug)
	if errWorker == nil && existingWorker != nil {
		return nil, fmt.Errorf("%w: Slug profil sudah digunakan. Silakan pilih slug lain.", domain.ErrInvalidInput)
	}
	if errWorker != nil && !errors.Is(errWorker, domain.ErrWorkerNotFound) {
		return nil, fmt.Errorf("memeriksa ketersediaan slug: %w", errWorker)
	}

	// 4. Hash PIN
	hashedPassword, err := auth.HashPassword(pin)
	if err != nil {
		return nil, fmt.Errorf("melakukan hashing PIN: %w", err)
	}

	workerID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("membuat UUID worker: %w", err)
	}
	workerIDStr := workerID.String()

	accountID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("membuat UUID akun: %w", err)
	}
	accountIDStr := accountID.String()

	// 5. Buat entitas Worker baru
	bio := strings.TrimSpace(payload.SpecialtyLabel)
	if bio != "" {
		bio = fmt.Sprintf("Mitra mandiri spesialis %s di wilayah %s.", bio, zone)
	} else {
		bio = fmt.Sprintf("Mitra teknisi profesional terverifikasi di area %s.", zone)
	}

	newWorker := domain.Worker{
		ID:             workerIDStr,
		Slug:           workerSlug,
		Name:           name,
		Bio:            bio,
		AvatarURL:      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a",
		Rating:         5.0,
		ReviewCount:    0,
		Zone:           zone,
		BasePrice:      75000.00,
		RateType:       "HOURLY",
		MaxRadiusKM:    15.00,
		FreeRadiusKM:   3.00,
		ExtraFeePerKM:  0,
		PhoneNumber:    sanitizedWA,
		WhatsAppNumber: sanitizedWA,
		Email:          email,
		Address:        zone,
		IsActive:       true,
	}

	// 6. Buat 7 default jadwal kerja (Senin s/d Minggu)
	defaultSchedules := []domain.WorkerSchedule{
		{DayOfWeek: 0, IsActive: false, SlotMorning: false, SlotAfternoon: false, SlotEvening: false},
		{DayOfWeek: 1, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 2, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 3, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 4, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 5, IsActive: true, SlotMorning: true, SlotAfternoon: true, SlotEvening: false},
		{DayOfWeek: 6, IsActive: true, SlotMorning: true, SlotAfternoon: false, SlotEvening: false},
	}

	// 7. Buat WorkerAccount baru
	newAccount := domain.WorkerAccount{
		ID:                 accountIDStr,
		WorkerID:           &workerIDStr,
		Email:              email,
		PhoneNumber:        sanitizedWA,
		PasswordHash:       hashedPassword,
		Role:               domain.RoleWorker,
		AccountStatus:      domain.AccountStatusActive,
		MustChangePassword: false,
	}

	// 8. Simpan secara transaksional
	if err := s.repo.CreateWorkerWithAccountTx(ctx, &newWorker, defaultSchedules, &newAccount); err != nil {
		return nil, fmt.Errorf("eksekusi transaksi pendaftaran mitra gagal: %w", err)
	}

	// 9. Buat token JWT
	token, err := auth.GenerateToken(newAccount.ID, newWorker.ID, newAccount.Email, newAccount.Role, newAccount.AccountStatus, 7*24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("pembuatan token sesi gagal: %w", err)
	}

	return &domain.AuthLoginResponse{
		Token: token,
		Session: domain.AuthUserSession{
			ID:                 newAccount.ID,
			WorkerID:           &newWorker.ID,
			WorkerSlug:         newWorker.Slug,
			Slug:               newWorker.Slug,
			Name:               newWorker.Name,
			Email:              newAccount.Email,
			PhoneNumber:        newAccount.PhoneNumber,
			Role:               newAccount.Role,
			AccountStatus:      newAccount.AccountStatus,
			MustChangePassword: newAccount.MustChangePassword,
		},
	}, nil
}

func (s *workerService) ListWorkersForAdmin(ctx context.Context) ([]domain.AdminWorkerListItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	workers, err := s.repo.GetAdminWorkerList(ctx)
	if err != nil {
		return nil, err
	}
	if workers == nil {
		workers = []domain.AdminWorkerListItem{}
	}
	return workers, nil
}

func (s *workerService) GetAdminStats(ctx context.Context) (*domain.AdminStats, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return s.repo.GetAdminStats(ctx)
}

func (s *workerService) SetWorkerStatus(ctx context.Context, workerID string, status string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	return s.repo.UpdateWorkerAccountStatus(ctx, workerID, status)
}

func (s *workerService) Authenticate(ctx context.Context, identifier string, password string) (*domain.AuthLoginResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	identifier = strings.TrimSpace(identifier)
	password = strings.TrimSpace(password)

	if identifier == "" || password == "" {
		return nil, fmt.Errorf("%w: identitas akun dan kata sandi wajib diisi", domain.ErrInvalidInput)
	}

	account, err := s.repo.GetAccountByEmailOrPhone(ctx, identifier)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return nil, fmt.Errorf("%w: akun dengan email atau nomor WhatsApp tersebut tidak ditemukan", domain.ErrInvalidInput)
		}
		return nil, err
	}

	if account.AccountStatus == domain.AccountStatusSuspended {
		return nil, fmt.Errorf("%w: akun Anda telah dinonaktifkan oleh administrator", domain.ErrWorkerInactive)
	}

	match, err := auth.VerifyPassword(account.PasswordHash, password)
	if err != nil || !match {
		return nil, fmt.Errorf("%w: kata sandi yang Anda masukkan tidak sesuai", domain.ErrInvalidInput)
	}

	workerIDStr := ""
	workerSlug := ""
	userName := "Pengguna"

	if account.Role == domain.RoleAdmin {
		userName = "Super Administrator"
		workerSlug = "admin"
	}

	if account.WorkerID != nil {
		workerIDStr = *account.WorkerID
	}
	if account.Worker != nil {
		userName = account.Worker.Name
		workerSlug = account.Worker.Slug
	} else if workerIDStr != "" {
		if w, err := s.repo.GetByID(ctx, workerIDStr); err == nil && w != nil {
			userName = w.Name
			workerSlug = w.Slug
		}
	}

	token, err := auth.GenerateToken(account.ID, workerIDStr, account.Email, account.Role, account.AccountStatus, 7*24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("pembuatan token sesi gagal: %w", err)
	}

	return &domain.AuthLoginResponse{
		Token: token,
		Session: domain.AuthUserSession{
			ID:                 account.ID,
			WorkerID:           account.WorkerID,
			WorkerSlug:         workerSlug,
			Slug:               workerSlug,
			Name:               userName,
			Email:              account.Email,
			PhoneNumber:        account.PhoneNumber,
			Role:               account.Role,
			AccountStatus:      account.AccountStatus,
			MustChangePassword: account.MustChangePassword,
		},
	}, nil
}

func (s *workerService) GetSessionProfile(ctx context.Context, accountID string) (*domain.AuthUserSession, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return nil, fmt.Errorf("%w: ID akun wajib diisi", domain.ErrInvalidInput)
	}

	account, err := s.repo.GetAccountByID(ctx, accountID)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			return nil, fmt.Errorf("%w: akun pengguna tidak ditemukan", domain.ErrWorkerNotFound)
		}
		return nil, err
	}

	if account.AccountStatus == domain.AccountStatusSuspended {
		return nil, fmt.Errorf("%w: akun Anda telah dinonaktifkan oleh administrator", domain.ErrWorkerInactive)
	}

	workerIDStr := ""
	workerSlug := ""
	userName := "Pengguna"

	if account.WorkerID != nil {
		workerIDStr = *account.WorkerID
	}
	if account.Role == domain.RoleAdmin {
		userName = "Super Administrator"
		workerSlug = "admin"
	}

	if account.Worker != nil {
		userName = account.Worker.Name
		workerSlug = account.Worker.Slug
	} else if workerIDStr != "" {
		if w, err := s.repo.GetByID(ctx, workerIDStr); err == nil && w != nil {
			userName = w.Name
			workerSlug = w.Slug
		}
	}

	return &domain.AuthUserSession{
		ID:                 account.ID,
		WorkerID:           account.WorkerID,
		WorkerSlug:         workerSlug,
		Slug:               workerSlug,
		Name:               userName,
		Email:              account.Email,
		PhoneNumber:        account.PhoneNumber,
		Role:               account.Role,
		AccountStatus:      account.AccountStatus,
		MustChangePassword: account.MustChangePassword,
	}, nil
}

// CreateService menambahkan paket layanan baru untuk pekerja ke katalog
func (s *workerService) CreateService(ctx context.Context, idOrSlug string, payload *domain.CreateServicePayload) (*domain.Service, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if payload == nil {
		return nil, domain.ErrInvalidInput
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		return nil, fmt.Errorf("%w: nama layanan wajib diisi", domain.ErrInvalidInput)
	}
	if len(name) < 3 {
		return nil, fmt.Errorf("%w: nama layanan minimal 3 karakter", domain.ErrInvalidInput)
	}
	if payload.Price < 0 {
		return nil, fmt.Errorf("%w: tarif harga layanan tidak boleh negatif", domain.ErrInvalidInput)
	}
	if payload.BasePrice < 0 {
		return nil, fmt.Errorf("%w: tarif dasar layanan tidak boleh negatif", domain.ErrInvalidInput)
	}
	duration := payload.DurationMinutes
	if duration <= 0 {
		duration = 60
	}

	rateType := strings.ToUpper(strings.TrimSpace(payload.RateType))
	if rateType != "" && rateType != "HOURLY" && rateType != "UNIT" {
		return nil, domain.ErrInvalidRateType
	}
	if rateType == "" {
		rateType = "HOURLY"
	}

	worker, err := s.repo.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = s.repo.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	basePrice := payload.BasePrice
	if basePrice <= 0 {
		basePrice = payload.Price
	}

	isActive := true
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}

	serviceEntity := &domain.Service{
		WorkerID:        worker.ID,
		Name:            name,
		Description:     strings.TrimSpace(payload.Description),
		Price:           payload.Price,
		BasePrice:       basePrice,
		RateType:        rateType,
		DurationMinutes: duration,
		IsActive:        isActive,
	}

	created, err := s.repo.CreateService(ctx, serviceEntity)
	if err != nil {
		return nil, fmt.Errorf("menyimpan layanan pekerja: %w", err)
	}
	return created, nil
}

// UpdateService memperbarui data paket layanan pekerja yang ada
func (s *workerService) UpdateService(ctx context.Context, idOrSlug string, serviceID string, payload *domain.UpdateServicePayload) (*domain.Service, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if payload == nil {
		return nil, domain.ErrInvalidInput
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	serviceID = strings.TrimSpace(serviceID)
	if idOrSlug == "" || serviceID == "" {
		return nil, domain.ErrInvalidInput
	}

	if payload.Name != nil {
		name := strings.TrimSpace(*payload.Name)
		if name == "" {
			return nil, fmt.Errorf("%w: nama layanan tidak boleh kosong", domain.ErrInvalidInput)
		}
		if len(name) < 3 {
			return nil, fmt.Errorf("%w: nama layanan minimal 3 karakter", domain.ErrInvalidInput)
		}
	}
	if payload.Price != nil && *payload.Price < 0 {
		return nil, fmt.Errorf("%w: tarif harga layanan tidak boleh negatif", domain.ErrInvalidInput)
	}
	if payload.BasePrice != nil && *payload.BasePrice < 0 {
		return nil, fmt.Errorf("%w: tarif dasar layanan tidak boleh negatif", domain.ErrInvalidInput)
	}
	if payload.DurationMinutes != nil && *payload.DurationMinutes <= 0 {
		return nil, fmt.Errorf("%w: durasi layanan harus lebih besar dari 0 menit", domain.ErrInvalidInput)
	}
	if payload.RateType != nil {
		rt := strings.ToUpper(strings.TrimSpace(*payload.RateType))
		if rt != "HOURLY" && rt != "UNIT" {
			return nil, domain.ErrInvalidRateType
		}
	}

	worker, err := s.repo.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = s.repo.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	updated, err := s.repo.UpdateService(ctx, worker.ID, serviceID, payload)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

// DeleteService menonaktifkan paket layanan pekerja dari katalog
func (s *workerService) DeleteService(ctx context.Context, idOrSlug string, serviceID string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	serviceID = strings.TrimSpace(serviceID)
	if idOrSlug == "" || serviceID == "" {
		return domain.ErrInvalidInput
	}

	worker, err := s.repo.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = s.repo.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return err
		}
	}

	return s.repo.DeleteService(ctx, worker.ID, serviceID)
}

func (s *workerService) AddWorkerService(ctx context.Context, idOrSlug string, payload *domain.CreateServicePayload) (*domain.Service, error) {
	return s.CreateService(ctx, idOrSlug, payload)
}

func (s *workerService) UpdateWorkerService(ctx context.Context, idOrSlug string, serviceID string, payload *domain.UpdateServicePayload) (*domain.Service, error) {
	return s.UpdateService(ctx, idOrSlug, serviceID, payload)
}

func (s *workerService) DeleteWorkerService(ctx context.Context, idOrSlug string, serviceID string) error {
	return s.DeleteService(ctx, idOrSlug, serviceID)
}



