package sanitize

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	// ErrInvalidLength adalah error ketika panjang karakter melanggar batas min/max.
	ErrInvalidLength = errors.New("panjang karakter tidak valid")

	scriptTagRegex  = regexp.MustCompile(`(?i)<script[\s\S]*?</script>`)
	styleTagRegex   = regexp.MustCompile(`(?i)<style[\s\S]*?</style>`)
	htmlTagRegex    = regexp.MustCompile(`(?i)<[^>]*>`)
	whitespaceRegex = regexp.MustCompile(`[\t\r\n\v\f]+|\s{2,}`)
)

// StripHTML menghapus script tags, style tags, dan seluruh tag HTML dari teks input.
func StripHTML(input string) string {
	if input == "" {
		return ""
	}
	s := scriptTagRegex.ReplaceAllString(input, "")
	s = styleTagRegex.ReplaceAllString(s, "")
	s = htmlTagRegex.ReplaceAllString(s, "")
	return s
}

// NormalizeWhitespace memotong spasi luar (trim) dan mengganti spasi berlebih menjadi satu spasi.
func NormalizeWhitespace(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return ""
	}
	return whitespaceRegex.ReplaceAllString(trimmed, " ")
}

// SanitizeText membersihkan HTML tags, menormalisasi spasi, dan memotong panjang teks ke maxLen rune (jika maxLen > 0).
func SanitizeText(input string, maxLen int) string {
	cleaned := NormalizeWhitespace(StripHTML(input))
	if maxLen <= 0 {
		return cleaned
	}
	runes := []rune(cleaned)
	if len(runes) > maxLen {
		return string(runes[:maxLen])
	}
	return cleaned
}

// ValidateLength memvalidasi bahwa panjang karakter (utf-8 rune count) berada dalam rentang [minLen, maxLen].
func ValidateLength(input string, fieldName string, minLen int, maxLen int) error {
	count := utf8.RuneCountInString(input)
	if minLen > 0 && count < minLen {
		return fmt.Errorf("%w: %s minimal %d karakter", ErrInvalidLength, fieldName, minLen)
	}
	if maxLen > 0 && count > maxLen {
		return fmt.Errorf("%w: %s tidak boleh melebihi %d karakter", ErrInvalidLength, fieldName, maxLen)
	}
	return nil
}

// SanitizeDigitsOnly menyaring hanya karakter numerik [0-9] dan membatasi panjang digit ke maxDigits (jika maxDigits > 0).
func SanitizeDigitsOnly(input string, maxDigits int) string {
	if input == "" {
		return ""
	}
	var builder strings.Builder
	for _, r := range input {
		if r >= '0' && r <= '9' {
			builder.WriteRune(r)
			if maxDigits > 0 && builder.Len() >= maxDigits {
				break
			}
		}
	}
	return builder.String()
}
