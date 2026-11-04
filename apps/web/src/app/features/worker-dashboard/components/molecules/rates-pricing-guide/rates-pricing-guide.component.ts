import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rates-pricing-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface-container-lowest rounded-xl shadow-xs p-6 space-y-4 border border-hairline-subtle">
      <!-- Card Header -->
      <div class="flex items-center gap-2 text-caption font-caption text-secondary font-bold">
        <span class="material-symbols-outlined text-[18px]">lightbulb</span>
        <span>PANDUAN KEDAULATAN TARIF</span>
      </div>

      <h4 class="font-heading-3 text-heading-3 text-on-surface font-bold">
        Formula Menentukan Tarif
      </h4>

      <div class="space-y-3 text-caption font-caption">
        <div class="p-3 rounded-lg bg-surface-container-low space-y-1">
          <span class="font-body-strong text-body-strong text-on-surface block">
            1. Model Per Jam (Hourly)
          </span>
          <p class="text-ink-secondary leading-relaxed">
            Ideal untuk pekerjaan tak terduga (deep clean, pasca-renovasi). Selalu tetapkan <strong>Minimum Jam</strong> (misal 2.0 jam) agar waktu perjalanan Anda tetap menguntungkan secara matematis.
          </p>
        </div>

        <div class="p-3 rounded-lg bg-surface-container-low space-y-1">
          <span class="font-body-strong text-body-strong text-on-surface block">
            2. Model Sesi / Unit Flat
          </span>
          <p class="text-ink-secondary leading-relaxed">
            Paling digemari klien yang ingin kepastian total biaya (misal studio/apartemen). Pastikan Anda memberikan <strong>batasan durasi maksimal</strong> agar tenaga tidak terkuras melebihi valuasi jasa.
          </p>
        </div>

        <div class="p-3 rounded-lg bg-surface-container-low space-y-1">
          <span class="font-body-strong text-body-strong text-on-surface block">
            3. Biaya Bahan Kimia & Peralatan
          </span>
          <p class="text-ink-secondary leading-relaxed">
            Tambahkan estimasi depresiasi mesin & pembelian cairan pembersih sekitar <strong>Rp 15.000 - Rp 25.000 per sesi</strong> ke dalam dasar kalkulasi tarif Anda.
          </p>
        </div>
      </div>

      <div class="pt-1">
        <a
          href="javascript:void(0)"
          class="inline-flex items-center gap-1.5 text-button-label font-button-label text-accent-link hover:underline min-h-[44px]"
        >
          <span>Baca panduan penetapan harga profesional</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesPricingGuideComponent {}
