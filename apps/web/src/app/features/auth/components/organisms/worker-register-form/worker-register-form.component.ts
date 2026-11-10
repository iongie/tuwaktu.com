import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { filterNumericInput, sanitizePlainText } from '../../../../../core/utils/sanitize.utils';
import { AuthService } from '../../../services/auth.service';
import { AuthRegisterResponse, RegisterFormData, SpecialtyOption } from '../../../models/auth.models';
import { AuthSpecialtyPickerComponent } from '../../molecules/auth-specialty-picker/auth-specialty-picker.component';
import { AltchaCaptchaFieldComponent } from '../../molecules/altcha-captcha-field/altcha-captcha-field.component';

@Component({
  selector: 'app-worker-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthSpecialtyPickerComponent, AltchaCaptchaFieldComponent],
  template: `
    <div class="bg-body-canvas rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      <div class="flex items-center justify-between pb-2 border-b border-hairline-subtle/40">
        <div class="flex flex-col">
          <span class="font-micro-uppercase text-micro-uppercase text-on-surface-variant uppercase font-semibold">
            REGISTRASI LANGSUNG
          </span>
          <h2 class="font-heading-h2 text-heading-h2 text-ink-on-light font-bold">
            Data Identitas & Akses Mandiri
          </h2>
        </div>
        <div
          class="flex items-center gap-1.5 bg-whatsapp-surface text-whatsapp-ink px-2.5 py-1 rounded"
        >
          <span class="material-symbols-outlined text-whatsapp-green text-[18px]">verified</span>
          <span class="font-caption text-caption font-semibold">Akses Mandiri</span>
        </div>
      </div>

      @if (formError()) {
        <div
          class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm"
          role="alert"
        >
          <span class="material-symbols-outlined text-red-600 text-[18px]">error</span>
          <span>{{ formError() }}</span>
        </div>
      }

      @if (registrationResult(); as result) {
        <!-- Tampilan Langkah Terakhir: Aktivasi WhatsApp Inbound ke Admin -->
        <div class="flex flex-col gap-6" id="workerRegistrationSuccessCard">
          <div class="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-whatsapp-green flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px]">mark_chat_unread</span>
            </div>
            <div class="flex flex-col">
              <span class="font-micro-uppercase text-micro-uppercase text-emerald-800 font-bold uppercase tracking-wider">
                LANGKAH TERAKHIR
              </span>
              <h3 class="font-heading-h3 text-heading-h3 text-emerald-950 font-bold">
                Kirim Pesan Aktivasi ke WhatsApp Admin
              </h3>
            </div>
          </div>

          <div class="p-4 bg-surface-container-low rounded-xl border border-hairline-subtle/40 flex flex-col gap-3">
            <div class="flex justify-between items-center text-sm pb-2 border-b border-hairline-subtle/20">
              <span class="text-ink-secondary">Nama Calon Mitra</span>
              <span class="font-bold text-ink-on-light">{{ result.name }}</span>
            </div>
            <div class="flex justify-between items-center text-sm pb-2 border-b border-hairline-subtle/20">
              <span class="text-ink-secondary">Nomor WhatsApp Mitra</span>
              <span class="font-mono font-semibold text-ink-on-light">{{ result.whatsapp_number }}</span>
            </div>
            <div class="flex justify-between items-center text-sm pb-2 border-b border-hairline-subtle/20">
              <span class="text-ink-secondary">Tujuan WhatsApp Admin</span>
              <div class="flex items-center gap-1.5 font-mono font-bold text-ink-on-light">
                <span class="material-symbols-outlined text-whatsapp-green text-[16px]">verified</span>
                <span>{{ formatAdminPhone(result.admin_whatsapp_number) }}</span>
              </div>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-ink-secondary">Alamat Profil Publik</span>
              <span class="font-mono font-semibold text-accent-link">tuwaktu.com/{{ result.slug }}</span>
            </div>
          </div>

          <div class="text-sm text-ink-secondary leading-relaxed bg-surface-warm-promo p-4 rounded-xl border border-promo-ink/10 flex flex-col gap-2">
            <p>
              Pendaftaran profil Anda telah tercatat dengan status <strong>Menunggu Konfirmasi</strong>. Demi menjaga keamanan dan memastikan keaslian nomor WhatsApp Anda, mohon kirimkan pesan aktivasi ke WhatsApp Admin langsung dari nomor WhatsApp Anda.
            </p>
            <div class="flex items-center gap-1.5 text-xs text-promo-ink font-semibold mt-1">
              <span class="material-symbols-outlined text-[16px]">timer</span>
              <span>Tautan aktivasi pada pesan berlaku selama {{ result.expires_in_minutes }} menit (sekali pakai).</span>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <!-- Tombol Utama: Aplikasi WhatsApp -->
            <a
              [href]="result.whatsapp_share_url"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-12 bg-whatsapp-green hover:bg-emerald-600 text-white font-button-label text-button-label rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[48px] text-decoration-none no-underline"
            >
              <span class="material-symbols-outlined text-[20px]">chat</span>
              <span>Buka Aplikasi WhatsApp</span>
            </a>

            <!-- Tombol Alternatif Desktop: WhatsApp Web Langsung -->
            <a
              [href]="result.whatsapp_web_url"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full h-11 bg-surface-container-high hover:bg-surface-container-highest text-ink-on-light border border-hairline-subtle/60 font-button-label text-button-label rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] text-decoration-none no-underline"
            >
              <span class="material-symbols-outlined text-[20px] text-accent-link">laptop_mac</span>
              <span>Buka via WhatsApp Web (Desktop)</span>
            </a>

            <!-- Tombol Opsi Manual: Salin Pesan Aktivasi -->
            <button
              type="button"
              (click)="copyMessageToClipboard(result.whatsapp_message)"
              class="w-full h-11 bg-body-canvas hover:bg-surface-container-low text-ink-on-light border border-hairline-subtle/60 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer min-h-[44px]"
            >
              @if (copyStatus() === 'copied') {
                <span class="material-symbols-outlined text-whatsapp-green text-[18px]">check_circle</span>
                <span class="text-emerald-700 font-bold">Teks Pesan Berhasil Disalin!</span>
              } @else {
                <span class="material-symbols-outlined text-ink-secondary text-[18px]">content_copy</span>
                <span>Salin Teks Pesan Aktivasi</span>
              }
            </button>

            <div class="flex items-center justify-center gap-1 text-sm pt-2">
              <span class="font-body-default text-body-default text-ink-secondary">
                Sudah mengirimkan pesan aktivasi?
              </span>
              <a
                routerLink="/login"
                class="font-button-label text-button-label text-accent-link hover:underline font-semibold min-h-[44px] inline-flex items-center py-2"
              >
                Masuk ke Konsol Mitra
              </a>
            </div>
          </div>
        </div>
      } @else {
        <!-- Formulir Pendaftaran Mitra -->
        <form class="flex flex-col gap-5" (ngSubmit)="handleFormSubmit()">
          <!-- Field 1: Nama Lengkap -->
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-baseline">
              <label class="font-body-strong text-body-strong text-ink-on-light" for="fullName">
                Nama Lengkap Pekerja / Entitas Usaha
              </label>
              <span class="font-caption text-caption text-ink-secondary">Nama resmi publik</span>
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              maxlength="100"
              required
              [(ngModel)]="fullName"
              (ngModelChange)="onFullNameChange($event)"
              placeholder="Contoh: Sarah Melinda / Studio Bersih Rapi"
              class="w-full h-11 bg-surface-container-low text-ink-on-light font-body-default text-body-default px-3.5 rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none transition-all shadow-inner"
            />
          </div>

          <!-- Field 2: Spesialisasi Layanan -->
          <app-auth-specialty-picker
            [options]="authService.specialtyOptions"
            [selectedId]="authService.selectedSpecialty().id"
            (selectSpecialty)="onSpecialtySelected($event)"
          />

          <!-- Field 3: WhatsApp Utama & Direct Handshake -->
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-baseline">
              <label class="font-body-strong text-body-strong text-ink-on-light" for="waNumber">
                Nomor WhatsApp Bisnis Langsung
              </label>
              <span class="font-caption text-caption text-whatsapp-green font-semibold">
                Tujuan Notifikasi Klien
              </span>
            </div>
            <div class="flex gap-2">
              <div
                class="h-11 px-3.5 bg-surface-container flex items-center justify-center font-mono-rate text-mono-rate rounded-lg text-ink-on-light font-bold select-none shrink-0"
              >
                +62
              </div>
              <input
                id="waNumber"
                name="waNumber"
                type="tel"
                inputmode="numeric"
                maxlength="13"
                required
                [(ngModel)]="waNumber"
                (input)="onWaNumberInput($event)"
                placeholder="812-3456-7890"
                class="flex-1 h-11 bg-surface-container-low text-ink-on-light font-mono-rate text-mono-rate px-3.5 rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <!-- Field 4: Basecamp & Wilayah Awal -->
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-baseline">
              <label class="font-body-strong text-body-strong text-ink-on-light" for="basecamp">
                Basecamp Operasional & Titik Radius Nol
              </label>
              <span class="font-caption text-caption text-ink-secondary">Pusat kalkulasi ongkir</span>
            </div>
            <div class="relative">
              <input
                id="basecamp"
                name="basecamp"
                type="text"
                maxlength="255"
                required
                [(ngModel)]="basecamp"
                (ngModelChange)="basecampChange.emit($event)"
                placeholder="Contoh: Tebet Barat Dalam, Jakarta Selatan"
                class="w-full h-11 bg-surface-container-low text-ink-on-light font-body-default text-body-default pl-10 pr-3.5 rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none transition-all shadow-inner"
              />
              <span
                class="material-symbols-outlined absolute left-3 top-3 text-ink-disabled text-[18px]"
              >
                location_on
              </span>
            </div>
          </div>

          <!-- Field 5: URL Profil Mandiri -->
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-baseline">
              <label class="font-body-strong text-body-strong text-ink-on-light" for="customSlug">
                Alamat Tautan Profil Pemesanan Publik
              </label>
              @if (customSlug) {
                <div
                  class="flex items-center gap-1 font-caption text-caption font-semibold"
                  [class.text-emerald-600]="slugValidation().isValid"
                  [class.text-red-600]="!slugValidation().isValid"
                >
                  <span class="material-symbols-outlined text-[14px]">
                    {{ slugValidation().isValid ? 'check_circle' : 'cancel' }}
                  </span>
                  <span>{{ slugValidation().message }}</span>
                </div>
              } @else {
                <div class="flex items-center gap-1 font-caption text-caption text-ink-secondary">
                  <span class="material-symbols-outlined text-[14px]">link</span>
                  <span>Tautan unik profil Anda</span>
                </div>
              }
            </div>
            <div
              class="flex items-center h-11 bg-surface-container-low rounded-lg px-3.5 shadow-inner border border-transparent focus-within:border-ink-on-light focus-within:bg-body-canvas transition-all"
            >
              <span class="font-mono-rate text-mono-rate text-ink-disabled select-none">
                tuwaktu.com/
              </span>
              <input
                id="customSlug"
                name="customSlug"
                type="text"
                maxlength="50"
                required
                [(ngModel)]="customSlug"
                (ngModelChange)="onSlugChange($event)"
                placeholder="nama-entitas-anda"
                class="flex-1 bg-transparent text-ink-on-light font-mono-rate text-mono-rate focus:outline-none pl-1"
              />
            </div>
            <span class="font-caption text-caption text-ink-secondary">
              Tautan mandiri ini akan dibagikan ke calon klien, bio Instagram, atau kartu nama fisik.
            </span>
          </div>

          <!-- Field 6: Master Security PIN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1">
              <label class="font-body-strong text-body-strong text-ink-on-light" for="workerPin">
                PIN Akses 6-Digit
              </label>
              <input
                id="workerPin"
                name="workerPin"
                type="password"
                maxlength="6"
                inputmode="numeric"
                required
                [(ngModel)]="workerPin"
                (input)="onPinInput($event, 'pin')"
                placeholder="••••••"
                class="h-11 bg-surface-container-low text-ink-on-light font-mono-rate text-mono-rate tracking-widest text-center rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none shadow-inner"
              />
              <span class="font-caption text-caption text-ink-disabled">
                Pengganti kata sandi rumit.
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <label
                class="font-body-strong text-body-strong text-ink-on-light"
                for="workerPinConfirm"
              >
                Konfirmasi PIN Akses
              </label>
              <input
                id="workerPinConfirm"
                name="workerPinConfirm"
                type="password"
                maxlength="6"
                inputmode="numeric"
                required
                [(ngModel)]="workerPinConfirm"
                (input)="onPinInput($event, 'pinConfirm')"
                placeholder="••••••"
                class="h-11 bg-surface-container-low text-ink-on-light font-mono-rate text-mono-rate tracking-widest text-center rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none shadow-inner"
              />
              <span class="font-caption text-caption text-ink-disabled">Wajib persis sama.</span>
            </div>
          </div>

          <!-- Strict Worker Covenant (No em dashes) -->
          <div
            class="bg-surface-warm-promo p-3.5 rounded-lg flex items-start gap-3 border border-promo-ink/10"
          >
            <input
              id="doctrineAgreement"
              name="doctrineAgreement"
              type="checkbox"
              required
              [(ngModel)]="doctrineAgreement"
              class="mt-1 w-4 h-4 accent-voltage-orange rounded cursor-pointer min-h-[16px] min-w-[16px]"
            />
            <label
              for="doctrineAgreement"
              class="font-caption text-caption text-promo-ink cursor-pointer select-none leading-relaxed"
            >
              <strong>Ketentuan Layanan Pekerja Mandiri:</strong> Saya menyetujui komitmen layanan
              ini - saya bertanggung jawab langsung terhadap integritas layanan kepada klien,
              mengatur tarif serta jangkauan radius secara mandiri, dan mematuhi buffer transit istirahat demi
              keselamatan kerja.
            </label>
          </div>

          <!-- Verifikasi Keamanan Anti-Bot ALTCHA -->
          <app-altcha-captcha-field
            [disabled]="isLoading()"
            [resetTick]="altchaResetTick()"
            (verifiedPayload)="onAltchaVerified($event)"
          />

          <!-- Execution Trigger -->
          <div class="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full h-12 bg-primary hover:bg-surface-elevated-dark text-on-primary font-button-label text-button-label rounded-lg flex items-center justify-center gap-2 shadow-md transition-all group cursor-pointer min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Mendaftarkan Profil Mitra...</span>
              } @else {
                <span>Buat Profil Mandiri & Ambil Tautan Web</span>
                <span
                  class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform"
                >
                  arrow_forward
                </span>
              }
            </button>

            <div class="flex items-center justify-center gap-1 text-sm">
              <span class="font-body-default text-body-default text-ink-secondary">
                Sudah memiliki konsol pekerja?
              </span>
              <a
                routerLink="/login"
                class="font-button-label text-button-label text-accent-link hover:underline font-semibold min-h-[44px] inline-flex items-center py-2"
              >
                Masuk ke Konsol Mandiri
              </a>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerRegisterFormComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private userManuallyEditedSlug = false;

  readonly basecampChange = output<string>();

  ngOnInit(): void {
    this.authService.loadSpecialties();
  }

  fullName = '';
  waNumber = '';
  basecamp = '';
  customSlug = '';
  workerPin = '';
  workerPinConfirm = '';
  doctrineAgreement = false;

  readonly formError = signal<string>('');
  readonly formSuccess = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly altchaPayload = signal<string>('');
  readonly altchaVerified = signal<boolean>(false);
  readonly altchaResetTick = signal<number>(0);
  readonly registrationResult = signal<AuthRegisterResponse | null>(null);
  readonly copyStatus = signal<'idle' | 'copied' | 'error'>('idle');
  private copyResetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly slugValidation = computed(() => {
    return this.authService.validateSlug(this.customSlug);
  });

  formatAdminPhone(raw: string | undefined): string {
    if (!raw) return '+62 812-3456-7890';
    const clean = raw.replace(/[^0-9]/g, '');
    if (clean.startsWith('62')) {
      const rest = clean.slice(2);
      if (rest.length >= 8) {
        return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
      }
      return `+62 ${rest}`;
    }
    return raw;
  }

  async copyMessageToClipboard(message: string): Promise<void> {
    if (!message) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      this.copyStatus.set('copied');
    } catch {
      this.copyStatus.set('error');
    }

    if (this.copyResetTimeoutId !== null) {
      clearTimeout(this.copyResetTimeoutId);
    }
    this.copyResetTimeoutId = setTimeout(() => {
      this.copyStatus.set('idle');
      this.copyResetTimeoutId = null;
    }, 3000);
  }

  onAltchaVerified(payload: string): void {
    this.altchaPayload.set(payload);
    this.altchaVerified.set(Boolean(payload));
    if (payload) {
      this.formError.set('');
    }
  }

  ngOnDestroy(): void {
    if (this.redirectTimeoutId !== null) {
      clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
    }
    if (this.copyResetTimeoutId !== null) {
      clearTimeout(this.copyResetTimeoutId);
      this.copyResetTimeoutId = null;
    }
  }

  onSpecialtySelected(option: SpecialtyOption): void {
    this.authService.selectSpecialty(option);
  }

  onFullNameChange(name: string): void {
    if (!this.userManuallyEditedSlug) {
      this.customSlug = this.authService.sanitizeSlug(name);
    }
  }

  onSlugChange(value: string): void {
    this.userManuallyEditedSlug = true;
    this.customSlug = this.authService.sanitizeSlug(value);
    if (!value.trim()) {
      this.userManuallyEditedSlug = false;
    }
  }

  onWaNumberInput(event: Event): void {
    this.waNumber = filterNumericInput(event, 13);
  }

  onPinInput(event: Event, target: 'pin' | 'pinConfirm'): void {
    const numericVal = filterNumericInput(event, 6);
    if (target === 'pin') {
      this.workerPin = numericVal;
    } else {
      this.workerPinConfirm = numericVal;
    }
  }

  handleFormSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    this.formError.set('');
    this.formSuccess.set('');

    this.fullName = sanitizePlainText(this.fullName, 100);
    this.basecamp = sanitizePlainText(this.basecamp, 255);
    this.customSlug = sanitizePlainText(this.customSlug, 50);

    const payload: RegisterFormData = {
      fullName: this.fullName,
      specialtyId: this.authService.selectedSpecialty().id,
      specialtyLabel: this.authService.selectedSpecialty().label,
      waNumber: this.waNumber,
      basecamp: this.basecamp,
      customSlug: this.customSlug,
      pin: this.workerPin,
      pinConfirm: this.workerPinConfirm,
      doctrineAccepted: this.doctrineAgreement,
      altchaPayload: this.altchaPayload(),
    };

    const validation = this.authService.validateRegistration(payload);
    if (!validation.isValid) {
      this.formError.set(validation.error || 'Terjadi kesalahan pada data formulir.');
      return;
    }

    if (!this.altchaVerified()) {
      this.formError.set('Verifikasi keamanan captcha wajib diselesaikan sebelum mendaftar.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(payload).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.success && result.data) {
          this.registrationResult.set(result.data);
          this.formSuccess.set(
            `Pendaftaran berhasil diajukan! Silakan kirimkan pesan aktivasi WhatsApp ke Admin untuk mengaktifkan akun Anda.`
          );
        } else {
          this.altchaResetTick.update((v) => v + 1);
          this.formError.set(result.error || 'Pendaftaran mitra gagal. Silakan coba lagi.');
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.altchaResetTick.update((v) => v + 1);
        const httpErr = err as { message?: string; error?: { message?: string } | string };
        const errorMessage =
          (typeof httpErr?.error === 'object' && httpErr?.error?.message) ||
          (typeof httpErr?.error === 'string' && httpErr.error) ||
          'Terjadi kesalahan koneksi saat pendaftaran mitra.';
        this.formError.set(errorMessage);
      },
    });
  }
}
