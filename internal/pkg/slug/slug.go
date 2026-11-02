package slug

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"tuwaktu.com/internal/domain"
)

var (
	dotOrQuoteRegex      = regexp.MustCompile(`[\.'’"“”]+`)
	nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)
)

// GenerateSlug generates a clean, URL-friendly slug from an input string.
// It converts characters to lowercase, strips abbreviation dots and quotation marks,
// collapses consecutive non-alphanumeric characters into a single hyphen,
// and trims hyphens from the start and end.
func GenerateSlug(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		return ""
	}

	// Remove dots and quotes so honorifics/acronyms like Dr. or S.T. join cleanly
	cleaned := dotOrQuoteRegex.ReplaceAllString(raw, "")

	// Replace all sequences of non-alphanumeric characters with a single hyphen
	slug := nonAlphanumericRegex.ReplaceAllString(cleaned, "-")

	// Trim leading and trailing hyphens
	return strings.Trim(slug, "-")
}

const maxSlugSuffixAttempts = 10000

// GenerateUniqueSlug produces a collision-free slug by checking existence with existsFn.
// If the base slug already exists, it auto-increments with a numbered suffix (e.g. -2, -3).
func GenerateUniqueSlug(
	ctx context.Context,
	baseName string,
	existsFn func(ctx context.Context, slug string) (bool, error),
) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}

	if existsFn == nil {
		return "", domain.ErrInvalidInput
	}

	baseSlug := GenerateSlug(baseName)
	if baseSlug == "" {
		return "", domain.ErrInvalidInput
	}

	exists, err := existsFn(ctx, baseSlug)
	if err != nil {
		return "", err
	}
	if !exists {
		return baseSlug, nil
	}

	for suffix := 2; suffix <= maxSlugSuffixAttempts; suffix++ {
		if err := ctx.Err(); err != nil {
			return "", err
		}

		candidate := fmt.Sprintf("%s-%d", baseSlug, suffix)
		exists, err := existsFn(ctx, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("batas maksimum percobaan collision slug (%d) terlampaui", maxSlugSuffixAttempts)
}
