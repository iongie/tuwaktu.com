package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonMemory      uint32 = 64 * 1024
	argonIterations  uint32 = 1
	argonParallelism uint8  = 4
	argonSaltLength  uint32 = 16
	argonKeyLength   uint32 = 32
)

var (
	ErrInvalidHash         = errors.New("format hash kata sandi argon2id tidak valid")
	ErrIncompatibleVersion = errors.New("versi argon2 tidak kompatibel")
)

// HashPassword mengenkripsi kata sandi atau PIN menggunakan algoritma Argon2id dalam format standar PHC
func HashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("membuat salt kriptografi: %w", err)
	}

	hash := argon2.IDKey([]byte(password), salt, argonIterations, argonMemory, argonParallelism, argonKeyLength)

	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonIterations, argonParallelism, b64Salt, b64Hash), nil
}

// VerifyPassword membandingkan kata sandi plaintext terhadap string hash Argon2id secara constant-time
func VerifyPassword(encodedHash, password string) (bool, error) {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 || parts[0] != "" || parts[1] != "argon2id" ||
		strings.ContainsAny(parts[2], " \t\n\r") || strings.ContainsAny(parts[3], " \t\n\r") {
		return false, ErrInvalidHash
	}

	var version int
	var extra string
	if _, err := fmt.Sscanf(parts[2], "v=%d%s", &version, &extra); err == nil {
		return false, ErrInvalidHash
	}
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return false, ErrInvalidHash
	}
	if version != argon2.Version {
		return false, ErrIncompatibleVersion
	}

	var memory, iterations uint32
	var parallelism uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d%s", &memory, &iterations, &parallelism, &extra); err == nil {
		return false, ErrInvalidHash
	}
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil {
		return false, ErrInvalidHash
	}
	if memory == 0 || iterations == 0 || parallelism == 0 {
		return false, ErrInvalidHash
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil || len(salt) == 0 {
		return false, ErrInvalidHash
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil || len(expectedHash) == 0 {
		return false, ErrInvalidHash
	}

	computedHash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(expectedHash)))
	if subtle.ConstantTimeCompare(expectedHash, computedHash) == 1 {
		return true, nil
	}

	return false, nil
}
