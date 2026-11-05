package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCORS_PreflightAndCredentials(t *testing.T) {
	app := fiber.New()

	corsConfig := cors.Config{
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, ng-skip-http-transfer-cache, X-Requested-With, Cache-Control, Pragma",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true,
		ExposeHeaders:    "Set-Cookie, Content-Length",
		MaxAge:           86400,
		AllowOriginsFunc: func(origin string) bool {
			if origin == "http://localhost:4200" || origin == "http://127.0.0.1:4200" ||
				strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") {
				return true
			}
			return false
		},
	}

	app.Use(cors.New(corsConfig))

	app.Get("/api/v1/auth/me", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	t.Run("Preflight OPTIONS request dengan custom ng-skip-http-transfer-cache header diizinkan", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/me", nil)
		req.Header.Set("Origin", "http://localhost:4200")
		req.Header.Set("Access-Control-Request-Method", "GET")
		req.Header.Set("Access-Control-Request-Headers", "Content-Type,ng-skip-http-transfer-cache")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusNoContent, resp.StatusCode)

		assert.Equal(t, "http://localhost:4200", resp.Header.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", resp.Header.Get("Access-Control-Allow-Credentials"))
		assert.Contains(t, resp.Header.Get("Access-Control-Allow-Headers"), "ng-skip-http-transfer-cache")
		assert.Contains(t, resp.Header.Get("Access-Control-Allow-Headers"), "Content-Type")
	})

	t.Run("Actual GET request dengan origin localhost:4200 menyertakan credentials header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
		req.Header.Set("Origin", "http://localhost:4200")

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		assert.Equal(t, "http://localhost:4200", resp.Header.Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", resp.Header.Get("Access-Control-Allow-Credentials"))
	})
}

