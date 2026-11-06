import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-slot-track-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="w-full bg-surface-container-low rounded-xl p-3 sm:p-4 border border-hairline-subtle space-y-2.5"
    >
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-on-surface">Distribusi Waktu Kerja Harian</span>
        <span class="font-mono text-on-surface-variant font-medium text-[11px]">
          Alokasi Operasional: 3 Slot Kerja • Buffer Terproteksi
        </span>
      </div>

      <!-- Multi-Segment Visual Progress Track Bar -->
      <div
        class="w-full h-4 bg-surface-container rounded-full overflow-hidden flex items-stretch gap-0.5 p-0.5 border border-hairline-subtle"
        role="progressbar"
        aria-label="Progress Track Alokasi Slot Harian"
        aria-valuenow="100"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <!-- Pagi: Siap Dipesan -->
        <div
          class="w-[30%] bg-emerald-600/90 rounded-l-full relative transition-all group"
          title="Slot Pagi (08:30 - 11:30): Siap Dipesan"
        ></div>

        <!-- Buffer 1: Transit 90m -->
        <div
          class="w-[15%] bg-amber-200/90 relative transition-all flex items-center justify-center [background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(180,83,9,0.2)_3px,rgba(180,83,9,0.2)_6px)]"
          title="Transit Buffer 1 (11:30 - 13:00): 90 Menit Terproteksi"
        ></div>

        <!-- Siang: Siap Dipesan -->
        <div
          class="w-[28%] bg-emerald-600/90 relative transition-all"
          title="Slot Siang (13:00 - 15:30): Siap Dipesan"
        ></div>

        <!-- Buffer 2: Transit 90m -->
        <div
          class="w-[15%] bg-amber-200/90 relative transition-all flex items-center justify-center [background-image:repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(180,83,9,0.2)_3px,rgba(180,83,9,0.2)_6px)]"
          title="Transit Buffer 2 (15:30 - 17:00): 90 Menit Terproteksi"
        ></div>

        <!-- Sore: Siap Dipesan -->
        <div
          class="w-[12%] bg-emerald-600/90 rounded-r-full relative transition-all"
          title="Slot Sore (17:00 - 20:00): Siap Dipesan"
        ></div>
      </div>

      <!-- Legend Breakdown -->
      <div
        class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-on-surface-variant pt-1"
      >
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>08:30 Pagi (Buka)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[13px] text-amber-700">lock_clock</span>
          <span class="text-amber-800">Buffer 90m</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>13:00 Siang (Buka)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[13px] text-amber-700">lock_clock</span>
          <span class="text-amber-800">Buffer 90m</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span class="text-emerald-700 font-semibold">17:00 Sore (Buka)</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarySlotTrackBarComponent {}
