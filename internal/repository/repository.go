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

	// Manajemen Admin & Otentikasi
	CreateWorkerWithAccountTx(ctx context.Context, worker *domain.Worker, schedules []domain.WorkerSchedule, account *domain.WorkerAccount) error
	GetAdminWorkerList(ctx context.Context) ([]domain.AdminWorkerListItem, error)
	GetAdminStats(ctx context.Context) (*domain.AdminStats, error)
	UpdateWorkerAccountStatus(ctx context.Context, workerID string, newStatus string) error
	GetAccountByEmailOrPhone(ctx context.Context, identifier string) (*domain.WorkerAccount, error)
	GetAccountByID(ctx context.Context, accountID string) (*domain.WorkerAccount, error)
}

type BookingRepository interface {
	CreateBooking(ctx context.Context, booking *domain.Booking) error
	GetServiceByID(ctx context.Context, serviceID string) (*domain.Service, error)
	GetWorkerByID(ctx context.Context, workerID string) (*domain.Worker, error)
	GetWorkerBySlug(ctx context.Context, slug string) (*domain.Worker, error)
	GetBookingsByWorkerAndDateRange(ctx context.Context, workerID string, startTime, endTime time.Time) ([]domain.Booking, error)
	GetWorkerSchedules(ctx context.Context, idOrSlug string) ([]domain.WorkerSchedule, error)
}

