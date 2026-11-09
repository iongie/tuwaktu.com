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
          class="relative w-full max-w-lg bg-surface border border-outline-variant/60 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          (click)="$event.stopPropagation()"
        >
          <!-- Header Modal -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-[22px]">lock_reset</span>
              <h3 id="resetModalTitle" class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                Bantuan Akses Akun Mitra
              </h3>
            </div>
            <button
              type="button"
              (click)="closeModal()"
              class="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Tutup dialog permohonan reset"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Isi Konten Modal -->
          <div class="p-6 overflow-y-auto flex flex-col gap-5">
            @if (!successData()) {
              <!-- Segmented Control Jenis Permohonan -->
              <div class="flex flex-col gap-1.5">
                <label class="font-body-strong text-body-strong text-on-surface text-sm">
                  Pilih Jenis Permohonan
                </label>
                <div class="grid grid-cols-2 p-1 bg-surface-container rounded-xl gap-1" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="selectedType() === 'RESET_PIN'"
                    (click)="selectType('RESET_PIN')"
                    class="py-2.5 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    [ngClass]="{
                      'bg-surface text-primary shadow-xs': selectedType() === 'RESET_PIN',
                      'text-on-surface-variant hover:text-on-surface': selectedType() !== 'RESET_PIN'
                    }"
                  >
                    <span class="material-symbols-outlined text-[18px]">pin</span>
                    <span>Reset PIN Keamanan</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="selectedType() === 'CHANGE_PHONE'"
                    (click)="selectType('CHANGE_PHONE')"
                    class="py-2.5 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    [ngClass]="{
                      'bg-surface text-primary shadow-xs': selectedType() === 'CHANGE_PHONE',
                      'text-on-surface-variant hover:text-on-surface': selectedType() !== 'CHANGE_PHONE'
                    }"
                  >
                    <span class="material-symbols-outlined text-[18px]">sync_alt</span>
                    <span>Ganti Nomor WhatsApp</span>
                  </button>
                </div>
              </div>

              <!-- Deskripsi Konteks Alur -->
              <div class="p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl flex items-start gap-3">
                <span class="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified_user</span>
                <p class="font-body-default text-caption text-on-surface-variant leading-relaxed">
                  @if (selectedType() === 'RESET_PIN') {
                    Permohonan reset PIN akan diverifikasi oleh Admin Tuwaktu via WhatsApp untuk memastikan keamanan akun mandiri Anda sebelum tautan PIN baru dikirimkan.
                  } @else {
                    Jika nomor WhatsApp lama Anda hilang atau tidak aktif, ajukan pergantian nomor di sini. Admin akan memverifikasi permohonan sebelum menerbitkan tautan pembaruan.
                  }
                </p>
              </div>

              @if (errorMessage()) {
                <div
                  class="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-xl text-sm"
                  role="alert"
                >
                  <span class="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">error</span>
                  <span class="leading-snug">{{ errorMessage() }}</span>
                </div>
              }

              <!-- Input Nomor WhatsApp Terdaftar -->
              <div class="flex flex-col gap-1.5">
                <label for="resetWaNumber" class="font-body-strong text-body-strong text-on-surface text-sm flex items-center justify-between">
                  <span>Nomor WhatsApp Terdaftar</span>
                  <span class="font-caption text-caption text-on-surface-variant">Awali dengan 62 atau 08</span>
                </label>
                <div class="flex items-center bg-surface-container-low rounded-xl px-3.5 h-12 border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <div class="flex items-center gap-1.5 pr-3 text-on-surface font-semibold shrink-0 select-none border-r border-outline-variant/50">
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
                    class="w-full bg-transparent border-none outline-none font-mono text-on-surface placeholder:text-on-surface-variant/50 pl-3 text-base"
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
                  class="px-5 py-2.5 rounded-xl border border-outline text-on-surface font-semibold hover:bg-surface-container transition-colors cursor-pointer min-h-[48px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  (click)="submitResetRequest()"
                  [disabled]="isLoading() || !isFormValid()"
                  class="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2 min-h-[48px]"
                >
                  @if (isLoading()) {
                    <span class="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses...</span>
                  } @else {
                    <span class="material-symbols-outlined text-[18px]">send</span>
                    <span>Kirim ke WhatsApp Admin</span>
                  }
                </button>
              </div>
            } @else {
              <!-- Tampilan Berhasil: Arahkan ke WhatsApp Admin -->
              <div class="flex flex-col items-center text-center gap-4 py-3">
                <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-[32px]">mark_chat_unread</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <h4 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                    Permohonan Siap Dikirim!
                  </h4>
                  <p class="font-body-default text-body-default text-on-surface-variant max-w-md leading-relaxed">
                    Tautan permohonan telah dibuat dan berlaku selama 15 menit. Silakan buka aplikasi WhatsApp untuk mengirimkan pesan verifikasi langsung ke Admin Tuwaktu.
                  </p>
                </div>

                <div class="w-full p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 flex flex-col gap-2 text-left">
                  <div class="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>Nomor WhatsApp Mitra:</span>
                    <span class="font-mono font-semibold text-on-surface">{{ successData()?.phone_number }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>Jenis Permohonan:</span>
                    <span class="font-semibold text-primary">
                      {{ selectedType() === 'RESET_PIN' ? 'Reset PIN Keamanan' : 'Ganti Nomor WhatsApp' }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col w-full gap-2.5 pt-2">
                  <a
                    [href]="successData()?.whatsapp_share_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span class="material-symbols-outlined text-[20px]">chat</span>
                    <span>Kirim via Aplikasi WhatsApp</span>
                  </a>

                  <a
                    [href]="successData()?.whatsapp_web_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full py-2.5 px-4 rounded-xl border border-outline text-on-surface font-semibold hover:bg-surface-container transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                  >
                    <span>Gunakan WhatsApp Web (Browser)</span>
                  </a>

                  <button
                    type="button"
                    (click)="closeModal()"
                    class="mt-2 text-on-surface-variant hover:text-on-surface text-sm font-medium py-2 cursor-pointer"
                  >
                    Selesai & Tutup Jendela
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

