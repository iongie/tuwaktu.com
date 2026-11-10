package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/geo"
	"tuwaktu.com/internal/repository"
)

type BookingService interface {
	CreateBooking(ctx context.Context, req domain.CreateBookingRequest) (*domain.PublicBookingResponse, error)
	CalculateFee(ctx context.Context, req domain.CalculateFeeRequest) (*domain.FeeCalculationResponse, error)
	GetAvailableSlots(ctx context.Context, workerSlug string, dateStr string, serviceID string) (*domain.AvailableSlotsResponse, error)
}

type bookingService struct {
	repo repository.BookingRepository
}

func NewBookingService(repo repository.BookingRepository) BookingService {
	return &bookingService{repo: repo}
}

func (s *bookingService) CreateBooking(ctx context.Context, req domain.CreateBookingRequest) (*domain.PublicBookingResponse, error) {
	// 1. Validate request payload
	bookingDate, err := req.Validate()
	if err != nil {
		return nil, err
	}

	// 2. Validate Service exists and is active
	srv, err := s.repo.GetServiceByID(ctx, req.ServiceID)
	if err != nil {
		return nil, err
	}
	if !srv.IsActive {
		return nil, domain.ErrServiceNotFound
	}

	// 3. Resolve Worker: from worker_id, worker_slug, or automatically inferred from service
	var worker *domain.Worker
	if strings.TrimSpace(req.WorkerID) != "" {
		worker, err = s.repo.GetWorkerByID(ctx, strings.TrimSpace(req.WorkerID))
		if err != nil {
			return nil, err
		}
	} else if strings.TrimSpace(req.WorkerSlug) != "" {
		worker, err = s.repo.GetWorkerBySlug(ctx, strings.TrimSpace(req.WorkerSlug))
		if err != nil {
			return nil, err
		}
	} else {
		// Automatically infer worker from the chosen service
		worker, err = s.repo.GetWorkerByID(ctx, srv.WorkerID)
		if err != nil {
			return nil, err
		}
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}

	// Ensure the service belongs to the resolved worker
	if srv.WorkerID != worker.ID {
		return nil, domain.ErrServiceWorkerMismatch
	}

	// 4. Resolve Location and Zone
	location := strings.TrimSpace(req.Location)
	zone := strings.TrimSpace(req.Zone)
	if zone == "" {
		zone = worker.Zone
	}
	if location == "" {
		location = zone
	}

	// 5. Calculate pricing and validate radius if client coordinates are provided
	var transportFee float64
	totalPrice := srv.Price

	if req.ClientLat != nil && req.ClientLng != nil {
		clientLat := *req.ClientLat
		clientLng := *req.ClientLng

		if clientLat < -90.0 || clientLat > 90.0 {
			return nil, fmt.Errorf("%w: titik lintang klien (client_lat) harus berada di antara -90 dan 90", domain.ErrInvalidInput)
		}
		if clientLng < -180.0 || clientLng > 180.0 {
			return nil, fmt.Errorf("%w: titik bujur klien (client_lng) harus berada di antara -180 dan 180", domain.ErrInvalidInput)
		}

		if worker.Lat != nil && worker.Lng != nil {
			distance := geo.CalculateDistance(*worker.Lat, *worker.Lng, clientLat, clientLng)
			maxRadius := worker.MaxRadiusKM
			if maxRadius <= 0 {
				maxRadius = 10.0
			}
			if distance > maxRadius {
				return nil, domain.ErrOutOfServiceRadius
			}

			freeRadius := worker.FreeRadiusKM
			if freeRadius < 0 {
				freeRadius = 3.0
			}

			chargeableKM := math.Round(math.Max(0.0, distance-freeRadius)*100.0) / 100.0
			transportFee = math.Ceil(chargeableKM) * float64(worker.ExtraFeePerKM)
			totalPrice = srv.Price + transportFee
		}
	}

	// 6. Generate unique booking code
	bookingCode := generateBookingCode()

	bookingID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("generating booking id: %w", err)
	}

	durationMinutes := srv.DurationMinutes
	if durationMinutes <= 0 {
		durationMinutes = 60
	}
	startTime := bookingDate
	endTime := startTime.Add(time.Duration(durationMinutes) * time.Minute)

	// Check for collision with existing worker bookings (including 60 min transit buffer)
	// only when booking_date was explicitly specified by the client
	if strings.TrimSpace(req.BookingDate) != "" {
		locWIB := time.FixedZone("WIB", 7*3600)
		dateStr := bookingDate.In(locWIB).Format("2006-01-02")
		override, err := s.repo.GetWorkerDateOverrideByDate(ctx, worker.ID, dateStr)
		if err == nil && override != nil {
			if override.IsHoliday {
				return nil, fmt.Errorf("%w: mitra sedang libur pada tanggal ini", domain.ErrSlotUnavailable)
			}
			wibHour := bookingDate.In(locWIB).Hour()
			if wibHour >= 8 && wibHour < 12 && override.IsSlot1Locked {
				return nil, fmt.Errorf("%w: slot pagi sedang dinonaktifkan oleh mitra pada tanggal ini", domain.ErrSlotUnavailable)
			}
			if wibHour >= 13 && wibHour < 17 && override.IsSlot2Locked {
				return nil, fmt.Errorf("%w: slot siang sedang dinonaktifkan oleh mitra pada tanggal ini", domain.ErrSlotUnavailable)
			}
			if wibHour >= 17 && wibHour < 21 && override.IsSlot3Locked {
				return nil, fmt.Errorf("%w: slot sore sedang dinonaktifkan oleh mitra pada tanggal ini", domain.ErrSlotUnavailable)
			}
		}

		buffer := domain.TransitBufferDuration
		existingBookings, err := s.repo.GetBookingsByWorkerAndDateRange(ctx, worker.ID, startTime.Add(-buffer-4*time.Hour), endTime.Add(buffer+4*time.Hour))
		if err == nil {
			for _, b := range existingBookings {
				if b.Status == "CANCELLED" {
					continue
				}
				bStart := b.BookingDate
				bEnd := bStart.Add(60 * time.Minute)
				if b.StartTime != nil {
					bStart = *b.StartTime
				}
				if b.EndTime != nil {
					bEnd = *b.EndTime
				}
				if startTime.Before(bEnd.Add(buffer)) && endTime.After(bStart.Add(-buffer)) {
					return nil, domain.ErrSlotUnavailable
				}
			}
		}
	}

	bookingStatus := "PENDING"
	if strings.TrimSpace(req.Status) != "" {
		bookingStatus = strings.TrimSpace(req.Status)
	}

	now := time.Now().UTC()
	booking := &domain.Booking{
		ID:          bookingID.String(),
		BookingCode: bookingCode,
		WorkerID:    worker.ID,
		ServiceID:   srv.ID,
		ClientName:  strings.TrimSpace(req.ClientName),
		ClientPhone: strings.TrimSpace(req.ClientPhone),
		ClientEmail: strings.TrimSpace(req.ClientEmail),
		Location:    location,
		Zone:        zone,
		BookingDate: bookingDate,
		StartTime:   &startTime,
		EndTime:     &endTime,
		Notes:       strings.TrimSpace(req.Notes),
		TotalPrice:  totalPrice,
		Status:      bookingStatus,
		ReviewToken: domain.GenerateReviewToken(),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// 7. Persist to database
	if err := s.repo.CreateBooking(ctx, booking); err != nil {
		return nil, fmt.Errorf("persisting booking: %w", err)
	}

	// 8. Return sanitized response
	res := &domain.PublicBookingResponse{
		BookingID:      booking.ID,
		BookingCode:    booking.BookingCode,
		WorkerID:       worker.ID,
		WorkerName:     worker.Name,
		WorkerWhatsApp: worker.WhatsAppNumber,
		ServiceID:      srv.ID,
		ServiceName:    srv.Name,
		ClientName:     booking.ClientName,
		Location:       booking.Location,
		Zone:           booking.Zone,
		BookingDate:    booking.BookingDate,
		StartTime:      &startTime,
		EndTime:        &endTime,
		Notes:          booking.Notes,
		TotalPrice:     booking.TotalPrice,
		TransportFee:   transportFee,
		Status:         booking.Status,
		CreatedAt:      booking.CreatedAt,
	}

	return res, nil
}

func generateBookingCode() string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("TW-%s", uuid.NewString()[:8])
	}
	today := time.Now().Format("20060102")
	return fmt.Sprintf("TW-%s-%s", today, strings.ToUpper(hex.EncodeToString(bytes)))
}

func (s *bookingService) CalculateFee(ctx context.Context, req domain.CalculateFeeRequest) (*domain.FeeCalculationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	serviceID := strings.TrimSpace(req.ServiceID)
	if serviceID == "" {
		return nil, fmt.Errorf("%w: pilihan layanan (service_id) wajib diisi", domain.ErrInvalidInput)
	}

	if req.ClientLat == nil || req.ClientLng == nil {
		return nil, fmt.Errorf("%w: titik koordinat klien (client_lat dan client_lng) wajib diisi", domain.ErrInvalidInput)
	}

	clientLat := *req.ClientLat
	clientLng := *req.ClientLng

	if clientLat < -90.0 || clientLat > 90.0 {
		return nil, fmt.Errorf("%w: titik lintang klien (client_lat) harus berada di antara -90 dan 90", domain.ErrInvalidInput)
	}
	if clientLng < -180.0 || clientLng > 180.0 {
		return nil, fmt.Errorf("%w: titik bujur klien (client_lng) harus berada di antara -180 dan 180", domain.ErrInvalidInput)
	}

	// 1. Resolve service
	srv, err := s.repo.GetServiceByID(ctx, serviceID)
	if err != nil {
		return nil, err
	}
	if !srv.IsActive {
		return nil, domain.ErrServiceNotFound
	}

	// 2. Resolve worker
	var worker *domain.Worker
	if strings.TrimSpace(req.WorkerID) != "" {
		worker, err = s.repo.GetWorkerByID(ctx, strings.TrimSpace(req.WorkerID))
		if err != nil {
			return nil, err
		}
	} else if strings.TrimSpace(req.WorkerSlug) != "" {
		worker, err = s.repo.GetWorkerBySlug(ctx, strings.TrimSpace(req.WorkerSlug))
		if err != nil {
			return nil, err
		}
	} else {
		worker, err = s.repo.GetWorkerByID(ctx, srv.WorkerID)
		if err != nil {
			return nil, err
		}
	}

	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}
	if srv.WorkerID != worker.ID {
		return nil, domain.ErrServiceWorkerMismatch
	}

	// 3. Ensure worker location is configured
	if worker.Lat == nil || worker.Lng == nil {
		return nil, domain.ErrWorkerLocationNotSet
	}

	// 4. Calculate straight-line distance via Haversine formula
	distance := geo.CalculateDistance(*worker.Lat, *worker.Lng, clientLat, clientLng)

	maxRadius := worker.MaxRadiusKM
	if maxRadius <= 0 {
		maxRadius = 10.0
	}

	if distance > maxRadius {
		return nil, domain.ErrOutOfServiceRadius
	}

	freeRadius := worker.FreeRadiusKM
	if freeRadius < 0 {
		freeRadius = 3.0
	}

	chargeableKM := math.Round(math.Max(0.0, distance-freeRadius)*100.0) / 100.0
	extraFee := math.Ceil(chargeableKM) * float64(worker.ExtraFeePerKM)
	totalPrice := srv.Price + extraFee

	return &domain.FeeCalculationResponse{
		DistanceKM:     distance,
		MaxRadiusKM:    maxRadius,
		FreeRadiusKM:   freeRadius,
		ServicePrice:   srv.Price,
		ExtraFeePerKM:  worker.ExtraFeePerKM,
		TransportFee:   extraFee,
		TotalPrice:     totalPrice,
		IsWithinRadius: true,
	}, nil
}

func (s *bookingService) GetAvailableSlots(ctx context.Context, workerSlug string, dateStr string, serviceID string) (*domain.AvailableSlotsResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	workerSlug = strings.ToLower(strings.TrimSpace(workerSlug))
	if workerSlug == "" {
		return nil, fmt.Errorf("%w: slug pekerja wajib diisi", domain.ErrInvalidInput)
	}

	worker, err := s.repo.GetWorkerBySlug(ctx, workerSlug)
	if err != nil {
		return nil, err
	}
	if !worker.IsActive {
		return nil, domain.ErrWorkerInactive
	}

	if strings.TrimSpace(serviceID) != "" {
		srv, err := s.repo.GetServiceByID(ctx, strings.TrimSpace(serviceID))
		if err != nil {
			return nil, err
		}
		if srv.WorkerID != worker.ID {
			return nil, domain.ErrServiceWorkerMismatch
		}
	}

	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" {
		return nil, fmt.Errorf("%w: parameter tanggal (date) wajib diisi dengan format YYYY-MM-DD", domain.ErrInvalidInput)
	}

	parsedDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, fmt.Errorf("%w: format tanggal tidak valid, gunakan format YYYY-MM-DD (contoh: 2026-11-03)", domain.ErrInvalidInput)
	}

	// Use Indonesia Western Time (WIB, UTC+7) as base operational timezone
	loc := time.FixedZone("WIB", 7*3600)
	dateInLoc := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, loc)

	dayOfWeek := int(dateInLoc.Weekday())
	dayName := domain.GetDayName(dayOfWeek)

	// Fetch schedules for worker
	schedules, err := s.repo.GetWorkerSchedules(ctx, worker.ID)
	if err != nil {
		return nil, fmt.Errorf("mengambil jadwal pekerja: %w", err)
	}

	isWorkingDay := true
	slotMorningActive := true
	slotAfternoonActive := true
	slotEveningActive := false

	var foundSchedule bool
	for _, sc := range schedules {
		if sc.DayOfWeek == dayOfWeek {
			isWorkingDay = sc.IsActive
			slotMorningActive = sc.SlotMorning
			slotAfternoonActive = sc.SlotAfternoon
			slotEveningActive = sc.SlotEvening
			foundSchedule = true
			break
		}
	}
	if !foundSchedule {
		// Default rule if no schedule entry exists:
		// Sunday (0) is off, others Morning & Afternoon active
		if dayOfWeek == 0 {
			isWorkingDay = false
			slotMorningActive = false
			slotAfternoonActive = false
			slotEveningActive = false
		} else {
			isWorkingDay = true
			slotMorningActive = true
			slotAfternoonActive = true
			slotEveningActive = false
		}
	}

	// Fetch date-specific overrides (holidays and locked slots)
	var isDateHoliday bool
	var isDateSlot1Locked, isDateSlot2Locked, isDateSlot3Locked bool
	override, err := s.repo.GetWorkerDateOverrideByDate(ctx, worker.ID, dateStr)
	if err == nil && override != nil {
		if override.IsHoliday {
			isDateHoliday = true
			isWorkingDay = false
			slotMorningActive = false
			slotAfternoonActive = false
			slotEveningActive = false
		} else {
			if override.IsSlot1Locked {
				isDateSlot1Locked = true
				slotMorningActive = false
			}
			if override.IsSlot2Locked {
				isDateSlot2Locked = true
				slotAfternoonActive = false
			}
			if override.IsSlot3Locked {
				isDateSlot3Locked = true
				slotEveningActive = false
			}
		}
	}

	// Fetch existing bookings for this worker around this date
	dayStart := time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 0, 0, 0, 0, loc)
	dayEnd := time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), 23, 59, 59, 999999999, loc)

	bookings, err := s.repo.GetBookingsByWorkerAndDateRange(ctx, worker.ID, dayStart.Add(-4*time.Hour), dayEnd.Add(4*time.Hour))
	if err != nil {
		return nil, fmt.Errorf("mengambil data pesanan pekerja: %w", err)
	}

	slotConfigs := []struct {
		SlotType  string
		Name      string
		StartTime string
		EndTime   string
		StartH    int
		StartM    int
		EndH      int
		EndM      int
		IsActive  bool
	}{
		{
			SlotType:  domain.SlotMorning,
			Name:      "Pagi",
			StartTime: domain.SlotMorningStart,
			EndTime:   domain.SlotMorningEnd,
			StartH:    8, StartM: 0,
			EndH:      11, EndM: 30,
			IsActive:  slotMorningActive,
		},
		{
			SlotType:  domain.SlotAfternoon,
			Name:      "Siang",
			StartTime: domain.SlotAfternoonStart,
			EndTime:   domain.SlotAfternoonEnd,
			StartH:    13, StartM: 0,
			EndH:      16, EndM: 30,
			IsActive:  slotAfternoonActive,
		},
		{
			SlotType:  domain.SlotEvening,
			Name:      "Sore",
			StartTime: domain.SlotEveningStart,
			EndTime:   domain.SlotEveningEnd,
			StartH:    17, StartM: 0,
			EndH:      20, EndM: 30,
			IsActive:  slotEveningActive,
		},
	}

	now := time.Now().UTC()
	slots := make([]domain.AvailableTimeSlot, len(slotConfigs))

	for i, cfg := range slotConfigs {
		slotStart := time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), cfg.StartH, cfg.StartM, 0, 0, loc)
		slotEnd := time.Date(dateInLoc.Year(), dateInLoc.Month(), dateInLoc.Day(), cfg.EndH, cfg.EndM, 0, 0, loc)

		slot := domain.AvailableTimeSlot{
			SlotType:  cfg.SlotType,
			Name:      cfg.Name,
			StartTime: cfg.StartTime,
			EndTime:   cfg.EndTime,
			Available: true,
			Reason:    "Tersedia",
		}

		if isDateHoliday {
			slot.Available = false
			slot.Reason = "Mitra sedang libur pada tanggal ini"
		} else if !isWorkingDay {
			slot.Available = false
			slot.Reason = "Pekerja libur pada hari yang dipilih"
		} else if !cfg.IsActive {
			slot.Available = false
			if (cfg.SlotType == domain.SlotMorning && isDateSlot1Locked) ||
				(cfg.SlotType == domain.SlotAfternoon && isDateSlot2Locked) ||
				(cfg.SlotType == domain.SlotEvening && isDateSlot3Locked) {
				slot.Reason = "Slot sedang dinonaktifkan oleh mitra pada tanggal ini"
			} else {
				slot.Reason = "Slot tidak diaktifkan oleh pekerja"
			}
		} else if slotStart.Before(now) {
			slot.Available = false
			slot.Reason = "Waktu slot telah berlalu"
		} else {
			// Transit buffer 60 minutes conflict:
			// slot_start < booking.end_time + 60m && slot_end > booking.start_time - 60m
			buffer := domain.TransitBufferDuration
			for _, b := range bookings {
				if b.Status == "CANCELLED" {
					continue
				}

				bStart := b.BookingDate
				bEnd := bStart.Add(60 * time.Minute)
				if b.StartTime != nil {
					bStart = *b.StartTime
				}
				if b.EndTime != nil {
					bEnd = *b.EndTime
				}

				if slotStart.Before(bEnd.Add(buffer)) && slotEnd.After(bStart.Add(-buffer)) {
					slot.Available = false
					slot.Reason = "Slot bentrok dengan pesanan lain (termasuk buffer transit 60 menit)"
					break
				}
			}
		}

		slots[i] = slot
	}

	return &domain.AvailableSlotsResponse{
		WorkerID:     worker.ID,
		WorkerSlug:   worker.Slug,
		WorkerName:   worker.Name,
		Date:         dateStr,
		DayOfWeek:    dayOfWeek,
		DayName:      dayName,
		IsWorkingDay: isWorkingDay,
		Slots:        slots,
	}, nil
}


