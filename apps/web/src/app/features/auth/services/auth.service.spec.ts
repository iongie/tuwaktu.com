import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { LoginFormData, RegisterFormData } from '../models/auth.models';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  it('harus terinisialisasi dengan daftar spesialisasi bawaan', () => {
    expect(service.specialtyOptions.length).toBeGreaterThan(0);
    expect(service.selectedSpecialty().label).toBe('Spesialis Kebersihan Hunian');
  });

  it('harus mampu memilih spesialisasi berdasarkan objek atau ID', () => {
    service.selectSpecialtyById('ac-electric');
    expect(service.selectedSpecialty().id).toBe('ac-electric');
    expect(service.selectedSpecialty().label).toBe('Teknisi AC & Kelistrikan');

    service.selectSpecialty({
      id: 'audio-acoustic',
      label: 'Servis Audio Akustik',
    });
    expect(service.selectedSpecialty().id).toBe('audio-acoustic');
  });

  it('harus memvalidasi kustom slug dengan benar', () => {
    const emptySlug = service.validateSlug('');
    expect(emptySlug.isValid).toBe(false);
    expect(emptySlug.message).toContain('Wajib diisi');

    const invalidShort = service.validateSlug('ab');
    expect(invalidShort.isValid).toBe(false);
    expect(invalidShort.message).toContain('Minimal 3 karakter');

    const validSlug = service.validateSlug('sarah-cleaning');
    expect(validSlug.isValid).toBe(true);
    expect(validSlug.message).toBe('Tersedia & Siap Diklaim');
  });

  it('harus membersihkan dan mensanitasi slug dari spasi dan karakter ilegal', () => {
    const sanitized = service.sanitizeSlug('Sarah Melinda & Co 2026!');
    expect(sanitized).toBe('sarah-melinda-co-2026');
  });

  it('harus menolak OTP jika nomor WA kurang dari 8 digit', async () => {
    const success = await service.sendInstantOtp('123', 0);
    expect(success).toBe(false);
    expect(service.otpStatus()).toBe('error');
  });

  it('harus berhasil mengirim OTP jika nomor WA valid', async () => {
    const success = await service.sendInstantOtp('08123456789', 0);
    expect(success).toBe(true);
    expect(service.otpStatus()).toBe('sent');
    expect(service.otpFeedbackMessage()).toContain('Kode OTP 6-Digit dikirim langsung');
  });

  it('harus mendukung simulasi jeda waktu saat delayMs positif', async () => {
    jest.useFakeTimers();
    const promise = service.sendInstantOtp('08123456789', 500);
    expect(service.otpStatus()).toBe('sending');
    jest.advanceTimersByTime(500);
    const success = await promise;
    expect(success).toBe(true);
    expect(service.otpStatus()).toBe('sent');
    jest.useRealTimers();
  });

  it('harus menolak magic link jika nomor WA tidak valid', async () => {
    const success = await service.sendMagicLink('123', 0);
    expect(success).toBe(false);
    expect(service.magicLinkStatus()).toBe('error');
  });

  it('harus berhasil mengirim magic link jika nomor WA valid', async () => {
    const success = await service.sendMagicLink('08123456789', 0);
    expect(success).toBe(true);
    expect(service.magicLinkStatus()).toBe('sent');
    expect(service.magicLinkFeedbackMessage()).toBe('Tautan Terkirim ke WhatsApp Anda!');
  });

  describe('validateRegistration', () => {
    const validData: RegisterFormData = {
      fullName: 'Budi Santoso',
      specialtyId: 'cleaning',
      specialtyLabel: 'Spesialis Kebersihan Hunian',
      waNumber: '081234567890',
      basecamp: 'Tebet Barat, Jakarta Selatan',
      customSlug: 'budi-santoso',
      pin: '123456',
      pinConfirm: '123456',
      doctrineAccepted: true,
    };

    it('harus lulus jika semua data valid', () => {
      const res = service.validateRegistration(validData);
      expect(res.isValid).toBe(true);
    });

    it('harus gagal jika nama kosong', () => {
      const res = service.validateRegistration({ ...validData, fullName: '   ' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Nama lengkap');
    });

    it('harus gagal jika nomor wa tidak valid', () => {
      const res = service.validateRegistration({ ...validData, waNumber: '123' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('WhatsApp');
    });

    it('harus gagal jika PIN bukan 6 digit numerik', () => {
      const res = service.validateRegistration({ ...validData, pin: '1234a', pinConfirm: '1234a' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('6 digit');
    });

    it('harus gagal jika konfirmasi PIN tidak cocok', () => {
      const res = service.validateRegistration({ ...validData, pin: '123456', pinConfirm: '654321' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('tidak cocok');
    });

    it('harus gagal jika pakta kedaulatan belum disetujui', () => {
      const res = service.validateRegistration({ ...validData, doctrineAccepted: false });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Pakta Kedaulatan');
    });
  });

  describe('validateLogin', () => {
    const validWaLogin: LoginFormData = {
      method: 'wa',
      waNumber: '081234567890',
      workerId: '',
      pin: '123456',
      rememberDevice: true,
    };

    it('harus lulus login WhatsApp dengan nomor dan PIN valid', () => {
      const res = service.validateLogin(validWaLogin);
      expect(res.isValid).toBe(true);
    });

    it('harus gagal login WhatsApp jika nomor terlalu pendek', () => {
      const res = service.validateLogin({ ...validWaLogin, waNumber: '123' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('WhatsApp terdaftar');
    });

    it('harus lulus login ID dengan workerId dan PIN valid', () => {
      const res = service.validateLogin({
        method: 'id',
        waNumber: '',
        workerId: 'budi@tuwaktu.com',
        pin: '123456',
        rememberDevice: false,
      });
      expect(res.isValid).toBe(true);
    });

    it('harus gagal login ID jika workerId kosong', () => {
      const res = service.validateLogin({
        method: 'id',
        waNumber: '',
        workerId: '   ',
        pin: '123456',
        rememberDevice: false,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('ID Praktisi wajib diisi');
    });

    it('harus gagal jika PIN tidak valid', () => {
      const res = service.validateLogin({ ...validWaLogin, pin: '12' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('6 digit');
    });
  });
});
