import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  AdminApproveResetResponse,
  AdminResetApprovalView,
  AltchaChallenge,
  AuthLoginResult,
  AuthRegisterResponse,
  AuthRegisterResult,
  AuthUserSession,
  BackendLoginData,
  BackendUserSession,
  CredentialResetRequestPayload,
  CredentialResetRequestResponse,
  ExecuteCredentialResetPayload,
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
  private readonly httpClient: HttpClient | null = (() => {
    try {
      return inject(HttpClient, { optional: true });
    } catch {
      return null;
    }
  })();
  private readonly configuredBaseUrl: string | null = (() => {
    try {
      return inject(API_BASE_URL, { optional: true });
    } catch {
      return null;
    }
  })();

  private readonly _specialtyOptions = signal<readonly SpecialtyOption[]>(INITIAL_SPECIALTY_OPTIONS);

  get specialtyOptions(): readonly SpecialtyOption[] {
    return this._specialtyOptions();
  }

  readonly selectedSpecialty = signal<SpecialtyOption>(INITIAL_SPECIALTY_OPTIONS[0]);
  readonly otpStatus = signal<OtpDispatchStatus>('idle');
  readonly otpFeedbackMessage = signal<string>('');
  readonly magicLinkStatus = signal<MagicLinkStatus>('idle');
  readonly magicLinkFeedbackMessage = signal<string>('');

  // State profil pengguna aktif disimpan murni di sinyal runtime memori (Dilarang menggunakan browser storage)
  readonly currentUser = signal<AuthUserSession | null>(null);
  readonly currentWorker = computed<AuthUserSession | null>(() => this.currentUser());
  readonly isLoggedIn = computed<boolean>(() => this.currentUser() !== null);
  readonly isInitialized = signal<boolean>(false);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private hasLoadedSpecialties = false;
  private isLoadingSpecialties = false;

  hasHttpClient(): boolean {
    return Boolean(this.httpClient);
  }

  fetchAltchaChallenge(): Observable<AltchaChallenge | null> {
    if (!this.httpClient) {
      return of({
        algorithm: 'SHA-256',
        challenge: this.computeSha256FallbackHex('test0'),
        maxnumber: 10,
        salt: 'test',
        signature: 'local-fallback-signature',
      });
    }

    return this.httpClient
      .get<{ success: boolean; message: string; data: AltchaChallenge }>(
        `${this.normalizedBaseUrl}/api/v1/auth/altcha-challenge`,
        { withCredentials: true }
      )
      .pipe(
        map((resp) => (resp && resp.success && resp.data ? resp.data : null)),
        catchError(() => of(null))
      );
  }

  async solveAltchaChallenge(challengeData: AltchaChallenge): Promise<string | null> {
    if (!challengeData || !challengeData.challenge || !challengeData.salt) {
      return null;
    }
    const maxNum = challengeData.maxnumber > 0 ? challengeData.maxnumber : 50000;
    const target = challengeData.challenge.toLowerCase();

    for (let n = 0; n <= maxNum; n++) {
      const candidate = `${challengeData.salt}${n}`;
      const hashHex = await this.computeSha256Hex(candidate);
      if (hashHex === target) {
        const solutionJson = JSON.stringify({
          algorithm: challengeData.algorithm || 'SHA-256',
          challenge: challengeData.challenge,
          number: n,
          salt: challengeData.salt,
          signature: challengeData.signature,
        });
        return typeof btoa === 'function'
          ? btoa(solutionJson)
          : Buffer.from(solutionJson, 'utf-8').toString('base64');
      }
      if (n > 0 && n % 2500 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    return null;
  }

  private async computeSha256Hex(message: string): Promise<string> {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return this.computeSha256FallbackHex(message);
  }

  private computeSha256FallbackHex(ascii: string): string {
    const rightRotate = (value: number, amount: number): number =>
      (value >>> amount) | (value << (32 - amount));

    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    const bytes = Array.from(new TextEncoder().encode(ascii));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) {
      bytes.push(0);
    }
    for (let i = 7; i >= 0; i--) {
      bytes.push((bitLength / Math.pow(2, i * 8)) & 0xff);
    }

    const w = new Array<number>(64);
    for (let offset = 0; offset < bytes.length; offset += 64) {
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
        const s1 = (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = hash;
      for (let i = 0; i < 64; i++) {
        const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (h + S1 + ch + k[i] + w[i]) >>> 0;
        const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (S0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      hash[0] = (hash[0] + a) >>> 0;
      hash[1] = (hash[1] + b) >>> 0;
      hash[2] = (hash[2] + c) >>> 0;
      hash[3] = (hash[3] + d) >>> 0;
      hash[4] = (hash[4] + e) >>> 0;
      hash[5] = (hash[5] + f) >>> 0;
      hash[6] = (hash[6] + g) >>> 0;
      hash[7] = (hash[7] + h) >>> 0;
    }

    return hash.map((v) => v.toString(16).padStart(8, '0')).join('');
  }

  private inFlightSession$: Observable<AuthUserSession | null> | null = null;

  setSession(session: AuthUserSession | null): void {
    this.inFlightSession$ = null;
    this.currentUser.set(session);
    if (session !== null) {
      this.isInitialized.set(true);
    }
  }

  checkAuthStatus(force = false): Observable<AuthUserSession | null> {
    return this.checkSession(force);
  }

  checkSession(force = false): Observable<AuthUserSession | null> {
    if (!this.httpClient) {
      this.isInitialized.set(true);
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
              avatarUrl: d.avatar_url,
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
        finalize(() => {
          this.isInitialized.set(true);
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
        this.isInitialized.set(true);
        return of({ success: true });
      }

      const loginPayload: Record<string, string> = { identifier, password };
      if (data.altchaPayload) {
        loginPayload['altcha_payload'] = data.altchaPayload;
      }

      return this.httpClient
        .post<{ success: boolean; message: string; data: BackendLoginData }>(
          `${this.normalizedBaseUrl}/api/v1/auth/login`,
          loginPayload,
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
                avatarUrl: s.avatar_url,
                role: s.role as AuthUserSession['role'],
                accountStatus: s.account_status,
                mustChangePassword: s.must_change_password,
              };
              this.currentUser.set(session);
              this.isInitialized.set(true);
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

  updateSessionAvatar(avatarUrl: string): void {
    const current = this.currentUser();
    if (current) {
      this.currentUser.set({
        ...current,
        avatarUrl,
      });
    }
  }

  register(formData: RegisterFormData): Observable<AuthRegisterResult> {
    const validation = this.validateRegistration(formData);
    if (!validation.isValid) {
      return of({ success: false, error: validation.error });
    }

    const cleanWa = formData.waNumber ? formData.waNumber.replace(/\D/g, '') : '';
    let sanitizedWa = cleanWa;
    if (cleanWa.startsWith('0')) {
      sanitizedWa = '62' + cleanWa.slice(1);
    } else if (!cleanWa.startsWith('62')) {
      sanitizedWa = '62' + cleanWa;
    }

    const cleanSlug = this.sanitizeSlug(formData.customSlug || formData.fullName);

    if (!this.httpClient) {
      const fallbackData: AuthRegisterResponse = {
        worker_id: `wrk_${Date.now()}`,
        name: formData.fullName.trim(),
        slug: cleanSlug,
        whatsapp_number: sanitizedWa,
        admin_whatsapp_number: '6281234567890',
        activation_url: `http://localhost:3000/api/admin/workers/activate?token=mock_token`,
        whatsapp_share_url: `https://wa.me/6281234567890?text=Halo%20Admin%20Tuwaktu`,
        whatsapp_web_url: `https://web.whatsapp.com/send?phone=6281234567890&text=Halo%20Admin%20Tuwaktu`,
        whatsapp_message: `Halo Admin Tuwaktu, saya ${formData.fullName.trim()} baru saja mendaftar.`,
        expires_in_minutes: 15,
      };

      return of({
        success: true,
        message: 'Pendaftaran berhasil diajukan. Silakan kirimkan tautan aktivasi WhatsApp ke Admin untuk mengaktifkan akun Anda.',
        data: fallbackData,
      });
    }

    const payload: Record<string, string> = {
      name: formData.fullName.trim(),
      full_name: formData.fullName.trim(),
      specialty_id: formData.specialtyId,
      specialty_label: formData.specialtyLabel,
      phone_number: sanitizedWa,
      whatsapp_number: sanitizedWa,
      zone: formData.basecamp.trim(),
      basecamp: formData.basecamp.trim(),
      slug: cleanSlug,
      pin: formData.pin.trim(),
      password: formData.pin.trim(),
    };
    if (formData.altchaPayload) {
      payload['altcha_payload'] = formData.altchaPayload;
    }

    return this.httpClient
      .post<{ success: boolean; message: string; data: AuthRegisterResponse }>(
        `${this.normalizedBaseUrl}/api/v1/auth/register`,
        payload,
        { withCredentials: true }
      )
      .pipe(
        map((resp) => {
          if (resp && resp.success && resp.data) {
            return {
              success: true,
              message: resp.message,
              data: resp.data,
            };
          }
          return { success: false, error: resp?.message || 'Pendaftaran mitra gagal' };
        }),
        catchError((err: unknown) => {
          const httpErr = err as { message?: string; error?: { message?: string } | string };
          let errorMessage =
            (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
            (typeof httpErr?.error === 'string' && httpErr.error) ||
            'Pendaftaran mitra tidak berhasil. Silakan periksa kembali data Anda.';
          if (typeof errorMessage === 'string') {
            errorMessage = errorMessage.replace(/^data masukan tidak valid:\s*/i, '');
          }
          return of({ success: false, error: errorMessage });
        })
      );
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

  loadSpecialties(force = false): void {
    if (!this.httpClient) return;
    if (this.hasLoadedSpecialties && !force) return;
    if (this.isLoadingSpecialties) return;

    this.isLoadingSpecialties = true;
    this.httpClient
      .get<{ success: boolean; data: Array<{ id: string; name?: string; title?: string }> }>(
        `${this.normalizedBaseUrl}/api/v1/public/categories`
      )
      .pipe(
        catchError(() =>
          this.httpClient!.get<{ success: boolean; data: Array<{ id: string; name?: string; title?: string }> }>(
            `${this.normalizedBaseUrl}/api/public/categories`
          )
        ),
        catchError(() => of(null)),
        finalize(() => {
          this.isLoadingSpecialties = false;
        })
      )
      .subscribe({
        next: (resp) => {
          if (resp && resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
            this.hasLoadedSpecialties = true;
            const dynamicList: SpecialtyOption[] = resp.data.map((item) => ({
              id: item.id,
              label: item.title || item.name || 'Spesialisasi',
              colSpan: false,
            }));
            dynamicList.push({
              id: 'general',
              label: 'Lainnya / Teknisi Multitalenta',
              colSpan: true,
            });
            this._specialtyOptions.set(dynamicList);

            const current = this.selectedSpecialty();
            const exists = dynamicList.find((opt) => opt.id === current.id);
            if (!exists && dynamicList.length > 0) {
              this.selectedSpecialty.set(dynamicList[0]);
            }
          }
        },
        error: () => {
          // Tetap mempertahankan INITIAL_SPECIALTY_OPTIONS
        },
      });
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
    if (clean.length > 50) {
      return {
        isValid: false,
        message: 'Maksimal 50 karakter alfanumerik',
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

  private static readonly WEAK_PIN_BLACKLIST = new Set([
    '000000',
    '111111',
    '222222',
    '333333',
    '444444',
    '555555',
    '666666',
    '777777',
    '888888',
    '999999',
    '012345',
    '123456',
    '234567',
    '345678',
    '456789',
    '567890',
    '987654',
    '876543',
    '765432',
    '654321',
    '543210',
    '432109',
    '112233',
    '121212',
    '123123',
    '123321',
    '102030',
    '101010',
  ]);

  isWeakPin(pin: string): boolean {
    const clean = pin.trim();
    if (!/^\d{6}$/.test(clean)) {
      return false;
    }
    if (AuthService.WEAK_PIN_BLACKLIST.has(clean)) {
      return true;
    }
    let allSame = true;
    let isAsc = true;
    let isDesc = true;
    for (let i = 1; i < 6; i++) {
      const prev = clean.charCodeAt(i - 1);
      const curr = clean.charCodeAt(i);
      if (curr !== clean.charCodeAt(0)) {
        allSame = false;
      }
      if (curr - prev !== 1) {
        isAsc = false;
      }
      if (prev - curr !== 1) {
        isDesc = false;
      }
    }
    if (allSame || isAsc || isDesc) {
      return true;
    }
    if (
      (clean[0] === clean[2] && clean[2] === clean[4] && clean[1] === clean[3] && clean[3] === clean[5]) ||
      (clean[0] === clean[3] && clean[1] === clean[4] && clean[2] === clean[5]) ||
      (clean[0] === clean[1] && clean[2] === clean[3] && clean[4] === clean[5])
    ) {
      return true;
    }
    return false;
  }

  validateRegistration(data: RegisterFormData): { isValid: boolean; error?: string } {
    if (!data.fullName.trim()) {
      return { isValid: false, error: 'Nama lengkap pekerja atau entitas usaha wajib diisi.' };
    }
    if (data.fullName.trim().length < 3) {
      return { isValid: false, error: 'Nama lengkap pekerja minimal 3 karakter.' };
    }
    if (data.fullName.trim().length > 100) {
      return { isValid: false, error: 'Nama lengkap pekerja maksimal 100 karakter.' };
    }
    const cleanWaDigits = data.waNumber.replace(/[^0-9]/g, '');
    if (!cleanWaDigits || cleanWaDigits.length < 8 || cleanWaDigits.length > 15) {
      return { isValid: false, error: 'Nomor WhatsApp bisnis tidak valid (panjang 8-15 digit).' };
    }
    if (!data.basecamp.trim()) {
      return { isValid: false, error: 'Basecamp operasional dan titik radius nol wajib diisi.' };
    }
    if (data.basecamp.trim().length > 255) {
      return { isValid: false, error: 'Alamat basecamp operasional maksimal 255 karakter.' };
    }
    const slugCheck = this.validateSlug(data.customSlug);
    if (!slugCheck.isValid) {
      return { isValid: false, error: slugCheck.message };
    }
    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN keamanan harus berupa 6 digit angka.' };
    }
    if (this.isWeakPin(data.pin)) {
      return {
        isValid: false,
        error: 'PIN terlalu lemah: hindari kombinasi angka berurutan atau berulang seperti 123456 atau 111111.',
      };
    }
    if (data.pin !== data.pinConfirm) {
      return { isValid: false, error: 'Konfirmasi PIN tidak cocok dengan PIN Akses.' };
    }
    if (!data.doctrineAccepted) {
      return {
        isValid: false,
        error: 'Harap setujui Ketentuan Layanan Pekerja Mandiri untuk melanjutkan.',
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
      if (data.workerId.trim().length > 100) {
        return { isValid: false, error: 'Email atau ID Praktisi maksimal 100 karakter.' };
      }
    }

    if (!/^\d{6}$/.test(data.pin)) {
      return { isValid: false, error: 'PIN keamanan harus terdiri dari 6 digit angka.' };
    }

    return { isValid: true };
  }

  requestCredentialReset(payload: CredentialResetRequestPayload): Observable<{
    success: boolean;
    message?: string;
    data?: CredentialResetRequestResponse;
    error?: string;
  }> {
    if (!this.httpClient) {
      return of({
        success: true,
        message: 'Permohonan reset kredensial berhasil dibuat (mock).',
        data: {
          worker_name: 'Mitra Tuwaktu',
          phone_number: payload.phone_number,
          admin_whatsapp_number: '6281234567890',
          whatsapp_share_url: 'https://wa.me/6281234567890',
          whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6281234567890',
          whatsapp_message: 'Halo Admin Tuwaktu',
          expires_in_minutes: 15,
        },
      });
    }

    return this.httpClient
      .post<{ success: boolean; message: string; data: CredentialResetRequestResponse }>(
        `${this.normalizedBaseUrl}/api/v1/auth/credential-reset-request`,
        payload,
        { withCredentials: true }
      )
      .pipe(
        map((resp) => ({
          success: resp?.success ?? true,
          message: resp?.message,
          data: resp?.data,
        })),
        catchError((err: unknown) => {
          const httpErr = err as { message?: string; error?: { message?: string } | string };
          let errorMessage =
            (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
            (typeof httpErr?.error === 'string' && httpErr.error) ||
            'Gagal mengajukan permohonan reset. Silakan coba beberapa saat lagi.';
          if (typeof errorMessage === 'string') {
            errorMessage = errorMessage.replace(/^data masukan tidak valid:\s*/i, '');
          }
          return of({ success: false, error: errorMessage });
        })
      );
  }

  verifyResetRequestByAdmin(rawToken: string): Observable<{
    success: boolean;
    message?: string;
    data?: AdminResetApprovalView;
    error?: string;
  }> {
    if (!this.httpClient) {
      return of({
        success: true,
        message: 'Data permohonan reset berhasil diverifikasi (mock).',
        data: {
          request_id: 'mock-req-1',
          worker_id: 'mock-wrk-1',
          worker_name: 'Mitra Tuwaktu',
          worker_phone: '6281234567890',
          request_type: 'RESET_PIN',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          is_approved: false,
        },
      });
    }

    return this.httpClient
      .get<{ success: boolean; message: string; data: AdminResetApprovalView }>(
        `${this.normalizedBaseUrl}/api/v1/admin/credential-reset/verify`,
        {
          params: { token: rawToken },
          withCredentials: true,
        }
      )
      .pipe(
        map((resp) => ({
          success: resp?.success ?? true,
          message: resp?.message,
          data: resp?.data,
        })),
        catchError((err: unknown) => {
          const httpErr = err as { message?: string; error?: { message?: string } | string };
          let errorMessage =
            (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
            (typeof httpErr?.error === 'string' && httpErr.error) ||
            'Tautan permohonan reset tidak valid atau telah kedaluwarsa.';
          if (typeof errorMessage === 'string') {
            errorMessage = errorMessage.replace(/^data masukan tidak valid:\s*/i, '');
          }
          return of({ success: false, error: errorMessage });
        })
      );
  }

  approveCredentialReset(rawToken: string): Observable<{
    success: boolean;
    message?: string;
    data?: AdminApproveResetResponse;
    error?: string;
  }> {
    if (!this.httpClient) {
      return of({
        success: true,
        message: 'Permohonan reset berhasil disetujui (mock).',
        data: {
          worker_name: 'Mitra Tuwaktu',
          worker_whatsapp_number: '6281234567890',
          whatsapp_share_url: 'https://wa.me/6281234567890',
          whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6281234567890',
          whatsapp_message: 'Halo Mitra Tuwaktu',
          execution_url: 'https://tuwaktu.com/reset-credential?token=mock_exec',
          expires_in_minutes: 10,
        },
      });
    }

    return this.httpClient
      .post<{ success: boolean; message: string; data: AdminApproveResetResponse }>(
        `${this.normalizedBaseUrl}/api/v1/admin/credential-reset/approve`,
        { request_token: rawToken },
        { withCredentials: true }
      )
      .pipe(
        map((resp) => ({
          success: resp?.success ?? true,
          message: resp?.message,
          data: resp?.data,
        })),
        catchError((err: unknown) => {
          const httpErr = err as { message?: string; error?: { message?: string } | string };
          let errorMessage =
            (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
            (typeof httpErr?.error === 'string' && httpErr.error) ||
            'Gagal menyetujui permohonan reset.';
          if (typeof errorMessage === 'string') {
            errorMessage = errorMessage.replace(/^data masukan tidak valid:\s*/i, '');
          }
          return of({ success: false, error: errorMessage });
        })
      );
  }

  executeCredentialReset(payload: ExecuteCredentialResetPayload): Observable<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    if (!this.httpClient) {
      return of({
        success: true,
        message: 'Kredensial akun berhasil diperbarui (mock).',
      });
    }

    return this.httpClient
      .post<{ success: boolean; message: string }>(
        `${this.normalizedBaseUrl}/api/v1/auth/credential-reset/execute`,
        payload,
        { withCredentials: true }
      )
      .pipe(
        map((resp) => ({
          success: resp?.success ?? true,
          message: resp?.message || 'Kredensial akun berhasil diperbarui. Silakan masuk menggunakan PIN baru Anda.',
        })),
        catchError((err: unknown) => {
          const httpErr = err as { message?: string; error?: { message?: string } | string };
          let errorMessage =
            (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
            (typeof httpErr?.error === 'string' && httpErr.error) ||
            'Gagal memperbarui kredensial akun.';
          if (typeof errorMessage === 'string') {
            errorMessage = errorMessage.replace(/^data masukan tidak valid:\s*/i, '');
          }
          return of({ success: false, error: errorMessage });
        })
      );
  }
}
