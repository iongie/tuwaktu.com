import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-manifesto-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-hero-canvas text-ink-on-dark p-space-xl rounded-xl shadow-md flex flex-col gap-space-md relative overflow-hidden border border-white/10">
      <div class="flex items-center gap-space-xs text-voltage-orange">
        <span class="material-symbols-outlined text-[20px]">shield</span>
        <span class="font-micro-uppercase text-micro-uppercase tracking-widest font-bold">
          DOKTRIN KEDAULATAN TUWAKTU
        </span>
      </div>

      <h3 class="font-heading-3 text-heading-3 text-ink-on-dark leading-snug font-bold">
        Disiplin Waktu Kedaulatan Pekerja
      </h3>

      <p class="font-body-default text-body-default text-inverse-primary/80 leading-relaxed">
        Tuwaktu tidak mengizinkan algoritma memaksakan back-to-back order tanpa jeda. Setiap pekerja independen berhak atas jam istirahat dan perlindungan stamina berkendara yang pantas. Jadwal yang Anda kunci di sini tidak akan bisa diterobos atau ditawar oleh sistem pemesanan.
      </p>

      <div class="pt-space-sm flex items-center gap-space-md">
        <div class="w-10 h-10 rounded-full bg-surface-elevated-dark flex items-center justify-center shrink-0 border border-white/10">
          <span class="material-symbols-outlined text-voltage-orange text-[20px]">lock_person</span>
        </div>
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-ink-on-dark font-bold">
            Bukan Karyawan Algoritma
          </span>
          <span class="font-caption text-caption text-inverse-primary/60">
            Kendalikan ritme Anda 100% mandiri
          </span>
        </div>
      </div>

      <!-- Ambient decorative corner graphic -->
      <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-voltage-orange/10 rounded-full blur-xl pointer-events-none"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleManifestoCardComponent {}
