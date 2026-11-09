package handler

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(
	app *fiber.App,
	workerHandler *WorkerHandler,
	bookingHandler *BookingHandler,
	adminHandler *AdminHandler,
	authHandler *AuthHandler,
	authMiddleware *AuthMiddleware,
	categoryHandler *CategoryHandler,
	reviewHandler *ReviewHandler,
	analyticsHandler *AnalyticsHandler,
) {
	// Root & health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"pesan":   "layanan berjalan normal",
			"service": "tuwaktu-api",
		})
	})

	// Public API group (backward compatible)
	api := app.Group("/api")
	pub := api.Group("/public")

	// Categories public endpoint
	if categoryHandler != nil {
		api.Get("/categories", categoryHandler.ListPublicCategories)
		pub.Get("/categories", categoryHandler.ListPublicCategories)
	}

	// Telemetry public endpoint
	if analyticsHandler != nil {
		pub.Post("/telemetry/events", analyticsHandler.TrackPublicEvent)
		api.Post("/public/telemetry/events", analyticsHandler.TrackPublicEvent)
	}

	// Workers endpoint
	pub.Get("/workers", workerHandler.ListPublicWorkers)
	pub.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	pub.Get("/worker/:slug", workerHandler.GetWorkerBySlug)
	pub.Get("/workers/:slug/available-slots", bookingHandler.GetAvailableSlots)
	pub.Get("/worker/:slug/available-slots", bookingHandler.GetAvailableSlots)

	// Bookings endpoint
	pub.Post("/bookings", bookingHandler.CreateBooking)
	pub.Post("/booking/create", bookingHandler.CreateWABooking)
	pub.Post("/bookings/create", bookingHandler.CreateWABooking)
	pub.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	pub.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)

	// Review public endpoints
	if reviewHandler != nil {
		pub.Get("/review-invitations/:bookingCode", reviewHandler.GetReviewInvitation)
		pub.Post("/reviews", reviewHandler.SubmitReview)
		pub.Get("/workers/:slug/reviews", reviewHandler.GetPublicWorkerReviews)
		pub.Get("/worker/:slug/reviews", reviewHandler.GetPublicWorkerReviews)
		api.Get("/worker/reviews", reviewHandler.GetWorkerReviews)
		api.Get("/workers/:id/reviews", reviewHandler.GetWorkerReviews)
	}

	// Worker profile update endpoints
	api.Put("/worker/profile", workerHandler.UpdateWorkerProfile)
	api.Put("/workers/:id/profile", workerHandler.UpdateWorkerProfile)

	// Booking create endpoints (api group)
	api.Post("/booking/create", bookingHandler.CreateWABooking)
	api.Post("/bookings/create", bookingHandler.CreateWABooking)

	// Worker rates endpoints & profile alias
	api.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	api.Get("/worker/:slug/profile", workerHandler.GetWorkerBySlug)
	api.Get("/workers/:slug/available-slots", bookingHandler.GetAvailableSlots)
	api.Get("/worker/:slug/available-slots", bookingHandler.GetAvailableSlots)
	api.Put("/worker/rates", workerHandler.UpdateWorkerRates)
	api.Put("/workers/:id/rates", workerHandler.UpdateWorkerRates)

	// Worker service catalog endpoints
	api.Post("/worker/services", workerHandler.CreateService)
	api.Post("/workers/:id/services", workerHandler.CreateService)
	api.Put("/worker/services/:serviceId", workerHandler.UpdateService)
	api.Put("/workers/:id/services/:serviceId", workerHandler.UpdateService)
	api.Delete("/worker/services/:serviceId", workerHandler.DeleteService)
	api.Delete("/workers/:id/services/:serviceId", workerHandler.DeleteService)

	// Worker location settings endpoints
	api.Put("/worker/location-settings", workerHandler.UpdateWorkerLocationSettings)
	api.Put("/workers/:id/location-settings", workerHandler.UpdateWorkerLocationSettings)

	// Worker schedules endpoints
	api.Get("/worker/schedules", workerHandler.GetWorkerSchedules)
	api.Get("/workers/:id/schedules", workerHandler.GetWorkerSchedules)
	api.Put("/worker/schedules", workerHandler.UpdateWorkerSchedules)
	api.Put("/workers/:id/schedules", workerHandler.UpdateWorkerSchedules)

	// Worker bookings endpoints
	api.Get("/worker/bookings", workerHandler.GetWorkerBookings)
	api.Get("/workers/:id/bookings", workerHandler.GetWorkerBookings)
	api.Patch("/worker/bookings/:bookingId/status", workerHandler.UpdateWorkerBookingStatus)
	api.Patch("/workers/:id/bookings/:bookingId/status", workerHandler.UpdateWorkerBookingStatus)

	// Booking calculate-fee endpoint
	api.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	api.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)

	// API v1 group
	v1 := api.Group("/v1")
	v1Pub := v1.Group("/public")

	// Auth routes
	if authHandler != nil {
		api.Get("/auth/altcha-challenge", authHandler.GetAltchaChallenge)
		v1.Get("/auth/altcha-challenge", authHandler.GetAltchaChallenge)
		api.Post("/auth/login", authHandler.Login)
		v1.Post("/auth/login", authHandler.Login)
		api.Post("/auth/register", authHandler.Register)
		v1.Post("/auth/register", authHandler.Register)
		api.Post("/auth/logout", authHandler.Logout)
		v1.Post("/auth/logout", authHandler.Logout)
		api.Get("/admin/workers/activate", authHandler.ActivateWorker)
		v1.Get("/admin/workers/activate", authHandler.ActivateWorker)
		if authMiddleware != nil {
			api.Get("/auth/me", authMiddleware.RequireAuth, authHandler.Me)
			v1.Get("/auth/me", authMiddleware.RequireAuth, authHandler.Me)
		}
	}

	// Admin routes
	if adminHandler != nil && authMiddleware != nil {
		adminGroup := v1.Group("/admin", authMiddleware.RequireAuth, authMiddleware.RequireAdmin)
		adminGroup.Post("/workers", adminHandler.CreateWorker)
		adminGroup.Get("/workers", adminHandler.GetWorkers)
		adminGroup.Patch("/workers/:id/status", adminHandler.UpdateWorkerStatus)
		adminGroup.Get("/stats", adminHandler.GetStats)

		if categoryHandler != nil {
			adminGroup.Get("/categories", categoryHandler.ListCategories)
			adminGroup.Post("/categories", categoryHandler.CreateCategory)
			adminGroup.Get("/categories/:id", categoryHandler.GetCategory)
			adminGroup.Put("/categories/:id", categoryHandler.UpdateCategory)
			adminGroup.Delete("/categories/:id", categoryHandler.DeleteCategory)
		}

		if analyticsHandler != nil {
			adminGroup.Get("/analytics/summary", analyticsHandler.GetAdminSummary)
		}

		// Backward compatible /api/admin
		legacyAdmin := api.Group("/admin", authMiddleware.RequireAuth, authMiddleware.RequireAdmin)
		legacyAdmin.Post("/workers", adminHandler.CreateWorker)
		legacyAdmin.Get("/workers", adminHandler.GetWorkers)
		legacyAdmin.Patch("/workers/:id/status", adminHandler.UpdateWorkerStatus)
		legacyAdmin.Get("/stats", adminHandler.GetStats)

		if categoryHandler != nil {
			legacyAdmin.Get("/categories", categoryHandler.ListCategories)
			legacyAdmin.Post("/categories", categoryHandler.CreateCategory)
			legacyAdmin.Get("/categories/:id", categoryHandler.GetCategory)
			legacyAdmin.Put("/categories/:id", categoryHandler.UpdateCategory)
			legacyAdmin.Delete("/categories/:id", categoryHandler.DeleteCategory)
		}

		if analyticsHandler != nil {
			legacyAdmin.Get("/analytics/summary", analyticsHandler.GetAdminSummary)
		}
	}

	if categoryHandler != nil {
		v1.Get("/categories", categoryHandler.ListPublicCategories)
		v1Pub.Get("/categories", categoryHandler.ListPublicCategories)
	}

	if analyticsHandler != nil {
		v1Pub.Post("/telemetry/events", analyticsHandler.TrackPublicEvent)
		v1.Post("/public/telemetry/events", analyticsHandler.TrackPublicEvent)
	}

	v1Pub.Get("/workers", workerHandler.ListPublicWorkers)
	v1Pub.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	v1Pub.Get("/worker/:slug", workerHandler.GetWorkerBySlug)
	v1Pub.Get("/workers/:slug/available-slots", bookingHandler.GetAvailableSlots)
	v1Pub.Get("/worker/:slug/available-slots", bookingHandler.GetAvailableSlots)
	v1Pub.Post("/bookings", bookingHandler.CreateBooking)
	v1Pub.Post("/booking/create", bookingHandler.CreateWABooking)
	v1Pub.Post("/bookings/create", bookingHandler.CreateWABooking)
	v1Pub.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	v1Pub.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)
	v1.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	v1.Get("/worker/:slug/profile", workerHandler.GetWorkerBySlug)
	v1.Get("/workers/:slug/available-slots", bookingHandler.GetAvailableSlots)
	v1.Get("/worker/:slug/available-slots", bookingHandler.GetAvailableSlots)
	v1.Put("/worker/rates", workerHandler.UpdateWorkerRates)
	v1.Put("/workers/:id/rates", workerHandler.UpdateWorkerRates)
	v1.Post("/worker/services", workerHandler.CreateService)
	v1.Post("/workers/:id/services", workerHandler.CreateService)
	v1.Put("/worker/services/:serviceId", workerHandler.UpdateService)
	v1.Put("/workers/:id/services/:serviceId", workerHandler.UpdateService)
	v1.Delete("/worker/services/:serviceId", workerHandler.DeleteService)
	v1.Delete("/workers/:id/services/:serviceId", workerHandler.DeleteService)
	v1.Put("/worker/profile", workerHandler.UpdateWorkerProfile)
	v1.Put("/workers/:id/profile", workerHandler.UpdateWorkerProfile)
	v1.Put("/worker/location-settings", workerHandler.UpdateWorkerLocationSettings)
	v1.Put("/workers/:id/location-settings", workerHandler.UpdateWorkerLocationSettings)
	v1.Get("/worker/schedules", workerHandler.GetWorkerSchedules)
	v1.Get("/workers/:id/schedules", workerHandler.GetWorkerSchedules)
	v1.Put("/worker/schedules", workerHandler.UpdateWorkerSchedules)
	v1.Put("/workers/:id/schedules", workerHandler.UpdateWorkerSchedules)
	v1.Get("/worker/bookings", workerHandler.GetWorkerBookings)
	v1.Get("/workers/:id/bookings", workerHandler.GetWorkerBookings)
	v1.Patch("/worker/bookings/:bookingId/status", workerHandler.UpdateWorkerBookingStatus)
	v1.Patch("/workers/:id/bookings/:bookingId/status", workerHandler.UpdateWorkerBookingStatus)
	v1.Post("/booking/create", bookingHandler.CreateWABooking)
	v1.Post("/bookings/create", bookingHandler.CreateWABooking)
	v1.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	v1.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)

	if reviewHandler != nil {
		v1Pub.Get("/review-invitations/:bookingCode", reviewHandler.GetReviewInvitation)
		v1Pub.Post("/reviews", reviewHandler.SubmitReview)
		v1Pub.Get("/workers/:slug/reviews", reviewHandler.GetPublicWorkerReviews)
		v1Pub.Get("/worker/:slug/reviews", reviewHandler.GetPublicWorkerReviews)
		v1.Get("/worker/reviews", reviewHandler.GetWorkerReviews)
		v1.Get("/workers/:id/reviews", reviewHandler.GetWorkerReviews)
	}
}


