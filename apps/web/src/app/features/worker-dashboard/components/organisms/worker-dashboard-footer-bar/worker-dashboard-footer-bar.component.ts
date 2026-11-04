import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, output } from '@angular/core';
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
    >
      @if (isScheduleRoute()) {
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-surface-elevated-dark flex items-center justify-center shrink-0 border border-white/10">
            <span class="material-symbols-outlined text-voltage-orange text-[20px]">published_with_changes</span>
          </div>
          <div class="flex flex-col">
            <span class="font-body-strong text-body-strong text-on-primary font-bold">
              Sinkronisasi Instan ke WhatsApp Pemesan
            </span>
            <span class="font-caption text-caption text-inverse-primary/70">
              Perubahan slot dan buffer langsung tersinkron ke halaman pemesanan WhatsApp publik tanpa reload.
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            (click)="cancelChanges()"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-elevated-dark text-on-primary font-button-label text-button-label hover:bg-neutral-700 transition-colors cursor-pointer min-h-[44px]"
          >
            Atur Ulang Default
          </button>
          <button
            id="saveScheduleBtn"
            type="button"
            (click)="saveChanges()"
            [disabled]="isSubmitting()"
            class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-voltage-orange text-on-primary font-button-label text-button-label hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px]"
          >
            @if (isSubmitting()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Menyimpan...</span>
            } @else {
              <span class="material-symbols-outlined text-[18px]">save</span>
              <span>Simpan Perubahan Jadwal</span>
            }
          </button>
        </div>
      } @else {
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
              Sinkronisasi terakhir: {{ syncTimestamp() }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            (click)="cancelChanges()"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-elevated-dark text-on-primary font-button-label text-button-label hover:bg-neutral-700 transition-colors cursor-pointer min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            (click)="saveChanges()"
            [disabled]="isSubmitting()"
            class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-voltage-orange text-on-primary font-button-label text-button-label hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px]"
          >
            @if (isSubmitting()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Menyimpan...</span>
            } @else {
              <span class="material-symbols-outlined text-[18px]">cloud_done</span>
              <span>Simpan Perubahan</span>
            }
          </button>
        </div>
      }
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardFooterBarComponent {
  readonly store = inject(WorkerDashboardStore);
  private readonly router = inject(Router, { optional: true });
  readonly cdr = inject(ChangeDetectorRef);
  readonly resetSelection = output<void>();

  constructor() {
    this.router?.events?.subscribe?.(() => {
      this.cdr.markForCheck();
    });
  }

  isScheduleRoute(): boolean {
    const currentUrl = this.router?.url || '';
    return currentUrl.includes('kalender') || currentUrl.includes('jadwal');
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

  readonly isSubmitting = computed(() => {
    return (
      this.store.isRatesSubmitting() ||
      this.store.isLocationSubmitting() ||
      this.store.isProfileSubmitting() ||
      this.store.isScheduleSubmitting()
    );
  });

  saveChanges(): void {
    const currentUrl = this.router?.url || '';
    if (currentUrl.includes('logistik')) {
      this.store.submitLocationSettingsUpdate();
    } else if (currentUrl.includes('kalender') || currentUrl.includes('jadwal')) {
      this.store.submitScheduleUpdate();
    } else if (currentUrl.includes('integrasi-whatsapp') || currentUrl.includes('profile')) {
      this.store.submitProfileUpdate();
    } else {
      this.store.submitRatesUpdate();
    }
  }

  cancelChanges(): void {
    const currentUrl = this.router?.url || '';
    if (currentUrl.includes('logistik')) {
      this.store.resetLocationToDefault();
    } else if (currentUrl.includes('kalender') || currentUrl.includes('jadwal')) {
      this.store.resetScheduleToDefault();
    } else {
      this.resetSelection.emit();
    }
  }
}
