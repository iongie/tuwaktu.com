/**
 * Utilitas sanitasi dan proteksi masukan data pada antarmuka frontend Tuwaktu.
 * Mencegah injeksi kode (XSS), normalisasi spasi ganda, dan pembatasan panjang karakter.
 */

/**
 * Membersihkan input form numerik secara langsung saat pengguna mengetik.
 * Menghapus semua karakter selain angka [0-9] dan membatasi jumlah digit jika ditentukan.
 */
export function filterNumericInput(event: Event, maxDigits?: number): string {
  const input = event.target as HTMLInputElement | null;
  if (!input) {
    return '';
  }

  let cleaned = (input.value || '').replace(/[^0-9]/g, '');
  if (maxDigits && maxDigits > 0 && cleaned.length > maxDigits) {
    cleaned = cleaned.slice(0, maxDigits);
  }

  input.value = cleaned;
  return cleaned;
}

/**
 * Mengambil hanya digit angka dari teks string dan memotong sesuai batas maksimal jika ditentukan.
 */
export function sanitizeDigitsOnly(value: string | null | undefined, maxDigits?: number): string {
  if (!value) {
    return '';
  }

  let cleaned = value.replace(/[^0-9]/g, '');
  if (maxDigits && maxDigits > 0 && cleaned.length > maxDigits) {
    cleaned = cleaned.slice(0, maxDigits);
  }

  return cleaned;
}

/**
 * Membersihkan teks bebas dari tag HTML, menormalisasi spasi ganda dan baris kosong berlebih,
 * serta memotong panjang teks sesuai batas maksimal yang ditentukan.
 */
export function sanitizePlainText(value: string | null | undefined, maxLength?: number): string {
  if (!value) {
    return '';
  }

  // Hapus semua tag HTML dan skrip
  let cleaned = value.replace(/<[^>]*>/g, '');

  // Normalisasi karakter spasi/whitespace berulang menjadi satu spasi biasa
  cleaned = cleaned.replace(/[\t\r\n\v\f]+|\s{2,}/g, ' ').trim();

  // Batasi panjang teks jika parameter maxLength disertakan
  if (maxLength && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

