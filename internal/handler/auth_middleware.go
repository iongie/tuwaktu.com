package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
)

type AuthMiddleware struct{}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{}
}

// RequireAuth memastikan request membawa token JWT valid baik dari Authorization Header maupun HTTP-Only Cookie
func (m *AuthMiddleware) RequireAuth(c *fiber.Ctx) error {
	var tokenStr string

	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Format token otentikasi tidak valid. Gunakan format 'Bearer <token>'",
				"data":    nil,
				"error":   "INVALID_TOKEN_FORMAT",
			})
		}
		tokenStr = strings.TrimSpace(parts[1])
	}

	if tokenStr == "" {
		tokenStr = c.Cookies(AuthCookieName)
		if tokenStr == "" {
			tokenStr = c.Cookies(LegacyAuthCookieName)
		}
	}

	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Otentikasi diperlukan: silakan masuk terlebih dahulu",
			"data":    nil,
			"error":   "UNAUTHORIZED",
		})
	}

	claims, err := auth.ValidateToken(tokenStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
			"data":    nil,
			"error":   "INVALID_TOKEN",
		})
	}

	if claims.AccountStatus == domain.AccountStatusSuspended {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Akun Anda sedang dinonaktifkan oleh administrator",
			"data":    nil,
			"error":   "ACCOUNT_SUSPENDED",
		})
	}

	c.Locals("accountID", claims.AccountID)
	c.Locals("workerID", claims.WorkerID)
	c.Locals("role", claims.Role)
	c.Locals("accountStatus", claims.AccountStatus)
	c.Locals("email", claims.Email)

	return c.Next()
}

// RequireAdmin memastikan pengguna yang mengakses memiliki peran ADMIN
func (m *AuthMiddleware) RequireAdmin(c *fiber.Ctx) error {
	role, ok := c.Locals("role").(string)
	if !ok || role != domain.RoleAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Akses ditolak: Anda tidak memiliki wewenang administrator",
			"data":    nil,
			"error":   "FORBIDDEN_ADMIN_ACCESS",
		})
	}

	return c.Next()
}
