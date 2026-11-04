package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
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

	var items []domain.AdminWorkerListItem
	query := `
		SELECT 
			wa.id as account_id,
			COALESCE(w.id, '') as worker_id,
			COALESCE(w.slug, '') as slug,
			COALESCE(w.name, '') as name,
			COALESCE(w.bio, '') as bio,
			COALESCE(w.zone, '') as zone,
			COALESCE(w.base_price, 0) as base_price,
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

	return items, nil
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



