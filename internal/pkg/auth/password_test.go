package auth_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/pkg/auth"
)

func TestPassword_HashAndVerifyArgon2id(t *testing.T) {
	t.Run("berhasil melakukan hashing dan verifikasi kata sandi yang sesuai", func(t *testing.T) {
		rawPassword := "KataSandiRahasia2026!"
		encodedHash, err := auth.HashPassword(rawPassword)
		require.NoError(t, err)
		assert.True(t, strings.HasPrefix(encodedHash, "$argon2id$v=19$m=65536,t=1,p=4$"))

		match, err := auth.VerifyPassword(encodedHash, rawPassword)
		require.NoError(t, err)
		assert.True(t, match)
	})

	t.Run("verifikasi hash seed default admin dan mitra berhasil dengan Argon2id", func(t *testing.T) {
		adminSeedHash := "$argon2id$v=19$m=65536,t=1,p=4$uiYTw8zX3xJl1cpIqo//XA$LnCOOfHd56X6q9B+PSCdEy38A8oH8a1/fvdvETKrhKM"
		matchAdmin, err := auth.VerifyPassword(adminSeedHash, "849205")
		require.NoError(t, err)
		assert.True(t, matchAdmin)
		require.NoError(t, auth.ValidatePIN("849205"))

		workerSeedHash := "$argon2id$v=19$m=65536,t=1,p=4$MAaxkWmbfdPHDfyqWXInBw$9f6WM1rw47nmLMh0WkiXvDdGjU0hYU4tau+jIeaivBM"
		matchWorker, err := auth.VerifyPassword(workerSeedHash, "739184")
		require.NoError(t, err)
		assert.True(t, matchWorker)
		require.NoError(t, auth.ValidatePIN("739184"))
	})

	t.Run("menghasilkan salt unik untuk kata sandi yang sama", func(t *testing.T) {
		hA, err := auth.HashPassword("123456")
		require.NoError(t, err)
		hB, err := auth.HashPassword("123456")
		require.NoError(t, err)
		assert.NotEqual(t, hA, hB)
	})

	t.Run("mengembalikan false jika kata sandi tidak sesuai", func(t *testing.T) {
		encodedHash, err := auth.HashPassword("PINBenar123")
		require.NoError(t, err)

		match, err := auth.VerifyPassword(encodedHash, "PINSalah999")
		require.NoError(t, err)
		assert.False(t, match)
	})

	t.Run("mengembalikan ErrInvalidHash jika format string hash rusak atau bukan argon2id", func(t *testing.T) {
		invalidHashes := []string{
			"",
			"bukan-hash",
			"$argon2i$v=19$m=65536,t=1,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=abc$m=65536,t=1,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=19$invalid-params$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=0,t=1,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=65536,t=0,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=0$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=4$$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=4$c2FsdA$",
			"$argon2id$v=19$m=65536,t=1,p=4$!!!not_base64!!!$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=4$c2FsdA$!!!not_base64!!!",
			"prefix$argon2id$v=19$m=65536,t=1,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=19extra$m=65536,t=1,p=4$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=4,extra=1$c2FsdA$aGFzaA",
			"$argon2id$v=19$m=65536,t=1,p=4 $c2FsdA$aGFzaA",
		}

		for _, invalid := range invalidHashes {
			match, err := auth.VerifyPassword(invalid, "password")
			assert.ErrorIs(t, err, auth.ErrInvalidHash, "input: %s", invalid)
			assert.False(t, match)
		}
	})

	t.Run("mendukung kompatibilitas backward verifikasi hash bcrypt lama", func(t *testing.T) {
		// Contoh hash bcrypt untuk password "739184"
		bcryptHash := "$2a$10$wEeVq3dDkYkFjL/hX46/uOPjT4p1MlhP4kQG0X3lS3P3GkYmK2Kmu"
		assert.True(t, auth.IsLegacyBcryptHash(bcryptHash))

		// Buat hash bcrypt baru untuk pengetesan
		rawPIN := "582914"
		bHash, err := auth.HashPassword(rawPIN)
		require.NoError(t, err)
		assert.False(t, auth.IsLegacyBcryptHash(bHash))
	})

	t.Run("mengembalikan ErrIncompatibleVersion jika versi argon2 berbeda", func(t *testing.T) {
		incompatible := "$argon2id$v=16$m=65536,t=1,p=4$c2FsdDEyMzQ1Njc4$aGFzaDEyMzQ1Njc4"
		match, err := auth.VerifyPassword(incompatible, "password")
		assert.ErrorIs(t, err, auth.ErrIncompatibleVersion)
		assert.False(t, match)
	})
}

func TestValidatePIN_WeakBlacklistAndStrongPIN(t *testing.T) {
	t.Run("menolak kombinasi PIN sekuensial dan repetitif dalam daftar hitam", func(t *testing.T) {
		weakPINs := []string{
			"123456",
			"654321",
			"000000",
			"111111",
			"222222",
			"999999",
			"012345",
			"234567",
			"987654",
			"543210",
			"112233",
			"121212",
			"123123",
			"123321",
		}
		for _, pin := range weakPINs {
			assert.True(t, auth.IsWeakPIN(pin), "PIN %s seharusnya terdeteksi lemah", pin)
			err := auth.ValidatePIN(pin)
			assert.ErrorIs(t, err, auth.ErrWeakPIN, "PIN %s seharusnya ditolak oleh ValidatePIN", pin)
		}
	})

	t.Run("menolak format PIN yang bukan 6 digit angka", func(t *testing.T) {
		invalidFormats := []string{"", "1234", "1234567", "12345a", "abcdef"}
		for _, pin := range invalidFormats {
			err := auth.ValidatePIN(pin)
			assert.ErrorIs(t, err, auth.ErrInvalidPINFormat, "input: %s", pin)
		}
	})

	t.Run("menerima kombinasi PIN 6 digit yang kuat", func(t *testing.T) {
		strongPINs := []string{"849205", "482915", "739184", "592837", "309481"}
		for _, pin := range strongPINs {
			assert.False(t, auth.IsWeakPIN(pin), "PIN %s seharusnya valid", pin)
			require.NoError(t, auth.ValidatePIN(pin), "PIN %s seharusnya lulus validasi", pin)
		}
	})
}

