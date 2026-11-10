import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

@Component({
  selector: 'app-worker-dashboard-footer-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer
      class="sticky bottom-4 z-30 w-full bg-hero-canvas text-on-primary rounded-xl px-6 py-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10"
      role="status"
      aria-label="Status Sinkronisasi Profil Publik"
    >
      <div class="flex items-center gap-3.5">
        <div class="relative flex items-center justify-center w-3 h-3">
          <span class="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
        </div>
        <div class="flex flex-col">
          <span class="font-body-strong text-body-strong text-on-primary font-bold">
            Tersinkronisasi ke Profil Publik
          </span>
          <span class="font-caption text-caption text-ink-disabled font-mono-rate">
            Sinkronisasi terakhir: {{ syncTimestamp() }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <a
          id="btn-footer-view-public-profile"
          [href]="publicProfileUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-elevated-dark hover:bg-neutral-700 text-on-primary font-button-label text-button-label transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] text-decoration-none no-underline border border-white/10 shadow-xs"
        >
          <span class="material-symbols-outlined text-[18px]">open_in_new</span>
          <span>Lihat Halaman Publik</span>
        </a>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardFooterBarComponent {
  readonly store = inject(WorkerDashboardStore);
  private readonly router = inject(Router, { optional: true });
  readonly cdr = inject(ChangeDetectorRef);

  readonly publicProfileUrl = computed(() => {
    return this.store.publicProfileRelativeUrl() || '/';
  });

  constructor() {
    this.router?.events?.subscribe?.(() => {
      this.cdr.markForCheck();
    });
  }

  syncTimestamp(): string {
    const currentUrl = this.router?.url || '';
    if (currentUrl.includes('logistik')) {
      return this.store.lastLocationSyncTimestamp();
    }
    if (currentUrl.includes('kalender') || currentUrl.includes('jadwal')) {
      return this.store.lastScheduleSyncTimestamp();
    }
    return this.store.lastRatesSyncTimestamp();
  }
}
