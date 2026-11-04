import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminCreateWorkerPayload,
  AdminWorkerCreatedResponse,
} from '../../../models/admin-worker.model';

@Component({
  selector: 'app-admin-worker-onboarding-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <!-- Backdrop clickable to close -->
        <button
          type="button"
          class="fixed inset-0 w-full h-full cursor-default bg-transparent -z-10"
          aria-label="Tutup modal pendaftaran"
          (click)="closeModal()"
          tabindex="-1"
        ></button>

        <div class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-surface border border-hairline p-6 md:p-8 shadow-2xl">
          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-6 right-6 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition cursor-pointer"
            aria-label="Tutup jendela"
            (click)="closeModal()"
            data-testid="close-modal-btn"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          @if (!createdResult()) {
            <!-- FORM ONBOARDING -->
            <div class="mb-6">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
                Panel Onboarding Mitra
              </div>
              <h2 id="modalTitle" class="text-xl md:text-2xl font-bold text-on-surface">
                Tambah Mitra Mandiri Baru
              </h2>
              <p class="text-sm text-on-surface-variant mt-1">
                Daftarkan saudara atau teknisi baru. Akun login, profil publik, dan jadwal rutin akan dibuatkan otomatis.
              </p>
            </div>

            @if (errorMessage()) {
              <div class="p-4 mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-sm flex items-start gap-3">
                <svg class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="handleSubmit()" class="space-y-4">
              <!-- Nama Lengkap -->
              <div>
                <label for="workerNameInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Nama Lengkap Mitra <span class="text-rose-500">*</span>
                </label>
                <input
                  id="workerNameInput"
                  type="text"
                  name="workerName"
                  required
                  class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Contoh: Hendro Wijaya"
                  [(ngModel)]="formData.name"
                />
              </div>

              <!-- Kontak Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="workerWaInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Nomor WhatsApp <span class="text-rose-500">*</span>
                  </label>
                  <input
                    id="workerWaInput"
                    type="tel"
                    name="workerWa"
                    required
                    class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition font-mono"
                    placeholder="Contoh: 6281234567890"
                    [(ngModel)]="formData.whatsapp_number"
                  />
                  <span class="text-[11px] text-on-surface-variant mt-1 block">Gunakan kode negara (628...)</span>
                </div>

                <div>
                  <label for="workerEmailInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Alamat Email <span class="text-rose-500">*</span>
                  </label>
                  <input
                    id="workerEmailInput"
                    type="email"
                    name="workerEmail"
                    required
                    class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    placeholder="hendro@tuwaktu.com"
                    [(ngModel)]="formData.email"
                  />
                </div>
              </div>

              <!-- Zona Wilayah & Tarif Dasar -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="workerZoneInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Zona Layanan Operasional
                  </label>
                  <input
                    id="workerZoneInput"
                    type="text"
                    name="workerZone"
                    class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    placeholder="Contoh: Jakarta Barat"
                    [(ngModel)]="formData.zone"
                  />
                </div>

                <div>
                  <label for="workerPriceInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Tarif Dasar (Rp)
                  </label>
                  <input
                    id="workerPriceInput"
                    type="number"
                    name="workerPrice"
                    min="10000"
                    step="5000"
                    class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition font-mono"
                    placeholder="75000"
                    [(ngModel)]="formData.base_price"
                  />
                </div>
              </div>

              <!-- Bio / Profesi Singkat -->
              <div>
                <label for="workerBioInput" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Profesi & Deskripsi Singkat
                </label>
                <input
                  id="workerBioInput"
                  type="text"
                  name="workerBio"
                  class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Contoh: Teknisi AC dan kelistrikan berpengalaman"
                  [(ngModel)]="formData.bio"
                />
              </div>

              <!-- Password Generator Sementara -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label for="workerPasswordInput" class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Kata Sandi Sementara
                  </label>
                  <button
                    type="button"
                    class="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    (click)="generateRandomPassword()"
                    data-testid="generate-pwd-btn"
                  >
                    + Acak Sandi
                  </button>
                </div>
                <input
                  id="workerPasswordInput"
                  type="text"
                  name="workerPassword"
                  class="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-hairline text-sm text-on-surface font-mono placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Biarkan kosong untuk generate otomatis"
                  [(ngModel)]="formData.temporary_password"
                />
              </div>

              <!-- Action Buttons -->
              <div class="pt-4 flex items-center justify-end gap-3 border-t border-hairline">
                <button
                  type="button"
                  class="min-h-[44px] px-5 py-2.5 rounded-xl border border-hairline text-sm font-semibold text-on-surface hover:bg-surface-container-high transition cursor-pointer"
                  (click)="closeModal()"
                  [disabled]="isSubmitting()"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  class="min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition cursor-pointer flex items-center gap-2"
                  [disabled]="isSubmitting()"
                  data-testid="submit-onboarding-btn"
                >
                  @if (isSubmitting()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Menyimpan...
                  } @else {
                    Daftarkan Mitra Baru
                  }
                </button>
              </div>
            </form>
          } @else {
            <!-- LAYAR SUKSES & SALIN UNDANGAN -->
            <div class="text-center py-4" data-testid="success-onboarding-view">
              <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 class="text-xl md:text-2xl font-bold text-on-surface mb-1">
                Mitra Berhasil Didaftarkan!
              </h2>
              <p class="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
                Akun telah aktif. Salin teks undangan di bawah atau kirimkan langsung ke WhatsApp mitra.
              </p>

              <!-- Kredensial Box -->
              <div class="p-4 rounded-2xl bg-surface-container-high border border-hairline text-left text-sm mb-6 font-mono space-y-1.5">
                <div><span class="text-on-surface-variant">Nama:</span> <strong class="text-on-surface">{{ createdResult()!.worker.name }}</strong></div>
                <div><span class="text-on-surface-variant">Akun Login:</span> <strong class="text-on-surface">{{ createdResult()!.account.email }}</strong></div>
                <div><span class="text-on-surface-variant">Sandi Sementara:</span> <strong class="text-primary">{{ createdResult()!.temporary_password }}</strong></div>
                <div><span class="text-on-surface-variant">Slug Profil:</span> <strong class="text-on-surface">/{{ createdResult()!.worker.slug }}</strong></div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  class="min-h-[44px] px-6 py-2.5 rounded-xl border border-hairline bg-surface text-on-surface hover:bg-surface-container-high text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  (click)="copyInvitationText()"
                  data-testid="copy-invitation-btn"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{{ isCopied() ? 'Tersalin ke Clipboard!' : 'Salin Tautan & Undangan' }}</span>
                </button>

                <a
                  [href]="whatsappShareUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  data-testid="send-wa-btn"
                >
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                  </svg>
                  <span>Kirim ke WhatsApp</span>
                </a>
              </div>

              <div class="mt-6 pt-4 border-t border-hairline">
                <button
                  type="button"
                  class="text-xs text-on-surface-variant hover:text-on-surface font-semibold cursor-pointer"
                  (click)="closeModal()"
                >
                  Selesai & Tutup Jendela
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class AdminWorkerOnboardingModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly createdResult = input<AdminWorkerCreatedResponse | null>(null);

  readonly closeClick = output<void>();
  readonly submitOnboarding = output<AdminCreateWorkerPayload>();

  readonly isCopied = signal<boolean>(false);

  formData: AdminCreateWorkerPayload = {
    name: '',
    whatsapp_number: '',
    email: '',
    zone: 'Jakarta Selatan',
    base_price: 75000,
    rate_type: 'HOURLY',
    bio: '',
    temporary_password: '',
  };

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    if (this.isOpen()) {
      this.closeModal();
    }
  }

  generateRandomPassword(): void {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.formData.temporary_password = res;
  }

  handleSubmit(): void {
    if (!this.formData.name || !this.formData.whatsapp_number || !this.formData.email) {
      return;
    }
    this.submitOnboarding.emit({ ...this.formData });
  }

  closeModal(): void {
    this.isCopied.set(false);
    this.closeClick.emit();
  }

  copyInvitationText(): void {
    const result = this.createdResult();
    if (!result) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(result.invitation_text).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 3000);
      });
    }
  }

  whatsappShareUrl(): string {
    const result = this.createdResult();
    if (!result) return '#';

    const wa = result.account.phone_number || '';
    const cleanWa = wa.replace(/\D/g, '');
    const encodedText = encodeURIComponent(result.invitation_text);
    return `https://wa.me/${cleanWa}?text=${encodedText}`;
  }
}

