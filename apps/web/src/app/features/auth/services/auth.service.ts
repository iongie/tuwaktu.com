import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  AuthLoginResult,
  AuthUserSession,
  BackendLoginData,
  BackendUserSession,
  INITIAL_SPECIALTY_OPTIONS,
  LoginFormData,
  MagicLinkStatus,
  OtpDispatchStatus,
  RegisterFormData,
  SlugValidationState,
  SpecialtyOption,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient, { optional: true });
  private readonly configuredBaseUrl = inject(API_BASE_URL, { optional: true });

  readonly specialtyOptions: readonly SpecialtyOption[] = INITIAL_SPECIALTY_OPTIONS;

  readonly selectedSpecialty = signal<SpecialtyOption>(INITIAL_SPECIALTY_OPTIONS[0]);
  readonly otpStatus = signal<OtpDispatchStatus>('idle');
  readonly otpFeedbackMessage = signal<string>('');
  readonly magicLinkStatus = signal<MagicLinkStatus>('idle');
  readonly magicLinkFeedbackMessage = signal<string>('');

  // State profil pengguna aktif disimpan murni di sinyal runtime memori (Dilarang menggunakan browser storage)
  readonly currentUser = signal<AuthUserSession | null>(null);
  readonly currentWorker = computed<AuthUserSession | null>(() => this.currentUser());
  readonly isLoggedIn = computed<boolean>(() => this.currentUser() !== null);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
  }

  hasHttpClient(): boolean {
    return Boolean(this.httpClient);
  }

  private inFlightSession$: Observable<AuthUserSession | null> | null = null;

  setSession(session: AuthUserSession | null): void {
    this.inFlightSession$ = null;
    this.currentUser.set(session);
  }

  checkSession(force = false): Observable<AuthUserSession | null> {
    if (!this.httpClient) {
      return of(this.currentUser());
    }

    if (!force && this.inFlightSession$) {
      return this.inFlightSession$;
    }

    this.inFlightSession$ = this.httpClient
      .get<{ success: boolean; message: string; data: BackendUserSession }>(
        `${this.normalizedBaseUrl}/api/v1/auth/me`,
        { withCredentials: true }
      )
      .pipe(
        map((resp) => {
          this.inFlightSession$ = null;
          if (resp && resp.success && resp.data) {
            const d = resp.data;
            const session: AuthUserSession = {
              id: d.id,
              name: d.name || 'Pengguna',
              slug: d.slug || d.worker_slug || 'mitra-mandiri',
              email: d.email,
              waNumber: d.phone_number,
              role: d.role as AuthUserSession['role'],
              accountStatus: d.account_status,
              mustChangePassword: d.must_change_password,
            };
            this.currentUser.set(session);
            return session;
          }
          this.currentUser.set(null);
          return null;
        }),
        catchError(() => {
          this.inFlightSession$ = null;
          this.currentUser.set(null);
          return of(null);
        }),
        shareReplay(1)
      );

    return this.inFlightSession$;
  }

  login(
    data: LoginFormData | AuthUserSession,
    extra?: Partial<AuthUserSession>
  ): Observable<AuthLoginResult> {
    if ('method' in data) {
      const validation = this.validateLogin(data);
      if (!validation.isValid) {
        return of({ success: false, error: validation.error });
      }

      let identifier = '';
      if (data.method === 'wa') {
        const cleanWa = data.waNumber ? data.waNumber.replace(/\D/g, '') : '';
        if (cleanWa.startsWith('0')) {
          identifier = '62' + cleanWa.slice(1);
        } else if (!cleanWa.startsWith('62')) {
          identifier = '62' + cleanWa;
        } else {
          identifier = cleanWa;
        }
      } else {
        identifier = data.workerId.trim();
      }
      const password = data.pin.trim();

      if (!this.httpClient) {
        const isEmailAdmin =
          Boolean(data.workerId) &&
          data.workerId.toLowerCase().includes('admin');
        const assignedRole = extra?.role || (isEmailAdmin ? 'ADMIN' : 'worker');
        const cleanWa = data.waNumber ? data.waNumber.replace(/\D/g, '') : '';
        const fallbackSlug = cleanWa
          ? `pekerja-${cleanWa.slice(-4)}`
          : 'mitra-mandiri';
        const generatedSlug = data.workerId
          ? this.sanitizeSlug(data.workerId.replace(/@.*/, ''))
          : fallbackSlug;

        const fallbackSession: AuthUserSession = {
          id: extra?.id || `usr_${Date.now()}`,
          name:
            extra?.name ||
            (data.method === 'wa'
              ? `Mitra ${data.waNumber}`
              : isEmailAdmin
              ? 'Super Administrator'
              : data.workerId),
          slug:
            extra?.slug ||
            (isEmailAdmin ? 'admin' : generatedSlug || 'budi-santoso'),
          email:
            extra?.email ||
            (data.method === 'id' && data.workerId.includes('@')
              ? data.workerId
              : undefined),
          waNumber: data.waNumber,
          avatarUrl: extra?.avatarUrl,
          role: assignedRole,
          token: extra?.token,
          accountStatus: extra?.accountStatus || 'ACTIVE',
          mustChangePassword: extra?.mustChangePassword ?? false,
        };
        this.currentUser.set(fallbackSession);
        return of({ success: true });
      }

      return this.httpClient
        .post<{ success: boolean; message: string; data: BackendLoginData }>(
          `${this.normalizedBaseUrl}/api/v1/auth/login`,
          { identifier, password },
          { withCredentials: true }
        )
        .pipe(
          map((resp) => {
            if (resp && resp.success && resp.data) {
              const s = resp.data.session;
              const session: AuthUserSession = {
                id: s.id,
                name: s.name || 'Pengguna',
                slug: s.slug || s.worker_slug || 'mitra-mandiri',
                email: s.email,
                waNumber: s.phone_number || data.waNumber,
                role: s.role as AuthUserSession['role'],
                accountStatus: s.account_status,
                mustChangePassword: s.must_change_password,
              };
              this.currentUser.set(session);
              return { success: true };
            }
            return { success: false, error: resp?.message || 'Proses masuk gagal' };
          }),
          catchError((err: unknown) => {
            const httpErr = err as { message?: string; error?: { message?: string } | string };
            const errorMessage =
              (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
              'Identitas atau kata sandi yang Anda masukkan tidak sesuai.';
            return of({ success: false, error: errorMessage });
          })
        );
    }

    this.currentUser.set(data);
    return of({ success: true });
  }

  register(formData: RegisterFormData): { success: boolean; error?: string } {
    const validation = this.validateRegistration(formData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const session: AuthUserSession = {
      id: `usr_${Date.now()}`,
      name: formData.fullName.trim(),
      slug: formData.customSlug.trim(),
      waNumber: formData.waNumber.trim(),
      role: 'worker',
    };

    this.setSession(session);
    return { success: true };
  }

  logout(): Observable<boolean> {
    this.inFlightSession$ = null;
    this.currentUser.set(null);
    this.otpStatus.set('idle');
    this.otpFeedbackMessage.set('');
    this.magicLinkStatus.set('idle');
    this.magicLinkFeedbackMessage.set('');

    if (!this.httpClient) {
      return of(true);
    }

    const req$ = this.httpClient
      .post<{ success: boolean; message: string }>(
        `${this.normalizedBaseUrl}/api/v1/auth/logout`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map(() => true),
        catchError(() => of(true))
      );

    req$.subscribe();
    return req$;
  }

  selectSpecialty(specialty: SpecialtyOption): void {
    this.selectedSpecialty.set(specialty);
  }

  selectSpecialtyById(specialtyId: string): void {
    const found = this.specialtyOptions.find((opt) => opt.id === specialtyId);
    if (found) {
      this.selectedSpecialty.set(found);
    }
  }

  validateSlug(slug: string): SlugValidationState {
    const clean = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      return {
        isValid: false,
        message: 'Wajib diisi (min. 3 karakter)',
      };
    }
    if (clean.length < 3) {
      return {
        isValid: false,
        message: 'Minimal 3 karakter alfanumerik',
      };
    }
    return {
      isValid: true,
      message: 'Tersedia & Siap Diklaim',
    };
  }

  sanitizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async sendInstantOtp(waNumber: string, delayMs = 700): Promise<boolean> {
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      this.otpStatus.set('error');
      this.otpFeedbackMessage.set('Nomor WhatsApp tidak valid (minimal 8 digit).');
      return false;
    }

    this.otpStatus.set('sending');
    this.otpFeedbackMessage.set('Mengirim...');

    if (delayMs <= 0) {
      this.otpStatus.set('sent');
      this.otpFeedbackMessage.set(
        'Kode OTP 6-Digit dikirim langsung ke WhatsApp Anda tanpa jeda.'
      );
      return true;
    }

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        this.otpStatus.set('sent');
        this.otpFeedbackMessage.set(
          'Kode OTP 6-Digit dikirim langsung ke WhatsApp Anda tanpa jeda.'
        );
        resolve(true);
      }, delayMs);
    });
  }

  async sendMagicLink(waNumber: string, delayMs = 700): Promise<boolean> {
    const cleanNumber = waNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length < 8) {
      this.magicLinkStatus.set('error');
      this.magicLinkFeedbackMessage.set('Nomor WhatsApp wajib diisi dengan benar.');
      return false;
    }

    this.magicLinkStatus.set('sending');
    this.magicLinkFeedbackMessage.set('Mengirim Tautan Otentikasi...');

    if (delayMs <= 0) {
      this.magicLinkStatus.set('sent');
      this.magicLinkFeedbackMessage.set('Tautan Terkirim ke WhatsApp Anda!');
      return true;
    }

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        this.magicLinkStatus.set('sent');
        this.magicLinkFeedbackMessage.set('Tautan Terkirim ke WhatsApp Anda!');
        resolve(true);
      }, delayMs);
    });
  }

  validateRegistration(data: RegisterFormData): { isValid: boolean; error?: string } {
    if (!data.fullName.trim()) {
      return { isValid: false, error: 'Nama lengkap pekerja atau entitas usaha wajib diisi.' };
    }
    if (!data.waNumber.trim() || data.waNumber.replace(/[^0-9]/g, '').length < 8) {
      return { isValid: false, error: 'Nomor WhatsApp bisnis tidak valid (minimal 8 digit).' };
    }
    if (!data.basecamp.trim()) {
      return { isValid: false, error: 'Basecamp operasional dan titik radius nol wajib diisi.' };
    }
    const slugCheck = this.validateSlug(data.customSlug);
    if (!slugCheck.isValid) {
      return { isValid: false, error: slugCheck.message };
    }
    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN Kedaulatan harus berupa 6 digit angka.' };
    }
    if (data.pin !== data.pinConfirm) {
      return { isValid: false, error: 'Konfirmasi PIN tidak cocok dengan PIN Akses.' };
    }
    if (!data.doctrineAccepted) {
      return {
        isValid: false,
        error: 'Harap setujui Pakta Kedaulatan Pekerja Tuwaktu untuk melanjutkan.',
      };
    }

    return { isValid: true };
  }

  validateLogin(data: LoginFormData): { isValid: boolean; error?: string } {
    if (data.method === 'wa') {
      const clean = data.waNumber.replace(/[^0-9]/g, '');
      if (clean.length < 8) {
        return { isValid: false, error: 'Nomor WhatsApp terdaftar wajib diisi minimal 8 digit.' };
      }
    } else {
      if (!data.workerId.trim()) {
        return { isValid: false, error: 'Email atau ID Praktisi wajib diisi.' };
      }
    }

    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN Kedaulatan harus terdiri dari 6 digit angka.' };
    }

    return { isValid: true };
  }
}
