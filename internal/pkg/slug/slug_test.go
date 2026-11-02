package slug_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/domain"
	"tuwaktu.com/internal/pkg/slug"
)

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "penanganan spasi ganda",
			input:    "Budi   Santoso",
			expected: "budi-santoso",
		},
		{
			name:     "penanganan gelar, simbol, dan tanda baca",
			input:    "Dr. Budi Santoso, S.T. & Rekan!",
			expected: "dr-budi-santoso-st-rekan",
		},
		{
			name:     "string dengan tanda petik dan aksen",
			input:    "O'Connor & Assocs.",
			expected: "oconnor-assocs",
		},
		{
			name:     "trim hyphen di awal dan akhir",
			input:    "--- Ahmad Dahlan ---",
			expected: "ahmad-dahlan",
		},
		{
			name:     "input kosong menghasilkan string kosong",
			input:    "   ",
			expected: "",
		},
		{
			name:     "input hanya simbol non-alfanumerik",
			input:    "!!! ??? @@@ ###",
			expected: "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := slug.GenerateSlug(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestGenerateUniqueSlug(t *testing.T) {
	ctx := context.Background()

	t.Run("slug belum terpakai mengembalikan base slug", func(t *testing.T) {
		existsFn := func(ctx context.Context, s string) (bool, error) {
			return false, nil
		}

		result, err := slug.GenerateUniqueSlug(ctx, "Budi Santoso", existsFn)
		require.NoError(t, err)
		assert.Equal(t, "budi-santoso", result)
	})

	t.Run("collision bertingkat menghasilkan suffix numerik otomatis", func(t *testing.T) {
		usedSlugs := map[string]bool{
			"budi-santoso":   true,
			"budi-santoso-2": true,
		}

		existsFn := func(ctx context.Context, s string) (bool, error) {
			return usedSlugs[s], nil
		}

		result, err := slug.GenerateUniqueSlug(ctx, "Budi Santoso", existsFn)
		require.NoError(t, err)
		assert.Equal(t, "budi-santoso-3", result)
	})

	t.Run("error saat nama dasar menghasilkan slug kosong", func(t *testing.T) {
		existsFn := func(ctx context.Context, s string) (bool, error) {
			return false, nil
		}

		_, err := slug.GenerateUniqueSlug(ctx, "   !@#$%   ", existsFn)
		require.Error(t, err)
		assert.True(t, errors.Is(err, domain.ErrInvalidInput))
	})

	t.Run("propagasi error dari fungsi existsFn", func(t *testing.T) {
		dbErr := errors.New("koneksi database terputus")
		existsFn := func(ctx context.Context, s string) (bool, error) {
			return false, dbErr
		}

		_, err := slug.GenerateUniqueSlug(ctx, "Budi Santoso", existsFn)
		require.Error(t, err)
		assert.True(t, errors.Is(err, dbErr))
	})

	t.Run("context dibatalkan sebelum operasi selesai", func(t *testing.T) {
		canceledCtx, cancel := context.WithCancel(ctx)
		cancel()

		existsFn := func(ctx context.Context, s string) (bool, error) {
			return false, nil
		}

		_, err := slug.GenerateUniqueSlug(canceledCtx, "Budi Santoso", existsFn)
		require.Error(t, err)
		assert.True(t, errors.Is(err, context.Canceled))
	})

	t.Run("context timeout saat perulangan collision", func(t *testing.T) {
		timeoutCtx, cancel := context.WithTimeout(ctx, 10*time.Millisecond)
		defer cancel()

		existsFn := func(ctx context.Context, s string) (bool, error) {
			time.Sleep(15 * time.Millisecond)
			return true, nil
		}

		_, err := slug.GenerateUniqueSlug(timeoutCtx, "Budi Santoso", existsFn)
		require.Error(t, err)
	})

	t.Run("nil existsFn returns ErrInvalidInput", func(t *testing.T) {
		_, err := slug.GenerateUniqueSlug(ctx, "Budi Santoso", nil)
		require.Error(t, err)
		assert.True(t, errors.Is(err, domain.ErrInvalidInput))
	})

	t.Run("melebihi batas maksimum percobaan collision", func(t *testing.T) {
		alwaysExistsFn := func(ctx context.Context, s string) (bool, error) {
			return true, nil
		}

		_, err := slug.GenerateUniqueSlug(ctx, "Budi Santoso", alwaysExistsFn)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "batas maksimum percobaan collision slug")
	})
}
