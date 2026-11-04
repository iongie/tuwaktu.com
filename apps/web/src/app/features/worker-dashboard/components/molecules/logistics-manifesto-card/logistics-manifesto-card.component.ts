import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logistics-manifesto-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-hero-canvas text-ink-on-dark rounded-xl p-6 shadow-md flex flex-col gap-4 relative overflow-hidden border border-white/10">
      <!-- Subtle background glowing SVG trace -->
      <div class="absolute -right-10 -bottom-10 w-44 h-44 opacity-10 pointer-events-none text-white">
        <svg fill="currentColor" viewBox="0 0 100 100" class="w-full h-full">
          <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" stroke-width="2"></circle>
          <circle cx="50" cy="50" fill="none" r="30" stroke="currentColor" stroke-width="2"></circle>
          <circle cx="50" cy="50" fill="none" r="15" stroke="currentColor" stroke-width="2"></circle>
        </svg>
      </div>

      <div class="flex items-center gap-2 text-voltage-orange">
        <span class="material-symbols-outlined text-[24px]">verified_user</span>
        <span class="font-micro-uppercase text-micro-uppercase tracking-widest font-bold">
          DOKTRIN KERJA MANDIRI
        </span>
      </div>

      <h3 class="font-heading-3 text-heading-3 text-on-primary font-bold">
        Proteksi Stamina &amp; Akurasi Waktu
      </h3>

      <p class="font-body-default text-body-default text-neutral-300 leading-relaxed">
        Kemacetan jalan bukan hanya membuang bensin, melainkan menguras fokus fisik sebelum pekerjaan lapangan dimulai. Dengan mengunci batasan {{ maxRadiusKm() | number:'1.1-1' }} km, Anda memastikan energi maksimal tercurah penuh pada kualitas pengerjaan, bukan habis di atas aspal.
      </p>

      <div class="flex items-center gap-4 pt-1 text-caption font-mono-rate text-neutral-400">
        <span class="flex items-center gap-1.5 text-white">
          <span class="material-symbols-outlined text-[16px] text-success">check_circle</span>
          <span>Nol Debat Ongkir</span>
        </span>
        <span class="flex items-center gap-1.5 text-white">
          <span class="material-symbols-outlined text-[16px] text-success">check_circle</span>
          <span>Tiba Tepat Waktu</span>
        </span>
      </div>
    </div>
  `,
})
export class LogisticsManifestoCardComponent {
  readonly maxRadiusKm = input<number>(5.0);
}
