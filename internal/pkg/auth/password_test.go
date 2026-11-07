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
		adminSeedHash := "$argon2id$v=19$m=65536,t=1,p=4$h/Q2qYh7zsDv75pBmrRVhg$RXPT5jUCz0gCbq9DHF3Rrh4JNSakKukU3MMK+yDYs58"
		matchAdmin, err := auth.VerifyPassword(adminSeedHash, "AdminTuwaktu2026!")
		require.NoError(t, err)
		assert.True(t, matchAdmin)

		workerSeedHash := "$argon2id$v=19$m=65536,t=1,p=4$kguxhYUFs7XucnY26sw4BQ$xH2Q9SU7o50Lp0MevX4AKgozmFdVGvkUmANpoya98qU"
		matchWorker, err := auth.VerifyPassword(workerSeedHash, "MitraTuwaktu2026!")
		require.NoError(t, err)
		assert.True(t, matchWorker)
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

	t.Run("mengembalikan ErrIncompatibleVersion jika versi argon2 berbeda", func(t *testing.T) {
		incompatible := "$argon2id$v=16$m=65536,t=1,p=4$c2FsdDEyMzQ1Njc4$aGFzaDEyMzQ1Njc4"
		match, err := auth.VerifyPassword(incompatible, "password")
		assert.ErrorIs(t, err, auth.ErrIncompatibleVersion)
		assert.False(t, match)
	})
}
