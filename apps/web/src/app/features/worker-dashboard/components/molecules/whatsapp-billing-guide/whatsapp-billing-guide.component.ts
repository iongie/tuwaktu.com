import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-billing-guide',
  standalone: true,
  template: `
    <section
      class="bg-surface-warm-promo p-6 rounded-xl shadow-xs text-promo-ink flex flex-col gap-4 border border-hairline-subtle"
    >
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-[22px]">lightbulb</span>
        <h3 class="font-heading-3 text-heading-3 font-semibold text-promo-ink">
          Tips Transaksi & Penagihan Bebas Komisi
        </h3>
      </div>
      <p class="font-body-default text-body-default leading-relaxed">
        Tuwaktu tidak memotong komisi dari pendapatan Anda. Saat menerima pesan pemesanan via WhatsApp:
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div class="flex items-start gap-2">
          <span class="font-mono-rate text-mono-rate font-bold text-voltage-orange">01.</span>
          <div class="flex flex-col">
            <span class="font-body-strong text-body-strong text-promo-ink">
              Konfirmasi Ketersediaan
            </span>
            <span class="font-caption text-caption opacity-90">
              Balas ramah dan pastikan slot waktu cocok dengan jadwal kerja Anda.
            </span>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-mono-rate text-mono-rate font-bold text-voltage-orange">02.</span>
          <div class="flex flex-col">
            <span class="font-body-strong text-body-strong text-promo-ink">
              Kirim Rekening Bank / QRIS Pribadi
            </span>
            <span class="font-caption text-caption opacity-90">
              Minta DP atau pembayaran langsung ke rekening pribadi Anda untuk konfirmasi pesanan.
            </span>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppBillingGuideComponent {}
