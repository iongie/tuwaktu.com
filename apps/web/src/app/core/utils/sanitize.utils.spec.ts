import { filterNumericInput, sanitizeDigitsOnly, sanitizePlainText } from './sanitize.utils';

describe('SanitizeUtils Frontend', () => {
  describe('filterNumericInput', () => {
    it('harus memfilter karakter non-angka dari input event', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '0812-abc-3456';
      const mockEvent = { target: mockInput } as unknown as Event;

      const result = filterNumericInput(mockEvent);
      expect(result).toBe('08123456');
      expect(mockInput.value).toBe('08123456');
    });

    it('harus membatasi panjang digit jika parameter maxDigits ditentukan', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '081234567890123456';
      const mockEvent = { target: mockInput } as unknown as Event;

      const result = filterNumericInput(mockEvent, 13);
      expect(result).toBe('0812345678901');
      expect(mockInput.value).toBe('0812345678901');
    });

    it('harus mengembalikan string kosong jika event target tidak valid', () => {
      const mockEvent = { target: null } as unknown as Event;
      expect(filterNumericInput(mockEvent)).toBe('');
    });
  });

  describe('sanitizeDigitsOnly', () => {
    it('harus menyaring hanya digit angka dari teks string', () => {
      expect(sanitizeDigitsOnly('+62 (812) 345-6789')).toBe('628123456789');
    });

    it('harus memotong digit jika melebihi batas maxDigits', () => {
      expect(sanitizeDigitsOnly('123456789', 6)).toBe('123456');
    });

    it('harus menangani nilai null atau undefined dengan aman', () => {
      expect(sanitizeDigitsOnly(null)).toBe('');
      expect(sanitizeDigitsOnly(undefined)).toBe('');
    });
  });

  describe('sanitizePlainText', () => {
    it('harus menghapus tag HTML dan skrip berbahaya', () => {
      const input = '<script>alert("xss")</script><b>Halo</b> Dunia <img src="x" onerror="evil()"/>';
      const result = sanitizePlainText(input);
      expect(result).toBe('alert("xss")Halo Dunia');
    });

    it('harus menormalisasi spasi ganda dan baris baru', () => {
      const input = '   Servis   AC \n\n Rumah  Bocor   ';
      const result = sanitizePlainText(input);
      expect(result).toBe('Servis AC Rumah Bocor');
    });

    it('harus memotong teks jika melebihi batas maxLength', () => {
      const input = 'Nama Pekerja Yang Sangat Panjang Sekali';
      const result = sanitizePlainText(input, 12);
      expect(result).toBe('Nama Pekerja');
      expect(result.length).toBe(12);
    });

    it('harus mengembalikan string kosong untuk nilai kosong, null, atau undefined', () => {
      expect(sanitizePlainText('')).toBe('');
      expect(sanitizePlainText(null)).toBe('');
      expect(sanitizePlainText(undefined)).toBe('');
    });
  });
});

