import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-footer-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer
      class="sticky bottom-4 z-30 w-full bg-(--hero-canvas)/95 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-(--whatsapp-green) flex items-center justify-center text-white shrink-0"
        >
          <span class="material-symbols-outlined text-base">check</span>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-xs sm:text-sm text-white">
            Semua Perubahan Disinkronkan Otomatis
          </span>
          <span class="text-[11px] text-white/60">
            Profil publik {{ store.workerFullName() || 'Mitra' }} langsung terhubung ke sistem booking.
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <button
          type="button"
          (click)="resetSelection.emit()"
          class="flex-1 sm:flex-none h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-colors cursor-pointer border border-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          (click)="store.saveAllSettings()"
          class="flex-1 sm:flex-none h-10 px-6 rounded-lg bg-(--voltage-orange) hover:bg-[#e04b00] text-white font-mono text-xs font-bold transition-colors shadow-sm cursor-pointer"
        >
          Simpan Konfigurasi
        </button>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardFooterBarComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly resetSelection = output<void>();
}

