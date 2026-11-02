export interface WhatsAppBookingDetails {
  bookingCode?: string;
  workerName?: string;
  serviceName: string;
  clientName: string;
  bookingDate?: string;
  location: string;
  totalPrice: number;
  notes?: string;
}

/**
 * Memformat nominal angka ke format mata uang Rupiah standar Indonesia.
 */
export function formatCurrencyIdr(amount: number): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Memformat string ISO / tanggal ke format tanggal dan waktu yang mudah dibaca.
 */
export function formatBookingDateTime(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return '-';
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(parsed);
}

/**
 * Menyusun teks pesan konfirmasi reservasi pesanan klien untuk dikirim ke WhatsApp teknisi.
 */
export function generateWhatsAppBookingText(details: WhatsAppBookingDetails): string {
  const workerSalutation = details.workerName && details.workerName.trim()
    ? details.workerName.trim()
    : 'Mitra Teknisi';
  const bookingCodeText = details.bookingCode && details.bookingCode.trim()
    ? details.bookingCode.trim()
    : '-';
  const serviceText = details.serviceName && details.serviceName.trim()
    ? details.serviceName.trim()
    : '-';
  const clientText = details.clientName && details.clientName.trim()
    ? details.clientName.trim()
    : 'Klien';
  const dateFormatted = formatBookingDateTime(details.bookingDate);
  const priceFormatted = formatCurrencyIdr(details.totalPrice);
  const locationText = details.location && details.location.trim()
    ? details.location.trim()
    : '-';
  const notesText = details.notes && details.notes.trim()
    ? details.notes.trim()
    : '-';

  return `Halo ${workerSalutation}, saya ingin mengonfirmasi pesanan booking via Tuwaktu:\n\n` +
    `*Kode Booking:* ${bookingCodeText}\n` +
    `*Layanan:* ${serviceText}\n` +
    `*Nama Klien:* ${clientText}\n` +
    `*Jadwal Kunjungan:* ${dateFormatted}\n` +
    `*Lokasi:* ${locationText}\n` +
    `*Total Biaya:* ${priceFormatted}\n` +
    `*Catatan:* ${notesText}\n\n` +
    `Mohon konfirmasi kesediaan jadwal. Terima kasih!`;
}

/**
 * Mengonversi teks string menjadi format URL-Encoded (mengganti spasi dengan %20 dan baris baru dengan %0A).
 */
export function encodeWhatsAppMessage(rawText: string): string {
  return encodeURIComponent(rawText);
}

/**
 * Menghasilkan string teks pesan pemesanan yang langsung ter-URL-Encode (spasi menjadi %20, baris baru menjadi %0A).
 */
export function generateEncodedWhatsAppBookingText(details: WhatsAppBookingDetails): string {
  return encodeWhatsAppMessage(generateWhatsAppBookingText(details));
}

export const generateEncodedWhatsAppBookingMessage = generateEncodedWhatsAppBookingText;

/**
 * Membersihkan nomor WhatsApp dari karakter non-numerik (+, -, spasi, tanda kurung).
 */
export function sanitizeWhatsAppNumber(phoneNumber: string): string {
  return (phoneNumber || '').replace(/\D/g, '');
}

/**
 * Membangun URL lengkap WhatsApp wa.me dengan teks detail pesanan terenkode.
 */
export function buildWhatsAppBookingUrl(
  phoneNumber: string,
  details: WhatsAppBookingDetails
): string {
  let sanitizedNumber = sanitizeWhatsAppNumber(phoneNumber);
  if (sanitizedNumber.startsWith('08')) {
    sanitizedNumber = '62' + sanitizedNumber.slice(1);
  }
  const encodedText = generateEncodedWhatsAppBookingText(details);

  if (!sanitizedNumber) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${sanitizedNumber}?text=${encodedText}`;
}
