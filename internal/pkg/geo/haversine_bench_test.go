package geo_test

import (
	"testing"

	"tuwaktu.com/internal/pkg/geo"
)

func BenchmarkCalculateDistance(b *testing.B) {
	// Jakarta Selatan ke Tangerang Selatan (~14.2 km)
	lat1, lon1 := -6.2921, 106.7992
	lat2, lon2 := -6.2838, 106.7115

	b.ReportAllocs()
	for b.Loop() {
		geo.CalculateDistance(lat1, lon1, lat2, lon2)
	}
}

func BenchmarkCalculateDistance_Table(b *testing.B) {
	cases := []struct {
		name string
		lat1 float64
		lon1 float64
		lat2 float64
		lon2 float64
	}{
		{
			name: "SameCoordinate",
			lat1: -6.2921,
			lon1: 106.7992,
			lat2: -6.2921,
			lon2: 106.7992,
		},
		{
			name: "ShortDistance_3km",
			lat1: -6.2921,
			lon1: 106.7992,
			lat2: -6.3150,
			lon2: 106.8100,
		},
		{
			name: "MediumDistance_15km",
			lat1: -6.2921,
			lon1: 106.7992,
			lat2: -6.2000,
			lon2: 106.8500,
		},
		{
			name: "LongDistance_50km",
			lat1: -6.2921,
			lon1: 106.7992,
			lat2: -6.5950,
			lon2: 106.8166,
		},
	}

	for _, tc := range cases {
		b.Run(tc.name, func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() {
				geo.CalculateDistance(tc.lat1, tc.lon1, tc.lat2, tc.lon2)
			}
		})
	}
}

