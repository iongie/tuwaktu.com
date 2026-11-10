import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-worker-service-live-preview-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- PREVIEW FRAME HEADER -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <span class="font-mono-rate text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
            SIMULASI REAL-TIME
          </span>
          <span class="inline-flex items-center gap-1 text-[11px] font-mono-rate font-bold text-whatsapp-green bg-whatsapp-surface px-2 py-0.5 rounded border border-whatsapp-green/20">
            <span class="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse"></span>
            Terkoneksi
          </span>
        </div>
        <p class="text-xs text-ink-secondary truncate">
          Tampilan di profil publik pemesanan klien
        </p>
      </div>

      <!-- WORKER SERVICE LIVE PREVIEW CARD COMPONENT -->
      <div class="rounded-[10px] overflow-hidden bg-body-canvas border border-hairline-light shadow-none flex flex-col">
        <!-- Mock Browser / Bar Top -->
        <div class="bg-surface-highlight px-3 py-2 border-b border-hairline-light flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-hairline-light"></div>
            <div class="w-2 h-2 rounded-full bg-hairline-light"></div>
            <div class="w-2 h-2 rounded-full bg-hairline-light"></div>
          </div>
          <span class="font-mono-rate text-[10px] text-ink-secondary font-bold uppercase tracking-wider">Katalog Pemesanan Klien</span>
          <span class="material-symbols-outlined text-ink-disabled text-[14px]">lock</span>
        </div>

        <!-- Preview Card Content Area -->
        <div class="p-5 flex flex-col gap-3.5">
          <!-- Top Badges -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[11px] font-bold font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light px-2.5 py-0.5 rounded truncate max-w-[180px]">
              {{ categoryName() || 'Keahlian Umum' }}
            </span>
            @if (status() === 'ACTIVE') {
              <span class="text-[10px] font-mono-rate font-bold uppercase tracking-widest bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse"></span>
                Aktif Terbit
              </span>
            } @else {
              <span class="text-[10px] font-mono-rate font-bold uppercase tracking-widest bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                Draf Pribadi
              </span>
            }
          </div>

          <!-- Service Title -->
          <div class="flex flex-col gap-0.5">
            <h3 class="text-base font-bold text-ink-on-light font-sans leading-snug line-clamp-2">
              {{ name() || 'Nama Layanan Belum Diisi' }}
            </h3>
            <span class="text-xs text-ink-secondary font-sans">Dikerjakan langsung oleh teknisi mandiri</span>
          </div>

          <!-- Synchronized Description -->
          <p class="text-xs text-ink-secondary line-clamp-3 leading-relaxed font-sans">
            {{ description() || 'Deskripsi rincian tugas dan perlengkapan kerja yang akan disediakan.' }}
          </p>

          <!-- Feature & Attribute Pills -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span class="inline-flex items-center gap-1 text-[11px] font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light px-2 py-0.5 rounded">
              <span class="material-symbols-outlined text-[13px] text-ink-secondary">schedule</span>
              ~{{ durationMinutes() || 60 }} Menit
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light px-2 py-0.5 rounded">
              <span class="material-symbols-outlined text-[13px] text-whatsapp-green">verified</span>
              Garansi Mandiri
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] font-mono-rate bg-surface-highlight border border-hairline-light text-ink-on-light px-2 py-0.5 rounded">
              <span class="material-symbols-outlined text-[13px] text-voltage-orange">handyman</span>
              Alat Mandiri
            </span>
          </div>

          <!-- Price & Action Box -->
          <div class="mt-2 p-3 bg-surface-highlight border border-hairline-light rounded-[10px] flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[10px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">TARIF JASA</span>
              <div class="flex items-baseline gap-1 mt-0.5 font-mono-rate">
                <span class="text-xs font-bold text-ink-secondary">Rp</span>
                <span class="text-lg font-bold text-ink-on-light tabular-nums">
                  {{ formattedPrice() }}
                </span>
                <span class="text-[11px] text-ink-secondary">
                  {{ rateType() === 'HOURLY' ? '/ jam' : '/ paket' }}
                </span>
              </div>
            </div>
            <!-- Simulated CTA button -->
            <div class="h-8 px-3 bg-hero-canvas text-ink-on-dark rounded text-xs font-mono-rate font-bold flex items-center gap-1.5 select-none pointer-events-none">
              <span class="material-symbols-outlined text-[15px] text-voltage-orange">radio_button_checked</span>
              <span>Pilih Layanan</span>
            </div>
          </div>

          <div class="flex items-center justify-center gap-1.5 text-[11px] text-ink-secondary pt-1 font-mono-rate">
            <span class="material-symbols-outlined text-[14px] text-whatsapp-green">chat</span>
            <span>Klien melanjutkan ke konfirmasi WhatsApp otomatis</span>
          </div>
        </div>
      </div>

      <!-- KOTAK EDUKASI KEDAULATAN & TRANSPARANSI MITRA -->
      <div class="p-5 rounded-[10px] bg-surface-highlight border border-hairline-light flex flex-col gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded bg-body-canvas border border-hairline-light flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[18px] text-voltage-orange">shield</span>
          </div>
          <div class="flex flex-col">
            <h4 class="font-bold text-xs text-ink-on-light font-mono-rate uppercase tracking-wider">Prinsip 0% Komisi Tuwaktu</h4>
            <span class="text-[10px] text-ink-secondary font-mono-rate">Kedaulatan Pekerja Mandiri</span>
          </div>
        </div>

        <div class="flex flex-col gap-2 text-xs text-ink-secondary leading-relaxed font-sans">
          <div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] text-voltage-orange shrink-0 mt-0.5">check_circle</span>
            <p>
              <strong class="text-ink-on-light font-medium">100% Nominal Tarif adalah Hak Anda.</strong> Uang jasa langsung dibayarkan klien ke rekening pribadi Anda tanpa penahanan saldo sistem.
            </p>
          </div>
          <div class="flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] text-voltage-orange shrink-0 mt-0.5">check_circle</span>
            <p>
              <strong class="text-ink-on-light font-medium">Transparansi Mutlak Tanpa Mark-up.</strong> Tidak ada biaya platform siluman yang dibebankan kepada pelanggan Anda.
            </p>
          </div>
        </div>

        <div class="pt-2 border-t border-hairline-light flex items-center justify-between text-[11px] font-mono-rate text-ink-secondary">
          <span>Protokol v2.4-SOVEREIGN</span>
          <span class="font-bold text-voltage-orange">Tuwaktu Pro</span>
        </div>
      </div>
    </div>
  `,
})
export class WorkerServiceLivePreviewCardComponent {
  readonly name = input<string>('');
  readonly categoryName = input<string>('');
  readonly rateType = input<'HOURLY' | 'UNIT'>('HOURLY');
  readonly price = input<number>(0);
  readonly durationMinutes = input<number>(60);
  readonly description = input<string>('');
  readonly status = input<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  readonly formattedPrice = computed<string>(() => {
    const val = Number(this.price()) || 0;
    return val.toLocaleString('id-ID');
  });
}
