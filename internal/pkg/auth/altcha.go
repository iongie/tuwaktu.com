package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	AltchaAlgorithm  = "SHA-256"
	DefaultMaxNumber = 50000
	DefaultAltchaTTL = 5 * time.Minute
)

var (
	ErrAltchaRequired = errors.New("verifikasi keamanan captcha wajib diselesaikan")
	ErrAltchaInvalid  = errors.New("verifikasi keamanan captcha tidak valid atau telah kedaluwarsa")

	// shortcut: single-process in-memory replay cache, move usedSalts to Redis when running multi-instance horizontal replicas
	usedSaltsMu sync.Mutex
	usedSalts   = make(map[string]int64)
)

type AltchaChallenge struct {
	Algorithm string `json:"algorithm"`
	Challenge string `json:"challenge"`
	MaxNumber int64  `json:"maxnumber"`
	Salt      string `json:"salt"`
	Signature string `json:"signature"`
}

type AltchaSolution struct {
	Algorithm string `json:"algorithm"`
	Challenge string `json:"challenge"`
	Number    int64  `json:"number"`
	Salt      string `json:"salt"`
	Signature string `json:"signature"`
}

func getAltchaHMACKey() []byte {
	key := strings.TrimSpace(os.Getenv("ALTCHA_HMAC_KEY"))
	if key == "" {
		return getJWTSecret()
	}
	return []byte(key)
}

func computeSHA256Hex(input string) string {
	sum := sha256.Sum256([]byte(input))
	return hex.EncodeToString(sum[:])
}

func computeHMACSHA256Hex(message string, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}

// CreateAltchaChallenge membuat tantangan Proof-of-Work ALTCHA baru dengan batas kedaluwarsa pada salt
func CreateAltchaChallenge(maxNumber int64, ttl time.Duration) (*AltchaChallenge, error) {
	if maxNumber <= 0 {
		maxNumber = DefaultMaxNumber
	}
	if ttl <= 0 {
		ttl = DefaultAltchaTTL
	}

	nonceBytes := make([]byte, 12)
	if _, err := rand.Read(nonceBytes); err != nil {
		return nil, fmt.Errorf("membuat salt acak altcha: %w", err)
	}
	expiresAt := time.Now().Add(ttl).Unix()
	salt := fmt.Sprintf("%s?expires=%d", hex.EncodeToString(nonceBytes), expiresAt)

	secretNumBig, err := rand.Int(rand.Reader, big.NewInt(maxNumber+1))
	if err != nil {
		return nil, fmt.Errorf("membuat angka rahasia altcha: %w", err)
	}
	secretNumber := secretNumBig.Int64()

	return CreateAltchaChallengeWithParams(salt, secretNumber, maxNumber), nil
}

// CreateAltchaChallengeWithParams membuat tantangan ALTCHA deterministik dari salt dan angka rahasia tertentu
func CreateAltchaChallengeWithParams(salt string, secretNumber int64, maxNumber int64) *AltchaChallenge {
	if maxNumber <= 0 {
		maxNumber = DefaultMaxNumber
	}
	challenge := computeSHA256Hex(fmt.Sprintf("%s%d", salt, secretNumber))
	signature := computeHMACSHA256Hex(challenge, getAltchaHMACKey())

	return &AltchaChallenge{
		Algorithm: AltchaAlgorithm,
		Challenge: challenge,
		MaxNumber: maxNumber,
		Salt:      salt,
		Signature: signature,
	}
}

// EncodeAltchaSolution mengodekan solusi ALTCHA ke Base64 JSON payload
func EncodeAltchaSolution(ch *AltchaChallenge, number int64) (string, error) {
	if ch == nil {
		return "", ErrAltchaInvalid
	}
	sol := AltchaSolution{
		Algorithm: ch.Algorithm,
		Challenge: ch.Challenge,
		Number:    number,
		Salt:      ch.Salt,
		Signature: ch.Signature,
	}
	raw, err := json.Marshal(sol)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(raw), nil
}

// GenerateValidAltchaPayload membuat payload solusi ALTCHA yang langsung valid (berguna untuk pengujian)
func GenerateValidAltchaPayload() (string, error) {
	ch, err := CreateAltchaChallenge(100, DefaultAltchaTTL)
	if err != nil {
		return "", err
	}
	for n := int64(0); n <= ch.MaxNumber; n++ {
		if computeSHA256Hex(fmt.Sprintf("%s%d", ch.Salt, n)) == ch.Challenge {
			return EncodeAltchaSolution(ch, n)
		}
	}
	return "", ErrAltchaInvalid
}

// VerifyAltchaPayload memverifikasi payload solusi ALTCHA (Base64 JSON maupun raw JSON)
func VerifyAltchaPayload(encodedPayload string) error {
	trimmed := strings.TrimSpace(encodedPayload)
	if trimmed == "" {
		return ErrAltchaRequired
	}

	var rawJSON []byte
	if strings.HasPrefix(trimmed, "{") {
		rawJSON = []byte(trimmed)
	} else {
		decoded, err := base64.StdEncoding.DecodeString(trimmed)
		if err != nil {
			decodedURL, errURL := base64.RawStdEncoding.DecodeString(trimmed)
			if errURL != nil {
				return ErrAltchaInvalid
			}
			rawJSON = decodedURL
		} else {
			rawJSON = decoded
		}
	}

	var sol AltchaSolution
	if err := json.Unmarshal(rawJSON, &sol); err != nil {
		return ErrAltchaInvalid
	}

	if !strings.EqualFold(strings.TrimSpace(sol.Algorithm), AltchaAlgorithm) {
		return ErrAltchaInvalid
	}
	if strings.TrimSpace(sol.Challenge) == "" || strings.TrimSpace(sol.Salt) == "" || strings.TrimSpace(sol.Signature) == "" || sol.Number < 0 {
		return ErrAltchaInvalid
	}

	expiresUnix, err := parseSaltExpiration(sol.Salt)
	if err != nil {
		return err
	}

	expectedChallenge := computeSHA256Hex(fmt.Sprintf("%s%d", sol.Salt, sol.Number))
	if !hmac.Equal([]byte(strings.ToLower(sol.Challenge)), []byte(expectedChallenge)) {
		return ErrAltchaInvalid
	}

	expectedSignature := computeHMACSHA256Hex(expectedChallenge, getAltchaHMACKey())
	if !hmac.Equal([]byte(strings.ToLower(sol.Signature)), []byte(expectedSignature)) {
		return ErrAltchaInvalid
	}

	if !consumeSaltOnce(sol.Salt, expiresUnix) {
		return ErrAltchaInvalid
	}

	return nil
}

func parseSaltExpiration(salt string) (int64, error) {
	idx := strings.Index(salt, "?")
	if idx == -1 || idx == len(salt)-1 {
		return 0, ErrAltchaInvalid
	}
	queryPart := salt[idx+1:]
	vals, err := url.ParseQuery(queryPart)
	if err != nil {
		return 0, ErrAltchaInvalid
	}
	expiresStr := vals.Get("expires")
	if expiresStr == "" {
		return 0, ErrAltchaInvalid
	}
	expiresUnix, err := strconv.ParseInt(expiresStr, 10, 64)
	if err != nil {
		return 0, ErrAltchaInvalid
	}
	if time.Now().Unix() > expiresUnix {
		return 0, ErrAltchaInvalid
	}
	return expiresUnix, nil
}

func consumeSaltOnce(salt string, expiresUnix int64) bool {
	now := time.Now().Unix()
	usedSaltsMu.Lock()
	defer usedSaltsMu.Unlock()

	for k, exp := range usedSalts {
		if now > exp {
			delete(usedSalts, k)
		}
	}

	if _, exists := usedSalts[salt]; exists {
		return false
	}
	usedSalts[salt] = expiresUnix
	return true
}
