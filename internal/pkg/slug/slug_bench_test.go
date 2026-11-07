package slug_test

import (
	"context"
	"testing"

	"tuwaktu.com/internal/pkg/slug"
)

func BenchmarkGenerateSlug(b *testing.B) {
	input := "Dr. Budi Santoso, S.T. - Teknisi AC & Kelistrikan Profesional!"

	b.ReportAllocs()
	for b.Loop() {
		slug.GenerateSlug(input)
	}
}

func BenchmarkGenerateSlug_Table(b *testing.B) {
	cases := []struct {
		name  string
		input string
	}{
		{
			name:  "ShortSimple",
			input: "budi santoso",
		},
		{
			name:  "PunctuationAndHonorifics",
			input: "Dr. Siti Aminah, M.Kom.",
		},
		{
			name:  "LongComplexWithSpecialChars",
			input: "Spesialis Cuci AC 0.5 - 1 PK (Inverter & Low Watt) @ Jakarta Selatan #1",
		},
		{
			name:  "AlreadySlugified",
			input: "budi-santoso-teknisi-ac",
		},
	}

	for _, tc := range cases {
		b.Run(tc.name, func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() {
				slug.GenerateSlug(tc.input)
			}
		})
	}
}

func BenchmarkGenerateUniqueSlug(b *testing.B) {
	ctx := context.Background()
	// Mock existsFn: exists on first 3 attempts, free on 4th
	existsMock := func(ctx context.Context, checkSlug string) (bool, error) {
		if checkSlug == "budi-santoso" || checkSlug == "budi-santoso-2" || checkSlug == "budi-santoso-3" {
			return true, nil
		}
		return false, nil
	}

	b.ReportAllocs()
	for b.Loop() {
		_, _ = slug.GenerateUniqueSlug(ctx, "Budi Santoso", existsMock)
	}
}

