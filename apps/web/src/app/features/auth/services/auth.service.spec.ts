import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransferState } from '@angular/core';
import { AuthService, SPECIALTIES_TRANSFER_KEY } from './auth.service';
import { LoginFormData, RegisterFormData, SpecialtyOption } from '../models/auth.models';
import { API_BASE_URL } from '../../../../environments/environment.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
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
      pin: '482915',
      pinConfirm: '482915',
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

    it('harus gagal jika PIN termasuk daftar hitam sekuensial atau repetitif (123456, 000000, 111111)', () => {
      for (const weakPin of ['123456', '654321', '000000', '111111', '121212']) {
        const res = service.validateRegistration({ ...validData, pin: weakPin, pinConfirm: weakPin });
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('PIN terlalu lemah');
      }
    });

    it('harus gagal jika konfirmasi PIN tidak cocok', () => {
      const res = service.validateRegistration({ ...validData, pin: '482915', pinConfirm: '739184' });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('tidak cocok');
    });

    it('harus gagal jika ketentuan layanan belum disetujui', () => {
      const res = service.validateRegistration({ ...validData, doctrineAccepted: false });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Ketentuan Layanan');
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

  describe('Session and Authentication Lifecycle', () => {
    beforeEach(() => {
      service.setSession(null);
    });

    it('harus memiliki status awal tidak login jika belum ada sesi di memori', () => {
      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.currentWorker()).toBeNull();
    });

    it('DILARANG menggunakan browser storage (localStorage) untuk menyimpan token maupun sesi profil', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      service.setSession({
        id: 'usr-1',
        name: 'Sarah Melinda',
        slug: 'sarah-cleaning',
        role: 'worker',
      });
      expect(service.isLoggedIn()).toBe(true);
      expect(setItemSpy).not.toHaveBeenCalled();
      setItemSpy.mockRestore();
    });

    it('harus berhasil login dengan payload WhatsApp memanggil POST /api/v1/auth/login dengan withCredentials: true', () => {
      service
        .login({
          method: 'wa',
          waNumber: '081288992211',
          workerId: '',
          pin: '123456',
          rememberDevice: true,
        })
        .subscribe((res) => {
          expect(res.success).toBe(true);
        });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({
        identifier: '6281288992211',
        password: '123456',
      });

      req.flush({
        success: true,
        message: 'Proses masuk berhasil',
        data: {
          token: 'mock-jwt-token-from-backend',
          session: {
            id: 'usr-budi',
            name: 'Budi Santoso',
            slug: 'budi-santoso',
            phone_number: '6281288992211',
            role: 'WORKER',
            account_status: 'ACTIVE',
            must_change_password: false,
          },
        },
      });

      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()?.name).toBe('Budi Santoso');
      expect(service.currentUser()?.slug).toBe('budi-santoso');
      expect(service.currentWorker()).toEqual(service.currentUser());
    });

    it('harus menolak login secara lokal jika format kredensial tidak valid tanpa memanggil API', () => {
      service
        .login({
          method: 'wa',
          waNumber: '123',
          workerId: '',
          pin: '12',
          rememberDevice: false,
        })
        .subscribe((res) => {
          expect(res.success).toBe(false);
          expect(res.error).toBeDefined();
        });

      httpTestingController.expectNone('http://localhost:3000/api/v1/auth/login');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('harus menangani kegagalan kredensial dari respons server (401)', () => {
      service
        .login({
          method: 'id',
          waNumber: '',
          workerId: 'admin@tuwaktu.com',
          pin: '123456',
          rememberDevice: false,
        })
        .subscribe((res) => {
          expect(res.success).toBe(false);
          expect(res.error).toContain('kata sandi yang Anda masukkan tidak sesuai');
        });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(
        {
          success: false,
          message: 'kata sandi yang Anda masukkan tidak sesuai',
          data: null,
          error: 'INVALID_CREDENTIALS',
        },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(service.isLoggedIn()).toBe(false);
    });

    it('harus memanggil POST /api/v1/auth/register dengan withCredentials: true saat registrasi berhasil', () => {
      let resultSuccess = false;
      let registerData: any;
      service
        .register({
          fullName: 'Eko Prasetyo',
          specialtyId: 'ac-electric',
          specialtyLabel: 'Teknisi AC & Kelistrikan',
          waNumber: '081987654321',
          basecamp: 'Cilandak, Jakarta Selatan',
          customSlug: 'eko-teknisi-ac',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: true,
        })
        .subscribe((res) => {
          resultSuccess = res.success;
          registerData = res.data;
        });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body.name).toBe('Eko Prasetyo');
      expect(req.request.body.slug).toBe('eko-teknisi-ac');
      expect(req.request.body.phone_number).toBe('6281987654321');

      req.flush({
        success: true,
        message: 'Pendaftaran mitra berhasil diajukan',
        data: {
          worker_id: 'worker-id-eko',
          name: 'Eko Prasetyo',
          slug: 'eko-teknisi-ac',
          whatsapp_number: '6281987654321',
          admin_whatsapp_number: '6281234567890',
          activation_url: 'http://localhost:3000/api/admin/workers/activate?token=abc',
          whatsapp_share_url: 'https://wa.me/6281234567890?text=halo',
          whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6281234567890&text=halo',
          whatsapp_message: 'Halo Admin Tuwaktu',
          expires_in_minutes: 15,
        },
      });

      expect(resultSuccess).toBe(true);
      expect(service.isLoggedIn()).toBe(false);
      expect(registerData?.name).toBe('Eko Prasetyo');
      expect(registerData?.slug).toBe('eko-teknisi-ac');
      expect(registerData?.whatsapp_share_url).toContain('wa.me');
      expect(registerData?.expires_in_minutes).toBe(15);
    });

    it('harus menolak registrasi jika ketentuan layanan tidak disetujui tanpa mengirim request HTTP', () => {
      let resultSuccess: boolean | undefined;
      let errorMsg: string | undefined;

      service
        .register({
          fullName: 'Eko Prasetyo',
          specialtyId: 'ac-electric',
          specialtyLabel: 'Teknisi AC & Kelistrikan',
          waNumber: '081987654321',
          basecamp: 'Cilandak, Jakarta Selatan',
          customSlug: 'eko-teknisi-ac',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: false,
        })
        .subscribe((res) => {
          resultSuccess = res.success;
          errorMsg = res.error;
        });

      httpTestingController.expectNone('http://localhost:3000/api/v1/auth/register');
      expect(resultSuccess).toBe(false);
      expect(errorMsg).toContain('Ketentuan Layanan Pekerja');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('harus menangani error respons dari backend saat registrasi gagal', () => {
      let resultSuccess: boolean | undefined;
      let errorMsg: string | undefined;

      service
        .register({
          fullName: 'Eko Prasetyo',
          specialtyId: 'ac-electric',
          specialtyLabel: 'Teknisi AC & Kelistrikan',
          waNumber: '081987654321',
          basecamp: 'Cilandak, Jakarta Selatan',
          customSlug: 'eko-teknisi-ac',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: true,
        })
        .subscribe((res) => {
          resultSuccess = res.success;
          errorMsg = res.error;
        });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(
        {
          success: false,
          message: 'Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.',
          error: 'INVALID_INPUT',
        },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(resultSuccess).toBe(false);
      expect(errorMsg).toBe(
        'Nomor WhatsApp atau slug ini sudah terdaftar sebagai mitra. Silakan masuk.'
      );
      expect(service.isLoggedIn()).toBe(false);
    });

    it('harus membersihkan prefix teknis data masukan tidak valid jika respons backend menyertakannya', () => {
      let errorMsg: string | undefined;

      service
        .register({
          fullName: 'Eko Prasetyo',
          specialtyId: 'ac-electric',
          specialtyLabel: 'Teknisi AC & Kelistrikan',
          waNumber: '081987654321',
          basecamp: 'Cilandak, Jakarta Selatan',
          customSlug: 'eko-teknisi-ac',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: true,
        })
        .subscribe((res) => {
          errorMsg = res.error;
        });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
      req.flush(
        {
          success: false,
          message: 'data masukan tidak valid: Slug profil sudah digunakan. Silakan pilih slug lain.',
          error: 'INVALID_INPUT',
        },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorMsg).toBe('Slug profil sudah digunakan. Silakan pilih slug lain.');
      expect(service.isLoggedIn()).toBe(false);
    });

    it('harus menyimpan sesi lokal saat httpClient tidak tersedia', () => {
      const serviceNoHttp = new AuthService();
      let resultSuccess = false;
      let registerData: any;
      serviceNoHttp
        .register({
          fullName: 'Budi Santoso',
          specialtyId: 'ac-electric',
          specialtyLabel: 'Teknisi AC & Kelistrikan',
          waNumber: '081234567890',
          basecamp: 'Jakarta',
          customSlug: 'budi-santoso',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: true,
        })
        .subscribe((res) => {
          resultSuccess = res.success;
          registerData = res.data;
        });

      expect(resultSuccess).toBe(true);
      expect(serviceNoHttp.isLoggedIn()).toBe(false);
      expect(registerData?.name).toBe('Budi Santoso');
      expect(registerData?.whatsapp_share_url).toContain('wa.me');
    });

    it('harus memanggil POST /api/v1/auth/logout dengan withCredentials: true dan mereset sinyal sesi saat logout dipanggil', () => {
      service.setSession({
        id: 'usr-1',
        name: 'Sarah Melinda',
        slug: 'sarah-cleaning',
        waNumber: '081234567890',
        role: 'worker',
      });
      expect(service.isLoggedIn()).toBe(true);

      service.logout();
      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true, message: 'Sesi otentikasi berhasil ditutup', data: null });

      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.currentWorker()).toBeNull();
      expect(service.otpStatus()).toBe('idle');
      expect(service.magicLinkStatus()).toBe('idle');
    });

    it('harus memanggil GET /api/v1/auth/me dengan withCredentials: true untuk checkSession dan meng-hydrate profil pengguna', () => {
      service.checkSession().subscribe((session) => {
        expect(session).not.toBeNull();
        expect(session?.name).toBe('Super Administrator');
        expect(session?.role).toBe('ADMIN');
      });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush({
        success: true,
        message: 'Sesi otentikasi aktif berhasil diambil',
        data: {
          id: 'admin-id-1',
          name: 'Super Administrator',
          slug: 'admin',
          email: 'admin@tuwaktu.com',
          phone_number: '628120000000',
          role: 'ADMIN',
          account_status: 'ACTIVE',
          must_change_password: false,
        },
      });

      expect(service.isLoggedIn()).toBe(true);
      expect(service.currentUser()?.role).toBe('ADMIN');
    });

    it('harus menduplikasi pemanggilan simultan checkSession menggunakan satu in-flight HTTP request', () => {
      let callCount = 0;
      service.checkSession().subscribe(() => callCount++);
      service.checkSession().subscribe(() => callCount++);

      const reqs = httpTestingController.match('http://localhost:3000/api/v1/auth/me');
      expect(reqs.length).toBe(1);

      reqs[0].flush({
        success: true,
        message: 'Sesi otentikasi aktif berhasil diambil',
        data: {
          id: 'worker-id-1',
          name: 'Budi Santoso',
          slug: 'budi-santoso',
          email: 'budi@tuwaktu.com',
          phone_number: '6281288992211',
          role: 'WORKER',
          account_status: 'ACTIVE',
          must_change_password: false,
        },
      });

      expect(callCount).toBe(2);
      expect(service.currentUser()?.name).toBe('Budi Santoso');
    });

    it('harus memperbarui sinyal isInitialized menjadi true setelah checkAuthStatus selesai', () => {
      expect(service.isInitialized()).toBe(false);

      let emittedSession: unknown = undefined;
      service.checkAuthStatus().subscribe((session) => {
        emittedSession = session;
      });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/me');
      req.flush({
        success: true,
        message: 'Sesi otentikasi aktif berhasil diambil',
        data: {
          id: 'worker-id-1',
          name: 'Budi Santoso',
          slug: 'budi-santoso',
          email: 'budi@tuwaktu.com',
          phone_number: '6281288992211',
          role: 'WORKER',
          account_status: 'ACTIVE',
          must_change_password: false,
        },
      });

      expect(service.isInitialized()).toBe(true);
      expect(emittedSession).toBeTruthy();
    });

    it('harus memperbarui sinyal isInitialized menjadi true meski checkAuthStatus gagal (401)', () => {
      expect(service.isInitialized()).toBe(false);

      let emittedSession: unknown = 'initial';
      service.checkAuthStatus().subscribe((session) => {
        emittedSession = session;
      });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/me');
      req.flush(
        {
          success: false,
          message: 'Otentikasi diperlukan: silakan masuk terlebih dahulu',
          data: null,
          error: 'UNAUTHORIZED',
        },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(service.isInitialized()).toBe(true);
      expect(emittedSession).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    it('harus mengambil tantangan ALTCHA dari GET /api/v1/auth/altcha-challenge', () => {
      let receivedChallenge: unknown = null;
      service.fetchAltchaChallenge().subscribe((ch) => {
        receivedChallenge = ch;
      });

      const req = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/altcha-challenge');
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        message: 'Tantangan keamanan captcha berhasil dibuat',
        data: {
          algorithm: 'SHA-256',
          challenge: 'abc123',
          maxnumber: 100,
          salt: 'salt123?expires=9999999999',
          signature: 'sig123',
        },
      });

      expect(receivedChallenge).toEqual({
        algorithm: 'SHA-256',
        challenge: 'abc123',
        maxnumber: 100,
        salt: 'salt123?expires=9999999999',
        signature: 'sig123',
      });
    });

    it('harus menyertakan altcha_payload ke POST /api/v1/auth/login dan POST /api/v1/auth/register jika tersedia', () => {
      service
        .login({
          method: 'wa',
          waNumber: '081288992211',
          workerId: '',
          pin: '123456',
          rememberDevice: false,
          altchaPayload: 'altcha-token-login',
        })
        .subscribe();

      const loginReq = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/login');
      expect(loginReq.request.body.altcha_payload).toBe('altcha-token-login');
      loginReq.flush({ success: true, message: 'OK', data: { token: 't', session: { id: '1', name: 'A', role: 'WORKER', account_status: 'ACTIVE', email: '', phone_number: '', must_change_password: false } } });

      service
        .register({
          fullName: 'Budi',
          specialtyId: 'cleaning',
          specialtyLabel: 'Cleaning',
          waNumber: '081288992211',
          basecamp: 'Jakarta',
          customSlug: 'budi-clean',
          pin: '482915',
          pinConfirm: '482915',
          doctrineAccepted: true,
          altchaPayload: 'altcha-token-register',
        })
        .subscribe();

      const regReq = httpTestingController.expectOne('http://localhost:3000/api/v1/auth/register');
      expect(regReq.request.body.altcha_payload).toBe('altcha-token-register');
      regReq.flush({ success: true, message: 'OK', data: { token: 't', session: { id: '1', name: 'Budi', role: 'WORKER', account_status: 'ACTIVE', email: '', phone_number: '', must_change_password: false } } });
    });

    it('harus menyelesaikan solveAltchaChallenge meskipun crypto.subtle tidak tersedia (fallback SHA-256 murni)', async () => {
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        configurable: true,
      });

      try {
        // SHA-256("test0") = f25f5841d0f32b4f212b035b320f08b904ab43f7126401e6b3f0e0689236b018
        // SHA-256("test")  = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
        const solved = await service.solveAltchaChallenge({
          algorithm: 'SHA-256',
          challenge: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
          maxnumber: 10,
          salt: 'ab',
          signature: 'sig-abc',
        });
        expect(solved).toBeNull();

        const solvedValid = await service.solveAltchaChallenge({
          algorithm: 'SHA-256',
          challenge: (service as unknown as { computeSha256FallbackHex: (m: string) => string }).computeSha256FallbackHex('test3'),
          maxnumber: 10,
          salt: 'test',
          signature: 'sig-abc',
        });
        expect(solvedValid).toBeTruthy();
        const decoded = JSON.parse(Buffer.from(solvedValid!, 'base64').toString('utf-8'));
        expect(decoded.number).toBe(3);
        expect(decoded.salt).toBe('test');
      } finally {
        Object.defineProperty(globalThis, 'crypto', {
          value: originalCrypto,
          configurable: true,
        });
      }
    });

    describe('loadSpecialties (Deduplication & TransferState SSR Cache)', () => {
      it('harus memanggil GET /api/v1/public/categories dan memperbarui specialtyOptions', () => {
        service.loadSpecialties().subscribe((options) => {
          expect(options.length).toBe(3); // 2 dari API + 1 'general'
          expect(options[0].id).toBe('cat-1');
          expect(options[0].label).toBe('Servis AC');
          expect(options[2].id).toBe('general');
        });

        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/public/categories');
        expect(req.request.method).toBe('GET');

        req.flush({
          success: true,
          message: 'Daftar kategori berhasil diambil',
          data: [
            { id: 'cat-1', name: 'Servis AC' },
            { id: 'cat-2', name: 'Instalasi Listrik' },
          ],
        });

        expect(service.specialtyOptions.length).toBe(3);
        expect(service.selectedSpecialty().id).toBe('cat-1');
      });

      it('harus menduplikasi pemanggilan simultan loadSpecialties menjadi tepat satu HTTP request', () => {
        let callCount = 0;
        service.loadSpecialties().subscribe(() => callCount++);
        service.loadSpecialties().subscribe(() => callCount++);

        const reqs = httpTestingController.match('http://localhost:3000/api/v1/public/categories');
        expect(reqs.length).toBe(1);

        reqs[0].flush({
          success: true,
          data: [{ id: 'cat-1', name: 'Servis AC' }],
        });

        expect(callCount).toBe(2);
      });

      it('tidak boleh melakukan request HTTP ulang jika data sudah pernah dimuat (hasLoadedSpecialties)', () => {
        // Panggilan pertama
        service.loadSpecialties().subscribe();
        const req = httpTestingController.expectOne('http://localhost:3000/api/v1/public/categories');
        req.flush({
          success: true,
          data: [{ id: 'cat-1', name: 'Servis AC' }],
        });

        // Panggilan kedua tidak boleh memicu request HTTP lagi
        let secondCallEmitted = false;
        service.loadSpecialties().subscribe((opts) => {
          secondCallEmitted = true;
          expect(opts.length).toBeGreaterThan(0);
        });

        expect(secondCallEmitted).toBe(true);
        httpTestingController.expectNone('http://localhost:3000/api/v1/public/categories');
        httpTestingController.expectNone('http://localhost:3000/api/public/categories');
      });

      it('harus membaca data dari TransferState saat tersedia tanpa melakukan request HTTP ke jaringan', () => {
        const transferState = TestBed.inject(TransferState);
        const mockTransferData: SpecialtyOption[] = [
          { id: 'cat-ssr', label: 'Teknisi Elektronik SSR', colSpan: false },
          { id: 'general', label: 'Lainnya / Teknisi Multitalenta', colSpan: true },
        ];
        transferState.set(SPECIALTIES_TRANSFER_KEY, mockTransferData);

        let resultOptions: readonly SpecialtyOption[] = [];
        service.loadSpecialties().subscribe((opts) => {
          resultOptions = opts;
        });

        expect(resultOptions.length).toBe(2);
        expect(resultOptions[0].id).toBe('cat-ssr');
        expect(service.specialtyOptions[0].id).toBe('cat-ssr');
        expect(transferState.hasKey(SPECIALTIES_TRANSFER_KEY)).toBe(false);

        // Pastikan tidak ada satupun request HTTP yang terkirim ke jaringan
        httpTestingController.expectNone('http://localhost:3000/api/v1/public/categories');
      });
    });
  });
});
