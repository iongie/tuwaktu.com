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

	// Public API group
	api := app.Group("/api")
	pub := api.Group("/public")

	// Workers endpoint
	pub.Get("/workers/:slug", workerHandler.GetWorkerBySlug)

	// Bookings endpoint
	pub.Post("/bookings", bookingHandler.CreateBooking)
}
