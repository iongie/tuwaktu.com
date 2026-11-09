import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import {
  CredentialResetRequestResponse,
  CredentialResetType,
} from '../../../models/auth.models';
import { AltchaCaptchaFieldComponent } from '../altcha-captcha-field/altcha-captcha-field.component';

@Component({
  selector: 'app-credential-reset-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AltchaCaptchaFieldComponent],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resetModalTitle"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative w-full max-w-lg bg-body-canvas border border-hairline-light rounded-[16px] shadow-none overflow-hidden flex flex-col max-h-[90vh]"
          (click)="$event.stopPropagation()"
        >
          <!-- Header Modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-hairline-light bg-surface-highlight">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-voltage-orange text-[22px]">lock_reset</span>
              <h3 id="resetModalTitle" class="font-heading-h3 text-heading-h3 font-bold text-ink-on-light">
                Bantuan Akses Akun Mitra
              </h3>
            </div>
            <button
              type="button"
              (click)="closeModal()"
              class="w-8 h-8 flex items-center justify-center rounded border border-hairline-light bg-body-canvas text-ink-on-light hover:bg-surface-highlight transition-colors cursor-pointer"
              aria-label="Tutup dialog permohonan reset"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <!-- Isi Konten Modal -->
          <div class="p-6 overflow-y-auto flex flex-col gap-5">
            @if (!successData()) {
              <!-- Segmented Control Jenis Permohonan -->
              <div class="flex flex-col gap-1.5">
                <label class="font-mono-rate text-xs uppercase tracking-wider text-ink-on-light font-bold">
                  Pilih Jenis Permohonan
                </label>
                <div class="grid grid-cols-2 p-1 bg-surface-highlight border border-hairline-light rounded gap-1" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="selectedType() === 'RESET_PIN'"
                    (click)="selectType('RESET_PIN')"
                    class="py-2.5 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    [ngClass]="{
                      'bg-body-canvas text-ink-on-light border border-hairline-light shadow-xs': selectedType() === 'RESET_PIN',
                      'text-ink-secondary hover:text-ink-on-light border border-transparent': selectedType() !== 'RESET_PIN'
                    }"
                  >
                    @if (selectedType() === 'RESET_PIN') {
                      <span class="w-1.5 h-1.5 rounded-full bg-voltage-orange shrink-0"></span>
                    }
                    <span class="material-symbols-outlined text-[16px]">pin</span>
                    <span>Reset PIN Keamanan</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="selectedType() === 'CHANGE_PHONE'"
                    (click)="selectType('CHANGE_PHONE')"
                    class="py-2.5 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    [ngClass]="{
                      'bg-body-canvas text-ink-on-light border border-hairline-light shadow-xs': selectedType() === 'CHANGE_PHONE',
                      'text-ink-secondary hover:text-ink-on-light border border-transparent': selectedType() !== 'CHANGE_PHONE'
                    }"
                  >
                    @if (selectedType() === 'CHANGE_PHONE') {
                      <span class="w-1.5 h-1.5 rounded-full bg-voltage-orange shrink-0"></span>
                    }
                    <span class="material-symbols-outlined text-[16px]">sync_alt</span>
                    <span>Ganti Nomor WhatsApp</span>
                  </button>
                </div>
              </div>

              <!-- Deskripsi Konteks Alur -->
              <div class="p-3.5 bg-surface-highlight border border-hairline-light rounded flex items-start gap-3">
                <span class="material-symbols-outlined text-whatsapp-green text-[18px] shrink-0 mt-0.5">verified_user</span>
                <p class="font-body-default text-xs text-ink-secondary leading-relaxed">
                  @if (selectedType() === 'RESET_PIN') {
                    Permohonan reset PIN akan diverifikasi oleh Admin Tuwaktu via WhatsApp untuk memastikan keamanan akun mandiri Anda sebelum tautan PIN baru dikirimkan.
                  } @else {
                    Jika nomor WhatsApp lama Anda hilang atau tidak aktif, ajukan pergantian nomor di sini. Admin akan memverifikasi permohonan sebelum menerbitkan tautan pembaruan.
                  }
                </p>
              </div>

              @if (errorMessage()) {
                <div
                  class="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-900 rounded text-xs"
                  role="alert"
                >
                  <span class="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">error</span>
                  <span class="leading-snug">{{ errorMessage() }}</span>
                </div>
              }

              <!-- Input Nomor WhatsApp Terdaftar -->
              <div class="flex flex-col gap-1.5">
                <label for="resetWaNumber" class="font-mono-rate text-xs uppercase tracking-wider text-ink-on-light font-bold flex items-center justify-between">
                  <span>Nomor WhatsApp Terdaftar</span>
                  <span class="font-mono-rate text-[11px] text-ink-secondary font-normal">Awali dengan 62 atau 08</span>
                </label>
                <div class="flex items-center bg-surface-highlight rounded px-3.5 h-11 border border-hairline-light focus-within:border-accent-link focus-within:bg-body-canvas transition-all">
                  <div class="flex items-center gap-1.5 pr-3 text-ink-on-light font-bold shrink-0 select-none border-r border-hairline-light font-mono-rate text-xs">
                    <span>🇮🇩</span>
                    <span>+62</span>
                  </div>
                  <input
                    id="resetWaNumber"
                    type="tel"
                    inputmode="numeric"
                    maxlength="16"
                    required
                    [value]="waNumber()"
                    (input)="onWaNumberInput($event)"
                    placeholder="812 8899 2211"
                    class="w-full bg-transparent border-none outline-none font-mono-rate text-ink-on-light placeholder:text-ink-disabled pl-3 text-sm"
                  />
                </div>
              </div>

              <!-- Altcha Captcha Field -->
              <app-altcha-captcha-field
                [disabled]="isLoading()"
                [resetTick]="altchaResetTick()"
                (verifiedPayload)="onAltchaVerified($event)"
              />

              <!-- Tombol Aksi Permohonan -->
              <div class="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeModal()"
                  [disabled]="isLoading()"
                  class="px-5 py-2.5 rounded border border-hairline-light text-ink-on-light bg-body-canvas hover:bg-surface-highlight font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  (click)="submitResetRequest()"
                  [disabled]="isLoading() || !isFormValid()"
                  class="px-6 py-2.5 rounded bg-hero-canvas text-ink-on-dark hover:bg-[#262626] font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                >
                  @if (isLoading()) {
                    <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses...</span>
                  } @else {
                    <span class="material-symbols-outlined text-[16px]">send</span>
                    <span>Kirim ke WhatsApp Admin</span>
                  }
                </button>
              </div>
            } @else {
              <!-- Tampilan Berhasil: Arahkan ke WhatsApp Admin -->
              <div class="flex flex-col items-center text-center gap-4 py-3">
                <div class="w-12 h-12 rounded bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/20 flex items-center justify-center">
                  <span class="material-symbols-outlined text-[28px] text-whatsapp-green">mark_chat_unread</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <h4 class="font-heading-h3 text-heading-h3 font-bold text-ink-on-light">
                    Permohonan Siap Dikirim!
                  </h4>
                  <p class="font-body-default text-xs text-ink-secondary max-w-md leading-relaxed">
                    Tautan permohonan telah dibuat dan berlaku selama 15 menit. Silakan buka aplikasi WhatsApp untuk mengirimkan pesan verifikasi langsung ke Admin Tuwaktu.
                  </p>
                </div>

                <div class="w-full p-4 bg-surface-highlight rounded border border-hairline-light flex flex-col gap-2 text-left">
                  <div class="flex items-center justify-between text-xs text-ink-secondary font-medium">
                    <span>Nomor WhatsApp Mitra:</span>
                    <span class="font-mono-rate font-bold text-ink-on-light">{{ successData()?.phone_number }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-ink-secondary font-medium">
                    <span>Jenis Permohonan:</span>
                    <span class="font-bold text-ink-on-light">
                      {{ selectedType() === 'RESET_PIN' ? 'Reset PIN Keamanan' : 'Ganti Nomor WhatsApp' }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col w-full gap-2.5 pt-2">
                  <a
                    [href]="successData()?.whatsapp_share_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full py-3 px-4 rounded bg-whatsapp-green hover:bg-whatsapp-green-hover text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span class="material-symbols-outlined text-[18px]">chat</span>
                    <span>Kirim via Aplikasi WhatsApp</span>
                  </a>

                  <a
                    [href]="successData()?.whatsapp_web_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full py-2.5 px-4 rounded border border-hairline-light bg-body-canvas text-ink-on-light hover:bg-surface-highlight font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Gunakan WhatsApp Web (Browser)</span>
                  </a>

                  <button
                    type="button"
                    (click)="closeModal()"
                    class="mt-1 text-xs font-bold uppercase tracking-wider text-ink-secondary hover:text-ink-on-light py-2 cursor-pointer transition-colors"
                  >
                    Selesai &amp; Tutup Jendela
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialResetModalComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly isOpen = input<boolean>(false);
  readonly initialType = input<CredentialResetType>('RESET_PIN');
  readonly initialPhone = input<string>('');

  readonly closed = output<void>();

  readonly selectedType = signal<CredentialResetType>('RESET_PIN');
  readonly waNumber = signal<string>('');
  readonly altchaPayload = signal<string | null>(null);
  readonly altchaResetTick = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successData = signal<CredentialResetRequestResponse | null>(null);

  ngOnInit(): void {
    if (this.initialType()) {
      this.selectedType.set(this.initialType());
    }
    if (this.initialPhone()) {
      this.waNumber.set(this.initialPhone());
    }
  }

  selectType(type: CredentialResetType): void {
    this.selectedType.set(type);
    this.errorMessage.set('');
  }

  onWaNumberInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const clean = inputEl.value.replace(/[^0-9]/g, '');
    this.waNumber.set(clean);
    this.errorMessage.set('');
  }

  onAltchaVerified(payload: string): void {
    this.altchaPayload.set(payload);
    this.errorMessage.set('');
  }

  isFormValid(): boolean {
    const clean = this.waNumber().replace(/\D/g, '');
    return clean.length >= 8 && Boolean(this.altchaPayload());
  }

  submitResetRequest(): void {
    const raw = this.waNumber().trim();
    if (!raw) {
      this.errorMessage.set('Nomor WhatsApp terdaftar wajib diisi.');
      return;
    }

    let sanitizedWa = raw.replace(/\D/g, '');
    if (sanitizedWa.startsWith('0')) {
      sanitizedWa = '62' + sanitizedWa.slice(1);
    } else if (!sanitizedWa.startsWith('62')) {
      sanitizedWa = '62' + sanitizedWa;
    }

    if (sanitizedWa.length < 10) {
      this.errorMessage.set('Nomor WhatsApp minimal 10 digit angka.');
      return;
    }

    const altcha = this.altchaPayload();
    if (!altcha) {
      this.errorMessage.set('Verifikasi keamanan captcha wajib diselesaikan.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .requestCredentialReset({
        phone_number: sanitizedWa,
        request_type: this.selectedType(),
        altcha_payload: altcha,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.successData.set(res.data);
          } else {
            this.altchaResetTick.update((v) => v + 1);
            this.altchaPayload.set(null);
            this.errorMessage.set(res.error || 'Gagal membuat permohonan reset kredensial.');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.altchaResetTick.update((v) => v + 1);
          this.altchaPayload.set(null);
          this.errorMessage.set(err?.message || 'Terjadi kesalahan sistem saat memproses permohonan.');
        },
      });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.successData.set(null);
    this.errorMessage.set('');
    this.altchaPayload.set(null);
    this.altchaResetTick.update((v) => v + 1);
    this.closed.emit();
  }
}

