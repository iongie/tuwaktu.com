package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"tuwaktu.com/internal/domain"
)

type PostgresWorkerRepository struct {
	db *gorm.DB
}

func NewPostgresWorkerRepository(db *gorm.DB) *PostgresWorkerRepository {
	return &PostgresWorkerRepository{db: db}
}

// GormWorkerRepository is an alias for PostgresWorkerRepository
type GormWorkerRepository = PostgresWorkerRepository

func NewGormWorkerRepository(db *gorm.DB) *GormWorkerRepository {
	return NewPostgresWorkerRepository(db)
}

func (r *PostgresWorkerRepository) GetBySlug(ctx context.Context, slug string) (*domain.Worker, error) {
	slug = strings.ToLower(strings.TrimSpace(slug))
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("LOWER(slug) = ?", slug).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("querying worker by slug: %w", err)
	}

	return &w, nil
}

func (r *PostgresWorkerRepository) GetByID(ctx context.Context, id string) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, domain.ErrInvalidInput
	}
	if _, err := uuid.Parse(id); err != nil && r.db.Dialector.Name() == "postgres" {
		return nil, domain.ErrWorkerNotFound
	}
	var w domain.Worker
	err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&w).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) ||
			strings.Contains(err.Error(), "invalid input syntax for type uuid") ||
			strings.Contains(err.Error(), "22P02") {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("querying worker by id: %w", err)
	}

	return &w, nil
}

func (r *PostgresWorkerRepository) GetServicesByWorkerID(ctx context.Context, workerID string) ([]domain.Service, error) {
	var services []domain.Service
	err := r.db.WithContext(ctx).
		Where("worker_id = ? AND is_active = ?", workerID, true).
		Order("price ASC").
		Find(&services).Error
	if err != nil {
		return nil, fmt.Errorf("querying services by worker_id: %w", err)
	}

	if services == nil {
		services = []domain.Service{}
	}

	return services, nil
}

func (r *PostgresWorkerRepository) syncWorkerBasePrice(ctx context.Context, workerID string) {
	var minPrice struct {
		Price *float64 `gorm:"column:min_price"`
	}
	err := r.db.WithContext(ctx).
		Raw("SELECT MIN(price) AS min_price FROM services WHERE worker_id = ? AND is_active = true", workerID).
		Scan(&minPrice).Error
	if err == nil {
		newBase := 0.0
		if minPrice.Price != nil {
			newBase = *minPrice.Price
		}
		_ = r.db.WithContext(ctx).Model(&domain.Worker{}).Where("id = ?", workerID).Update("base_price", newBase)
	}
}

func (r *PostgresWorkerRepository) CreateService(ctx context.Context, service *domain.Service) (*domain.Service, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("creating service: %w", err)
	}
	if service == nil || strings.TrimSpace(service.WorkerID) == "" {
		return nil, domain.ErrInvalidInput
	}
	if strings.TrimSpace(service.ID) == "" {
		id, err := uuid.NewV7()
		if err != nil {
			return nil, fmt.Errorf("generating service id: %w", err)
		}
		service.ID = id.String()
	}
	now := time.Now()
	service.CreatedAt = now
	service.UpdatedAt = now

	if err := r.db.WithContext(ctx).Create(service).Error; err != nil {
		return nil, fmt.Errorf("saving service to database: %w", err)
	}
	r.syncWorkerBasePrice(ctx, service.WorkerID)
	return service, nil
}

func (r *PostgresWorkerRepository) UpdateService(ctx context.Context, workerID string, serviceID string, update *domain.UpdateServicePayload) (*domain.Service, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating service: %w", err)
	}
	if update == nil {
		return nil, domain.ErrInvalidInput
	}
	workerID = strings.TrimSpace(workerID)
	serviceID = strings.TrimSpace(serviceID)
	if workerID == "" || serviceID == "" {
		return nil, domain.ErrInvalidInput
	}

	var existing domain.Service
	err := r.db.WithContext(ctx).
		Where("id = ? AND worker_id = ?", serviceID, workerID).
		First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrServiceNotFound
		}
		return nil, fmt.Errorf("finding service to update: %w", err)
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if update.CategoryID != nil {
		existing.CategoryID = update.CategoryID
		updates["category_id"] = existing.CategoryID
	}
	if update.Name != nil {
		existing.Name = strings.TrimSpace(*update.Name)
		updates["name"] = existing.Name
	}
	if update.Description != nil {
		existing.Description = strings.TrimSpace(*update.Description)
		updates["description"] = existing.Description
	}
	if update.Price != nil {
		existing.Price = *update.Price
		updates["price"] = existing.Price
	}
	if update.BasePrice != nil {
		existing.BasePrice = *update.BasePrice
		updates["base_price"] = existing.BasePrice
	}
	if update.RateType != nil {
		existing.RateType = strings.ToUpper(strings.TrimSpace(*update.RateType))
		updates["rate_type"] = existing.RateType
	}
	if update.DurationMinutes != nil {
		existing.DurationMinutes = *update.DurationMinutes
		updates["duration_minutes"] = existing.DurationMinutes
	}
	if update.IsActive != nil {
		existing.IsActive = *update.IsActive
		updates["is_active"] = existing.IsActive
	}

	if err := r.db.WithContext(ctx).Model(&domain.Service{}).Where("id = ? AND worker_id = ?", serviceID, workerID).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating service record: %w", err)
	}

	r.syncWorkerBasePrice(ctx, workerID)
	return &existing, nil
}

func (r *PostgresWorkerRepository) DeleteService(ctx context.Context, workerID string, serviceID string) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("deleting service: %w", err)
	}
	workerID = strings.TrimSpace(workerID)
	serviceID = strings.TrimSpace(serviceID)
	if workerID == "" || serviceID == "" {
		return domain.ErrInvalidInput
	}

	res := r.db.WithContext(ctx).
		Model(&domain.Service{}).
		Where("id = ? AND worker_id = ?", serviceID, workerID).
		Update("is_active", false)
	if res.Error != nil {
		return fmt.Errorf("deactivating service: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return domain.ErrServiceNotFound
	}
	r.syncWorkerBasePrice(ctx, workerID)
	return nil
}

func (r *PostgresWorkerRepository) UpdateProfile(ctx context.Context, id string, profile *domain.WorkerProfileUpdate) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker profile: %w", err)
	}
	if profile == nil {
		return nil, domain.ErrInvalidInput
	}
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, id)
		}
		if err != nil {
			return nil, err
		}
	}

	if strings.TrimSpace(profile.Name) != "" {
		worker.Name = strings.TrimSpace(profile.Name)
	}
	worker.Bio = strings.TrimSpace(profile.Bio)
	if strings.TrimSpace(profile.AvatarURL) != "" {
		worker.AvatarURL = strings.TrimSpace(profile.AvatarURL)
	}
	if strings.TrimSpace(profile.Zone) != "" {
		worker.Zone = strings.TrimSpace(profile.Zone)
	}
	if strings.TrimSpace(profile.PhoneNumber) != "" {
		worker.PhoneNumber = strings.TrimSpace(profile.PhoneNumber)
	}
	if strings.TrimSpace(profile.WhatsAppNumber) != "" {
		worker.WhatsAppNumber = strings.TrimSpace(profile.WhatsAppNumber)
	}
	if strings.TrimSpace(profile.Email) != "" {
		worker.Email = strings.TrimSpace(profile.Email)
	}
	if strings.TrimSpace(profile.Address) != "" {
		worker.Address = strings.TrimSpace(profile.Address)
	}
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker profile update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) UpdateRates(ctx context.Context, idOrSlug string, basePrice float64, rateType string) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker rates: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	worker.BasePrice = basePrice
	worker.RateType = rateType
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker rates update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) UpdateLocationSettings(ctx context.Context, idOrSlug string, update *domain.WorkerLocationSettingsUpdate) (*domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker location settings: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" || update == nil {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	if update.Lat != nil {
		worker.Lat = update.Lat
	}
	if update.Lng != nil {
		worker.Lng = update.Lng
	}
	if update.MaxRadiusKM > 0 {
		worker.MaxRadiusKM = update.MaxRadiusKM
	}
	if update.FreeRadiusKM >= 0 {
		worker.FreeRadiusKM = update.FreeRadiusKM
	}
	if update.ExtraFeePerKM >= 0 {
		worker.ExtraFeePerKM = update.ExtraFeePerKM
	}
	worker.UpdatedAt = time.Now().UTC()

	if err := r.db.WithContext(ctx).Save(worker).Error; err != nil {
		return nil, fmt.Errorf("saving worker location settings update: %w", err)
	}

	return worker, nil
}

func (r *PostgresWorkerRepository) GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("querying worker schedules: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	var schedules []domain.WorkerSchedule
	err = r.db.WithContext(ctx).
		Where("worker_id = ?", worker.ID).
		Order("day_of_week ASC").
		Find(&schedules).Error
	if err != nil {
		return nil, fmt.Errorf("querying worker schedules: %w", err)
	}

	if len(schedules) == 0 {
		// Provide default weekly schedule (all 7 days)
		schedules = make([]domain.WorkerSchedule, 7)
		for d := 0; d < 7; d++ {
			schedules[d] = domain.WorkerSchedule{
				WorkerID:      worker.ID,
				DayOfWeek:     d,
				DayName:       domain.GetDayName(d),
				IsActive:      true,
				SlotMorning:   true,
				SlotAfternoon: true,
				SlotEvening:   false,
			}
		}
	} else {
		for i := range schedules {
			schedules[i].DayName = domain.GetDayName(schedules[i].DayOfWeek)
		}
	}

	return schedules, nil
}

func (r *PostgresWorkerRepository) UpdateWorkerSchedules(ctx context.Context, idOrSlug string, schedules []domain.WorkerSchedule) ([]domain.WorkerSchedule, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("updating worker schedules: %w", err)
	}
	idOrSlug = strings.TrimSpace(idOrSlug)
	if idOrSlug == "" {
		return nil, domain.ErrInvalidInput
	}

	worker, err := r.GetByID(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, domain.ErrWorkerNotFound) {
			worker, err = r.GetBySlug(ctx, idOrSlug)
		}
		if err != nil {
			return nil, err
		}
	}

	tx := r.db.WithContext(ctx).Begin()
	now := time.Now().UTC()

	for _, item := range schedules {
		if item.DayOfWeek < 0 || item.DayOfWeek > 6 {
			tx.Rollback()
			return nil, domain.ErrInvalidScheduleDay
		}

		var existing domain.WorkerSchedule
		err := tx.Where("worker_id = ? AND day_of_week = ?", worker.ID, item.DayOfWeek).First(&existing).Error
		if err == nil {
			existing.IsActive = item.IsActive
			existing.SlotMorning = item.SlotMorning
			existing.SlotAfternoon = item.SlotAfternoon
			existing.SlotEvening = item.SlotEvening
			existing.UpdatedAt = now
			if err := tx.Select("is_active", "slot_morning", "slot_afternoon", "slot_evening", "updated_at").Save(&existing).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("saving worker schedule: %w", err)
			}
		} else {
			item.WorkerID = worker.ID
			item.CreatedAt = now
			item.UpdatedAt = now
			if err := tx.Select("*").Omit("DayName").Create(&item).Error; err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("creating worker schedule: %w", err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("committing worker schedules update: %w", err)
	}

	return r.GetWorkerSchedules(ctx, worker.ID)
}

// CreateWorkerWithAccountTx membuat worker, worker_schedules, dan worker_accounts dalam satu transaksi atomik
func (r *PostgresWorkerRepository) CreateWorkerWithAccountTx(ctx context.Context, worker *domain.Worker, schedules []domain.WorkerSchedule, account *domain.WorkerAccount) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if worker == nil || account == nil {
		return domain.ErrInvalidInput
	}

	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return fmt.Errorf("memulai transaksi database: %w", tx.Error)
	}

	// 1. Simpan entitas Worker
	if err := tx.Create(worker).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("menyimpan worker baru: %w", err)
	}

	// 2. Simpan entitas Schedules default (7 hari)
	now := time.Now().UTC()
	for i := range schedules {
		schedules[i].WorkerID = worker.ID
		schedules[i].CreatedAt = now
		schedules[i].UpdatedAt = now
		if err := tx.Select("*").Omit("DayName").Create(&schedules[i]).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("menyimpan jadwal worker: %w", err)
		}
	}

	// 3. Simpan entitas WorkerAccount
	account.WorkerID = &worker.ID
	account.CreatedAt = now
	account.UpdatedAt = now
	if err := tx.Create(account).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("menyimpan akun worker: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("melakukan commit transaksi: %w", err)
	}

	return nil
}

// GetAdminWorkerList mengambil daftar seluruh pekerja untuk tampilan panel admin
func (r *PostgresWorkerRepository) GetAdminWorkerList(ctx context.Context) ([]domain.AdminWorkerListItem, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	items := make([]domain.AdminWorkerListItem, 0)
	query := `
		SELECT 
			CAST(wa.id AS TEXT) as account_id,
			COALESCE(CAST(w.id AS TEXT), '') as worker_id,
			COALESCE(w.slug, '') as slug,
			COALESCE(w.name, '') as name,
			COALESCE(w.bio, '') as bio,
			COALESCE(w.zone, '') as zone,
			COALESCE((SELECT MIN(s.price) FROM services s WHERE s.worker_id = w.id AND s.is_active = true), w.base_price, 0) as base_price,
			COALESCE(w.rate_type, 'HOURLY') as rate_type,
			COALESCE(w.avatar_url, '') as avatar_url,
			COALESCE(w.rating, 0) as rating,
			COALESCE(w.review_count, 0) as review_count,
			COALESCE(wa.phone_number, w.phone_number, '') as phone_number,
			COALESCE(w.whatsapp_number, wa.phone_number, '') as whatsapp_number,
			wa.email,
			wa.role,
			wa.account_status,
			wa.must_change_password,
			wa.created_at
		FROM worker_accounts wa
		LEFT JOIN workers w ON wa.worker_id = w.id
		WHERE wa.role = 'WORKER'
		ORDER BY wa.created_at DESC
	`

	if err := r.db.WithContext(ctx).Raw(query).Scan(&items).Error; err != nil {
		return nil, fmt.Errorf("mengambil daftar mitra admin: %w", err)
	}

	if items == nil {
		items = make([]domain.AdminWorkerListItem, 0)
	}

	return items, nil
}

// GetAdminStats mengambil agregasi data statistik mitra dan pemesanan secara riil dari database
func (r *PostgresWorkerRepository) GetAdminStats(ctx context.Context) (*domain.AdminStats, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	stats := &domain.AdminStats{}

	var counts struct {
		TotalWorkers     int64 `gorm:"column:total_workers"`
		ActiveWorkers    int64 `gorm:"column:active_workers"`
		SuspendedWorkers int64 `gorm:"column:suspended_workers"`
	}

	queryWorkers := `
		SELECT 
			COALESCE(COUNT(CASE WHEN role = 'WORKER' THEN 1 END), 0) as total_workers,
			COALESCE(COUNT(CASE WHEN role = 'WORKER' AND account_status = 'ACTIVE' THEN 1 END), 0) as active_workers,
			COALESCE(COUNT(CASE WHEN role = 'WORKER' AND account_status = 'SUSPENDED' THEN 1 END), 0) as suspended_workers
		FROM worker_accounts
	`
	if err := r.db.WithContext(ctx).Raw(queryWorkers).Scan(&counts).Error; err != nil {
		return nil, fmt.Errorf("menghitung statistik mitra admin: %w", err)
	}

	stats.TotalWorkers = counts.TotalWorkers
	stats.ActiveWorkers = counts.ActiveWorkers
	stats.SuspendedWorkers = counts.SuspendedWorkers

	var totalBookings int64
	if err := r.db.WithContext(ctx).Table("bookings").Count(&totalBookings).Error; err != nil {
		return nil, fmt.Errorf("menghitung total pemesanan admin: %w", err)
	}
	stats.TotalBookings = totalBookings

	return stats, nil
}

// UpdateWorkerAccountStatus mengubah status akun mitra (ACTIVE/SUSPENDED) dan menyinkronkan is_active worker
func (r *PostgresWorkerRepository) UpdateWorkerAccountStatus(ctx context.Context, workerID string, newStatus string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	workerID = strings.TrimSpace(workerID)
	if workerID == "" {
		return domain.ErrInvalidInput
	}

	newStatus = strings.ToUpper(strings.TrimSpace(newStatus))
	if newStatus != domain.AccountStatusActive && newStatus != domain.AccountStatusSuspended {
		return fmt.Errorf("%w: status akun tidak valid, harus ACTIVE atau SUSPENDED", domain.ErrInvalidInput)
	}

	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return fmt.Errorf("memulai transaksi status: %w", tx.Error)
	}

	isActive := (newStatus == domain.AccountStatusActive)

	// 1. Update worker_accounts
	resAccount := tx.Model(&domain.WorkerAccount{}).
		Where("worker_id = ? OR id = ?", workerID, workerID).
		Update("account_status", newStatus)
	if resAccount.Error != nil {
		tx.Rollback()
		return fmt.Errorf("memperbarui status worker_accounts: %w", resAccount.Error)
	}
	if resAccount.RowsAffected == 0 {
		tx.Rollback()
		return domain.ErrWorkerNotFound
	}

	// 2. Update workers is_active
	resWorker := tx.Model(&domain.Worker{}).
		Where("id = ?", workerID).
		Update("is_active", isActive)
	if resWorker.Error != nil {
		tx.Rollback()
		return fmt.Errorf("memperbarui is_active workers: %w", resWorker.Error)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("commit perubahan status: %w", err)
	}

	return nil
}

// GetAccountByEmailOrPhone mencari akun berdasarkan email atau nomor telepon untuk autentikasi
func (r *PostgresWorkerRepository) GetAccountByEmailOrPhone(ctx context.Context, identifier string) (*domain.WorkerAccount, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	identifier = strings.TrimSpace(identifier)
	if identifier == "" {
		return nil, domain.ErrInvalidInput
	}

	var account domain.WorkerAccount
	err := r.db.WithContext(ctx).
		Preload("Worker").
		Where("LOWER(email) = LOWER(?) OR phone_number = ?", identifier, identifier).
		First(&account).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("mencari akun dengan identitas: %w", err)
	}

	return &account, nil
}

// GetAccountByID mencari akun berdasarkan ID UUID
func (r *PostgresWorkerRepository) GetAccountByID(ctx context.Context, accountID string) (*domain.WorkerAccount, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return nil, domain.ErrInvalidInput
	}

	var account domain.WorkerAccount
	err := r.db.WithContext(ctx).
		Preload("Worker").
		Where("id = ?", accountID).
		First(&account).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("mencari akun berdasarkan id: %w", err)
	}

	return &account, nil
}

// RecordFailedLogin mencatat kegagalan login pada akun dan mengunci sementara bila mencapai batas maksimal
func (r *PostgresWorkerRepository) RecordFailedLogin(ctx context.Context, accountID string, maxAttempts int, lockDuration time.Duration) (int, *time.Time, error) {
	if err := ctx.Err(); err != nil {
		return 0, nil, err
	}
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return 0, nil, domain.ErrInvalidInput
	}

	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return 0, nil, fmt.Errorf("memulai transaksi pencatatan gagal login: %w", tx.Error)
	}

	var account domain.WorkerAccount
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", accountID).First(&account).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil, domain.ErrWorkerNotFound
		}
		return 0, nil, fmt.Errorf("mencari akun untuk pencatatan gagal login: %w", err)
	}

	now := time.Now().UTC()
	if account.LockedUntil != nil && now.After(*account.LockedUntil) {
		account.FailedLoginAttempts = 0
		account.LockedUntil = nil
	}

	account.FailedLoginAttempts++
	if maxAttempts > 0 && account.FailedLoginAttempts >= maxAttempts {
		until := now.Add(lockDuration)
		account.LockedUntil = &until
	}

	updates := map[string]interface{}{
		"failed_login_attempts": account.FailedLoginAttempts,
		"locked_until":          account.LockedUntil,
		"updated_at":            now,
	}
	if err := tx.Model(&domain.WorkerAccount{}).Where("id = ?", accountID).Updates(updates).Error; err != nil {
		tx.Rollback()
		return 0, nil, fmt.Errorf("memperbarui jumlah kegagalan login: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return 0, nil, fmt.Errorf("melakukan commit pencatatan gagal login: %w", err)
	}

	return account.FailedLoginAttempts, account.LockedUntil, nil
}

// ResetFailedLogin mengembalikan penghitung gagal login ke nol dan membuka kunci akun setelah berhasil masuk
func (r *PostgresWorkerRepository) ResetFailedLogin(ctx context.Context, accountID string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return domain.ErrInvalidInput
	}

	updates := map[string]interface{}{
		"failed_login_attempts": 0,
		"locked_until":          nil,
		"updated_at":            time.Now().UTC(),
	}
	if err := r.db.WithContext(ctx).Model(&domain.WorkerAccount{}).Where("id = ?", accountID).Updates(updates).Error; err != nil {
		return fmt.Errorf("mereset status gagal login akun: %w", err)
	}

	return nil
}

// UpdateAccountPasswordHash memperbarui hash kata sandi akun (misal saat migrasi transparan bcrypt ke Argon2id)
func (r *PostgresWorkerRepository) UpdateAccountPasswordHash(ctx context.Context, accountID string, newHash string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	accountID = strings.TrimSpace(accountID)
	newHash = strings.TrimSpace(newHash)
	if accountID == "" || newHash == "" {
		return domain.ErrInvalidInput
	}

	updates := map[string]interface{}{
		"password_hash": newHash,
		"updated_at":    time.Now().UTC(),
	}
	if err := r.db.WithContext(ctx).Model(&domain.WorkerAccount{}).Where("id = ?", accountID).Updates(updates).Error; err != nil {
		return fmt.Errorf("memperbarui hash kata sandi akun: %w", err)
	}

	return nil
}

// ListPublicWorkers mengambil daftar seluruh mitra aktif untuk halaman beranda / katalog publik
func (r *PostgresWorkerRepository) ListPublicWorkers(ctx context.Context) ([]domain.Worker, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	var workers []domain.Worker
	err := r.db.WithContext(ctx).
		Preload("Services", "is_active = ?", true).
		Where("is_active = ?", true).
		Order("rating DESC, review_count DESC, created_at DESC").
		Find(&workers).Error
	if err != nil {
		return nil, fmt.Errorf("mengambil daftar pekerja publik: %w", err)
	}

	if workers == nil {
		workers = []domain.Worker{}
	}

	return workers, nil
}

// GetWorkerBookings mengambil daftar pesanan milik pekerja berdasarkan worker_id dengan batasan limit
func (r *PostgresWorkerRepository) GetWorkerBookings(ctx context.Context, workerID string, limit int) ([]domain.Booking, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	workerID = strings.TrimSpace(workerID)
	if limit <= 0 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}

	var bookings []domain.Booking
	err := r.db.WithContext(ctx).
		Preload("Service").
		Where("worker_id = ?", workerID).
		Order("created_at DESC").
		Limit(limit).
		Find(&bookings).Error
	if err != nil {
		return nil, fmt.Errorf("mengambil daftar pesanan pekerja: %w", err)
	}

	if bookings == nil {
		bookings = []domain.Booking{}
	}

	return bookings, nil
}

// UpdateBookingStatus memperbarui status pesanan milik pekerja secara aman
func (r *PostgresWorkerRepository) UpdateBookingStatus(ctx context.Context, workerID string, bookingID string, status string) (*domain.Booking, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	workerID = strings.TrimSpace(workerID)
	bookingID = strings.TrimSpace(bookingID)
	status = strings.ToUpper(strings.TrimSpace(status))

	validStatuses := map[string]bool{
		"PENDING_WA": true,
		"CONFIRMED":  true,
		"COMPLETED":  true,
		"CANCELLED":  true,
	}
	if !validStatuses[status] {
		return nil, domain.ErrInvalidBookingStatus
	}

	updates := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now().UTC(),
	}

	res := r.db.WithContext(ctx).
		Model(&domain.Booking{}).
		Where("id = ? AND worker_id = ?", bookingID, workerID).
		Updates(updates)
	if res.Error != nil {
		return nil, fmt.Errorf("memperbarui status booking: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return nil, domain.ErrBookingNotFound
	}

	var updated domain.Booking
	if err := r.db.WithContext(ctx).Preload("Service").Where("id = ?", bookingID).First(&updated).Error; err != nil {
		return nil, fmt.Errorf("mengambil data booking setelah pembaruan: %w", err)
	}

	return &updated, nil
}

// CreateActivationToken menyimpan token aktivasi baru ke database
func (r *PostgresWorkerRepository) CreateActivationToken(ctx context.Context, token *domain.WorkerActivationToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

// GetActivationTokenByHash mencari token aktivasi berdasarkan token_hash
func (r *PostgresWorkerRepository) GetActivationTokenByHash(ctx context.Context, tokenHash string) (*domain.WorkerActivationToken, error) {
	var token domain.WorkerActivationToken
	err := r.db.WithContext(ctx).Where("token_hash = ?", tokenHash).First(&token).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrWorkerNotFound
		}
		return nil, fmt.Errorf("mencari token aktivasi: %w", err)
	}
	return &token, nil
}

// MarkActivationTokenUsed menandai token aktivasi telah digunakan dan mengaktifkan akun pekerja secara transaksional
func (r *PostgresWorkerRepository) MarkActivationTokenUsed(ctx context.Context, tokenID string, workerID string) error {
	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return fmt.Errorf("memulai transaksi aktivasi: %w", tx.Error)
	}

	now := time.Now().UTC()

	// 1. Update token is_used = true
	resToken := tx.Model(&domain.WorkerActivationToken{}).
		Where("id = ? AND is_used = false", tokenID).
		Updates(map[string]interface{}{
			"is_used": true,
			"used_at": now,
		})
	if resToken.Error != nil {
		tx.Rollback()
		return fmt.Errorf("memperbarui status token aktivasi: %w", resToken.Error)
	}
	if resToken.RowsAffected == 0 {
		tx.Rollback()
		return fmt.Errorf("token aktivasi sudah digunakan atau tidak valid")
	}

	// 2. Aktifkan workers (is_active = true)
	if err := tx.Model(&domain.Worker{}).Where("id = ?", workerID).Update("is_active", true).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("mengaktifkan worker: %w", err)
	}

	// 3. Aktifkan worker_accounts (account_status = ACTIVE)
	if err := tx.Model(&domain.WorkerAccount{}).Where("worker_id = ?", workerID).Update("account_status", domain.AccountStatusActive).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("mengaktifkan worker_account: %w", err)
	}

	return tx.Commit().Error
}




