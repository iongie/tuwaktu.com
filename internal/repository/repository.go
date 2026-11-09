package repository

import (
	"context"
	"time"

	"tuwaktu.com/internal/domain"
)

type WorkerRepository interface {
	GetBySlug(ctx context.Context, slug string) (*domain.Worker, error)
	GetByID(ctx context.Context, id string) (*domain.Worker, error)
	GetServicesByWorkerID(ctx context.Context, workerID string) ([]domain.Service, error)
	CreateService(ctx context.Context, service *domain.Service) (*domain.Service, error)
	UpdateService(ctx context.Context, workerID string, serviceID string, update *domain.UpdateServicePayload) (*domain.Service, error)
	DeleteService(ctx context.Context, workerID string, serviceID string) error
	UpdateProfile(ctx context.Context, id string, profile *domain.WorkerProfileUpdate) (*domain.Worker, error)
	UpdateRates(ctx context.Context, idOrSlug string, basePrice float64, rateType string) (*domain.Worker, error)
	UpdateLocationSettings(ctx context.Context, idOrSlug string, update *domain.WorkerLocationSettingsUpdate) (*domain.Worker, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error)
	UpdateWorkerSchedules(ctx context.Context, idOrSlug string, schedules []domain.WorkerSchedule) ([]domain.WorkerSchedule, error)
	ListPublicWorkers(ctx context.Context) ([]domain.Worker, error)
	GetWorkerBookings(ctx context.Context, workerID string, limit int) ([]domain.Booking, error)
	UpdateBookingStatus(ctx context.Context, workerID string, bookingID string, status string) (*domain.Booking, error)

	// Manajemen Admin & Otentikasi
	CreateWorkerWithAccountTx(ctx context.Context, worker *domain.Worker, schedules []domain.WorkerSchedule, account *domain.WorkerAccount) error
	GetAdminWorkerList(ctx context.Context) ([]domain.AdminWorkerListItem, error)
	GetAdminStats(ctx context.Context) (*domain.AdminStats, error)
	UpdateWorkerAccountStatus(ctx context.Context, workerID string, newStatus string) error
	GetAccountByEmailOrPhone(ctx context.Context, identifier string) (*domain.WorkerAccount, error)
	GetAccountByID(ctx context.Context, accountID string) (*domain.WorkerAccount, error)
	RecordFailedLogin(ctx context.Context, accountID string, maxAttempts int, lockDuration time.Duration) (int, *time.Time, error)
	ResetFailedLogin(ctx context.Context, accountID string) error
	UpdateAccountPasswordHash(ctx context.Context, accountID string, newHash string) error

	// Token Aktivasi Pendaftaran Manual via WhatsApp
	CreateActivationToken(ctx context.Context, token *domain.WorkerActivationToken) error
	GetActivationTokenByHash(ctx context.Context, tokenHash string) (*domain.WorkerActivationToken, error)
	MarkActivationTokenUsed(ctx context.Context, tokenID string, workerID string) error
}

type BookingRepository interface {
	CreateBooking(ctx context.Context, booking *domain.Booking) error
	GetServiceByID(ctx context.Context, serviceID string) (*domain.Service, error)
	GetWorkerByID(ctx context.Context, workerID string) (*domain.Worker, error)
	GetWorkerBySlug(ctx context.Context, slug string) (*domain.Worker, error)
	GetBookingByCode(ctx context.Context, bookingCode string) (*domain.Booking, error)
	GetBookingsByWorkerAndDateRange(ctx context.Context, workerID string, startTime, endTime time.Time) ([]domain.Booking, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error)
}

type ReviewRepository interface {
	CreateReviewTx(ctx context.Context, review *domain.Review) error
	GetReviewByBookingID(ctx context.Context, bookingID string) (*domain.Review, error)
	GetPublicReviewsByWorkerSlug(ctx context.Context, slug string, limit, offset int) ([]domain.PublicReviewItem, int64, error)
	GetWorkerDashboardReviews(ctx context.Context, workerID string, limit, offset int) ([]domain.WorkerDashboardReviewItem, int64, error)
	GetWorkerRatingStats(ctx context.Context, workerID string) (avgRating float64, reviewCount int, err error)
}

type CategoryRepository interface {
	ListPublicCategories(ctx context.Context) ([]domain.Category, error)
	ListAdminCategories(ctx context.Context) ([]domain.Category, error)
	GetByID(ctx context.Context, id string) (*domain.Category, error)
	GetBySlug(ctx context.Context, slug string) (*domain.Category, error)
	Create(ctx context.Context, category *domain.Category) (*domain.Category, error)
	Update(ctx context.Context, id string, payload *domain.UpdateCategoryPayload) (*domain.Category, error)
	Delete(ctx context.Context, id string) error
}


