package auth_test

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/pkg/auth"
)

func TestAltcha_CreateAndVerify(t *testing.T) {
	t.Run("berhasil membuat tantangan dan memverifikasi solusi yang valid", func(t *testing.T) {
		payload, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)
		require.NotEmpty(t, payload)

		err = auth.VerifyAltchaPayload(payload)
		assert.NoError(t, err)
	})

	t.Run("CreateAltchaChallenge menghasilkan struktur tantangan yang valid", func(t *testing.T) {
		ch, err := auth.CreateAltchaChallenge(100, 2*time.Minute)
		require.NoError(t, err)
		require.NotNil(t, ch)
		assert.Equal(t, "SHA-256", ch.Algorithm)
		assert.Equal(t, int64(100), ch.MaxNumber)
		assert.Contains(t, ch.Salt, "?expires=")
		assert.NotEmpty(t, ch.Challenge)
		assert.NotEmpty(t, ch.Signature)
	})

	t.Run("gagal dengan ErrAltchaRequired jika payload kosong", func(t *testing.T) {
		err := auth.VerifyAltchaPayload("   ")
		assert.ErrorIs(t, err, auth.ErrAltchaRequired)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika payload bukan Base64 atau JSON valid", func(t *testing.T) {
		err := auth.VerifyAltchaPayload("!!!bukan-base64!!!")
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)

		invalidJSON := base64.StdEncoding.EncodeToString([]byte("{broken-json"))
		err = auth.VerifyAltchaPayload(invalidJSON)
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika angka solusi salah", func(t *testing.T) {
		salt := fmt.Sprintf("nonce123?expires=%d", time.Now().Add(5*time.Minute).Unix())
		ch := auth.CreateAltchaChallengeWithParams(salt, 25, 1000)

		wrongPayload, err := auth.EncodeAltchaSolution(ch, 26)
		require.NoError(t, err)

		err = auth.VerifyAltchaPayload(wrongPayload)
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika signature dimanipulasi", func(t *testing.T) {
		salt := fmt.Sprintf("nonce123?expires=%d", time.Now().Add(5*time.Minute).Unix())
		ch := auth.CreateAltchaChallengeWithParams(salt, 25, 1000)
		ch.Signature = "0000000000000000000000000000000000000000000000000000000000000000"

		tamperedPayload, err := auth.EncodeAltchaSolution(ch, 25)
		require.NoError(t, err)

		err = auth.VerifyAltchaPayload(tamperedPayload)
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika tantangan telah kedaluwarsa", func(t *testing.T) {
		expiredSalt := fmt.Sprintf("nonce123?expires=%d", time.Now().Add(-1*time.Minute).Unix())
		ch := auth.CreateAltchaChallengeWithParams(expiredSalt, 10, 1000)

		expiredPayload, err := auth.EncodeAltchaSolution(ch, 10)
		require.NoError(t, err)

		err = auth.VerifyAltchaPayload(expiredPayload)
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika salt tidak memiliki parameter expires", func(t *testing.T) {
		ch := auth.CreateAltchaChallengeWithParams("salt-tanpa-expires", 10, 1000)
		raw, err := json.Marshal(auth.AltchaSolution{
			Algorithm: ch.Algorithm,
			Challenge: ch.Challenge,
			Number:    10,
			Salt:      ch.Salt,
			Signature: ch.Signature,
		})
		require.NoError(t, err)

		err = auth.VerifyAltchaPayload(base64.StdEncoding.EncodeToString(raw))
		assert.ErrorIs(t, err, auth.ErrAltchaInvalid)
	})

	t.Run("gagal dengan ErrAltchaInvalid jika payload yang sama dikirim ulang (replay attack)", func(t *testing.T) {
		payload, err := auth.GenerateValidAltchaPayload()
		require.NoError(t, err)

		err = auth.VerifyAltchaPayload(payload)
		require.NoError(t, err)

		errReplay := auth.VerifyAltchaPayload(payload)
		assert.ErrorIs(t, errReplay, auth.ErrAltchaInvalid)
	})
}
