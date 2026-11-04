import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

export interface DashboardSidebarMenuItem {
  readonly routePath: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-worker-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (store.isMobileSidebarOpen()) {
      <button
        type="button"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default w-full h-full border-0"
        (click)="store.closeMobileSidebar()"
        aria-label="Tutup Bilah Navigasi"
      ></button>
    }

    <aside
      class="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex-col justify-between py-6 border-r border-hairline-subtle shadow-xs"
      [class.flex]="store.isMobileSidebarOpen()"
      [class.hidden]="!store.isMobileSidebarOpen()"
      [class.lg:flex]="true"
    >
      <div class="flex flex-col gap-6">
        <!-- Logo Tuwaktu Workspace PRO -->
        <div class="px-6 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary"
            >
              <span class="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <div class="flex flex-col">
              <span class="font-heading-3 text-heading-3 text-primary tracking-tight font-bold leading-tight">
                TUWAKTU
              </span>
              <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary tracking-widest">
                WORKSPACE PRO
              </span>
            </div>
          </a>
          <button
            type="button"
            (click)="store.closeMobileSidebar()"
            class="lg:hidden p-1 text-ink-secondary hover:text-primary"
            aria-label="Tutup Navigasi"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Section Label -->
        <div class="px-6">
          <span class="font-micro-uppercase text-micro-uppercase text-ink-secondary uppercase tracking-wider">
            Modul Kerja
          </span>
        </div>

        <!-- Navigation Menu -->
        <nav aria-label="Navigasi Utama Dasbor" class="flex flex-col px-3 gap-1">
          @for (item of menuItems; track item.routePath) {
            <a
              [routerLink]="item.routePath"
              queryParamsHandling="preserve"
              routerLinkActive="bg-surface-highlight text-primary font-bold border-l-2 border-voltage-orange"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="store.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-highlight hover:text-on-surface transition-colors rounded text-button-label font-button-label cursor-pointer min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div class="px-6 flex flex-col gap-3 pt-4 border-t border-hairline-subtle">
        <div class="flex items-center justify-between text-caption font-caption">
          <span class="text-ink-secondary">Versi Mesin</span>
          <span class="font-mono-rate text-mono-rate text-on-surface font-semibold">
            v2.4-SOVEREIGN
          </span>
        </div>
        <div class="flex items-center gap-2 text-caption text-success font-caption">
          <span class="w-2 h-2 rounded-full bg-success inline-block"></span>
          <span class="font-bold">Sinkronisasi Aktif</span>
        </div>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSidebarComponent {
  readonly store = inject(WorkerDashboardStore);

  readonly menuItems: readonly DashboardSidebarMenuItem[] = [
    { routePath: '/dashboard/ringkasan', label: 'Ringkasan', icon: 'grid_view' },
    { routePath: '/dashboard/tarif-layanan', label: 'Tarif & Layanan', icon: 'sell' },
    { routePath: '/dashboard/logistik-radius', label: 'Logistik & Basecamp', icon: 'distance' },
    { routePath: '/dashboard/kalender-slot', label: 'Kalender & Slot', icon: 'calendar_month' },
    { routePath: '/dashboard/integrasi-whatsapp', label: 'Integrasi WhatsApp', icon: 'chat' },
    { routePath: '/dashboard/plan', label: 'Paket & Langganan', icon: 'workspace_premium' },
    { routePath: '/dashboard/boost', label: 'Boost Visibilitas', icon: 'bolt' },
  ];
}

