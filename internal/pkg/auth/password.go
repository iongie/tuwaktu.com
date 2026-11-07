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
	ErrInvalidPINFormat    = errors.New("PIN keamanan harus berupa 6 digit angka")
	ErrWeakPIN             = errors.New("PIN terlalu lemah: hindari kombinasi angka berurutan atau berulang seperti 123456 atau 111111")
)

var weakPINBlacklist = map[string]struct{}{
	"000000": {}, "111111": {}, "222222": {}, "333333": {}, "444444": {},
	"555555": {}, "666666": {}, "777777": {}, "888888": {}, "999999": {},
	"012345": {}, "123456": {}, "234567": {}, "345678": {}, "456789": {}, "567890": {},
	"987654": {}, "876543": {}, "765432": {}, "654321": {}, "543210": {}, "432109": {},
	"112233": {}, "121212": {}, "123123": {}, "123321": {}, "102030": {},
	"001122": {}, "223344": {}, "334455": {}, "445566": {}, "556677": {},
	"667788": {}, "778899": {}, "889900": {}, "998877": {}, "101010": {},
}

// IsWeakPIN memeriksa apakah PIN 6 digit termasuk dalam daftar terlarang, berulang, atau berurutan.
func IsWeakPIN(pin string) bool {
	pin = strings.TrimSpace(pin)
	if len(pin) != 6 {
		return false
	}
	for i := 0; i < 6; i++ {
		if pin[i] < '0' || pin[i] > '9' {
			return false
		}
	}

	if _, blacklisted := weakPINBlacklist[pin]; blacklisted {
		return true
	}

	allSame := true
	isAsc := true
	isDesc := true
	for i := 1; i < 6; i++ {
		if pin[i] != pin[0] {
			allSame = false
		}
		if int(pin[i])-int(pin[i-1]) != 1 {
			isAsc = false
		}
		if int(pin[i-1])-int(pin[i]) != 1 {
			isDesc = false
		}
	}
	if allSame || isAsc || isDesc {
		return true
	}

	// Blokir pola pengulangan pasangan 2 digit (ABABAB), 3 digit (ABCABC), atau kembar berpasangan (AABBCC)
	if (pin[0] == pin[2] && pin[2] == pin[4] && pin[1] == pin[3] && pin[3] == pin[5]) ||
		(pin[0] == pin[3] && pin[1] == pin[4] && pin[2] == pin[5]) ||
		(pin[0] == pin[1] && pin[2] == pin[3] && pin[4] == pin[5]) {
		return true
	}

	return false
}

// ValidatePIN memvalidasi bahwa PIN terdiri dari tepat 6 digit numerik dan bukan kombinasi lemah.
func ValidatePIN(pin string) error {
	pin = strings.TrimSpace(pin)
	if len(pin) != 6 {
		return ErrInvalidPINFormat
	}
	for i := 0; i < 6; i++ {
		if pin[i] < '0' || pin[i] > '9' {
			return ErrInvalidPINFormat
		}
	}
	if IsWeakPIN(pin) {
		return ErrWeakPIN
	}
	return nil
}

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
