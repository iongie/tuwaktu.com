package auth_test

import (
	"fmt"
	"testing"
	"time"

	"tuwaktu.com/internal/pkg/auth"
)

func BenchmarkCreateAltchaChallenge(b *testing.B) {
	b.ReportAllocs()
	for b.Loop() {
		_, _ = auth.CreateAltchaChallenge(50000, 5*time.Minute)
	}
}

func BenchmarkCreateAltchaChallengeWithParams(b *testing.B) {
	salt := "abcdef012345?expires=1794012476"
	secret := int64(12345)

	b.ReportAllocs()
	for b.Loop() {
		_ = auth.CreateAltchaChallengeWithParams(salt, secret, 50000)
	}
}

func BenchmarkEncodeAltchaSolution(b *testing.B) {
	ch := auth.CreateAltchaChallengeWithParams("abcdef012345?expires=1794012476", 12345, 50000)

	b.ReportAllocs()
	for b.Loop() {
		_, _ = auth.EncodeAltchaSolution(ch, 12345)
	}
}

func BenchmarkVerifyAltchaPayload(b *testing.B) {
	// Pre-generate unique valid payloads so anti-replay consumeSaltOnce succeeds
	const pregenCount = 1000
	payloads := make([]string, pregenCount)
	for i := 0; i < pregenCount; i++ {
		salt := fmt.Sprintf("benchsalt%d?expires=%d", i, time.Now().Add(10*time.Minute).Unix())
		ch := auth.CreateAltchaChallengeWithParams(salt, 42, 1000)
		encoded, err := auth.EncodeAltchaSolution(ch, 42)
		if err != nil {
			b.Fatalf("failed to encode: %v", err)
		}
		payloads[i] = encoded
	}

	idx := 0
	b.ReportAllocs()
	for b.Loop() {
		payload := payloads[idx%pregenCount]
		idx++
		_ = auth.VerifyAltchaPayload(payload)
	}
}

