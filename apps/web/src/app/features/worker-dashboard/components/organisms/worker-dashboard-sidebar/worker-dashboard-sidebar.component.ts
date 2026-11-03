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
    <aside
      class="fixed left-0 top-0 h-full w-64 bg-(--hero-canvas) text-white z-50 flex-col justify-between py-6 px-4 hidden lg:flex border-r border-white/10"
    >
      <div class="space-y-6">
        <!-- Logo Tuwaktu Workspace PRO -->
        <div class="flex items-center justify-between px-2">
          <a routerLink="/" class="flex items-center gap-2">
            <div
              class="w-7 h-7 bg-(--voltage-orange) rounded-lg flex items-center justify-center text-white font-bold text-sm"
            >
              T
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold tracking-tight text-white uppercase leading-none">
                TUWAKTU
              </span>
              <span class="text-[9px] font-mono tracking-widest text-white/50 uppercase">
                WORKSPACE PRO
              </span>
            </div>
          </a>
          <span class="font-mono text-[10px] uppercase text-white/50 px-2 py-0.5 bg-white/10 rounded">
            PRO
          </span>
        </div>

        <!-- Master Status Penerimaan Indicator -->
        <div
          class="px-3 py-2 bg-white/5 rounded-lg flex items-center justify-between border border-white/10"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full"
              [class.bg-emerald-400]="store.isStoreOnline()"
              [class.bg-gray-400]="!store.isStoreOnline()"
              [class.animate-pulse]="store.isStoreOnline()"
            ></span>
            <span class="text-xs text-white/80">Status Penerimaan</span>
          </div>
          <span
            class="font-mono text-xs font-bold"
            [class.text-emerald-400]="store.isStoreOnline()"
            [class.text-gray-400]="!store.isStoreOnline()"
          >
            {{ store.isStoreOnline() ? 'AKTIF' : 'OFFLINE' }}
          </span>
        </div>

        <!-- Navigation Menu -->
        <nav aria-label="Navigasi Utama Dasbor" class="space-y-1">
          <div class="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
            Modul Kerja
          </div>

          @for (item of menuItems; track item.routePath) {
            <a
              [routerLink]="item.routePath"
              queryParamsHandling="preserve"
              routerLinkActive="bg-white/15 text-white font-semibold"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-white/70 hover:bg-white/5 hover:text-white"
            >
              <span class="material-symbols-outlined text-base">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div class="flex flex-col gap-3 pt-4 border-t border-white/10">
        @if (store.workerSlugIdentifier()) {
          <a
            [routerLink]="store.publicProfileRelativeUrl()"
            target="_blank"
            class="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs transition-colors"
          >
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">open_in_new</span>
              <span>Lihat Tautan Publik</span>
            </span>
            <span class="text-white/40">&rarr;</span>
          </a>
        }

        <div class="flex items-center gap-3 px-1 pt-1">
          @if (store.workerAvatarUrl()) {
            <img
              [src]="store.workerAvatarUrl()"
              [alt]="store.workerFullName() || 'Avatar Mitra'"
              class="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
            />
          } @else {
            <div
              class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xs"
            >
              {{ (store.workerFullName() || 'M').substring(0, 2).toUpperCase() }}
            </div>
          }
          <div class="flex flex-col overflow-hidden">
            <span class="text-xs font-bold text-white truncate">
              {{ store.workerFullName() || 'Mitra Tuwaktu' }}
            </span>
            <span class="text-[10px] text-white/50 truncate">
              {{ store.workerProfessionZone() || 'Spesialis Mandiri' }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-white/40 px-1 pt-1 font-mono">
          <span>v2.4-SOVEREIGN</span>
          <span class="flex items-center gap-1 text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Sinkron
          </span>
        </div>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSidebarComponent {
  readonly store = inject(WorkerDashboardStore);

  readonly menuItems: readonly DashboardSidebarMenuItem[] = [
    { routePath: '/dashboard/ringkasan', label: 'Ringkasan', icon: 'space_dashboard' },
    { routePath: '/dashboard/tarif-layanan', label: 'Tarif & Layanan', icon: 'payments' },
    { routePath: '/dashboard/logistik-radius', label: 'Logistik & Basecamp', icon: 'near_me' },
    { routePath: '/dashboard/kalender-slot', label: 'Kalender & Slot', icon: 'calendar_month' },
    { routePath: '/dashboard/integrasi-whatsapp', label: 'Integrasi WhatsApp', icon: 'chat' },
    { routePath: '/dashboard/plan', label: 'Paket & Langganan', icon: 'workspace_premium' },
    { routePath: '/dashboard/boost', label: 'Boost Visibilitas', icon: 'bolt' },
  ];
}

