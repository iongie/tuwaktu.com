import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rates-manifesto-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-hero-canvas text-on-primary rounded-xl p-6 shadow-xl space-y-4">
      <!-- Card Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-micro-uppercase font-micro-uppercase text-secondary tracking-widest font-bold">
          <span class="material-symbols-outlined text-[16px] text-voltage-orange">shield</span>
          <span>PRINSIP TUWAKTU</span>
        </div>
        <span class="text-caption font-caption text-ink-disabled font-mono-rate">MANIFESTO</span>
      </div>

      <h3 class="font-heading-3 text-heading-3 font-bold leading-snug text-white">
        100% Tarif Milik Anda. Nol Potongan Komisi.
      </h3>

      <p class="font-body-default text-body-default text-surface-variant leading-relaxed">
        Platform lain memotong 20 hingga 30% dari jerih payah Anda. Di Tuwaktu, setiap rupiah yang dibayarkan klien mengalir utuh langsung ke rekening atau e-wallet Anda tanpa perantara.
      </p>

      <div class="p-3 bg-surface-elevated-dark rounded-lg flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-voltage-orange/20 text-voltage-orange flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[20px]">account_balance_wallet</span>
        </div>
        <div class="text-caption font-caption">
          <span class="block text-surface-bright font-bold">Transparansi Finansial Mutlak</span>
          <span class="text-ink-disabled">Klien membayar tarif murni + ongkir langsung ke Anda.</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesManifestoCardComponent {}
