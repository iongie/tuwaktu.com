package geo

import (
	"math"
)

// EarthRadiusKm represents the standard volumetric mean radius of the Earth in kilometers.
const EarthRadiusKm = 6371.0

// CalculateDistance calculates the straight-line (great-circle) distance in kilometers
// between two geographic coordinates using the Haversine formula.
// The result is rounded to 2 decimal places.
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	if math.IsNaN(lat1) || math.IsNaN(lon1) || math.IsNaN(lat2) || math.IsNaN(lon2) {
		return 0.0
	}
	if math.IsInf(lat1, 0) || math.IsInf(lon1, 0) || math.IsInf(lat2, 0) || math.IsInf(lon2, 0) {
		return 0.0
	}
	if lat1 == lat2 && lon1 == lon2 {
		return 0.0
	}

	// Convert degrees to radians
	radLat1 := lat1 * math.Pi / 180.0
	radLon1 := lon1 * math.Pi / 180.0
	radLat2 := lat2 * math.Pi / 180.0
	radLon2 := lon2 * math.Pi / 180.0

	deltaLat := radLat2 - radLat1
	deltaLon := radLon2 - radLon1

	sinHalfDeltaLat := math.Sin(deltaLat / 2.0)
	sinHalfDeltaLon := math.Sin(deltaLon / 2.0)

	a := (sinHalfDeltaLat * sinHalfDeltaLat) +
		math.Cos(radLat1)*math.Cos(radLat2)*(sinHalfDeltaLon*sinHalfDeltaLon)

	if a < 0.0 {
		a = 0.0
	} else if a > 1.0 {
		a = 1.0
	}

	c := 2.0 * math.Atan2(math.Sqrt(a), math.Sqrt(1.0-a))
	dist := EarthRadiusKm * c

	return math.Round(dist*100.0) / 100.0
}
