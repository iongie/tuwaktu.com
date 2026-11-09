import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsCityMetric } from '../../../models/admin-analytics.model';

@Component({
  selector: 'app-admin-city-distribution-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-body-canvas border border-hairline-light rounded-[10px] p-6 flex flex-col justify-between shadow-none transition-all"
      data-testid="admin-city-distribution-card"
    >
      <!-- Header Kartu -->
      <div class="flex items-start justify-between gap-4 mb-5">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded bg-surface-highlight text-voltage-orange flex items-center justify-center shrink-0 border border-hairline-light"
          >
            <span class="material-symbols-outlined text-[18px]">location_city</span>
          </div>
          <div>
            <h2 class="font-heading-h3 text-[18px] font-bold text-ink-on-light">
              Sebaran Aktivitas Berdasarkan Wilayah
            </h2>
            <p class="font-body-default text-xs text-ink-secondary mt-0.5">
              Peta volume interaksi, pencarian jasa, dan kontak mitra per kota secara otomatis.
            </p>
          </div>
        </div>

        <span
          class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono-rate bg-surface-highlight text-ink-on-light border border-hairline-light shrink-0"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-whatsapp-green"></span>
          Geographic Insights
        </span>
      </div>

      <!-- Konten Daftar Kota -->
      @if (cities().length === 0) {
        <div
          class="py-10 px-4 rounded border border-dashed border-hairline-light bg-surface-highlight text-center flex flex-col items-center justify-center"
          data-testid="city-empty-state"
        >
          <div
            class="w-10 h-10 rounded bg-body-canvas border border-hairline-light text-ink-disabled flex items-center justify-center mb-2"
          >
            <span class="material-symbols-outlined text-[20px]">map</span>
          </div>
          <p class="text-xs font-bold text-ink-on-light">Belum Ada Data Wilayah</p>
          <p class="text-[11px] text-ink-secondary max-w-sm mt-1">
            Data wilayah akan otomatis diagregasikan saat pengunjung melakukan pencarian jasa atau membuka profil mitra dari berbagai kota.
          </p>
        </div>
      } @else {
        <div class="space-y-4" data-testid="city-list">
          @for (item of cities(); track item.city; let idx = $index) {
            <div class="space-y-1.5">
              <!-- Baris Atas: Nama Kota, Rincian, dan Angka -->
              <div class="flex items-center justify-between text-xs gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-5 h-5 rounded bg-surface-highlight border border-hairline-light text-[10px] font-mono-rate font-bold text-ink-on-light flex items-center justify-center shrink-0"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-ink-on-light truncate">
                    {{ item.city }}
                  </span>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <!-- Rincian Interaksi Ringkas -->
                  <div class="hidden md:flex items-center gap-2 text-[11px] text-ink-secondary font-mono-rate">
                    <span class="inline-flex items-center gap-1" title="Kunjungan Profil">
                      <span class="material-symbols-outlined text-[13px]">visibility</span>
                      {{ item.profile_views }}
                    </span>
                    <span class="text-hairline-light">|</span>
                    <span class="inline-flex items-center gap-1" title="Pencarian Jasa">
                      <span class="material-symbols-outlined text-[13px]">search</span>
                      {{ item.searches }}
                    </span>
                    <span class="text-hairline-light">|</span>
                    <span class="inline-flex items-center gap-1 text-whatsapp-green font-bold" title="Klik WhatsApp">
                      <span class="material-symbols-outlined text-[13px]">chat</span>
                      {{ item.whatsapp_clicks }}
                    </span>
                  </div>

                  <!-- Persentase & Total -->
                  <div class="flex items-center gap-1.5 text-right font-mono-rate">
                    <span class="font-bold text-ink-on-light text-[12px] tabular-nums">
                      {{ item.total_activity }}
                    </span>
                    <span class="text-[11px] text-ink-secondary">
                      ({{ item.percentage }}%)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Horizontal Progress Bar ala Stitch -->
              <div class="h-2 w-full bg-surface-highlight border border-hairline-light rounded overflow-hidden">
                <div
                  class="h-full bg-voltage-orange rounded transition-all duration-500 ease-out"
                  [style.width.%]="item.percentage"
                  role="progressbar"
                  [attr.aria-valuenow]="item.percentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminCityDistributionCardComponent {
  readonly cities = input<AdminAnalyticsCityMetric[]>([]);
}

