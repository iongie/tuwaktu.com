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

	// Workers endpoint
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

	// Booking calculate-fee endpoint
	api.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	api.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)

	// API v1 group
	v1 := api.Group("/v1")
	v1Pub := v1.Group("/public")

	// Auth routes
	if authHandler != nil {
		api.Post("/auth/login", authHandler.Login)
		v1.Post("/auth/login", authHandler.Login)
		api.Post("/auth/register", authHandler.Register)
		v1.Post("/auth/register", authHandler.Register)
		api.Post("/auth/logout", authHandler.Logout)
		v1.Post("/auth/logout", authHandler.Logout)
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

		// Backward compatible /api/admin
		legacyAdmin := api.Group("/admin", authMiddleware.RequireAuth, authMiddleware.RequireAdmin)
		legacyAdmin.Post("/workers", adminHandler.CreateWorker)
		legacyAdmin.Get("/workers", adminHandler.GetWorkers)
		legacyAdmin.Patch("/workers/:id/status", adminHandler.UpdateWorkerStatus)
		legacyAdmin.Get("/stats", adminHandler.GetStats)
	}

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
	v1.Post("/booking/create", bookingHandler.CreateWABooking)
	v1.Post("/bookings/create", bookingHandler.CreateWABooking)
	v1.Post("/booking/calculate-fee", bookingHandler.CalculateFee)
	v1.Post("/bookings/calculate-fee", bookingHandler.CalculateFee)
}


