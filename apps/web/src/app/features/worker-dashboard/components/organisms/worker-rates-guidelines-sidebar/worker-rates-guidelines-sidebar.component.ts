import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatesManifestoCardComponent } from '../../molecules/rates-manifesto-card/rates-manifesto-card.component';
import { RatesPricingGuideComponent } from '../../molecules/rates-pricing-guide/rates-pricing-guide.component';

@Component({
  selector: 'app-worker-rates-guidelines-sidebar',
  standalone: true,
  imports: [CommonModule, RatesManifestoCardComponent, RatesPricingGuideComponent],
  template: `
    <aside class="space-y-6">
      <!-- 100% Sovereign Manifesto Card -->
      <app-rates-manifesto-card />

      <!-- Pricing Formula Guidelines Card -->
      <app-rates-pricing-guide />

      <!-- Verification Status Card -->
      <div class="bg-surface-warm-promo text-promo-ink rounded-xl p-5 shadow-xs space-y-2 border border-promo-ink/10">
        <div class="flex items-center gap-2 font-bold text-caption font-caption">
          <span class="material-symbols-outlined text-[18px]">verified_user</span>
          <span>STATUS VERIFIKASI KATALOG</span>
        </div>
        <p class="text-caption font-caption leading-relaxed">
          Semua perubahan harga akan langsung disesuaikan ke kalkulator otomatis pada formulir pemesanan WhatsApp publik Anda.
        </p>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerRatesGuidelinesSidebarComponent {}
