package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/handler"
	"tuwaktu.com/internal/pkg/auth"
	"tuwaktu.com/internal/repository"
	"tuwaktu.com/internal/service"
)

func setupB2BHandlerTestApp() (*fiber.App, *repository.MemoryB2BInquiryRepository) {
	app := fiber.New()
	repo := repository.NewMemoryB2BInquiryRepository()
	svc := service.NewB2BInquiryService(repo)
	b2bHandler := handler.NewB2BInquiryHandler(svc)
	authMiddleware := handler.NewAuthMiddleware()

	handler.RegisterB2BRoutes(app, b2bHandler, authMiddleware)
	return app, repo
}

func makeValidB2BAltchaSolution(t *testing.T, saltPrefix string) string {
	t.Helper()
	salt := saltPrefix + "?expires=4102444800"
	secret := int64(7)
	challenge := auth.CreateAltchaChallengeWithParams(salt, secret, 100)
	sol := auth.AltchaSolution{
		Algorithm: challenge.Algorithm,
		Challenge: challenge.Challenge,
		Number:    secret,
		Salt:      challenge.Salt,
		Signature: challenge.Signature,
	}
	raw, err := json.Marshal(sol)
	require.NoError(t, err)
	return string(raw)
}

func TestB2BInquiryHandler_PublicAndAdminFlow(t *testing.T) {
	app, _ := setupB2BHandlerTestApp()

	t.Run("menolak pengajuan publik jika captcha altcha kosong", func(t *testing.T) {
		payload := map[string]any{
			"business_name":    "Kantor Maju",
			"property_type":    "KANTOR",
			"contact_name":     "Andi",
			"contact_whatsapp": "081234567890",
			"city_zone":        "Jakarta Selatan",
			"property_address": "Jl. Sudirman Kav 10, Jakarta Selatan",
			"plan_tier":        "RUTIN_PROPERTI",
			"service_focus":    "Cuci AC Rutin",
			"unit_count":       10,
			"visit_frequency":  "BULANAN",
			"altcha_payload":   "",
		}
		raw, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/public/b2b-inquiries", bytes.NewReader(raw))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	var createdID string
	t.Run("berhasil membuat pengajuan publik dengan altcha valid (201 Created)", func(t *testing.T) {
		altchaSol := makeValidB2BAltchaSolution(t, "b2b-handler-salt-1")
		payload := map[string]any{
			"business_name":    "Kos Harmoni Setiabudi",
			"property_type":    "KOS",
			"contact_name":     "Siti Rahma",
			"contact_whatsapp": "081299887766",
			"city_zone":        "Jakarta Selatan",
			"property_address": "Jl. Setiabudi Barat No. 5, Jakarta Selatan",
			"plan_tier":        "RUTIN_PROPERTI",
			"service_focus":    "Servis AC & Sanitasi",
			"unit_count":       16,
			"visit_frequency":  "BULANAN",
			"altcha_payload":   altchaSol,
		}
		raw, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/public/b2b-inquiries", bytes.NewReader(raw))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var body map[string]any
		err = json.NewDecoder(resp.Body).Decode(&body)
		require.NoError(t, err)
		assert.True(t, body["success"].(bool))

		data := body["data"].(map[string]any)
		inq := data["inquiry"].(map[string]any)
		createdID = inq["id"].(string)
		assert.Contains(t, inq["inquiry_code"].(string), "B2B-")
		assert.Equal(t, float64(550000), inq["estimated_monthly_fee"])
	})

	t.Run("endpoint admin menolak request tanpa token atau non-admin", func(t *testing.T) {
		reqNoAuth := httptest.NewRequest(http.MethodGet, "/api/v1/admin/b2b-inquiries", nil)
		respNoAuth, err := app.Test(reqNoAuth)
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, respNoAuth.StatusCode)

		workerToken, err := auth.GenerateToken("acc-worker", "worker-1", "worker@tuwaktu.com", domain.RoleWorker, domain.AccountStatusActive, 1*time.Hour)
		require.NoError(t, err)
		reqWorker := httptest.NewRequest(http.MethodGet, "/api/v1/admin/b2b-inquiries", nil)
		reqWorker.Header.Set("Authorization", "Bearer "+workerToken)
		respWorker, err := app.Test(reqWorker)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, respWorker.StatusCode)
	})

	t.Run("admin dapat melihat daftar dan memperbarui status pembayaran menjadi PAID", func(t *testing.T) {
		adminToken, err := auth.GenerateToken("acc-admin", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, 1*time.Hour)
		require.NoError(t, err)

		reqList := httptest.NewRequest(http.MethodGet, "/api/v1/admin/b2b-inquiries", nil)
		reqList.Header.Set("Authorization", "Bearer "+adminToken)
		respList, err := app.Test(reqList)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, respList.StatusCode)

		updateBody, _ := json.Marshal(map[string]any{
			"status":             "ACTIVE",
			"payment_status":     "PAID",
			"agreed_monthly_fee": 600000,
			"payment_reference":  "QRIS-INV-009",
		})
		reqPatch := httptest.NewRequest(http.MethodPatch, "/api/v1/admin/b2b-inquiries/"+createdID, bytes.NewReader(updateBody))
		reqPatch.Header.Set("Authorization", "Bearer "+adminToken)
		reqPatch.Header.Set("Content-Type", "application/json")
		respPatch, err := app.Test(reqPatch)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, respPatch.StatusCode)

		var patchRes map[string]any
		require.NoError(t, json.NewDecoder(respPatch.Body).Decode(&patchRes))
		assert.True(t, patchRes["success"].(bool))
		updatedData := patchRes["data"].(map[string]any)
		assert.Equal(t, "PAID", updatedData["payment_status"])
		assert.NotEmpty(t, updatedData["paid_at"])
	})
}
