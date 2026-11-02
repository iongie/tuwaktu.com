import {
  WhatsAppBookingDetails,
  formatCurrencyIdr,
  formatBookingDateTime,
  generateWhatsAppBookingText,
  encodeWhatsAppMessage,
  generateEncodedWhatsAppBookingText,
  sanitizeWhatsAppNumber,
  buildWhatsAppBookingUrl,
} from './whatsapp-message.util';

describe('WhatsApp Message Utility', () => {
  const sampleDetails: WhatsAppBookingDetails = {
    bookingCode: 'TWK-20261102-1234',
    workerName: 'Budi Santoso',
    serviceName: 'Servis AC Standar',
    clientName: 'Ahmad Dahlan',
    bookingDate: '2026-11-05T09:00:00Z',
    location: 'Jl. Sudirman No. 45, Jakarta Selatan',
    totalPrice: 85000,
    notes: 'Tolong bawa tangga lipat.',
  };

  describe('formatCurrencyIdr', () => {
    it('harus memformat nominal angka ke Rupiah dengan benar', () => {
      const formatted = formatCurrencyIdr(85000);
      expect(formatted).toContain('85.000');
      expect(formatted).toContain('Rp');
    });

    it('harus menangani angka 0 atau input tidak valid secara aman', () => {
      expect(formatCurrencyIdr(0)).toContain('0');
      expect(formatCurrencyIdr(NaN)).toBe('Rp 0');
    });
  });

  describe('formatBookingDateTime', () => {
    it('harus mengembalikan strip (-) jika input tanggal kosong', () => {
      expect(formatBookingDateTime('')).toBe('-');
      expect(formatBookingDateTime(undefined)).toBe('-');
    });

    it('harus memformat tanggal ISO yang valid', () => {
      const formatted = formatBookingDateTime('2026-11-05T09:00:00Z');
      expect(formatted).not.toBe('-');
      expect(formatted.length).toBeGreaterThan(5);
    });

    it('harus mengembalikan string asli jika parsing tanggal gagal', () => {
      expect(formatBookingDateTime('tanggal-tidak-valid')).toBe('tanggal-tidak-valid');
    });
  });

  describe('generateWhatsAppBookingText', () => {
    it('harus menyusun pesan WhatsApp lengkap dengan kode booking dan rincian pesanan', () => {
      const text = generateWhatsAppBookingText(sampleDetails);

      expect(text).toContain('Halo Budi Santoso');
      expect(text).toContain('*Kode Booking:* TWK-20261102-1234');
      expect(text).toContain('*Layanan:* Servis AC Standar');
      expect(text).toContain('*Nama Klien:* Ahmad Dahlan');
      expect(text).toContain('*Lokasi:* Jl. Sudirman No. 45, Jakarta Selatan');
      expect(text).toContain('*Total Biaya:*');
      expect(text).toContain('85.000');
      expect(text).toContain('*Catatan:* Tolong bawa tangga lipat.');
    });

    it('harus menggunakan nilai default jika nama teknisi atau catatan kosong', () => {
      const detailsWithoutOptional: WhatsAppBookingDetails = {
        serviceName: 'Perbaikan Kelistrikan',
        clientName: 'Siti Rahma',
        location: 'Depok',
        totalPrice: 50000,
      };

      const text = generateWhatsAppBookingText(detailsWithoutOptional);

      expect(text).toContain('Halo Mitra Teknisi');
      expect(text).toContain('*Kode Booking:* -');
      expect(text).toContain('*Catatan:* -');
    });
  });

  describe('encodeWhatsAppMessage', () => {
    it('harus mengonversi spasi menjadi %20 dan baris baru menjadi %0A', () => {
      const raw = 'Halo Teknisi\nKode: 123';
      const encoded = encodeWhatsAppMessage(raw);

      expect(encoded).toContain('Halo%20Teknisi');
      expect(encoded).toContain('%0AKode%3A%20123');
      expect(encoded).not.toContain(' ');
      expect(encoded).not.toContain('\n');
    });
  });

  describe('sanitizeWhatsAppNumber', () => {
    it('harus membersihkan karakter non-digit seperti +, -, spasi, dan tanda kurung', () => {
      expect(sanitizeWhatsAppNumber('+62 812-3456-7890')).toBe('6281234567890');
      expect(sanitizeWhatsAppNumber('(021) 765-4321')).toBe('0217654321');
      expect(sanitizeWhatsAppNumber('')).toBe('');
    });
  });

  describe('generateEncodedWhatsAppBookingText', () => {
    it('harus menghasilkan string pesan terenkode URL lengkap langsung dari objek detail pesanan', () => {
      const encoded = generateEncodedWhatsAppBookingText(sampleDetails);

      expect(encoded).toContain('Halo%20Budi%20Santoso');
      expect(encoded).toContain('*Jadwal%20Kunjungan%3A*');
      expect(encoded).toContain('TWK-20261102-1234');
      expect(encoded).not.toContain('\n');
      expect(encoded).toContain('%0A');
    });
  });

  describe('buildWhatsAppBookingUrl', () => {
    it('harus membangun URL wa.me dengan nomor pekerja dan pesan yang di-URL-Encode', () => {
      const url = buildWhatsAppBookingUrl('+62 812-3456-7890', sampleDetails);

      expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true);
      expect(url).toContain('%20');
      expect(url).toContain('%0A');
      expect(url).toContain('TWK-20261102-1234');
    });

    it('harus mengonversi nomor telepon lokal yang berawalan 08 menjadi 628', () => {
      const url = buildWhatsAppBookingUrl('081234567890', sampleDetails);

      expect(url.startsWith('https://wa.me/6281234567890?text=')).toBe(true);
    });

    it('harus menghasilkan URL wa.me tanpa nomor jika nomor telepon tidak tersedia', () => {
      const url = buildWhatsAppBookingUrl('', sampleDetails);

      expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    });
  });
});
