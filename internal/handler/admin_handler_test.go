package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/auth"
)

func TestAdminRoutes_RBAC(t *testing.T) {
	app, repo := setupTestApp()

	// 1. Tanpa header Authorization -> HTTP 401 Unauthorized
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers", nil)
	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	var errBody map[string]any
	json.NewDecoder(resp.Body).Decode(&errBody)
	assert.False(t, errBody["success"].(bool))
	assert.Equal(t, "UNAUTHORIZED", errBody["error"])

	// 2. Token dengan Role WORKER -> HTTP 403 Forbidden
	workerToken, err := auth.GenerateToken("worker-acc-1", "worker-1", "worker@tuwaktu.com", domain.RoleWorker, domain.AccountStatusActive, time.Hour)
	require.NoError(t, err)

	reqWorker := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers", nil)
	reqWorker.Header.Set("Authorization", "Bearer "+workerToken)
	respWorker, err := app.Test(reqWorker)
	require.NoError(t, err)
	assert.Equal(t, http.StatusForbidden, respWorker.StatusCode)

	var workerErrBody map[string]any
	json.NewDecoder(respWorker.Body).Decode(&workerErrBody)
	assert.False(t, workerErrBody["success"].(bool))
	assert.Equal(t, "FORBIDDEN_ADMIN_ACCESS", workerErrBody["error"])

	// 3. Token dengan status SUSPENDED -> HTTP 403 Forbidden
	suspendedToken, err := auth.GenerateToken("suspended-acc", "", "suspend@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusSuspended, time.Hour)
	require.NoError(t, err)

	reqSuspended := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers", nil)
	reqSuspended.Header.Set("Authorization", "Bearer "+suspendedToken)
	respSuspended, err := app.Test(reqSuspended)
	require.NoError(t, err)
	assert.Equal(t, http.StatusForbidden, respSuspended.StatusCode)

	var suspendedErrBody map[string]any
	json.NewDecoder(respSuspended.Body).Decode(&suspendedErrBody)
	assert.Equal(t, "ACCOUNT_SUSPENDED", suspendedErrBody["error"])

	// 4. Token dengan Role ADMIN -> HTTP 200 OK
	adminToken, err := auth.GenerateToken("admin-acc-1", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
	require.NoError(t, err)

	reqAdmin := httptest.NewRequest(http.MethodGet, "/api/v1/admin/workers", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+adminToken)
	respAdmin, err := app.Test(reqAdmin)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respAdmin.StatusCode)

	var adminBody map[string]any
	json.NewDecoder(respAdmin.Body).Decode(&adminBody)
	assert.True(t, adminBody["success"].(bool))
	_ = repo
}

func TestAdminRoutes_TransactionalOnboarding(t *testing.T) {
	app, _ := setupTestApp()

	adminToken, err := auth.GenerateToken("admin-acc-1", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
	require.NoError(t, err)

	payload := domain.AdminCreateWorkerPayload{
		Name:              "Hendro Wijaya",
		Bio:               "Teknisi instalasi pipa dan kelistrikan berpengalaman",
		Zone:              "Jakarta Barat",
		BasePrice:         90000,
		RateType:          "HOURLY",
		MaxRadiusKM:       12,
		FreeRadiusKM:      4,
		ExtraFeePerKM:     4000,
		PhoneNumber:       "6281311223344",
		WhatsAppNumber:    "6281311223344",
		Email:             "hendro.wijaya@internal.tuwaktu.com",
		Address:           "Jl. Kebon Jeruk No. 8, Jakarta Barat",
		TemporaryPassword: "PasswordMitra2026!",
	}

	payloadBytes, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/workers", bytes.NewReader(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	bodyBytes, _ := io.ReadAll(resp.Body)
	var createdResp struct {
		Success bool                              `json:"success"`
		Message string                            `json:"message"`
		Data    domain.AdminWorkerCreatedResponse `json:"data"`
	}
	err = json.Unmarshal(bodyBytes, &createdResp)
	require.NoError(t, err)
	assert.True(t, createdResp.Success)
	assert.Equal(t, "hendro-wijaya", createdResp.Data.Worker.Slug)
	assert.Equal(t, "PasswordMitra2026!", createdResp.Data.TemporaryPassword)
	assert.Contains(t, createdResp.Data.InvitationText, "Hendro Wijaya")
	assert.Contains(t, createdResp.Data.InvitationText, "hendro-wijaya")
	assert.Contains(t, createdResp.Data.InvitationText, "PasswordMitra2026!")

	// Uji duplikasi email -> Harus gagal dengan HTTP 400
	reqDuplicate := httptest.NewRequest(http.MethodPost, "/api/v1/admin/workers", bytes.NewReader(payloadBytes))
	reqDuplicate.Header.Set("Content-Type", "application/json")
	reqDuplicate.Header.Set("Authorization", "Bearer "+adminToken)

	respDuplicate, err := app.Test(reqDuplicate)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, respDuplicate.StatusCode)
}

func TestAdminRoutes_UpdateStatusAndSuspensionEffect(t *testing.T) {
	app, _ := setupTestApp()

	adminToken, err := auth.GenerateToken("admin-acc-1", "", "admin@tuwaktu.com", domain.RoleAdmin, domain.AccountStatusActive, time.Hour)
	require.NoError(t, err)

	// 1. Buat mitra baru terlebih dahulu
	onboardPayload := domain.AdminCreateWorkerPayload{
		Name:              "Rudi Santika",
		Email:             "rudi.santika@internal.tuwaktu.com",
		WhatsAppNumber:    "628177665544",
		TemporaryPassword: "PasswordRudi123!",
	}
	pBytes, _ := json.Marshal(onboardPayload)
	reqOnboard := httptest.NewRequest(http.MethodPost, "/api/v1/admin/workers", bytes.NewReader(pBytes))
	reqOnboard.Header.Set("Content-Type", "application/json")
	reqOnboard.Header.Set("Authorization", "Bearer "+adminToken)
	respOnboard, err := app.Test(reqOnboard)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, respOnboard.StatusCode)

	var onboardRes struct {
		Data domain.AdminWorkerCreatedResponse `json:"data"`
	}
	json.NewDecoder(respOnboard.Body).Decode(&onboardRes)
	workerID := onboardRes.Data.Worker.ID
	workerSlug := onboardRes.Data.Worker.Slug

	// 2. Verifikasi profil publik dapat diakses sebelum disuspend
	reqPub := httptest.NewRequest(http.MethodGet, "/api/public/workers/"+workerSlug, nil)
	respPub, err := app.Test(reqPub)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respPub.StatusCode)

	// 3. Admin melakukan suspend mitra -> PATCH /api/v1/admin/workers/:id/status
	suspendPayload := domain.AdminUpdateWorkerStatusPayload{
		Status: domain.AccountStatusSuspended,
	}
	sBytes, _ := json.Marshal(suspendPayload)
	reqSuspend := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/admin/workers/%s/status", workerID), bytes.NewReader(sBytes))
	reqSuspend.Header.Set("Content-Type", "application/json")
	reqSuspend.Header.Set("Authorization", "Bearer "+adminToken)
	respSuspend, err := app.Test(reqSuspend)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respSuspend.StatusCode)

	// 4. Verifikasi profil publik sekarang terkunci / inactive -> HTTP 403 Forbidden atau pesan tidak aktif
	reqPubSuspended := httptest.NewRequest(http.MethodGet, "/api/public/workers/"+workerSlug, nil)
	respPubSuspended, err := app.Test(reqPubSuspended)
	require.NoError(t, err)
	assert.True(t, respPubSuspended.StatusCode == http.StatusForbidden || respPubSuspended.StatusCode == http.StatusNotFound)

	// 5. Coba login dengan kredensial mitra suspended -> Harus ditolak (HTTP 403)
	loginPayload := domain.AuthLoginPayload{
		Identifier: "rudi.santika@internal.tuwaktu.com",
		Password:   "PasswordRudi123!",
	}
	lBytes, _ := json.Marshal(loginPayload)
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(lBytes))
	reqLogin.Header.Set("Content-Type", "application/json")
	respLogin, err := app.Test(reqLogin)
	require.NoError(t, err)
	assert.Equal(t, http.StatusForbidden, respLogin.StatusCode)

	// 6. Aktifkan kembali mitra (ACTIVE)
	activatePayload := domain.AdminUpdateWorkerStatusPayload{
		Status: domain.AccountStatusActive,
	}
	actBytes, _ := json.Marshal(activatePayload)
	reqAct := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/admin/workers/%s/status", workerID), bytes.NewReader(actBytes))
	reqAct.Header.Set("Content-Type", "application/json")
	reqAct.Header.Set("Authorization", "Bearer "+adminToken)
	respAct, err := app.Test(reqAct)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respAct.StatusCode)

	// 7. Login sekarang sukses -> HTTP 200
	reqLoginSuccess := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(lBytes))
	reqLoginSuccess.Header.Set("Content-Type", "application/json")
	respLoginSuccess, err := app.Test(reqLoginSuccess)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, respLoginSuccess.StatusCode)
}

