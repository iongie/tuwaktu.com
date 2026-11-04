package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("token otentikasi tidak valid atau telah kedaluwarsa")
	ErrExpiredToken = errors.New("sesi login telah kedaluwarsa, silakan masuk kembali")
)

type JWTClaims struct {
	AccountID     string `json:"account_id"`
	WorkerID      string `json:"worker_id,omitempty"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	AccountStatus string `json:"account_status"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "tuwaktu-super-secret-jwt-key-2026-production"
	}
	return []byte(secret)
}

// GenerateToken membuat token JWT untuk akun pengguna
func GenerateToken(accountID string, workerID string, email string, role string, accountStatus string, duration time.Duration) (string, error) {
	if duration <= 0 {
		duration = 7 * 24 * time.Hour
	}

	claims := JWTClaims{
		AccountID:     accountID,
		WorkerID:      workerID,
		Email:         email,
		Role:          role,
		AccountStatus: accountStatus,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "tuwaktu.com",
			Subject:   accountID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", fmt.Errorf("menandatangani token jwt: %w", err)
	}

	return tokenString, nil
}

// ValidateToken memvalidasi dan mengurai token JWT
func ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode penandatanganan tidak terduga: %v", t.Header["alg"])
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

