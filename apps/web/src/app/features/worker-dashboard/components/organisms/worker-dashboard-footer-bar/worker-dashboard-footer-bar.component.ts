import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-footer-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer
      class="sticky bottom-4 z-30 w-full bg-hero-canvas text-on-primary rounded-xl px-6 py-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10"
    >
      <div class="flex items-center gap-3.5">
        <div class="relative flex items-center justify-center w-3 h-3">
          <span class="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
        </div>
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-on-primary font-bold">
            Perubahan tersimpan otomatis ke profil publik
          </span>
          <span class="font-caption text-caption text-ink-disabled font-mono-rate">
            Sinkronisasi terakhir: {{ store.lastRatesSyncTimestamp() }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          (click)="resetSelection.emit()"
          class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-elevated-dark text-on-primary font-button-label text-button-label hover:bg-neutral-700 transition-colors cursor-pointer min-h-[44px]"
        >
          Batal
        </button>
        <button
          type="button"
          (click)="store.submitRatesUpdate()"
          class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-voltage-orange text-on-primary font-button-label text-button-label hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px]"
        >
          <span class="material-symbols-outlined text-[18px]">cloud_done</span>
          <span>Simpan Perubahan</span>
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

