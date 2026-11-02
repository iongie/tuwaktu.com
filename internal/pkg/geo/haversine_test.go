package geo_test

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"tuwaktu.com/internal/pkg/geo"
)

func TestCalculateDistance(t *testing.T) {
	tests := []struct {
		name        string
		lat1, lon1  float64
		lat2, lon2  float64
		expectedKm  float64
		toleranceKm float64
	}{
		{
			name:        "Titik identik menghasilkan jarak nol",
			lat1:        -6.2000,
			lon1:        106.8166,
			lat2:        -6.2000,
			lon2:        106.8166,
			expectedKm:  0.0,
			toleranceKm: 0.001,
		},
		{
			name:        "Jarak Monas ke Blok M (dalam area Jakarta)",
			lat1:        -6.1754,
			lon1:        106.8272,
			lat2:        -6.2443,
			lon2:        106.7978,
			expectedKm:  8.32,
			toleranceKm: 0.1,
		},
		{
			name:        "Jarak Jakarta (Monas) ke Bandung (Gedung Sate)",
			lat1:        -6.1754,
			lon1:        106.8272,
			lat2:        -6.9025,
			lon2:        107.6186,
			expectedKm:  119.50,
			toleranceKm: 0.5,
		},
		{
			name:        "Jarak lintas khatulistiwa: Jakarta ke Singapura",
			lat1:        -6.2088,
			lon1:        106.8456,
			lat2:        1.3521,
			lon2:        103.8198,
			expectedKm:  905.35,
			toleranceKm: 1.0,
		},
		{
			name:        "Kutub Utara ke Kutub Selatan (setengah keliling bumi)",
			lat1:        90.0,
			lon1:        0.0,
			lat2:        -90.0,
			lon2:        0.0,
			expectedKm:  20015.09,
			toleranceKm: 1.0,
		},
		{
			name:        "Jarak dekat: radius 500 meter (0.5 km)",
			lat1:        -6.2921000,
			lon1:        106.7992000,
			lat2:        -6.2941000,
			lon2:        106.8025000,
			expectedKm:  0.43,
			toleranceKm: 0.05,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := geo.CalculateDistance(tt.lat1, tt.lon1, tt.lat2, tt.lon2)
			assert.InDelta(t, tt.expectedKm, actual, tt.toleranceKm,
				"Jarak antara (%f, %f) dan (%f, %f) harus mendekati %f km",
				tt.lat1, tt.lon1, tt.lat2, tt.lon2, tt.expectedKm)

			// Tes simetri: jarak dari A ke B harus sama dengan B ke A
			reverseActual := geo.CalculateDistance(tt.lat2, tt.lon2, tt.lat1, tt.lon1)
			assert.Equal(t, actual, reverseActual, "Jarak harus simetris terlepas dari arah titik koordinat")
		})
	}

	t.Run("Input NaN dan Inf menghasilkan jarak 0 tanpa panic", func(t *testing.T) {
		assert.Equal(t, 0.0, geo.CalculateDistance(math.Inf(1), 106.8, -6.2, 106.8))
		assert.Equal(t, 0.0, geo.CalculateDistance(math.NaN(), 106.8, -6.2, 106.8))
		assert.Equal(t, 0.0, geo.CalculateDistance(-6.2, 106.8, -6.2, math.NaN()))
	})
}
