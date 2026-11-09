import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AuthMethod, LoginFormData } from '../../../models/auth.models';
import { AltchaCaptchaFieldComponent } from '../../molecules/altcha-captcha-field/altcha-captcha-field.component';
import {
  isAdminUrl,
  normalizeAdminUrl,
  sanitizeReturnUrl,
} from '../../../../../core/guards/admin.guard';
import {
  isDashboardUrl,
  normalizeDashboardUrl,
} from '../../../../../core/guards/auth.guard';

@Component({
  selector: 'app-worker-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AltchaCaptchaFieldComponent],
  template: `
    <div class="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div class="flex flex-col gap-1.5">
        <div
          class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded w-max"
        >
          <span class="material-symbols-outlined text-ink-on-light text-[14px]">shield_person</span>
          <span class="font-micro-uppercase text-micro-uppercase text-on-surface-variant uppercase font-semibold">
            AUTENTIKASI PEKERJA TERVERIFIKASI
          </span>
        </div>
        <h2 class="font-heading-h2 text-heading-h2 text-ink-on-light font-bold">
          Masuk ke Konsol Mandiri
        </h2>
        <p class="font-body-default text-body-default text-ink-secondary">
          Akses panel pengaturan tarif, buffer operasional, ketersediaan slot, dan integrasi nomor
          dispatch.
        </p>
      </div>

      <!-- Switch Metode Masuk -->
      <div
        class="bg-surface-container p-1 rounded flex items-center"
        role="tablist"
        aria-label="Metode Masuk"
      >
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeMethod() === 'wa'"
          (click)="setMethod('wa')"
          class="flex-1 py-2 px-3.5 rounded font-button-label text-button-label flex items-center justify-center gap-2 min-h-[44px] transition-all cursor-pointer"
          [class.bg-body-canvas]="activeMethod() === 'wa'"
          [class.text-ink-on-light]="activeMethod() === 'wa'"
          [class.shadow-sm]="activeMethod() === 'wa'"
          [class.text-on-surface-variant]="activeMethod() !== 'wa'"
        >
          <span class="material-symbols-outlined text-whatsapp-green text-[18px]">phone_iphone</span>
          <span>Nomor WhatsApp Aktif</span>
        </button>
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeMethod() === 'id'"
          (click)="setMethod('id')"
          class="flex-1 py-2 px-3.5 rounded font-button-label text-button-label flex items-center justify-center gap-2 min-h-[44px] transition-all cursor-pointer"
          [class.bg-body-canvas]="activeMethod() === 'id'"
          [class.text-ink-on-light]="activeMethod() === 'id'"
          [class.shadow-sm]="activeMethod() === 'id'"
          [class.text-on-surface-variant]="activeMethod() !== 'id'"
        >
          <span class="material-symbols-outlined text-[18px]">badge</span>
          <span>Email / ID Praktisi</span>
        </button>
      </div>

      @if (requiresAdminLogin()) {
        <div
          id="adminAuthNoticeBanner"
          class="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm"
          role="status"
        >
          <span class="material-symbols-outlined text-amber-700 text-[20px] shrink-0">admin_panel_settings</span>
          <div class="flex flex-col gap-0.5">
            <span class="font-body-strong text-body-strong font-semibold text-amber-950">
              Akses Panel Admin Memerlukan Autentikasi
            </span>
            <span class="font-caption text-caption text-amber-800 leading-relaxed">
              Halaman yang Anda tuju memerlukan wewenang administrator. Silakan masuk menggunakan akun pengelola yang terverifikasi.
            </span>
          </div>
        </div>
      } @else if (requiresDashboardLogin()) {
        <div
          id="dashboardAuthNoticeBanner"
          class="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm"
          role="status"
        >
          <span class="material-symbols-outlined text-amber-700 text-[20px] shrink-0">lock</span>
          <div class="flex flex-col gap-0.5">
            <span class="font-body-strong text-body-strong font-semibold text-amber-950">
              Akses Konsol Dasbor Memerlukan Autentikasi
            </span>
            <span class="font-caption text-caption text-amber-800 leading-relaxed">
              Halaman konsol kerja mandiri yang Anda tuju memerlukan sesi masuk aktif. Silakan masuk terlebih dahulu untuk melanjutkan.
            </span>
          </div>
        </div>
      }

      @if (loginError()) {
        <div
          class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm"
          role="alert"
        >
          <span class="material-symbols-outlined text-red-600 text-[18px]">error</span>
          <span>{{ loginError() }}</span>
        </div>
      }

      @if (loginSuccess()) {
        <div
          class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm"
          role="status"
        >
          <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          <span>{{ loginSuccess() }}</span>
        </div>
      }

      <form class="flex flex-col gap-4" (ngSubmit)="handleLoginSubmit()">
        <!-- WhatsApp View -->
        @if (activeMethod() === 'wa') {
          <div class="flex flex-col gap-1">
            <label
              class="font-body-strong text-body-strong text-ink-on-light flex items-center justify-between"
              for="loginWaNumber"
            >
              <span>Nomor WhatsApp Pekerja</span>
              <span class="font-caption text-caption text-ink-secondary">Terdaftar di Tuwaktu</span>
            </label>
            <div
              class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-transparent focus-within:border-ink-on-light focus-within:bg-body-canvas focus-within:ring-2 focus-within:ring-(--accent-link)"
            >
              <div
                class="flex items-center gap-1.5 pr-3 text-ink-on-light font-body-strong text-body-strong shrink-0 select-none"
              >
                <span class="text-base">🇮🇩</span>
                <span>+62</span>
              </div>
              <input
                id="loginWaNumber"
                name="loginWaNumber"
                type="tel"
                required
                [(ngModel)]="waNumber"
                placeholder="812 8899 2211"
                class="w-full bg-transparent border-none outline-none font-mono-rate text-mono-rate text-ink-on-light placeholder:text-ink-disabled pl-2"
              />
            </div>
          </div>
        } @else {
          <!-- Email/ID View -->
          <div class="flex flex-col gap-1">
            <label
              class="font-body-strong text-body-strong text-ink-on-light flex items-center justify-between"
              for="loginWorkerId"
            >
              <span>Email atau ID Praktisi</span>
              <span class="font-caption text-caption text-ink-secondary">
                Format: tuwaktu.com/nama-anda
              </span>
            </label>
            <div
              class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-transparent focus-within:border-ink-on-light focus-within:bg-body-canvas focus-within:ring-2 focus-within:ring-(--accent-link)"
            >
              <span class="material-symbols-outlined text-ink-secondary text-[20px] mr-2">
                alternate_email
              </span>
              <input
                id="loginWorkerId"
                name="loginWorkerId"
                type="text"
                required
                [(ngModel)]="workerId"
                placeholder="spesialis.ahli@email.com atau @id-pekerja"
                class="w-full bg-transparent border-none outline-none font-body-default text-body-default text-ink-on-light placeholder:text-ink-disabled"
              />
            </div>
          </div>
        }

        <!-- PIN Keamanan Akun -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <label
              class="font-body-strong text-body-strong text-ink-on-light flex items-center gap-1"
              for="securityPin"
            >
              <span>PIN Keamanan Akun (6-Digit)</span>
              <span
                class="material-symbols-outlined text-[16px] text-ink-secondary cursor-help"
                title="PIN rahasia autentikasi Anda"
              >
                info
              </span>
            </label>
            <button
              type="button"
              (click)="showResetInfo()"
              class="font-caption text-caption text-accent-link hover:underline cursor-pointer min-h-[44px] inline-flex items-center bg-transparent border-0 p-0"
            >
              Lupa PIN Keamanan?
            </button>
          </div>
          <div
            class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-transparent focus-within:border-ink-on-light focus-within:bg-body-canvas focus-within:ring-2 focus-within:ring-(--accent-link)"
          >
            <span class="material-symbols-outlined text-ink-secondary text-[20px] mr-2">key</span>
            <input
              id="securityPin"
              name="securityPin"
              [type]="showPin() ? 'text' : 'password'"
              inputmode="numeric"
              maxlength="6"
              pattern="[0-9]*"
              required
              [(ngModel)]="securityPin"
              placeholder="••••••"
              class="w-full bg-transparent border-none outline-none font-mono-rate text-mono-rate text-ink-on-light tracking-widest placeholder:text-ink-disabled"
            />
            <button
              type="button"
              (click)="togglePinVisibility()"
              class="text-ink-secondary hover:text-ink-on-light p-1 cursor-pointer w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              [attr.aria-label]="showPin() ? 'Sembunyikan PIN' : 'Tampilkan PIN'"
            >
              <span class="material-symbols-outlined text-[20px]">
                {{ showPin() ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Verifikasi Keamanan Anti-Bot ALTCHA -->
        <app-altcha-captcha-field
          [disabled]="isLoading()"
          [resetTick]="altchaResetTick()"
          (verifiedPayload)="onAltchaVerified($event)"
        />

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            [disabled]="isLoading()"
            class="h-11 px-6 bg-ink-on-light hover:bg-surface-elevated-dark text-on-primary rounded font-button-label text-button-label flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer min-h-[44px] disabled:opacity-60"
          >
            @if (isLoading()) {
              <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              <span>Memverifikasi Akses...</span>
            } @else {
              <span>Masuk ke Dashboard Pekerja</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            }
          </button>
        </div>

        <!-- Secondary Actions -->
        <div
          class="flex items-center justify-between pt-1 font-caption text-caption text-ink-secondary"
        >
          <button
            type="button"
            (click)="showResetInfo()"
            class="hover:text-ink-on-light transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0 py-2 min-h-[44px] text-left"
          >
            <span class="material-symbols-outlined text-[14px]">phonelink_setup</span>
            <span>Butuh reset nomor WhatsApp?</span>
          </button>
          <span class="text-hairline-light">|</span>
          <a
            routerLink="/"
            class="hover:text-ink-on-light transition-colors flex items-center gap-1 min-h-[44px] py-2"
          >
            <span class="material-symbols-outlined text-[14px]">support_agent</span>
            <span>Pusat Bantuan Praktisi</span>
          </a>
        </div>
      </form>

      <!-- Register Redirect Section -->
      <div
        class="mt-4 p-4 bg-surface-container-low rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-hairline-subtle/50"
      >
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-ink-on-light">
            Belum punya profil kerja mandiri?
          </span>
          <span class="font-caption text-caption text-ink-secondary">
            Buat katalog, tentukan radius, dan pasang kalender langsung.
          </span>
        </div>
        <a
          routerLink="/register"
          class="shrink-0 px-4 py-2 bg-body-canvas hover:bg-surface-container rounded text-voltage-orange font-button-label text-button-label shadow-sm transition-colors flex items-center gap-1 min-h-[44px]"
        >
          <span>Daftar Gratis</span>
          <span class="material-symbols-outlined text-[16px]">north_east</span>
        </a>
      </div>

      <!-- Micro-Badge Keamanan Mandiri -->
      <div class="mt-6 pt-4 flex items-center gap-3 text-ink-secondary border-t border-hairline-subtle/40">
        <span class="material-symbols-outlined text-whatsapp-green text-[18px] shrink-0">
          verified_user
        </span>
        <p class="font-caption text-caption leading-tight">
          <strong class="text-ink-on-light">Autentikasi Mandiri v2.4:</strong> Data jadwal,
          kontak klien, dan transaksi Anda tidak pernah dijual, diprofilkan, atau ditautkan ke
          jaringan pelacak iklan pihak ketiga mana pun.
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerLoginFormComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private routeSubscription: Subscription | null = null;

  readonly activeMethod = signal<AuthMethod>('wa');
  readonly showPin = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly loginError = signal<string>('');
  readonly loginSuccess = signal<string>('');

  readonly returnUrl = signal<string | null>(null);
  readonly requiresAdminLogin = computed<boolean>(() => {
    return isAdminUrl(this.returnUrl());
  });
  readonly requiresDashboardLogin = computed<boolean>(() => {
    return isDashboardUrl(this.returnUrl());
  });

  waNumber = '';
  workerId = '';
  securityPin = '';
  rememberDevice = false;

  readonly altchaPayload = signal<string>('');
  readonly altchaVerified = signal<boolean>(false);
  readonly altchaResetTick = signal<number>(0);

  onAltchaVerified(payload: string): void {
    this.altchaPayload.set(payload);
    this.altchaVerified.set(Boolean(payload));
    if (payload) {
      this.loginError.set('');
    }
  }

  ngOnInit(): void {
    const rawInitialUrl =
      this.route.snapshot?.queryParamMap?.get('returnUrl') ||
      this.route.snapshot?.queryParams?.['returnUrl'] ||
      null;

    const initialReturnUrl = sanitizeReturnUrl(rawInitialUrl);
    if (initialReturnUrl) {
      this.returnUrl.set(initialReturnUrl);
      if (isAdminUrl(initialReturnUrl)) {
        this.activeMethod.set('id');
      }
    }

    if (this.route.queryParamMap) {
      this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
        const rawUrl = params.get('returnUrl');
        const sanitizedUrl = sanitizeReturnUrl(rawUrl);
        this.returnUrl.set(sanitizedUrl);
        if (sanitizedUrl && isAdminUrl(sanitizedUrl)) {
          this.activeMethod.set('id');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.redirectTimeoutId !== null) {
      clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
      this.routeSubscription = null;
    }
  }

  setMethod(method: AuthMethod): void {
    this.activeMethod.set(method);
    this.loginError.set('');
  }

  togglePinVisibility(): void {
    this.showPin.update((curr) => !curr);
  }

  showResetInfo(): void {
    this.loginError.set(
      'Untuk mereset nomor atau PIN keamanan, silakan hubungi tim dukungan Tuwaktu dengan bukti kepemilikan nomor WhatsApp.',
    );
  }

  handleLoginSubmit(): void {
    this.loginError.set('');
    this.loginSuccess.set('');

    const payload: LoginFormData = {
      method: this.activeMethod(),
      waNumber: this.waNumber,
      workerId: this.workerId,
      pin: this.securityPin,
      rememberDevice: this.rememberDevice,
      altchaPayload: this.altchaPayload(),
    };

    const validation = this.authService.validateLogin(payload);
    if (!validation.isValid) {
      this.loginError.set(validation.error || 'Data kredensial tidak valid.');
      return;
    }

    if (!this.altchaVerified()) {
      this.loginError.set(
        'Verifikasi keamanan captcha wajib diselesaikan sebelum masuk.',
      );
      return;
    }

    this.isLoading.set(true);
    this.authService.login(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          const currentRole = (
            this.authService.currentUser()?.role || ''
          ).toUpperCase();
          const targetUrl = sanitizeReturnUrl(this.returnUrl());

          let destination = '/dashboard';
          if (currentRole === 'ADMIN') {
            if (targetUrl && isAdminUrl(targetUrl)) {
              destination = normalizeAdminUrl(targetUrl);
            } else if (targetUrl && isDashboardUrl(targetUrl)) {
              destination = normalizeDashboardUrl(targetUrl);
            } else {
              destination = '/admin/workers';
            }
            this.loginSuccess.set(
              'Otentikasi berhasil! Mengalihkan ke panel administrator...',
            );
          } else {
            if (targetUrl && !isAdminUrl(targetUrl)) {
              destination = normalizeDashboardUrl(targetUrl);
            } else {
              destination = '/dashboard';
            }
            this.loginSuccess.set(
              'Otentikasi berhasil! Mengalihkan ke konsol kerja mandiri...',
            );
          }

          this.redirectTimeoutId = setTimeout(() => {
            if (destination.includes('?') || destination.includes('#')) {
              this.router.navigateByUrl(destination);
            } else {
              this.router.navigate([destination]);
            }
          }, 1000);
        } else {
          this.altchaResetTick.update((v) => v + 1);
          this.loginError.set(res.error || 'Data kredensial tidak valid.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.altchaResetTick.update((v) => v + 1);
        const errorMsg =
          err?.error?.message ||
          'Gagal terhubung ke server autentikasi. Silakan periksa koneksi Anda.';
        this.loginError.set(errorMsg);
      },
    });
  }
}
