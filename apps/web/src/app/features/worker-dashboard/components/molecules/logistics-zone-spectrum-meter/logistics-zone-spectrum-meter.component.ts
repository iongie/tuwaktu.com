import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logistics-zone-spectrum-meter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-5 border border-hairline-subtle">
      <!-- Title & Scale Telemetry -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">radar</span>
          <h2 class="font-heading-3 text-heading-3 text-primary font-semibold">Visualisasi Zona Operasi</h2>
        </div>
        <span class="font-mono-rate text-caption text-ink-secondary">
          TOTAL SPAN: 0 - {{ baseScale() }} KM
        </span>
      </div>

      <!-- 3-Segment Custom Spectrum Meter -->
      <div class="flex flex-col gap-2">
        <div class="w-full h-5 rounded-full overflow-hidden flex bg-surface-container-high shadow-inner">
          <!-- Zone 1: Free -->
          <div
            class="h-full bg-success flex items-center justify-center transition-all duration-300"
            [style.width.%]="pctFree()"
          >
            <span class="font-micro-uppercase text-micro-uppercase text-on-primary font-bold hidden sm:inline">
              GRATIS
            </span>
          </div>
          <!-- Zone 2: Paid -->
          <div
            class="h-full bg-warning flex items-center justify-center transition-all duration-300"
            [style.width.%]="pctPaid()"
          >
            <span class="font-micro-uppercase text-micro-uppercase text-on-primary font-bold hidden sm:inline">
              +TARIF
            </span>
          </div>
          <!-- Zone 3: Rejected -->
          <div
            class="h-full bg-error flex items-center justify-center transition-all duration-300"
            [style.width.%]="pctReject()"
          >
            <span class="font-micro-uppercase text-micro-uppercase text-on-primary font-bold hidden sm:inline">
              BLOKIR
            </span>
          </div>
        </div>

        <!-- Axis Marks -->
        <div class="flex justify-between font-mono-rate text-caption text-ink-secondary px-1">
          <span>0.0 Km</span>
          <span>{{ freeRadiusKm() | number:'1.1-1' }} Km</span>
          <span>{{ maxRadiusKm() | number:'1.1-1' }} Km</span>
          <span>&gt; {{ maxRadiusKm() | number:'1.1-1' }} Km</span>
        </div>
      </div>

      <!-- Spectrum Legend Cards -->
      <div class="flex flex-col gap-2">
        <!-- Zone 1 Indicator -->
        <div class="flex items-center justify-between p-3 bg-success-surface rounded-lg border border-success/10">
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full bg-success shrink-0"></div>
            <div class="flex flex-col">
              <span class="font-body-strong text-body-strong text-success font-semibold">
                Zona 1 (0.0 - {{ freeRadiusKm() | number:'1.1-1' }} Km)
              </span>
              <span class="font-caption text-caption text-emerald-800">
                Bebas Ongkir • Termasuk biaya paket jasa
              </span>
            </div>
          </div>
          <span class="font-mono-rate text-mono-rate text-success font-bold shrink-0">
            Rp 0
          </span>
        </div>

        <!-- Zone 2 Indicator -->
        <div class="flex items-center justify-between p-3 bg-warning-surface rounded-lg border border-warning/15">
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full bg-warning shrink-0"></div>
            <div class="flex flex-col">
              <span class="font-body-strong text-body-strong text-promo-ink font-semibold">
                Zona 2 ({{ freeRadiusKm() | number:'1.1-1' }} - {{ maxRadiusKm() | number:'1.1-1' }} Km)
              </span>
              <span class="font-caption text-caption text-promo-ink">
                Surcharge Jalan Transparan
              </span>
            </div>
          </div>
          <span class="font-mono-rate text-mono-rate text-promo-ink font-bold shrink-0">
            +Rp {{ formattedExtraFee() }}/km
          </span>
        </div>

        <!-- Zone 3 Indicator -->
        <div class="flex items-center justify-between p-3 bg-error-surface rounded-lg border border-error/15">
          <div class="flex items-center gap-2.5">
            <div class="w-3 h-3 rounded-full bg-error shrink-0"></div>
            <div class="flex flex-col">
              <span class="font-body-strong text-body-strong text-error-dark font-semibold">
                Zona 3 (&gt; {{ maxRadiusKm() | number:'1.1-1' }} Km)
              </span>
              <span class="font-caption text-caption text-error-dark">
                Proteksi Stamina Fisik
              </span>
            </div>
          </div>
          <span class="font-mono-rate text-mono-rate text-error-dark font-bold shrink-0">
            Ditolak Otomatis
          </span>
        </div>
      </div>

      <!-- Real World Encompassed Neighborhoods -->
      <div class="flex flex-col gap-2 pt-2 border-t border-hairline-subtle">
        <span class="font-caption text-caption text-ink-secondary uppercase tracking-wider font-semibold">
          Cakupan Area Relevan dari {{ basecampZone() }}:
        </span>
        <div class="flex flex-wrap gap-1.5 pt-1">
          @for (neighborhood of relevantAreas(); track neighborhood) {
            <span class="px-3 py-1 rounded bg-surface-highlight text-primary font-caption text-caption border border-hairline-light/50">
              {{ neighborhood }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
})
export class LogisticsZoneSpectrumMeterComponent {
  readonly freeRadiusKm = input<number>(3.0);
  readonly maxRadiusKm = input<number>(5.0);
  readonly extraFeePerKm = input<number>(3000);
  readonly basecampZone = input<string>('Tebet');

  readonly formattedExtraFee = computed(() => {
    return new Intl.NumberFormat('id-ID').format(this.extraFeePerKm());
  });

  readonly baseScale = computed(() => Math.max(Math.ceil(this.maxRadiusKm()) + 3, 8));

  readonly pctFree = computed(() => {
    const scale = this.baseScale();
    const free = Math.max(0, this.freeRadiusKm());
    return Math.min(Math.max(Math.round((free / scale) * 100), 10), 65);
  });

  readonly pctPaid = computed(() => {
    const scale = this.baseScale();
    const paidDist = Math.max(0, this.maxRadiusKm() - this.freeRadiusKm());
    return Math.min(Math.max(Math.round((paidDist / scale) * 100), 10), 75 - this.pctFree());
  });

  readonly pctReject = computed(() => {
    return Math.max(10, 100 - this.pctFree() - this.pctPaid());
  });

  readonly relevantAreas = computed(() => {
    const zone = this.basecampZone().toLowerCase();
    if (zone.includes('selatan') || zone.includes('tebet')) {
      return [
        'Tebet Barat & Timur',
        'Pancoran',
        'Manggarai',
        'Bukit Duri',
        'Casablanca',
        'Kuningan Timur',
        'Senopati (Zona 2)',
      ];
    }
    if (zone.includes('tangerang') || zone.includes('tangsel') || zone.includes('bintaro')) {
      return [
        'Bintaro Sektor 1 - 9',
        'Pondok Ranji',
        'Ciputat Timur',
        'Rempoa',
        'BSD Sektor Timur',
        'Pondok Indah (Zona 2)',
      ];
    }
    return [
      `${this.basecampZone()} Inti`,
      'Pusat Aktivitas Sektor 1',
      'Area Sekitar 3 Km',
      'Koridor Utama Jalur Cepat',
      'Kawasan Perbatasan (Zona 2)',
    ];
  });
}
