import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-order-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="orderModalTitle"
    >
      <div
        class="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle"
      >
        <div class="flex items-center justify-between pb-4 border-b border-hairline-subtle">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div>
              <h3 id="orderModalTitle" class="font-heading-3 text-heading-3 text-primary font-bold">
                Rincian Pesanan Terjadwal
              </h3>
              <p class="font-caption text-caption text-ink-secondary">
                Informasi detail pemesanan klien dan rute logistik
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="p-2 text-ink-secondary hover:text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup Rincian Order"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        @if (orderId() === 'order-dimas') {
          <div class="space-y-4">
            <div class="p-3 bg-surface-highlight rounded-xl border border-hairline-subtle flex justify-between items-center">
              <div>
                <span class="text-xs text-ink-secondary block">Nama Klien</span>
                <span class="font-bold text-sm text-primary">Pak Dimas Arya</span>
              </div>
              <span class="bg-warning-surface text-warning px-2 py-0.5 rounded text-xs font-bold font-mono">
                SLOT 02 • SIAP JALAN
              </span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Layanan</span>
                <span class="font-bold text-primary">General Clean Living Room</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Waktu Pelaksanaan</span>
                <span class="font-bold font-mono text-primary">13:00 - 16:00 WIB (3 Jam)</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Lokasi Klien</span>
                <span class="font-bold text-primary text-right max-w-[240px]">Jl. Senopati No. 42, Kebayoran Baru (4.8 km)</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Estimasi Berangkat</span>
                <span class="font-bold text-voltage-orange">12:35 WIB (Jeda Buffer 90m Tersedia)</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="space-y-4">
            <div class="p-3 bg-surface-highlight rounded-xl border border-hairline-subtle flex justify-between items-center">
              <div>
                <span class="text-xs text-ink-secondary block">Nama Klien</span>
                <span class="font-bold text-sm text-primary">Bu Ratna K.</span>
              </div>
              <span class="bg-success-surface text-success px-2 py-0.5 rounded text-xs font-bold font-mono">
                SLOT 01 • TERKONFIRMASI
              </span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Layanan</span>
                <span class="font-bold text-primary">Deep Clean Detailing</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Waktu Pelaksanaan</span>
                <span class="font-bold font-mono text-primary">08:30 - 11:30 WIB (3 Jam)</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Lokasi Klien</span>
                <span class="font-bold text-primary text-right max-w-[240px]">Tebet Barat Dalam VII, Jakarta Selatan (6.2 km)</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-hairline-subtle">
                <span class="text-ink-secondary">Status WhatsApp</span>
                <span class="font-bold text-whatsapp-green">Dipesan via WhatsApp Terverifikasi</span>
              </div>
            </div>
          </div>
        }

        <div class="pt-4 border-t border-hairline-subtle flex justify-end">
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-button-label text-button-label hover:bg-neutral-800 transition-colors cursor-pointer min-h-[44px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleOrderDetailsModalComponent {
  readonly orderId = input<string>('order-ratna');
  readonly dismissModal = output<void>();
}
