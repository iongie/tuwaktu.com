import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';

@Component({
  selector: 'app-technician-profile-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="w-full bg-[#121212] text-white relative overflow-hidden border-b border-white/10">
      <!-- Subtle architectural noise/grid layer from Stitch -->
      <div class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <!-- Left Hero Stream: Identity, Proof & Direct Profile Wire (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex items-start sm:items-center gap-5">
              <div class="relative shrink-0">
                @if (workerProfile().avatar_url) {
                  <img
                    [src]="workerProfile().avatar_url"
                    [alt]="'Foto profil ' + workerProfile().name"
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl border-2 border-white/20 bg-white/10"
                  />
                } @else {
                  <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white/80 font-mono font-bold text-2xl">
                    {{ (workerProfile().name || 'TW').substring(0, 2).toUpperCase() }}
                  </div>
                }
                <span
                  class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#008850] ring-4 ring-[#121212]"
                  title="Status: Aktif Menerima Reservasi"
                ></span>
              </div>

              <div class="space-y-1.5 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                    {{ workerProfile().name }}
                  </h1>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4eedf] text-[#6f5b37] font-mono text-[11px] font-bold uppercase tracking-wider"
                  >
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    VERIFIED PRO
                  </span>
                </div>

                <p class="text-sm sm:text-base text-white/80 font-medium">
                  {{ workerProfile().bio || 'Penyedia Layanan Mandiri Terverifikasi Tuwaktu' }}
                </p>

                <div class="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-white/70">
                  <span class="flex items-center gap-1">
                    <span class="text-[#ff5500] font-bold text-sm">&#9733;</span>
                    <strong class="text-white">{{ workerProfile().rating || '5.0' }}</strong>
                    <span class="text-white/60">({{ workerProfile().review_count || 0 }} ulasan terverifikasi)</span>
                  </span>
                  <span class="text-white/30">•</span>
                  <span class="flex items-center gap-1 text-white/80">
                    <svg class="w-3.5 h-3.5 text-white/60 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>Pangkalan:</span>
                    <strong class="text-white">{{ workerProfile().zone }}</strong>
                  </span>
                  @if (formattedRate(); as rateText) {
                    <span class="text-white/30">•</span>
                    <span class="text-white/80">
                      Tarif Dasar: <strong class="font-bold text-[#ff5500]">{{ rateText }}</strong>
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Quick Copy Public Mandiri Wire -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div class="flex items-center justify-between gap-2 px-3.5 py-2 bg-[#303030] rounded-lg shadow-inner max-w-md w-full border border-white/10">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-[#ff5500] text-xs font-mono font-bold">&#128279;</span>
                  <span class="font-mono text-xs text-white/90 truncate select-all" id="profileUrl">
                    tuwaktu.com/{{ workerProfile().slug }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="copyLinkToClipboard()"
                  class="shrink-0 px-2.5 py-1 bg-white hover:bg-gray-100 text-[#121212] font-mono text-[10px] uppercase font-bold rounded transition-colors cursor-pointer"
                >
                  {{ isCopied() ? 'Tersalin!' : 'Salin Tautan' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right Hero Stream: Telemetry & Discipline Rules Cards (5 cols) -->
          <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <div class="p-3.5 bg-[#303030] rounded-lg shadow-md flex items-center justify-between border border-white/5">
              <div class="space-y-0.5">
                <span class="font-mono text-[10px] text-white/50 uppercase tracking-wider block">Batas Jangkauan Maksimal</span>
                <span class="font-bold text-xs sm:text-sm text-white">{{ workerProfile().max_radius_km || 10 }} Kilometer Radius</span>
              </div>
              <span class="px-2 py-1 rounded bg-[#121212] text-white/70 font-mono text-[11px] font-bold">RAD-MAX</span>
            </div>

            <div class="p-3.5 bg-[#303030] rounded-lg shadow-md flex items-center justify-between border border-white/5">
              <div class="space-y-0.5">
                <span class="font-mono text-[10px] text-white/50 uppercase tracking-wider block">Buffer Transit Wajib</span>
                <span class="font-bold text-xs sm:text-sm text-white">90 Menit Tiap Sesi</span>
              </div>
              <span class="px-2 py-1 rounded bg-[#ff5500]/20 text-[#ff5500] font-mono text-[11px] font-bold">BUFFER 90M</span>
            </div>

            <div class="p-3.5 bg-[#303030] rounded-lg shadow-md flex items-center justify-between border border-white/5">
              <div class="space-y-0.5">
                <span class="font-mono text-[10px] text-white/50 uppercase tracking-wider block">Respon WhatsApp Mandiri</span>
                <span class="font-bold text-xs sm:text-sm text-white">&lt; 15 Menit Rata-rata</span>
              </div>
              <span class="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">SIAP DISPATCH</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class TechnicianProfileHeaderComponent {
  readonly workerProfile = input.required<PublicTechnicianProfile>();
  readonly isCopied = signal<boolean>(false);

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
        setTimeout(() => this.isCopied.set(false), 2000);
      }).catch(() => {});
    }
  }
}
