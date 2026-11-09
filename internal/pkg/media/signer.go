package media

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var (
	// ErrInvalidFilename indicates filename violates safety regex or contains path traversal attempts
	ErrInvalidFilename = errors.New("nama berkas tidak valid atau tidak diizinkan")
	// ErrExpiredToken indicates the signed URL timestamp has expired
	ErrExpiredToken = errors.New("tautan media telah kadaluarsa")
	// ErrInvalidSignature indicates HMAC signature mismatch
	ErrInvalidSignature = errors.New("tanda tangan tautan media tidak sah")

	// safeFilenameRegex strictly allows only alphanumeric characters, underscores, hyphens, and safe image extensions
	safeFilenameRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+\.(webp|jpg|jpeg|png)$`)
)

// GetMediaSecret retrieves the signing secret from environment or uses a secure default key
func GetMediaSecret() []byte {
	secret := strings.TrimSpace(os.Getenv("MEDIA_SIGNING_SECRET"))
	if secret == "" {
		secret = strings.TrimSpace(os.Getenv("JWT_SECRET"))
	}
	if secret == "" {
		secret = "tuwaktu-media-signing-secure-key-2026-prod"
	}
	return []byte(secret)
}

// SanitizeFilename verifies that the filename contains no path traversal sequences
// and matches the allowed alphanumeric pattern with image extensions.
func SanitizeFilename(filename string) (string, error) {
	trimmed := strings.TrimSpace(filename)
	if trimmed == "" {
		return "", ErrInvalidFilename
	}
	// Check for path traversal characters
	if strings.Contains(trimmed, "..") || strings.Contains(trimmed, "/") || strings.Contains(trimmed, "\\") {
		return "", ErrInvalidFilename
	}
	lower := strings.ToLower(trimmed)
	if !safeFilenameRegex.MatchString(lower) {
		return "", ErrInvalidFilename
	}
	return lower, nil
}

// GenerateSignature generates an HMAC-SHA256 hex string for a given filename and expiration timestamp
func GenerateSignature(filename string, exp int64, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	payload := fmt.Sprintf("%s:%d", strings.ToLower(strings.TrimSpace(filename)), exp)
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}

// SignMediaURL creates a dynamic signed URL with expiration timestamp and HMAC signature
func SignMediaURL(baseURL string, filename string, ttl time.Duration) (string, error) {
	cleanFilename, err := SanitizeFilename(filename)
	if err != nil {
		return "", err
	}
	if ttl <= 0 {
		ttl = 4 * time.Hour // Default 4 hours expiration
	}
	exp := time.Now().Add(ttl).Unix()
	sig := GenerateSignature(cleanFilename, exp, GetMediaSecret())

	base := strings.TrimRight(baseURL, "/")
	if base == "" {
		base = "/api/v1/media/avatars"
	} else if !strings.HasSuffix(base, "/media/avatars") && !strings.HasSuffix(base, "/media/avatars/") {
		base = base + "/api/v1/media/avatars"
	}

	return fmt.Sprintf("%s/%s?exp=%d&sig=%s", strings.TrimRight(base, "/"), cleanFilename, exp, sig), nil
}

// VerifyMediaSignature verifies the HMAC signature and checks if the URL has expired
func VerifyMediaSignature(filename string, expStr string, sigStr string) error {
	cleanFilename, err := SanitizeFilename(filename)
	if err != nil {
		return ErrInvalidFilename
	}

	exp, err := strconv.ParseInt(strings.TrimSpace(expStr), 10, 64)
	if err != nil {
		return ErrInvalidSignature
	}

	if time.Now().Unix() > exp {
		return ErrExpiredToken
	}

	expectedSig := GenerateSignature(cleanFilename, exp, GetMediaSecret())
	if !hmac.Equal([]byte(strings.ToLower(strings.TrimSpace(sigStr))), []byte(expectedSig)) {
		return ErrInvalidSignature
	}

	return nil
}

