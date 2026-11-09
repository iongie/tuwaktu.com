package sanitize_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/pkg/sanitize"
)

func TestStripHTML(t *testing.T) {
	t.Run("menghapus tag script beserta konten di dalamnya", func(t *testing.T) {
		input := "Halo <script>alert('XSS')</script> Dunia"
		cleaned := sanitize.StripHTML(input)
		assert.Equal(t, "Halo  Dunia", cleaned)
	})

	t.Run("menghapus tag style beserta konten di dalamnya", func(t *testing.T) {
		input := "Teks <style>body{color:red;}</style> Normal"
		cleaned := sanitize.StripHTML(input)
		assert.Equal(t, "Teks  Normal", cleaned)
	})

	t.Run("menghapus berbagai tag HTML seperti anchor, img, div, p, dll", func(t *testing.T) {
		input := "<p>Paragraf <a href=\"https://evil.com\">klik disini</a> dan <img src=\"x\" onerror=\"steal()\" /> selesai.</p>"
		cleaned := sanitize.StripHTML(input)
		assert.Equal(t, "Paragraf klik disini dan  selesai.", cleaned)
	})

	t.Run("string kosong mengembalikan string kosong", func(t *testing.T) {
		assert.Equal(t, "", sanitize.StripHTML(""))
	})
}

func TestNormalizeWhitespace(t *testing.T) {
	t.Run("memotong spasi luar dan merapikan multiple spasi dan tab/newline", func(t *testing.T) {
		input := "   Budi   \t\n  Santoso   \r\n  Teknisi  "
		normalized := sanitize.NormalizeWhitespace(input)
		assert.Equal(t, "Budi Santoso Teknisi", normalized)
	})
}

func TestSanitizeText(t *testing.T) {
	t.Run("membersihkan tag HTML, menormalisasi spasi, dan memotong panjang teks", func(t *testing.T) {
		input := "  <b>Budi</b>  <script>alert(1)</script> Santoso   "
		res := sanitize.SanitizeText(input, 12)
		assert.Equal(t, "Budi Santoso", res)
	})

	t.Run("memotong teks panjang multibyte dengan benar", func(t *testing.T) {
		input := "Halo Dunia Selamat Datang"
		res := sanitize.SanitizeText(input, 10)
		assert.Equal(t, "Halo Dunia", res)
	})
}

func TestValidateLength(t *testing.T) {
	t.Run("lulus jika panjang karakter dalam rentang", func(t *testing.T) {
		err := sanitize.ValidateLength("Budi Santoso", "Nama", 3, 50)
		require.NoError(t, err)
	})

	t.Run("gagal jika panjang kurang dari minLen", func(t *testing.T) {
		err := sanitize.ValidateLength("ab", "Nama", 3, 50)
		require.Error(t, err)
		assert.ErrorIs(t, err, sanitize.ErrInvalidLength)
		assert.Contains(t, err.Error(), "Nama minimal 3 karakter")
	})

	t.Run("gagal jika panjang lebih dari maxLen", func(t *testing.T) {
		err := sanitize.ValidateLength("Budi Santoso Teknisi AC Kelistrikan Jakarta", "Nama", 3, 10)
		require.Error(t, err)
		assert.ErrorIs(t, err, sanitize.ErrInvalidLength)
		assert.Contains(t, err.Error(), "Nama tidak boleh melebihi 10 karakter")
	})
}

func TestSanitizeDigitsOnly(t *testing.T) {
	t.Run("hanya mengambil digit numerik", func(t *testing.T) {
		input := "+62 812-3456-7890 (ext. 9)"
		res := sanitize.SanitizeDigitsOnly(input, 15)
		assert.Equal(t, "62812345678909", res)
	})

	t.Run("memotong ke maxDigits jika melebihi batas", func(t *testing.T) {
		input := "081234567890123456"
		res := sanitize.SanitizeDigitsOnly(input, 13)
		assert.Equal(t, "0812345678901", res)
		assert.Len(t, res, 13)
	})
}
