package media

import (
	"strings"
	"testing"
	"time"
)

func TestExtractFilename(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"avt_123.webp", "avt_123.webp"},
		{"/api/v1/media/avatars/avt_123.webp?exp=123&sig=abc", "avt_123.webp"},
		{"http://localhost:3000/api/v1/media/avatars/avt_999.jpg", "avt_999.jpg"},
		{"storage/uploads/avatars/avt_file.png", "avt_file.png"},
		{"", ""},
	}

	for _, tt := range tests {
		actual := ExtractFilename(tt.input)
		if actual != tt.expected {
			t.Errorf("ExtractFilename(%s) = %s, expected %s", tt.input, actual, tt.expected)
		}
	}
}

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		name        string
		filename    string
		shouldError bool
	}{
		{"Valid WebP", "avt_123456789.webp", false},
		{"Valid JPG", "profile_user-123.jpg", false},
		{"Valid PNG", "avatar_hero_99.png", false},
		{"Path Traversal dot dot", "../secret.txt", true},
		{"Path Traversal absolute", "/etc/passwd", true},
		{"Path Traversal backslash", "..\\uploads\\test.webp", true},
		{"Invalid Extension", "malicious_script.php", true},
		{"Special characters", "file$(rm -rf).webp", true},
		{"Empty string", "", true},
		{"Spaces in name", "avatar profile.webp", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := SanitizeFilename(tt.filename)
			if tt.shouldError && err == nil {
				t.Errorf("Expected error for %s, but got nil", tt.filename)
			}
			if !tt.shouldError && err != nil {
				t.Errorf("Expected no error for %s, but got %v", tt.filename, err)
			}
		})
	}
}

func TestSignAndVerifyMediaURL(t *testing.T) {
	filename := "avt_01931a2b3c4d.webp"
	signedURL, err := SignMediaURL("", filename, 2*time.Hour)
	if err != nil {
		t.Fatalf("Failed to sign media URL: %v", err)
	}

	if !strings.Contains(signedURL, filename) {
		t.Errorf("Signed URL should contain filename, got: %s", signedURL)
	}
	if !strings.Contains(signedURL, "exp=") || !strings.Contains(signedURL, "sig=") {
		t.Errorf("Signed URL missing exp or sig param: %s", signedURL)
	}

	// Extract query params from URL
	parts := strings.Split(signedURL, "?")
	if len(parts) != 2 {
		t.Fatalf("Invalid signed URL format: %s", signedURL)
	}
	queryParts := strings.Split(parts[1], "&")
	var expStr, sigStr string
	for _, qp := range queryParts {
		if strings.HasPrefix(qp, "exp=") {
			expStr = strings.TrimPrefix(qp, "exp=")
		}
		if strings.HasPrefix(qp, "sig=") {
			sigStr = strings.TrimPrefix(qp, "sig=")
		}
	}

	// 1. Valid verification
	if err := VerifyMediaSignature(filename, expStr, sigStr); err != nil {
		t.Errorf("Verification should succeed, got: %v", err)
	}

	// 2. Tampered signature
	tamperedSig := sigStr[:len(sigStr)-2] + "ff"
	if err := VerifyMediaSignature(filename, expStr, tamperedSig); err != ErrInvalidSignature {
		t.Errorf("Expected ErrInvalidSignature for tampered sig, got: %v", err)
	}

	// 3. Expired token
	pastExpStr := "1000000000" // Year 2001
	pastSig := GenerateSignature(filename, 1000000000, GetMediaSecret())
	if err := VerifyMediaSignature(filename, pastExpStr, pastSig); err != ErrExpiredToken {
		t.Errorf("Expected ErrExpiredToken, got: %v", err)
	}

	// 4. Invalid filename path traversal
	if err := VerifyMediaSignature("../other.webp", expStr, sigStr); err != ErrInvalidFilename {
		t.Errorf("Expected ErrInvalidFilename for path traversal, got: %v", err)
	}
}

