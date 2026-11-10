import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminWorkerStore } from '../../../services/admin-worker.store';
import { AdminCreateWorkerPayload } from '../../../models/admin-worker.model';
import { AdminWorkerLivePreviewCardComponent } from '../../molecules/admin-worker-live-preview-card/admin-worker-live-preview-card.component';

@Component({
  selector: 'app-admin-worker-create-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AdminWorkerLivePreviewCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- Breadcrumb & Top Action Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-light pb-4">
        <div class="space-y-1">
          <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-xs text-ink-secondary mb-1">
            <a
              routerLink="/admin/workers"
              class="hover:text-ink-on-light transition-colors flex items-center gap-1 font-mono-rate"
            >
              <span class="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Kelola Mitra</span>
            </a>
            <span class="material-symbols-outlined text-[12px] text-ink-disabled">chevron_right</span>
            <span class="text-ink-on-light font-bold font-mono-rate">
              Pendaftaran Mitra Baru
            </span>
          </nav>
          <h1 class="font-bold text-xl sm:text-2xl text-ink-on-light tracking-tight">
            Studio Pendaftaran &amp; Onboarding Mitra
          </h1>
          <p class="text-xs sm:text-sm text-ink-secondary">
            Registrasikan pekerja mandiri baru ke sistem direktori Tuwaktu dengan standar transparansi 0% potongan komisi.
          </p>
        </div>

        @if (!store.newlyCreatedWorker()) {
          <div class="flex items-center gap-2.5 shrink-0">
            <a
              routerLink="/admin/workers"
              class="min-h-[44px] px-4 py-2 rounded border border-hairline-light bg-body-canvas text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center justify-center cursor-pointer"
            >
              Batal
            </a>
            <button
              type="button"
              (click)="handleSubmitOnboarding()"
              [disabled]="store.isOnboardingSubmitting() || !isFormValid()"
              class="min-h-[44px] px-5 py-2 rounded bg-hero-canvas text-ink-on-dark hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center gap-2 cursor-pointer shadow-none"
            >
              <span class="material-symbols-outlined text-[16px] text-voltage-orange">person_add</span>
              <span>{{ store.isOnboardingSubmitting() ? 'Menyimpan...' : 'Daftarkan Mitra Baru' }}</span>
            </button>
          </div>
        }
      </div>

      <!-- Feedback Error Message -->
      @if (store.errorMessage()) {
        <div class="p-3.5 rounded bg-red-500/10 border border-red-500/20 text-red-700 text-xs flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">error</span>
          <span>{{ store.errorMessage() }}</span>
        </div>
      }

      <!-- STEP 2: LAYAR SUKSES KREDENSIAL KHUSUS (SETELAH BERHASIL DIBUAT) -->
      @if (store.newlyCreatedWorker(); as result) {
        <div class="max-w-2xl mx-auto space-y-6 pt-4">
          <!-- Banner Sukses -->
          <div class="rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 p-6 text-center space-y-2">
            <div class="w-12 h-12 rounded bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <span class="material-symbols-outlined text-2xl">check</span>
            </div>
            <h2 class="text-base font-bold text-emerald-900 font-mono-rate uppercase tracking-wider">
              Mitra Berhasil Didaftarkan ke Database
            </h2>
            <p class="text-xs text-emerald-800 max-w-md mx-auto">
              Akun pekerja mandiri untuk <strong>{{ result.worker.name }}</strong> telah dibuat. Silakan salin atau kirimkan kredensial akses di bawah ini.
            </p>
          </div>

          <!-- Kartu Kredensial Akses Instrumen -->
          <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-6 space-y-4 shadow-none">
            <div class="flex items-center justify-between border-b border-hairline-subtle pb-3">
              <span class="font-mono-rate text-xs font-bold uppercase tracking-wider text-ink-on-light flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px] text-voltage-orange">key</span>
                Kredensial Akses Awal Mitra
              </span>
              <span class="font-mono-rate text-[10px] font-bold px-2 py-0.5 rounded bg-surface-highlight border border-hairline-light text-ink-secondary uppercase">
                Argon2id Enkripsi
              </span>
            </div>

            <div class="space-y-3 font-mono-rate text-xs">
              <!-- Baris WhatsApp -->
              <div class="flex items-center justify-between p-3 rounded bg-surface-highlight border border-hairline-light">
                <div>
                  <div class="text-[10px] text-ink-secondary uppercase tracking-wider font-bold">Nomor WhatsApp</div>
                  <div class="font-bold text-ink-on-light mt-0.5">{{ result.account.phone_number }}</div>
                </div>
                <button
                  type="button"
                  (click)="copyToClipboard(result.account.phone_number, 'Nomor WhatsApp disalin!')"
                  class="px-2.5 py-1 rounded bg-body-canvas border border-hairline-light text-[11px] font-bold text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
                >
                  Salin
                </button>
              </div>

              <!-- Baris PIN Awal -->
              <div class="flex items-center justify-between p-3 rounded bg-surface-highlight border border-hairline-light">
                <div>
                  <div class="text-[10px] text-ink-secondary uppercase tracking-wider font-bold">PIN Akses Awal</div>
                  <div class="font-bold text-ink-on-light text-sm mt-0.5 tracking-widest">{{ result.temporary_password }}</div>
                </div>
                <button
                  type="button"
                  (click)="copyToClipboard(result.temporary_password, 'PIN Awal disalin!')"
                  class="px-2.5 py-1 rounded bg-body-canvas border border-hairline-light text-[11px] font-bold text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition cursor-pointer"
                >
                  Salin
                </button>
              </div>

              <!-- Baris URL Profil Publik -->
              <div class="flex items-center justify-between p-3 rounded bg-surface-highlight border border-hairline-light">
                <div class="min-w-0 pr-2">
                  <div class="text-[10px] text-ink-secondary uppercase tracking-wider font-bold">Tautan Web Publik</div>
                  <div class="font-bold text-ink-on-light mt-0.5 truncate">tuwaktu.com/{{ result.worker.slug }}</div>
                </div>
                <button
                  type="button"
                  (click)="copyToClipboard('https://tuwaktu.com/' + result.worker.slug, 'Tautan profil disalin!')"
                  class="px-2.5 py-1 rounded bg-body-canvas border border-hairline-light text-[11px] font-bold text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition cursor-pointer shrink-0"
                >
                  Salin
                </button>
              </div>
            </div>

            <!-- Toast Feedback Salin -->
            @if (copyFeedback()) {
              <div class="p-2 rounded bg-voltage-orange/10 border border-voltage-orange/30 text-voltage-orange text-xs text-center font-mono-rate font-bold">
                {{ copyFeedback() }}
              </div>
            }
          </div>

          <!-- Tombol Aksi Pasca-Pembuatan -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <a
              [href]="getWhatsAppDispatchUrl(result)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 min-h-[44px] px-5 py-2.5 rounded bg-whatsapp-green text-white hover:bg-emerald-800 text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center justify-center gap-2 cursor-pointer shadow-none"
            >
              <span class="material-symbols-outlined text-[18px]">chat</span>
              <span>Kirim Kredensial via WhatsApp</span>
            </a>

            <button
              type="button"
              (click)="handleResetForNextWorker()"
              class="min-h-[44px] px-4 py-2.5 rounded border border-hairline-light bg-body-canvas text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>Daftarkan Mitra Lain</span>
            </button>

            <button
              type="button"
              (click)="handleFinishAndReturn()"
              class="min-h-[44px] px-5 py-2.5 rounded bg-hero-canvas text-ink-on-dark hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider font-mono-rate transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">done</span>
              <span>Selesai &amp; Buka Daftar Mitra</span>
            </button>
          </div>
        </div>
      } @else {
        <!-- STEP 1: FORMULIR TWO-COLUMN STUDIO EDITOR -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Kolom Kiri: Form Terstruktur (8 Kolom) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Section 1: Identitas Personal & Akun -->
            <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-5 sm:p-6 space-y-4 shadow-none">
              <div class="flex items-center gap-2 border-b border-hairline-subtle pb-3">
                <span class="material-symbols-outlined text-[18px] text-voltage-orange">person</span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  1. Identitas Personal &amp; Kontak Akses
                </h2>
              </div>

              <div class="space-y-4">
                <!-- Nama Lengkap -->
                <div class="space-y-1.5">
                  <label for="workerNameInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Nama Lengkap Mitra <span class="text-voltage-orange">*</span>
                  </label>
                  <input
                    id="workerNameInput"
                    type="text"
                    name="workerName"
                    [ngModel]="name()"
                    (ngModelChange)="onNameChange($event)"
                    placeholder="Contoh: Budi Santoso"
                    class="w-full h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                  />
                </div>

                <!-- Nomor WhatsApp & Email Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Nomor WhatsApp -->
                  <div class="space-y-1.5">
                    <label for="workerWhatsappInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                      Nomor WhatsApp Terdaftar <span class="text-voltage-orange">*</span>
                    </label>
                    <input
                      id="workerWhatsappInput"
                      type="tel"
                      name="workerWhatsapp"
                      [ngModel]="whatsappNumber()"
                      (ngModelChange)="whatsappNumber.set($event)"
                      placeholder="08xxxxxxxxxx"
                      class="w-full h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                    />
                    <p class="text-[11px] text-ink-secondary">
                      Nomor ini digunakan untuk login dan menerima pemesanan dari klien.
                    </p>
                  </div>

                  <!-- Email (Opsional) -->
                  <div class="space-y-1.5">
                    <label for="workerEmailInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                      Alamat Email (Opsional)
                    </label>
                    <input
                      id="workerEmailInput"
                      type="email"
                      name="workerEmail"
                      [ngModel]="email()"
                      (ngModelChange)="email.set($event)"
                      placeholder="budi@example.com"
                      class="w-full h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                    />
                    <p class="text-[11px] text-ink-secondary">
                      Digunakan sebagai kontak cadangan jika tersedia.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Keahlian & Klasifikasi Profesi -->
            <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-5 sm:p-6 space-y-4 shadow-none">
              <div class="flex items-center gap-2 border-b border-hairline-subtle pb-3">
                <span class="material-symbols-outlined text-[18px] text-voltage-orange">handyman</span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  2. Profesi &amp; Spesialisasi Utama
                </h2>
              </div>

              <div class="space-y-4">
                <!-- Profesi / Bio Singkat -->
                <div class="space-y-1.5">
                  <label for="workerProfessionInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Profesi / Spesialisasi Kerja <span class="text-voltage-orange">*</span>
                  </label>
                  <input
                    id="workerProfessionInput"
                    type="text"
                    name="workerProfession"
                    [ngModel]="profession()"
                    (ngModelChange)="profession.set($event)"
                    placeholder="Contoh: Teknisi AC &amp; Kelistrikan Presisi"
                    class="w-full h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                  />
                </div>

                <!-- URL Profil Publik (Slug) -->
                <div class="space-y-1.5">
                  <label for="workerSlugInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Tautan Profil Publik (Slug URL) <span class="text-voltage-orange">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono-rate text-ink-secondary">
                      tuwaktu.com/
                    </span>
                    <input
                      id="workerSlugInput"
                      type="text"
                      name="workerSlug"
                      [ngModel]="slug()"
                      (ngModelChange)="slug.set($event)"
                      placeholder="budi-santoso"
                      class="w-full h-11 pl-28 pr-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Basis Operasional & Jangkauan Lokasi -->
            <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-5 sm:p-6 space-y-4 shadow-none">
              <div class="flex items-center gap-2 border-b border-hairline-subtle pb-3">
                <span class="material-symbols-outlined text-[18px] text-voltage-orange">map</span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  3. Basis Wilayah &amp; Jangkauan Radius
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Kota Operasional -->
                <div class="space-y-1.5">
                  <label for="workerZoneSelect" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Kota Operasional Utama <span class="text-voltage-orange">*</span>
                  </label>
                  <select
                    id="workerZoneSelect"
                    name="workerZone"
                    [ngModel]="zone()"
                    (ngModelChange)="zone.set($event)"
                    class="w-full h-11 px-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition cursor-pointer"
                  >
                    <option value="Surabaya">Surabaya</option>
                    <option value="Malang">Malang</option>
                    <option value="Sidoarjo">Sidoarjo</option>
                    <option value="Gresik">Gresik</option>
                    <option value="Jakarta Selatan">Jakarta Selatan</option>
                    <option value="Bandung">Bandung</option>
                  </select>
                </div>

                <!-- Radius Maksimal -->
                <div class="space-y-1.5">
                  <label for="workerRadiusInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Radius Layanan Maksimal (km)
                  </label>
                  <div class="relative">
                    <input
                      id="workerRadiusInput"
                      type="number"
                      min="5"
                      max="100"
                      name="workerRadius"
                      [ngModel]="maxRadiusKm()"
                      (ngModelChange)="maxRadiusKm.set(+$event)"
                      class="w-full h-11 pl-3.5 pr-12 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light tabular-nums placeholder:text-ink-disabled focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                    />
                    <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold font-mono-rate text-ink-secondary">
                      km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 4: Standar Tarif Dasar Awal -->
            <div class="rounded-[10px] bg-body-canvas border border-hairline-light p-5 sm:p-6 space-y-4 shadow-none">
              <div class="flex items-center gap-2 border-b border-hairline-subtle pb-3">
                <span class="material-symbols-outlined text-[18px] text-voltage-orange">attach_money</span>
                <h2 class="font-bold text-sm text-ink-on-light uppercase tracking-wider font-mono-rate">
                  4. Tarif Dasar Awal (Dapat Diubah Mandiri oleh Mitra)
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Nominal Tarif Dasar -->
                <div class="space-y-1.5">
                  <label for="workerBasePriceInput" class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Nominal Tarif Dasar (Rp)
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-bold font-mono-rate text-ink-secondary">
                      Rp
                    </span>
                    <input
                      id="workerBasePriceInput"
                      type="number"
                      min="10000"
                      step="5000"
                      name="workerBasePrice"
                      [ngModel]="basePrice()"
                      (ngModelChange)="basePrice.set(+$event)"
                      placeholder="75000"
                      class="w-full h-11 pl-11 pr-3.5 rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light tabular-nums focus:outline-none focus:border-ink-on-light focus:bg-body-canvas transition"
                    />
                  </div>
                </div>

                <!-- Model Tarif -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold text-ink-on-light font-mono-rate uppercase">
                    Model Satuan Tarif
                  </label>
                  <div class="grid grid-cols-2 gap-2 h-11">
                    <button
                      type="button"
                      (click)="rateType.set('HOURLY')"
                      class="rounded text-xs font-bold font-mono-rate uppercase tracking-wider transition border cursor-pointer flex items-center justify-center"
                      [class.bg-hero-canvas]="rateType() === 'HOURLY'"
                      [class.text-white]="rateType() === 'HOURLY'"
                      [class.border-hero-canvas]="rateType() === 'HOURLY'"
                      [class.bg-surface-highlight]="rateType() !== 'HOURLY'"
                      [class.text-ink-secondary]="rateType() !== 'HOURLY'"
                      [class.border-hairline-light]="rateType() !== 'HOURLY'"
                    >
                      Per Jam
                    </button>
                    <button
                      type="button"
                      (click)="rateType.set('UNIT')"
                      class="rounded text-xs font-bold font-mono-rate uppercase tracking-wider transition border cursor-pointer flex items-center justify-center"
                      [class.bg-hero-canvas]="rateType() === 'UNIT'"
                      [class.text-white]="rateType() === 'UNIT'"
                      [class.border-hero-canvas]="rateType() === 'UNIT'"
                      [class.bg-surface-highlight]="rateType() !== 'UNIT'"
                      [class.text-ink-secondary]="rateType() !== 'UNIT'"
                      [class.border-hairline-light]="rateType() !== 'UNIT'"
                    >
                      Per Paket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Live Preview & Kotak Panduan (4 Kolom) -->
          <div class="lg:col-span-4 space-y-6 sticky top-20">
            <app-admin-worker-live-preview-card
              [name]="name()"
              [profession]="profession()"
              [city]="zone()"
              [whatsapp]="whatsappNumber()"
              [slug]="slug()"
              [maxRadius]="maxRadiusKm()"
            />
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminWorkerCreatePageComponent {
  readonly store = inject(AdminWorkerStore);
  private readonly router = inject(Router);

  readonly name = signal<string>('');
  readonly profession = signal<string>('Teknisi Spesialis AC & Listrik');
  readonly whatsappNumber = signal<string>('');
  readonly email = signal<string>('');
  readonly zone = signal<string>('Surabaya');
  readonly slug = signal<string>('');
  readonly basePrice = signal<number>(75000);
  readonly rateType = signal<'HOURLY' | 'UNIT'>('HOURLY');
  readonly maxRadiusKm = signal<number>(25);

  readonly copyFeedback = signal<string | null>(null);

  readonly isFormValid = computed<boolean>(() => {
    return (
      this.name().trim().length >= 3 &&
      this.whatsappNumber().trim().length >= 10 &&
      this.zone().trim().length > 0 &&
      this.slug().trim().length >= 2
    );
  });

  onNameChange(val: string): void {
    this.name.set(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    this.slug.set(autoSlug);
  }

  handleSubmitOnboarding(): void {
    if (!this.isFormValid()) return;

    const payload: AdminCreateWorkerPayload = {
      name: this.name().trim(),
      bio: this.profession().trim(),
      whatsapp_number: this.whatsappNumber().trim(),
      email: this.email().trim() || `${this.slug().trim()}@tuwaktu.internal`,
      zone: this.zone(),
      base_price: this.basePrice(),
      rate_type: this.rateType(),
      max_radius_km: this.maxRadiusKm(),
    };

    this.store.submitOnboarding(payload);
  }

  copyToClipboard(text: string, successMessage: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copyFeedback.set(successMessage);
      setTimeout(() => this.copyFeedback.set(null), 3000);
    }
  }

  getWhatsAppDispatchUrl(result: any): string {
    const rawNumber = result.account?.phone_number || '';
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const waNumber = cleanNumber.startsWith('0')
      ? '62' + cleanNumber.slice(1)
      : cleanNumber;
    const message = result.invitation_text ||
      `Halo ${result.worker?.name}, akun mitra Tuwaktu Anda telah aktif.\nNomor WA: ${result.account?.phone_number}\nPIN Awal: ${result.temporary_password}\nLogin di: https://tuwaktu.com/login`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  }

  handleResetForNextWorker(): void {
    this.store.newlyCreatedWorker.set(null);
    this.name.set('');
    this.whatsappNumber.set('');
    this.email.set('');
    this.slug.set('');
    this.copyFeedback.set(null);
  }

  handleFinishAndReturn(): void {
    this.store.newlyCreatedWorker.set(null);
    this.router.navigate(['/admin/workers']);
  }
}

