package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupReviewTestEnv(t *testing.T) (service.ReviewService, *repository.MemoryRepository) {
	memRepo := repository.NewMemoryRepository()

	worker := &domain.Worker{
		ID:        uuid.New().String(),
		Slug:      "budi-santoso",
		Name:      "Budi Santoso",
		Zone:      "Jakarta Barat",
		IsActive:  true,
		Rating:    0,
		ReviewCount: 0,
	}
	memRepo.SeedWorker(worker)

	srv := &domain.Service{
		ID:       uuid.New().String(),
		WorkerID: worker.ID,
		Name:     "Servis AC Cuci",
		Price:    100000,
		IsActive: true,
	}
	memRepo.SeedService(srv)

	revService := service.NewReviewService(memRepo, memRepo, memRepo)
	return revService, memRepo
}

func TestReviewService_GetReviewInvitation(t *testing.T) {
	ctx := context.Background()
	revService, memRepo := setupReviewTestEnv(t)

	w, _ := memRepo.GetWorkerBySlug(ctx, "budi-santoso")
	services, _ := memRepo.GetServicesByWorkerID(ctx, w.ID)
	srv := services[0]

	token := "token-rahasia-12345"
	booking := &domain.Booking{
		ID:          uuid.New().String(),
		BookingCode: "BK-REV-001",
		WorkerID:    w.ID,
		ServiceID:   srv.ID,
		ClientName:  "Ahmad Fauzi",
		ClientPhone: "628123456789",
		Location:    "Jl. Mawar No. 10 Jakarta",
		Zone:        "Jakarta Barat",
		BookingDate: time.Now().Add(24 * time.Hour),
		TotalPrice:  100000,
		Status:      "COMPLETED",
		ReviewToken: token,
	}
	require.NoError(t, memRepo.CreateBooking(ctx, booking))

	t.Run("sukses mengambil info undangan review", func(t *testing.T) {
		inv, err := revService.GetReviewInvitation(ctx, "BK-REV-001", token)
		require.NoError(t, err)
		assert.Equal(t, "BK-REV-001", inv.BookingCode)
		assert.Equal(t, "Ahmad Fauzi", inv.ClientName)
		assert.Equal(t, "Budi Santoso", inv.WorkerName)
		assert.Equal(t, "Servis AC Cuci", inv.ServiceName)
		assert.False(t, inv.IsReviewed)
	})

	t.Run("gagal jika token tidak cocok", func(t *testing.T) {
		_, err := revService.GetReviewInvitation(ctx, "BK-REV-001", "wrong-token")
		assert.ErrorIs(t, err, domain.ErrInvalidReviewToken)
	})

	t.Run("gagal jika status booking belum completed", func(t *testing.T) {
		bPending := &domain.Booking{
			ID:          uuid.New().String(),
			BookingCode: "BK-REV-PENDING",
			WorkerID:    w.ID,
			ServiceID:   srv.ID,
			ClientName:  "Dewi Sartika",
			Status:      "PENDING_WA",
			ReviewToken: "token-pending",
		}
		require.NoError(t, memRepo.CreateBooking(ctx, bPending))

		_, err := revService.GetReviewInvitation(ctx, "BK-REV-PENDING", "token-pending")
		assert.ErrorIs(t, err, domain.ErrBookingNotCompleted)
	})
}

func TestReviewService_SubmitReview(t *testing.T) {
	ctx := context.Background()
	revService, memRepo := setupReviewTestEnv(t)

	w, _ := memRepo.GetWorkerBySlug(ctx, "budi-santoso")
	services, _ := memRepo.GetServicesByWorkerID(ctx, w.ID)
	srv := services[0]

	token := "token-submit-999"
	booking := &domain.Booking{
		ID:          uuid.New().String(),
		BookingCode: "BK-SUBMIT-001",
		WorkerID:    w.ID,
		ServiceID:   srv.ID,
		ClientName:  "Budi Santoso",
		Status:      "COMPLETED",
		ReviewToken: token,
	}
	require.NoError(t, memRepo.CreateBooking(ctx, booking))

	t.Run("validasi menolak rating di luar 1-5", func(t *testing.T) {
		req := domain.SubmitReviewRequest{
			BookingCode: "BK-SUBMIT-001",
			Token:       token,
			Rating:      6,
			Comment:     "Pengerjaan sangat baik dan rapi",
		}
		_, err := revService.SubmitReview(ctx, req)
		assert.ErrorIs(t, err, domain.ErrInvalidRating)
	})

	t.Run("validasi menolak komentar kurang dari 5 karakter", func(t *testing.T) {
		req := domain.SubmitReviewRequest{
			BookingCode: "BK-SUBMIT-001",
			Token:       token,
			Rating:      5,
			Comment:     "Ok",
		}
		_, err := revService.SubmitReview(ctx, req)
		assert.ErrorIs(t, err, domain.ErrReviewCommentTooShort)
	})

	t.Run("sukses submit ulasan dan kalkulasi rating pekerja", func(t *testing.T) {
		req := domain.SubmitReviewRequest{
			BookingCode: "BK-SUBMIT-001",
			Token:       token,
			Rating:      5,
			Comment:     "Teknisi datang tepat waktu dan AC kembali dingin optimal!",
			IsAnonymous: true,
		}
		rev, err := revService.SubmitReview(ctx, req)
		require.NoError(t, err)
		assert.Equal(t, 5, rev.Rating)
		assert.True(t, rev.IsAnonymous)

		// Verifikasi worker rating ter-update
		updatedWorker, _ := memRepo.GetByID(ctx, w.ID)
		assert.Equal(t, 1, updatedWorker.ReviewCount)
		assert.Equal(t, 5.0, updatedWorker.Rating)

		// Verifikasi publik review menampilkan nama tersamar
		pubReviews, total, err := revService.GetPublicReviews(ctx, "budi-santoso", 10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Equal(t, "Budi S.", pubReviews[0].ClientDisplayName)
	})

	t.Run("gagal submit ulasan kedua kali untuk booking yang sama", func(t *testing.T) {
		req := domain.SubmitReviewRequest{
			BookingCode: "BK-SUBMIT-001",
			Token:       token,
			Rating:      4,
			Comment:     "Ulasan kedua harus ditolak oleh sistem",
		}
		_, err := revService.SubmitReview(ctx, req)
		assert.ErrorIs(t, err, domain.ErrBookingAlreadyReviewed)
	})
}

