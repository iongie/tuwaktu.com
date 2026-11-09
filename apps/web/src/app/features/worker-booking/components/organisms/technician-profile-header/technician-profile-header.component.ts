import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { resolveAvatarUrl } from '../../../../../core/utils/avatar-url.util';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';
import { AuthService } from '../../../../auth/services/auth.service';

@Component({
  selector: 'app-technician-profile-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="w-full bg-hero-canvas text-ink-on-dark relative overflow-hidden border-b border-white/10">
      <!-- Subtle architectural noise/grid layer from Stitch -->
      <div class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div class="max-w-7xl mx-auto px-margin-desktop py-space-3xl relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-2xl items-center">
          <!-- Left Hero Stream: Identity, Proof & Direct Profile Wire (7 cols) -->
          <div class="lg:col-span-7 space-y-space-xl">
            <div class="flex items-start sm:items-center gap-space-lg">
              <div class="relative shrink-0">
                @if (resolvedAvatarUrl() && !isAvatarBroken()) {
                  <img
                    [src]="resolvedAvatarUrl()"
                    [alt]="'Foto profil ' + workerProfile().name"
                    (error)="isAvatarBroken.set(true)"
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl"
                  />
                } @else {
                  <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-elevated-dark flex items-center justify-center text-ink-on-dark font-mono font-bold text-2xl shadow-xl">
                    {{ (workerProfile().name || 'TW').substring(0, 2).toUpperCase() }}
                  </div>
                }
                <span
                  class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success ring-4 ring-hero-canvas"
                  title="Status: Aktif Menerima Reservasi"
                ></span>
              </div>

              <div class="space-y-space-xs min-w-0">
                <div class="flex flex-wrap items-center gap-space-xs">
                  <span class="font-heading-h1 text-heading-h1 font-bold tracking-tight text-ink-on-dark truncate">
                    {{ workerProfile().name }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-warm-promo text-promo-ink font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider">
                    <span class="material-symbols-outlined text-[12px] font-bold">verified</span> VERIFIED PRO
                  </span>
                </div>

                <p class="font-lead-body text-lead-body text-ink-secondary text-surface-highlight font-medium">
                  {{ workerProfile().bio || 'Penyedia Layanan Mandiri Terverifikasi Tuwaktu' }}
                </p>

                <div class="flex flex-wrap items-center gap-space-md pt-1 font-caption text-caption text-surface-variant">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-voltage-orange" style="font-variation-settings: 'FILL' 1;">star</span>
                    <strong class="font-body-strong text-body-strong text-ink-on-dark">{{ workerProfile().rating || '4.9' }}</strong>
                    ({{ workerProfile().review_count || 0 }} ulasan terverifikasi)
                  </span>
                  <span class="text-ink-disabled">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-surface-variant">location_on</span>
                    Pangkalan: {{ workerProfile().zone }}
                  </span>
                  @if (formattedRate(); as rateText) {
                    <span class="text-ink-disabled">•</span>
                    <span class="flex items-center gap-1">
                      Tarif Mulai: <strong class="font-body-strong text-voltage-orange">{{ rateText }}</strong>
                    </span>
                  } @else {
                    <span class="text-ink-disabled">•</span>
                    <span class="flex items-center gap-1 text-ink-disabled">
                      <strong class="font-body-strong text-ink-disabled italic">Belum Menentukan Layanan</strong>
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Quick Copy Public Mandiri Wire -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm pt-space-xs">
              <div class="flex items-center justify-between gap-space-sm px-space-md py-2 bg-surface-elevated-dark rounded shadow-inner max-w-md w-full">
                <div class="flex items-center gap-space-xs min-w-0">
                  <span class="material-symbols-outlined text-[16px] text-voltage-orange">link</span>
                  <span class="font-mono-rate text-mono-rate text-surface-variant truncate select-all" id="profileUrl">
                    tuwaktu.com/{{ workerProfile().slug }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="copyLinkToClipboard()"
                  class="shrink-0 px-space-sm py-1 bg-surface-container-high hover:bg-surface-highlight text-ink-on-light font-micro-uppercase text-micro-uppercase uppercase font-bold rounded transition-colors cursor-pointer"
                  [class.bg-whatsapp-surface]="isCopied()"
                  [class.text-whatsapp-ink]="isCopied()"
                  id="copyBtn"
                >
                  {{ isCopied() ? 'TERSALIN' : 'Salin Tautan' }}
                </button>
              </div>
              <button
                type="button"
                (click)="shareProfile()"
                class="px-space-md py-2 bg-surface-elevated-dark hover:bg-surface-container-high text-surface-bright font-button-label text-button-label rounded transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                title="Bagikan Tautan Profil Mandiri"
              >
                <span class="material-symbols-outlined text-[16px]">share</span>
                <span>Bagikan</span>
              </button>
              @if (authService.isLoggedIn()) {
                <a
                  routerLink="/dashboard"
                  class="px-space-md py-2 bg-voltage-orange/20 hover:bg-voltage-orange/30 text-voltage-orange font-button-label text-button-label rounded transition-colors flex items-center justify-center gap-1 shrink-0 min-h-[44px] cursor-pointer"
                  title="Buka Dasbor Kerja Anda"
                  id="heroDashboardBtn"
                >
                  <span class="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Kelola di Dasbor</span>
                </a>
              }
            </div>
          </div>

          <!-- Right Hero Stream: Telemetry & Discipline Rules Cards (5 cols) -->
          <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-space-sm">
            <div class="p-space-md bg-surface-elevated-dark rounded shadow-md flex items-center justify-between">
              <div class="space-y-0.5">
                <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled uppercase tracking-wider block">Batas Jangkauan Maksimal</span>
                <span class="font-body-strong text-body-strong text-ink-on-dark">{{ workerProfile().max_radius_km || 5.0 }} Kilometer Radius</span>
              </div>
              <span class="px-space-xs py-1 rounded bg-hero-canvas text-surface-variant font-mono-rate text-mono-rate">RAD-MAX</span>
            </div>

            <div class="p-space-md bg-surface-elevated-dark rounded shadow-md flex items-center justify-between">
              <div class="space-y-0.5">
                <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled uppercase tracking-wider block">Buffer Transit Wajib</span>
                <span class="font-body-strong text-body-strong text-ink-on-dark">90 Menit Tiap Sesi</span>
              </div>
              <span class="px-space-xs py-1 rounded bg-voltage-orange/20 text-voltage-orange font-mono-rate text-mono-rate">BUFFER 90M</span>
            </div>

            <div class="p-space-md bg-surface-elevated-dark rounded shadow-md flex items-center justify-between">
              <div class="space-y-0.5">
                <span class="font-micro-uppercase text-micro-uppercase text-ink-disabled uppercase tracking-wider block">Respon WhatsApp Mandiri</span>
                <span class="font-body-strong text-body-strong text-ink-on-dark">&lt; 15 Menit Rata-rata</span>
              </div>
              <span class="material-symbols-outlined text-[20px] text-whatsapp-surface">chat_bubble</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stitch Notification Toast Modal Scrim -->
      <div
        id="toastNotification"
        role="status"
        aria-live="polite"
        class="fixed bottom-6 right-6 z-50 bg-hero-canvas text-ink-on-dark px-space-lg py-space-md rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-space-md pointer-events-none"
        [class.translate-y-0]="isCopied()"
        [class.opacity-100]="isCopied()"
        [class.translate-y-24]="!isCopied()"
        [class.opacity-0]="!isCopied()"
      >
        <span class="material-symbols-outlined text-success text-[20px]" id="toastIcon">check_circle</span>
        <span class="font-body-default text-body-default font-medium" id="toastMessage">
          Tautan profil {{ workerProfile().name }} berhasil disalin!
        </span>
      </div>
    </article>
  `,
})
export class TechnicianProfileHeaderComponent {
  readonly authService = inject(AuthService);
  readonly workerProfile = input.required<PublicTechnicianProfile>();
  readonly isCopied = signal<boolean>(false);
  readonly isAvatarBroken = signal<boolean>(false);

  readonly resolvedAvatarUrl = computed(() => {
    return resolveAvatarUrl(this.workerProfile().avatar_url);
  });

  readonly formattedRate = computed(() => {
    const profile = this.workerProfile();
    let price = profile.base_price;
    let rateType = profile.rate_type;

    if (!price || price <= 0 || Number.isNaN(price)) {
      if (profile.services && profile.services.length > 0) {
        price = profile.services[0].base_price || profile.services[0].price;
        rateType = profile.services[0].rate_type || 'HOURLY';
      }
    }

    if (!price || price <= 0 || Number.isNaN(price)) {
      return null;
    }

    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price);

    const unitLabel = (rateType || '').toUpperCase() === 'UNIT' ? 'Sesi' : 'Jam';
    return `${formattedPrice} / ${unitLabel}`;
  });

  copyLinkToClipboard(): void {
    const profile = this.workerProfile();
    const url = `https://tuwaktu.com/${profile.slug}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2500);
      }).catch(() => {
        this.isCopied.set(false);
      });
    }
  }

  shareProfile(): void {
    const profile = this.workerProfile();
    const url = `https://tuwaktu.com/${profile.slug}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({
        title: `Pesan Layanan dari ${profile.name} di Tuwaktu`,
        text: profile.bio || `Pesan layanan langsung tanpa perantara komisi dari ${profile.name}`,
        url,
      }).catch(() => {
        this.copyLinkToClipboard();
      });
    } else {
      this.copyLinkToClipboard();
    }
  }
}
