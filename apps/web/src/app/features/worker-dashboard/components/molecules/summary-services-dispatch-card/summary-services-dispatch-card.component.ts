import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-summary-services-dispatch-card',
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
            class="w-9 h-9 rounded-lg bg-orange-50 text-voltage-orange flex items-center justify-center shrink-0 border border-orange-100"
          >
            <span class="material-symbols-outlined text-[20px]">tune</span>
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-on-surface">Layanan &amp; Integrasi</h3>
            <span class="text-[11px] text-on-surface-variant block">Katalog Tarif &amp; Jalur Penugasan</span>
          </div>
        </div>

        <a
          routerLink="/dashboard/tarif-layanan"
          queryParamsHandling="preserve"
          class="text-xs font-semibold text-voltage-orange hover:underline flex items-center gap-1 min-h-[44px] px-2"
          aria-label="Ubah Pengaturan Tarif dan Layanan"
        >
          <span>Ubah</span>
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>

      <!-- Service Items List -->
      <div class="space-y-2.5">
        <!-- Item 1 -->
        <div
          class="p-3 rounded-xl bg-surface-container-low border border-hairline-subtle flex items-center justify-between gap-3"
        >
          <div class="space-y-0.5 min-w-0">
            <h4 class="text-xs font-bold text-on-surface truncate">
              Deep Cleaning Specialist
            </h4>
            <p class="text-[11px] text-on-surface-variant truncate">
              Vakum debu, toilet kerak berat &amp; dapur
            </p>
          </div>
          <span class="font-mono text-xs font-bold text-on-surface whitespace-nowrap shrink-0">
            Rp 90.000/jam
          </span>
        </div>

        <!-- Item 2 -->
        <div
          class="p-3 rounded-xl bg-surface-container-low border border-hairline-subtle flex items-center justify-between gap-3"
        >
          <div class="space-y-0.5 min-w-0">
            <h4 class="text-xs font-bold text-on-surface truncate">
              General Cleaning Room
            </h4>
            <p class="text-[11px] text-on-surface-variant truncate">
              Sapu, pel, sanitasi permukaan perabot
            </p>
          </div>
          <span class="font-mono text-xs font-bold text-on-surface whitespace-nowrap shrink-0">
            Rp 80.000/jam
          </span>
        </div>
      </div>

      <!-- WhatsApp Dispatch Handoff Channel Strip -->
      <div
        class="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-emerald-950"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs"
          >
            <span class="material-symbols-outlined text-[18px]">chat</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-900 font-bold block truncate">
              WhatsApp Dispatch Channel
            </span>
            <span class="font-mono text-xs font-bold text-emerald-800 block truncate">
              +62 812-8899-2211
            </span>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs shrink-0"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Aktif</span>
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryServicesDispatchCardComponent {}
