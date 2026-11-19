import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filterNumericInput } from '../../../../../core/utils/sanitize.utils';
import { AuthService } from '../../../services/auth.service';
import { AltchaCaptchaFieldComponent } from '../../molecules/altcha-captcha-field/altcha-captcha-field.component';
import { AuthHeaderNavComponent } from '../../molecules/auth-header-nav/auth-header-nav.component';
import { AuthFooterBarComponent } from '../../molecules/auth-footer-bar/auth-footer-bar.component';

@Component({
  selector: 'app-worker-credential-reset-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AltchaCaptchaFieldComponent,
    AuthHeaderNavComponent,
    AuthFooterBarComponent,
  ],
  template: `
    <div class="bg-surface font-body-default text-on-surface antialiased min-h-screen flex flex-col justify-between">
      <app-auth-header-nav activeTab="login" />

      <main class="w-full flex-1 flex flex-col justify-center items-center py-10 px-6 lg:px-12">
        <div class="flex flex-col w-full max-w-7xl mx-auto gap-8">
          <div
            class="grid grid-cols-1 lg:grid-cols-12 rounded-[10px] overflow-hidden border border-hairline-light bg-body-canvas shadow-none"
          >
            <!-- Sisi Kiri: Informasi Pembaruan PIN (5 Cols) -->
            <div
              class="lg:col-span-5 bg-hero-canvas p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-ink-on-dark"
            >
              <div class="flex flex-col gap-6">
                <span
                  class="font-mono-rate text-[10px] uppercase tracking-widest text-voltage-orange font-bold"
                >
                  ATUR ULANG PIN MITRA
                </span>

                <div class="flex flex-col gap-2.5">
                  <h1 class="font-heading-h1 text-heading-h1 text-ink-on-dark font-bold leading-tight">
                    Perbarui PIN &amp; Nomor WhatsApp Anda.
                  </h1>
                  <p class="font-body-default text-xs text-gray-400 leading-relaxed">
                    Gunakan tautan khusus dari Admin Tuwaktu untuk mengganti PIN masuk atau memperbarui nomor WhatsApp terdaftar Anda.
                  </p>
                </div>

                <div class="flex flex-col gap-4 pt-2">
                  <div class="flex items-start gap-3">
                    <div
                      class="w-7 h-7 rounded bg-surface-elevated-dark border border-white/10 flex items-center justify-center shrink-0 text-whatsapp-surface"
                    >
                      <span class="material-symbols-outlined text-[16px]">lock_reset</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-xs text-ink-on-dark font-bold">
                        Buat PIN Baru
                      </span>
                      <span class="font-body-default text-caption text-gray-400 text-xs">
                        Pilih 6 digit angka yang mudah Anda ingat untuk masuk ke dasbor mitra.
                      </span>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="w-7 h-7 rounded bg-surface-elevated-dark border border-white/10 flex items-center justify-center shrink-0 text-whatsapp-surface"
                    >
                      <span class="material-symbols-outlined text-[16px]">verified_user</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-body-strong text-xs text-ink-on-dark font-bold">
                        Tautan Berlaku 10 Menit
                      </span>
                      <span class="font-body-default text-caption text-gray-400 text-xs">
                        Tautan ini hanya dapat digunakan satu kali untuk menjaga keamanan akun Anda.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Box Sisi Kiri -->
              <div class="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-[11px] font-mono-rate text-gray-400">
                <span>Tuwaktu Mitra</span>
                <span class="text-voltage-orange font-bold">0% KOMISI</span>
              </div>
            </div>

            <!-- Sisi Kanan: Form Eksekusi Putih (7 Cols) -->
            <div class="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-body-canvas">
              <div class="max-w-xl mx-auto w-full flex flex-col gap-6">
                <!-- Header Form -->
                <div class="flex flex-col gap-1.5">
                  <h2 class="font-heading-h2 text-heading-h2 text-ink-on-light font-bold">
                    Buat PIN Masuk Baru
                  </h2>
                  <p class="font-body-default text-xs text-ink-secondary">
                    Masukkan nomor WhatsApp terdaftar Anda lalu tetapkan PIN baru.
                  </p>
                </div>

                <!-- State: Token Missing Error -->
                @if (!hasToken()) {
                  <div class="p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3 text-red-950 text-xs">
                    <span class="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">error</span>
                    <div class="flex flex-col gap-1">
                      <strong class="font-bold">Tautan Tidak Lengkap</strong>
                      <p class="text-xs text-red-800 leading-relaxed">
                        Parameter token eksekusi tidak ditemukan. Pastikan Anda membuka tautan lengkap yang dikirimkan oleh Admin Tuwaktu via WhatsApp.
                      </p>
                    </div>
                  </div>
                  <a
                    routerLink="/login"
                    class="w-full py-2.5 px-4 rounded border border-hairline-light text-ink-on-light text-center font-bold text-xs uppercase tracking-wider hover:bg-surface-highlight transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
                  >
                    Kembali ke Halaman Masuk
                  </a>
                } @else if (successMessage()) {
                  <!-- State Sukses -->
                  <div class="flex flex-col items-center text-center gap-3 py-6 bg-surface-highlight border border-hairline-light rounded p-6">
                    <div class="w-12 h-12 rounded bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/20 flex items-center justify-center">
                      <span class="material-symbols-outlined text-[28px] text-whatsapp-green">check_circle</span>
                    </div>
                    <h3 class="font-heading-h3 text-base font-bold text-ink-on-light">
                      Pembaruan Kredensial Berhasil!
                    </h3>
                    <p class="text-xs text-ink-secondary leading-relaxed max-w-sm">
                      {{ successMessage() }}
                    </p>
                    <span class="text-xs text-voltage-orange font-mono-rate font-bold mt-1">Mengalihkan ke halaman masuk...</span>
                  </div>
                } @else {
                  <!-- Form Eksekusi Reset -->
                  <form class="flex flex-col gap-4" (ngSubmit)="handleResetSubmit()">
                    @if (errorMessage()) {
                      <div class="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-red-900 text-xs" role="alert">
                        <span class="material-symbols-outlined text-red-600 text-[18px] shrink-0">error</span>
                        <span class="leading-snug">{{ errorMessage() }}</span>
                      </div>
                    }

                    <!-- 1. Nomor WhatsApp Terdaftar (Verifikasi Identitas) -->
                    <div class="flex flex-col gap-1">
                      <label for="registeredPhone" class="font-mono-rate text-xs uppercase tracking-wider text-ink-on-light font-bold flex items-center justify-between">
                        <span>Nomor WhatsApp Terdaftar</span>
                        <span class="text-[11px] text-ink-secondary font-normal">Untuk verifikasi</span>
                      </label>
                      <div class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-hairline-light focus-within:border-accent-link focus-within:bg-body-canvas transition-all">
                        <div class="flex items-center gap-1.5 pr-2.5 text-ink-on-light font-bold shrink-0 select-none border-r border-hairline-light font-mono-rate text-xs">
                          <span>🇮🇩</span>
                          <span>+62</span>
                        </div>
                        <input
                          id="registeredPhone"
                          name="registeredPhone"
                          type="tel"
                          inputmode="numeric"
                          maxlength="16"
                          required
                          [(ngModel)]="registeredPhone"
                          (input)="onRegisteredPhoneInput($event)"
                          placeholder="812 8899 2211"
                          class="w-full bg-transparent border-none outline-none font-mono-rate text-ink-on-light placeholder:text-ink-disabled pl-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <!-- 2. Opsi Pergantian Nomor WhatsApp Baru (Opsional) -->
                    <div class="flex flex-col gap-1.5 pt-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-ink-secondary">Apakah Anda juga mengganti nomor WhatsApp?</span>
                        <button
                          type="button"
                          (click)="toggleChangePhone()"
                          class="text-xs font-bold text-voltage-orange hover:underline cursor-pointer bg-transparent border-0 p-0 uppercase tracking-wider font-mono-rate"
                        >
                          {{ wantsChangePhone() ? 'Batal Ganti Nomor' : '+ Ganti Nomor Baru' }}
                        </button>
                      </div>

                      @if (wantsChangePhone()) {
                        <div class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-hairline-light focus-within:border-accent-link focus-within:bg-body-canvas transition-all">
                          <div class="flex items-center gap-1.5 pr-2.5 text-ink-on-light font-bold shrink-0 select-none border-r border-hairline-light font-mono-rate text-xs">
                            <span>🇮🇩</span>
                            <span>+62 Baru</span>
                          </div>
                          <input
                            id="newPhoneNumber"
                            name="newPhoneNumber"
                            type="tel"
                            inputmode="numeric"
                            maxlength="16"
                            [(ngModel)]="newPhoneNumber"
                            (input)="onNewPhoneInput($event)"
                            placeholder="856 7788 9900"
                            class="w-full bg-transparent border-none outline-none font-mono-rate text-ink-on-light placeholder:text-ink-disabled pl-2.5 text-sm"
                          />
                        </div>
                      }
                    </div>

                    <!-- 3. PIN Baru (6 Digit) -->
                    <div class="flex flex-col gap-1 pt-1">
                      <label for="newPin" class="font-mono-rate text-xs uppercase tracking-wider text-ink-on-light font-bold">
                        PIN Keamanan Baru (6 Digit Angka)
                      </label>
                      <div class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-hairline-light focus-within:border-accent-link focus-within:bg-body-canvas transition-all">
                        <span class="material-symbols-outlined text-ink-secondary text-[18px] mr-2">key</span>
                        <input
                          id="newPin"
                          name="newPin"
                          [type]="showPin() ? 'text' : 'password'"
                          inputmode="numeric"
                          maxlength="6"
                          pattern="[0-9]*"
                          required
                          [(ngModel)]="newPin"
                          (input)="onPinInput($event)"
                          placeholder="••••••"
                          class="w-full bg-transparent border-none outline-none font-mono-rate text-ink-on-light tracking-widest placeholder:text-ink-disabled text-sm"
                        />
                        <button
                          type="button"
                          (click)="showPin.set(!showPin())"
                          class="text-ink-secondary hover:text-ink-on-light p-1 cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
                          [attr.aria-label]="showPin() ? 'Sembunyikan PIN' : 'Tampilkan PIN'"
                        >
                          <span class="material-symbols-outlined text-[18px]">
                            {{ showPin() ? 'visibility_off' : 'visibility' }}
                          </span>
                        </button>
                      </div>
                    </div>

                    <!-- 4. Konfirmasi PIN Baru -->
                    <div class="flex flex-col gap-1">
                      <label for="confirmPin" class="font-mono-rate text-xs uppercase tracking-wider text-ink-on-light font-bold">
                        Konfirmasi PIN Keamanan Baru
                      </label>
                      <div class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-hairline-light focus-within:border-accent-link focus-within:bg-body-canvas transition-all">
                        <span class="material-symbols-outlined text-ink-secondary text-[18px] mr-2">lock</span>
                        <input
                          id="confirmPin"
                          name="confirmPin"
                          [type]="showConfirmPin() ? 'text' : 'password'"
                          inputmode="numeric"
                          maxlength="6"
                          pattern="[0-9]*"
                          required
                          [(ngModel)]="confirmPin"
                          (input)="onConfirmPinInput($event)"
                          placeholder="••••••"
                          class="w-full bg-transparent border-none outline-none font-mono-rate text-ink-on-light tracking-widest placeholder:text-ink-disabled text-sm"
                        />
                        <button
                          type="button"
                          (click)="showConfirmPin.set(!showConfirmPin())"
                          class="text-ink-secondary hover:text-ink-on-light p-1 cursor-pointer w-8 h-8 flex items-center justify-center shrink-0"
                          [attr.aria-label]="showConfirmPin() ? 'Sembunyikan konfirmasi PIN' : 'Tampilkan konfirmasi PIN'"
                        >
                          <span class="material-symbols-outlined text-[18px]">
                            {{ showConfirmPin() ? 'visibility_off' : 'visibility' }}
                          </span>
                        </button>
                      </div>
                    </div>

                    <!-- Captcha Altcha -->
                    <app-altcha-captcha-field
                      [disabled]="isLoading()"
                      [resetTick]="altchaResetTick()"
                      (verifiedPayload)="onAltchaVerified($event)"
                    />

                    <!-- Tombol Simpan -->
                    <button
                      type="submit"
                      [disabled]="isLoading() || !isFormValid()"
                      class="w-full py-3 px-4 rounded bg-hero-canvas text-ink-on-dark font-bold text-xs uppercase tracking-wider hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] mt-2 shadow-none"
                    >
                      @if (isLoading()) {
                        <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Menyimpan Kredensial Baru...</span>
                      } @else {
                        <span class="material-symbols-outlined text-[18px]">security_update_good</span>
                        <span>Simpan &amp; Perbarui Kredensial Akun</span>
                      }
                    </button>

                    <div class="text-center pt-2">
                      <a routerLink="/login" class="text-xs text-ink-secondary hover:text-ink-on-light font-bold uppercase tracking-wider font-mono-rate transition-colors">
                        Batal dan kembali ke halaman masuk
                      </a>
                    </div>
                  </form>
                }
              </div>
            </div>
          </div>
        </div>
      </main>

      <app-auth-footer-bar />
    </div>
  `,
})
export class WorkerCredentialResetPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly hasToken = signal<boolean>(false);
  readonly wantsChangePhone = signal<boolean>(false);
  readonly showPin = signal<boolean>(false);
  readonly showConfirmPin = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');
  readonly altchaPayload = signal<string | null>(null);
  readonly altchaResetTick = signal<number>(0);

  registeredPhone: string = '';
  newPhoneNumber: string = '';
  newPin: string = '';
  confirmPin: string = '';
  private rawToken: string = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token && token.trim()) {
      this.rawToken = token.trim();
      this.hasToken.set(true);
    } else {
      this.hasToken.set(false);
    }
  }

  toggleChangePhone(): void {
    this.wantsChangePhone.set(!this.wantsChangePhone());
    this.newPhoneNumber = '';
    this.errorMessage.set('');
  }

  onRegisteredPhoneInput(event: Event): void {
    this.registeredPhone = filterNumericInput(event, 16);
    this.errorMessage.set('');
  }

  onNewPhoneInput(event: Event): void {
    this.newPhoneNumber = filterNumericInput(event, 16);
    this.errorMessage.set('');
  }

  onPinInput(event: Event): void {
    this.newPin = filterNumericInput(event, 6);
    this.errorMessage.set('');
  }

  onConfirmPinInput(event: Event): void {
    this.confirmPin = filterNumericInput(event, 6);
    this.errorMessage.set('');
  }

  onAltchaVerified(payload: string): void {
    this.altchaPayload.set(payload);
    this.errorMessage.set('');
  }

  isFormValid(): boolean {
    const cleanPhone = this.registeredPhone.replace(/\D/g, '');
    const pinValid = /^\d{6}$/.test(this.newPin);
    const pinMatch = this.newPin === this.confirmPin;
    const altchaValid = Boolean(this.altchaPayload());

    if (cleanPhone.length < 8 || !pinValid || !pinMatch || !altchaValid) {
      return false;
    }

    if (this.wantsChangePhone()) {
      const cleanNew = this.newPhoneNumber.replace(/\D/g, '');
      return cleanNew.length >= 8;
    }

    return true;
  }

  handleResetSubmit(): void {
    this.errorMessage.set('');

    const cleanReg = this.registeredPhone.replace(/\D/g, '');
    let sanitizedReg = cleanReg;
    if (cleanReg.startsWith('0')) {
      sanitizedReg = '62' + cleanReg.slice(1);
    } else if (!cleanReg.startsWith('62')) {
      sanitizedReg = '62' + cleanReg;
    }

    if (sanitizedReg.length < 10) {
      this.errorMessage.set('Nomor WhatsApp terdaftar minimal 10 digit angka.');
      return;
    }

    if (!/^\d{6}$/.test(this.newPin)) {
      this.errorMessage.set('PIN baru harus terdiri dari tepat 6 digit angka.');
      return;
    }

    if (this.newPin !== this.confirmPin) {
      this.errorMessage.set('Konfirmasi PIN tidak cocok dengan PIN baru.');
      return;
    }

    let sanitizedNew: string | undefined = undefined;
    if (this.wantsChangePhone()) {
      const cleanNew = this.newPhoneNumber.replace(/\D/g, '');
      let formattedNew = cleanNew;
      if (cleanNew.startsWith('0')) {
        formattedNew = '62' + cleanNew.slice(1);
      } else if (!cleanNew.startsWith('62')) {
        formattedNew = '62' + cleanNew;
      }
      if (formattedNew.length < 10) {
        this.errorMessage.set('Nomor WhatsApp baru minimal 10 digit angka.');
        return;
      }
      if (formattedNew === sanitizedReg) {
        this.errorMessage.set('Nomor WhatsApp baru tidak boleh sama dengan nomor terdaftar saat ini.');
        return;
      }
      sanitizedNew = formattedNew;
    }

    const altcha = this.altchaPayload();
    if (!altcha) {
      this.errorMessage.set('Verifikasi keamanan captcha wajib diselesaikan.');
      return;
    }

    this.isLoading.set(true);

    this.authService
      .executeCredentialReset({
        execution_token: this.rawToken,
        phone_number: sanitizedReg,
        new_pin: this.newPin,
        new_phone_number: sanitizedNew,
        altcha_payload: altcha,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.successMessage.set(res.message || 'Kredensial akun berhasil diperbarui.');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.altchaResetTick.update((v) => v + 1);
            this.altchaPayload.set(null);
            this.errorMessage.set(res.error || 'Gagal memperbarui kredensial akun.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.altchaResetTick.update((v) => v + 1);
          this.altchaPayload.set(null);
          this.errorMessage.set(err?.message || 'Terjadi kesalahan sistem saat memperbarui kredensial.');
        },
      });
  }
}

