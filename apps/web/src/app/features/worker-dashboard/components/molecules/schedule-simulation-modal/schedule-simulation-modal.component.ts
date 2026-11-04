import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-simulation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simModalTitle"
    >
      <div
        class="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl border border-hairline-subtle"
      >
        <div class="flex items-center justify-between pb-4 border-b border-hairline-subtle">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[22px]">preview</span>
            </div>
            <div>
              <h3 id="simModalTitle" class="font-heading-3 text-heading-3 text-primary font-bold">
                Simulasi Kalender Publik
              </h3>
              <p class="font-caption text-caption text-ink-secondary">
                Pratinjau antarmuka pemesanan langsung dari sisi klien
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="p-2 text-ink-secondary hover:text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup Pratinjau Simulasi"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div class="p-3 bg-surface-highlight rounded-xl border border-hairline-subtle text-xs space-y-1">
            <div class="flex justify-between items-center text-primary font-bold">
              <span>Status URL Publik</span>
              <span class="text-success font-mono font-semibold">Aktif &amp; Terlindungi</span>
            </div>
            <p class="text-ink-secondary">
              Slot yang terisi atau terkunci oleh buffer transit secara otomatis ditolak dari pemilihan tanggal klien.
            </p>
          </div>

          <!-- Slots mockup -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-primary block">Ketersediaan Slot Besok (25 Okt):</span>
            <div class="p-3 rounded-lg border border-hairline-subtle bg-surface-container/60 opacity-60 flex justify-between items-center text-xs">
              <span class="line-through font-mono">08:30 - 11:30 WIB</span>
              <span class="font-bold text-ink-disabled">TERISI (Klien Ratna)</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-dim flex justify-between items-center text-xs italic text-ink-secondary">
              <span>11:30 - 13:00 WIB (Proteksi Buffer Transit 90m)</span>
              <span class="material-symbols-outlined text-sm">lock</span>
            </div>
            <div class="p-3 rounded-lg border border-hairline-subtle bg-surface-container/60 opacity-60 flex justify-between items-center text-xs">
              <span class="line-through font-mono">13:00 - 16:00 WIB</span>
              <span class="font-bold text-ink-disabled">TERISI (Klien Dimas)</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-dim flex justify-between items-center text-xs italic text-ink-secondary">
              <span>16:00 - 17:30 WIB (Proteksi Buffer Transit 90m)</span>
              <span class="material-symbols-outlined text-sm">lock</span>
            </div>
            <div class="p-3 rounded-lg border border-success/40 bg-success-surface flex justify-between items-center text-xs font-bold">
              <span class="text-success font-mono">17:30 - 20:00 WIB</span>
              <span class="bg-success text-white px-2 py-0.5 rounded text-[10px]">TERSEDIA UNTUK DIPESAN</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-hairline-subtle flex justify-end">
          <button
            type="button"
            (click)="dismissModal.emit()"
            class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-button-label text-button-label hover:bg-neutral-800 transition-colors cursor-pointer min-h-[44px]"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleSimulationModalComponent {
  readonly workerName = input<string>('Sarah Melinda');
  readonly dismissModal = output<void>();
}
