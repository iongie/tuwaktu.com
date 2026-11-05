import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeaturedWorker } from '../../../models/home.model';

@Component({
  selector: 'app-home-worker-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article
      class="m3-card-outlined h-full flex flex-col justify-between p-space-xl bg-body-canvas hover:shadow-md transition-all group"
      [attr.aria-label]="'Kartu profil mitra ' + worker().name"
    >
      <div class="space-y-space-md">
        <!-- Header Kartu: Avatar, Nama, Status Ketersediaan & Badge Verifikasi -->
        <div class="flex items-start gap-space-md">
          <div class="relative shrink-0">
            <div
              class="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden border border-hairline-subtle"
            >
              @if (worker().avatarUrl) {
                <img
                  [src]="worker().avatarUrl"
                  [alt]="'Foto profil ' + worker().name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              } @else {
                <div
                  class="w-full h-full flex items-center justify-center font-bold text-heading-h3 text-on-surface-variant"
                >
                  {{ initials() }}
                </div>
              }
            </div>
            <span
              class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-success ring-2 ring-body-canvas"
              title="Status: Aktif Menerima Reservasi"
            ></span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-space-xs flex-wrap">
              <h3
                class="font-heading-h3 text-heading-h3 font-bold text-on-surface truncate tracking-tight"
              >
                {{ worker().name }}
              </h3>
              @if (worker().isVerified) {
                <span
                  class="material-symbols-outlined text-[18px] text-promo-ink"
                  title="Pekerja Terverifikasi KTP & Pangkalan"
                  aria-label="Terverifikasi"
                >
                  verified
                </span>
              }
            </div>

            <p class="font-caption text-caption text-ink-secondary truncate mt-0.5">
              {{ worker().specialty }}
            </p>

            <div class="flex items-center gap-space-xs mt-1 text-caption text-ink-secondary">
              <span class="material-symbols-outlined text-[15px] text-voltage-orange">
                star
              </span>
              <span class="font-bold text-on-surface">{{ worker().rating.toFixed(2) }}</span>
              <span class="text-ink-disabled">({{ worker().reviewCount }} ulasan)</span>
            </div>
          </div>
        </div>

        <!-- Pangkalan & Buffer Transit -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs p-space-sm bg-surface-container-low rounded-lg text-caption"
        >
          <div class="flex items-center gap-1.5 text-ink-secondary min-w-0">
            <span class="material-symbols-outlined text-[16px] text-ink-disabled shrink-0">
              pin_drop
            </span>
            <span class="truncate">{{ worker().basecampZone }}</span>
          </div>
          <div class="flex items-center gap-1 text-promo-ink font-semibold shrink-0">
            <span class="material-symbols-outlined text-[15px]">schedule</span>
            <span>Buffer {{ worker().bufferMinutes }}m</span>
          </div>
        </div>

        <!-- Tags Keahlian Spesifik -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          @for (tag of worker().specialtyTags; track tag) {
            <span
              class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-rate text-[11px] font-medium"
            >
              {{ tag }}
            </span>
          }
        </div>
      </div>

      <!-- Footer Kartu: Tarif Mulai & Tombol CTA Pesan Langsung -->
      <div
        class="mt-space-lg pt-space-md border-t border-hairline-subtle flex items-center justify-between gap-space-md"
      >
        <div class="space-y-0.5">
          <span class="font-micro-uppercase text-caption text-ink-disabled uppercase">
            Tarif Mulai dari
          </span>
          <p class="font-mono-rate text-heading-h3 font-bold text-on-surface">
            {{ formattedStartingPrice() }}
            <span class="text-caption font-normal text-ink-secondary">/ {{ worker().priceUnit }}</span>
          </p>
        </div>

        <a
          [routerLink]="['/', worker().slug]"
          class="m3-btn-whatsapp gap-space-xs text-caption font-bold shadow-sm hover:shadow group-hover:bg-whatsapp-green-hover"
          [attr.aria-label]="'Lihat jadwal dan pesan layanan dari ' + worker().name"
        >
          <span>Lihat Jadwal &amp; Pesan</span>
          <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </a>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeWorkerCardComponent {
  readonly worker = input.required<FeaturedWorker>();

  readonly initials = computed(() => {
    const name = this.worker().name.trim();
    if (!name) return 'TW';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  readonly formattedStartingPrice = computed(() => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(this.worker().startingPrice);
  });
}
