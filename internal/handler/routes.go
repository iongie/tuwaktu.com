package handler

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app *fiber.App, workerHandler *WorkerHandler, bookingHandler *BookingHandler) {
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

	// Bookings endpoint
	pub.Post("/bookings", bookingHandler.CreateBooking)

	// Worker profile update endpoints
	api.Put("/workers/:id/profile", workerHandler.UpdateWorkerProfile)

	// Worker rates endpoints & profile alias
	api.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	api.Get("/worker/:slug/profile", workerHandler.GetWorkerBySlug)
	api.Put("/worker/rates", workerHandler.UpdateWorkerRates)
	api.Put("/workers/:id/rates", workerHandler.UpdateWorkerRates)

	// API v1 group
	v1 := api.Group("/v1")
	v1Pub := v1.Group("/public")

	v1Pub.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	v1Pub.Post("/bookings", bookingHandler.CreateBooking)
	v1.Get("/workers/:slug", workerHandler.GetWorkerBySlug)
	v1.Get("/worker/:slug/profile", workerHandler.GetWorkerBySlug)
	v1.Put("/worker/rates", workerHandler.UpdateWorkerRates)
	v1.Put("/workers/:id/rates", workerHandler.UpdateWorkerRates)
	v1.Put("/workers/:id/profile", workerHandler.UpdateWorkerProfile)
}
