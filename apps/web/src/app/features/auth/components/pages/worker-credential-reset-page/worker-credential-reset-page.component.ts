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

@Component({
  selector: 'app-worker-credential-reset-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, AltchaCaptchaFieldComponent],
  template: `
    <div class="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo Header -->
        <div class="flex flex-col items-center gap-2 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs">
            <span class="material-symbols-outlined text-[28px]">lock_reset</span>
          </div>
          <h2 class="font-heading-h2 text-heading-h2 font-bold text-center text-on-surface">
            Pembaruan Kredensial Mitra
          </h2>
          <p class="font-body-default text-caption text-center text-on-surface-variant max-w-sm">
            Tautan persetujuan admin diverifikasi. Masukkan nomor terdaftar dan tetapkan PIN keamanan baru Anda.
          </p>
        </div>

        <div class="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <!-- Token Missing Error -->
          @if (!hasToken()) {
            <div class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-950 text-sm">
              <span class="material-symbols-outlined text-red-600 text-[22px] shrink-0 mt-0.5">error</span>
              <div class="flex flex-col gap-1">
                <strong class="font-semibold">Tautan Tidak Lengkap</strong>
                <p class="text-xs text-red-800 leading-relaxed">
                  Parameter token eksekusi tidak ditemukan. Pastikan Anda membuka tautan lengkap yang dikirimkan oleh Admin Tuwaktu via WhatsApp.
                </p>
              </div>
            </div>
            <a
              routerLink="/login"
              class="w-full py-2.5 px-4 rounded-xl border border-outline text-on-surface text-center font-semibold text-sm hover:bg-surface-container transition-colors min-h-[44px] flex items-center justify-center"
            >
              Kembali ke Halaman Masuk
            </a>
          } @else if (successMessage()) {
            <!-- State Sukses -->
            <div class="flex flex-col items-center text-center gap-3 py-4">
              <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <h3 class="font-heading-h3 text-lg font-bold text-on-surface">
                Pembaruan Kredensial Berhasil!
              </h3>
              <p class="text-sm text-on-surface-variant leading-relaxed">
                {{ successMessage() }}
              </p>
              <span class="text-xs text-on-surface-variant/70 font-mono mt-1">Mengalihkan ke halaman masuk...</span>
            </div>
          } @else {
            <!-- Form Eksekusi Reset -->
            <form class="flex flex-col gap-4" (ngSubmit)="handleResetSubmit()">
              @if (errorMessage()) {
                <div class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-900 text-sm" role="alert">
                  <span class="material-symbols-outlined text-red-600 text-[18px] shrink-0">error</span>
                  <span class="text-xs leading-snug">{{ errorMessage() }}</span>
                </div>
              }

              <!-- 1. Nomor WhatsApp Terdaftar (Verifikasi Identitas) -->
              <div class="flex flex-col gap-1">
                <label for="registeredPhone" class="font-body-strong text-body-strong text-on-surface text-sm flex items-center justify-between">
                  <span>Nomor WhatsApp Terdaftar</span>
                  <span class="font-caption text-caption text-on-surface-variant">Untuk verifikasi</span>
                </label>
                <div class="flex items-center bg-surface rounded-xl px-3.5 h-11 border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <div class="flex items-center gap-1.5 pr-2.5 text-on-surface font-semibold shrink-0 select-none border-r border-outline-variant/40">
                    <span>🇮🇩</span>
                    <span class="text-xs">+62</span>
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
                    class="w-full bg-transparent border-none outline-none font-mono text-on-surface placeholder:text-on-surface-variant/40 pl-2.5 text-sm"
                  />
                </div>
              </div>

              <!-- 2. Opsi Pergantian Nomor WhatsApp Baru (Opsional / Toggle) -->
              <div class="flex flex-col gap-1.5 pt-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-on-surface-variant font-medium">Apakah Anda juga mengganti nomor WhatsApp?</span>
                  <button
                    type="button"
                    (click)="toggleChangePhone()"
                    class="text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    {{ wantsChangePhone() ? 'Batal Ganti Nomor' : '+ Ganti Nomor Baru' }}
                  </button>
                </div>

                @if (wantsChangePhone()) {
                  <div class="flex items-center bg-surface rounded-xl px-3.5 h-11 border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <div class="flex items-center gap-1.5 pr-2.5 text-on-surface font-semibold shrink-0 select-none border-r border-outline-variant/40">
                      <span>🇮🇩</span>
                      <span class="text-xs">+62 Baru</span>
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
                      class="w-full bg-transparent border-none outline-none font-mono text-on-surface placeholder:text-on-surface-variant/40 pl-2.5 text-sm"
                    />
                  </div>
                }
              </div>

              <!-- 3. PIN Baru (6 Digit) -->
              <div class="flex flex-col gap-1 pt-1">
                <label for="newPin" class="font-body-strong text-body-strong text-on-surface text-sm">
                  PIN Keamanan Baru (6 Digit Angka)
                </label>
                <div class="flex items-center bg-surface rounded-xl px-3.5 h-11 border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">key</span>
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
                    class="w-full bg-transparent border-none outline-none font-mono text-on-surface tracking-widest placeholder:text-on-surface-variant/40 text-sm"
                  />
                  <button
                    type="button"
                    (click)="showPin.set(!showPin())"
                    class="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer w-9 h-9 flex items-center justify-center shrink-0"
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
                <label for="confirmPin" class="font-body-strong text-body-strong text-on-surface text-sm">
                  Konfirmasi PIN Keamanan Baru
                </label>
                <div class="flex items-center bg-surface rounded-xl px-3.5 h-11 border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span class="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">lock</span>
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
                    class="w-full bg-transparent border-none outline-none font-mono text-on-surface tracking-widest placeholder:text-on-surface-variant/40 text-sm"
                  />
                  <button
                    type="button"
                    (click)="showConfirmPin.set(!showConfirmPin())"
                    class="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer w-9 h-9 flex items-center justify-center shrink-0"
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
                class="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] text-sm mt-2 shadow-xs"
              >
                @if (isLoading()) {
                  <span class="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyimpan Kredensial Baru...</span>
                } @else {
                  <span class="material-symbols-outlined text-[18px]">security_update_good</span>
                  <span>Simpan & Perbarui Kredensial Akun</span>
                }
              </button>

              <div class="text-center pt-2">
                <a routerLink="/login" class="text-xs text-on-surface-variant hover:text-on-surface font-medium transition-colors">
                  Batal dan kembali ke halaman masuk
                </a>
              </div>
            </form>
          }
        </div>
      </div>
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

