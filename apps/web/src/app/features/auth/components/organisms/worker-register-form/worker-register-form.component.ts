import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterFormData, SpecialtyOption } from '../../../models/auth.models';
import { AuthSpecialtyPickerComponent } from '../../molecules/auth-specialty-picker/auth-specialty-picker.component';

@Component({
  selector: 'app-worker-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthSpecialtyPickerComponent],
  template: `
    <div class="bg-body-canvas rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      <div class="flex items-center justify-between pb-2 border-b border-hairline-subtle/40">
        <div class="flex flex-col">
          <span class="font-micro-uppercase text-micro-uppercase text-on-surface-variant uppercase font-semibold">
            REGISTRASI LANGSUNG
          </span>
          <h2 class="font-heading-h2 text-heading-h2 text-ink-on-light font-bold">
            Data Identitas & Kedaulatan Akses
          </h2>
        </div>
        <div
          class="flex items-center gap-1.5 bg-whatsapp-surface text-whatsapp-ink px-2.5 py-1 rounded"
        >
          <span class="material-symbols-outlined text-whatsapp-green text-[18px]">verified</span>
          <span class="font-caption text-caption font-semibold">Bebas OAuth 100%</span>
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

      @if (formSuccess()) {
        <div
          class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm"
          role="status"
        >
          <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
          <span>{{ formSuccess() }}</span>
        </div>
      }

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
              required
              [(ngModel)]="waNumber"
              placeholder="812-3456-7890"
              class="flex-1 h-11 bg-surface-container-low text-ink-on-light font-mono-rate text-mono-rate px-3.5 rounded-lg border border-transparent focus:border-ink-on-light focus:bg-body-canvas focus:outline-none transition-all shadow-inner"
            />
            <button
              type="button"
              (click)="triggerOtpSend()"
              [disabled]="authService.otpStatus() === 'sending'"
              class="px-3.5 h-11 rounded-lg font-button-label text-button-label text-ink-on-dark flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              [class.bg-surface-elevated-dark]="authService.otpStatus() !== 'sent'"
              [class.hover:bg-hero-canvas]="authService.otpStatus() !== 'sent'"
              [class.bg-whatsapp-green]="authService.otpStatus() === 'sent'"
            >
              @if (authService.otpStatus() === 'sending') {
                <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Mengirim...</span>
              } @else if (authService.otpStatus() === 'sent') {
                <span class="material-symbols-outlined text-[18px]">check</span>
                <span>Terkirim</span>
              } @else {
                <span class="material-symbols-outlined text-[18px]">key</span>
                <span>Kirim OTP WA</span>
              }
            </button>
          </div>
          @if (authService.otpStatus() === 'sent') {
            <div
              class="flex items-center gap-1.5 mt-1 text-whatsapp-green font-caption text-caption font-medium"
            >
              <span class="material-symbols-outlined text-[16px]">task_alt</span>
              <span>{{ authService.otpFeedbackMessage() }}</span>
            </div>
          } @else if (authService.otpStatus() === 'error') {
            <div class="flex items-center gap-1.5 mt-1 text-red-600 font-caption text-caption">
              <span class="material-symbols-outlined text-[16px]">error</span>
              <span>{{ authService.otpFeedbackMessage() }}</span>
            </div>
          }
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

        <!-- Field 5: URL Kedaulatan Mandiri -->
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
              PIN Akses 6-Digit Kedaulatan
            </label>
            <input
              id="workerPin"
              name="workerPin"
              type="password"
              maxlength="6"
              inputmode="numeric"
              required
              [(ngModel)]="workerPin"
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
            <strong>Pakta Kedaulatan Pekerja Tuwaktu:</strong> Saya menyetujui kedaulatan penuh
            bisnis ini - saya bertanggung jawab langsung terhadap integritas layanan kepada klien,
            mengontrol 100% tarif serta radius, dan mematuhi buffer transit istirahat demi
            keselamatan kerja mandiri.
          </label>
        </div>

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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerRegisterFormComponent implements OnDestroy {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private userManuallyEditedSlug = false;

  readonly basecampChange = output<string>();

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

  readonly slugValidation = computed(() => {
    return this.authService.validateSlug(this.customSlug);
  });

  ngOnDestroy(): void {
    if (this.redirectTimeoutId !== null) {
      clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
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

  async triggerOtpSend(): Promise<void> {
    this.formError.set('');
    await this.authService.sendInstantOtp(this.waNumber);
  }

  handleFormSubmit(): void {
    if (this.isLoading()) {
      return;
    }

    this.formError.set('');
    this.formSuccess.set('');

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
    };

    const validation = this.authService.validateRegistration(payload);
    if (!validation.isValid) {
      this.formError.set(validation.error || 'Terjadi kesalahan pada data formulir.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(payload).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        if (result.success) {
          this.formSuccess.set(
            `Selamat! Profil kedaulatan Anda berhasil diaktifkan. Tautan resmi: tuwaktu.com/${this.customSlug}`
          );
          // Navigasi ke dashboard setelah konfirmasi
          this.redirectTimeoutId = setTimeout(() => {
            this.router.navigate(['/dashboard/ringkasan']);
          }, 1200);
        } else {
          this.formError.set(result.error || 'Pendaftaran mitra gagal. Silakan coba lagi.');
        }
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
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
