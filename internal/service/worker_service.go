package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/pkg/slug"
	"tuwaktu.com/internal/repository"
)

type WorkerService interface {
	GetPublicProfileBySlug(ctx context.Context, slug string) (*domain.PublicWorkerProfile, error)
	UpdateWorkerProfile(ctx context.Context, id string, req *domain.WorkerProfileUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerRates(ctx context.Context, req *domain.WorkerRateUpdate) (*domain.PublicWorkerProfile, error)
	UpdateWorkerLocationSettings(ctx context.Context, req *domain.WorkerLocationSettingsUpdate) (*domain.PublicWorkerProfile, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerScheduleItem, error)
	UpdateWorkerSchedules(ctx context.Context, idOrSlug string, req []domain.WorkerScheduleItem) ([]domain.WorkerScheduleItem, error)

	// Admin & Autentikasi
	OnboardWorker(ctx context.Context, payload *domain.AdminCreateWorkerPayload) (*domain.AdminWorkerCreatedResponse, error)
	ListWorkersForAdmin(ctx context.Context) ([]domain.AdminWorkerListItem, error)
	SetWorkerStatus(ctx context.Context, workerID string, status string) error
	Authenticate(ctx context.Context, identifier string, password string) (*domain.AuthLoginResponse, error)
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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
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
		PasswordHash:       string(hashedPassword),
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

func (s *workerService) ListWorkersForAdmin(ctx context.Context) ([]domain.AdminWorkerListItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return s.repo.GetAdminWorkerList(ctx)
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

	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("%w: kata sandi yang Anda masukkan tidak sesuai", domain.ErrInvalidInput)
	}

	workerIDStr := ""
	workerSlug := ""
	userName := "Super Administrator"

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
			Name:               userName,
			Email:              account.Email,
			PhoneNumber:        account.PhoneNumber,
			Role:               account.Role,
			AccountStatus:      account.AccountStatus,
			MustChangePassword: account.MustChangePassword,
		},
	}, nil
}



