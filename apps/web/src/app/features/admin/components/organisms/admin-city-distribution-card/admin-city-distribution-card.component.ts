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
      class="bg-surface-container-low border border-hairline-subtle rounded-2xl p-space-lg md:p-space-xl flex flex-col justify-between shadow-xs transition-all"
      data-testid="admin-city-distribution-card"
    >
      <!-- Header Kartu -->
      <div class="flex items-start justify-between gap-space-md mb-space-lg">
        <div class="flex items-center gap-space-sm">
          <div
            class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20"
          >
            <span class="material-symbols-outlined text-[20px]">location_city</span>
          </div>
          <div>
            <h2 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
              Sebaran Aktivitas Berdasarkan Wilayah
            </h2>
            <p class="font-body-default text-caption text-ink-secondary mt-0.5">
              Peta volume interaksi, pencarian jasa, dan kontak mitra per kota secara otomatis.
            </p>
          </div>
        </div>

        <span
          class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant border border-hairline-subtle shrink-0"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Geographic Insights
        </span>
      </div>

      <!-- Konten Daftar Kota -->
      @if (cities().length === 0) {
        <div
          class="py-12 px-4 rounded-xl border border-dashed border-hairline-subtle text-center flex flex-col items-center justify-center"
          data-testid="city-empty-state"
        >
          <div
            class="w-12 h-12 rounded-full bg-surface-container-high text-ink-disabled flex items-center justify-center mb-3"
          >
            <span class="material-symbols-outlined text-[24px]">map</span>
          </div>
          <p class="text-caption font-bold text-on-surface">Belum Ada Data Wilayah</p>
          <p class="text-[12px] text-ink-secondary max-w-sm mt-1">
            Data wilayah akan otomatis diagregasikan saat pengunjung melakukan pencarian jasa atau membuka profil mitra dari berbagai kota.
          </p>
        </div>
      } @else {
        <div class="space-y-4" data-testid="city-list">
          @for (item of cities(); track item.city; let idx = $index) {
            <div class="space-y-1.5">
              <!-- Baris Atas: Nama Kota, Rincian, dan Angka -->
              <div class="flex items-center justify-between text-caption gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-5 h-5 rounded-md bg-surface-container-high text-[11px] font-mono-rate font-bold text-on-surface-variant flex items-center justify-center shrink-0"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="font-bold text-on-surface truncate">
                    {{ item.city }}
                  </span>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <!-- Rincian Interaksi Ringkas -->
                  <div class="hidden md:flex items-center gap-2 text-[11px] text-ink-secondary">
                    <span class="inline-flex items-center gap-1" title="Kunjungan Profil">
                      <span class="material-symbols-outlined text-[13px]">visibility</span>
                      {{ item.profile_views }}
                    </span>
                    <span class="text-hairline-subtle">|</span>
                    <span class="inline-flex items-center gap-1" title="Pencarian Jasa">
                      <span class="material-symbols-outlined text-[13px]">search</span>
                      {{ item.searches }}
                    </span>
                    <span class="text-hairline-subtle">|</span>
                    <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold" title="Klik WhatsApp">
                      <span class="material-symbols-outlined text-[13px]">chat</span>
                      {{ item.whatsapp_clicks }}
                    </span>
                  </div>

                  <!-- Persentase & Total -->
                  <div class="flex items-center gap-1.5 text-right font-mono-rate">
                    <span class="font-bold text-on-surface text-[13px]">
                      {{ item.total_activity }}
                    </span>
                    <span class="text-[11px] text-ink-secondary">
                      ({{ item.percentage }}%)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Horizontal Progress Bar ala Umami -->
              <div class="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  class="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-500 ease-out"
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

