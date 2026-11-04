import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-summary-basecamp-radar-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="bg-surface-container-lowest border border-hairline-subtle rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
    >
      <!-- Card Header -->
      <div class="flex items-center justify-between pb-2 border-b border-hairline-subtle">
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100"
          >
            <span class="material-symbols-outlined text-[20px]">near_me</span>
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-on-surface">Logistik Basecamp</h3>
            <span class="text-[11px] text-on-surface-variant block">Jangkauan &amp; Proteksi Area Operasional</span>
          </div>
        </div>

        <a
          routerLink="/dashboard/logistik-radius"
          queryParamsHandling="preserve"
          class="text-xs font-semibold text-(--voltage-orange) hover:underline flex items-center gap-1 min-h-[44px] px-2"
          aria-label="Kelola Pengaturan Logistik Basecamp"
        >
          <span>Kelola</span>
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>

      <!-- Mini Radar Visual Canvas -->
      <div
        class="relative h-40 sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center select-none shadow-inner"
      >
        <!-- Map Street Lines Vector Graphic -->
        <svg
          class="absolute inset-0 w-full h-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radarGrid)" />
          <!-- Road arterials -->
          <path d="M -20 80 Q 120 40 280 120" fill="none" stroke="#64748b" stroke-width="2.5" />
          <path d="M 80 -20 Q 140 90 200 200" fill="none" stroke="#475569" stroke-width="2" />
          <path d="M 0 140 L 320 60" fill="none" stroke="#475569" stroke-width="1.5" />
          <!-- Landmarks -->
          <text x="20" y="30" fill="#94a3b8" font-size="9" font-family="monospace">Jl. Tebet Timur Dalam</text>
          <text x="180" y="150" fill="#94a3b8" font-size="9" font-family="monospace">Tebet Barat</text>
        </svg>

        <!-- Concentric Radar Rings -->
        <div class="w-36 h-36 rounded-full border border-emerald-500/20 absolute pointer-events-none"></div>
        <div class="w-28 h-28 rounded-full border border-(--voltage-orange)/40 absolute animate-ping motion-reduce:animate-none opacity-25 pointer-events-none"></div>
        <div class="w-20 h-20 rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 absolute pointer-events-none flex items-center justify-center"></div>

        <!-- Center Basecamp Marker -->
        <div class="relative z-10 flex flex-col items-center">
          <div
            class="w-5 h-5 rounded-full bg-(--voltage-orange) ring-4 ring-white/20 flex items-center justify-center shadow-lg"
          >
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>

        <!-- Top-Left Center Badge -->
        <div
          class="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-xs text-[10px] font-mono font-bold text-emerald-300 border border-white/10 flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>TITIK PUSAT: TEBET TIMUR</span>
        </div>

        <!-- Bottom-Right Free Zone Badge -->
        <div
          class="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/80 border border-white/10"
        >
          Radius Bebas 3.0 Km
        </div>
      </div>

      <!-- Data Key-Value List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
        <div class="p-2.5 rounded-lg bg-surface-container-low border border-hairline-subtle space-y-0.5">
          <span class="text-[10px] font-mono text-on-surface-variant uppercase block">Lokasi Asal</span>
          <span class="font-bold text-on-surface truncate block" title="Tebet Timur Dalam Raya No. 18">
            Tebet Timur Dalam Raya No. 18
          </span>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-container-low border border-hairline-subtle space-y-0.5">
          <span class="text-[10px] font-mono text-on-surface-variant uppercase block">Radius Bebas Biaya</span>
          <span class="font-mono font-bold text-emerald-700 block">0.0 - 3.0 Km (Rp 0)</span>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-container-low border border-hairline-subtle space-y-0.5">
          <span class="text-[10px] font-mono text-on-surface-variant uppercase block">Batas Jangkauan Maks</span>
          <span class="font-mono font-bold text-on-surface block">5.0 Km</span>
        </div>

        <div class="p-2.5 rounded-lg bg-surface-container-low border border-hairline-subtle space-y-0.5">
          <span class="text-[10px] font-mono text-on-surface-variant uppercase block">Surcharge Luar Radius</span>
          <span class="font-mono font-bold text-amber-800 block">+Rp 3.000 / Km</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryBasecampRadarCardComponent {}
