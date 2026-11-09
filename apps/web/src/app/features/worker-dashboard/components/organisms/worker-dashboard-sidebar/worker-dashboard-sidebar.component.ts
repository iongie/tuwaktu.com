import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

export interface DashboardSidebarMenuItem {
  readonly routePath: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-worker-dashboard-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LogoutConfirmModalComponent,
  ],
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
      class="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between py-6 border-r border-hairline-subtle shadow-xs transition-transform duration-200 lg:translate-x-0"
      [class.translate-x-0]="store.isMobileSidebarOpen()"
      [class.-translate-x-full]="!store.isMobileSidebarOpen()"
    >
      <div class="flex flex-col gap-6">
        <!-- Logo Tuwaktu Workspace PRO -->
        <div class="px-6 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary"
            >
              <span class="material-symbols-outlined text-[18px]"
                >schedule</span
              >
            </div>
            <div class="flex flex-col">
              <span
                class="font-heading-3 text-heading-3 text-primary tracking-tight font-bold leading-tight"
              >
                TUWAKTU
              </span>
              <span
                class="font-micro-uppercase text-micro-uppercase text-ink-secondary tracking-widest"
              >
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
          <span
            class="font-micro-uppercase text-micro-uppercase text-ink-secondary uppercase tracking-wider"
          >
            Modul Kerja
          </span>
        </div>

        <!-- Navigation Menu -->
        <nav
          aria-label="Navigasi Utama Dasbor"
          class="flex flex-col px-3 gap-1"
        >
          @for (item of menuItems; track item.routePath) {
            <a
              [routerLink]="item.routePath"
              queryParamsHandling="preserve"
              routerLinkActive="bg-surface-highlight text-primary font-bold border-l-2 border-voltage-orange"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="store.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-highlight hover:text-on-surface transition-colors rounded text-button-label font-button-label cursor-pointer min-h-[44px]"
            >
              <span class="material-symbols-outlined text-[20px]">{{
                item.icon
              }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <!-- Sidebar Footer -->
      <div
        class="px-6 flex flex-col gap-3 pt-4 border-t border-hairline-subtle"
      >
        <!-- Tombol Keluar Konsol -->
        <div class="px-3 pt-2">
          <button
            type="button"
            (click)="openLogoutModal()"
            class="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded text-button-label font-button-label cursor-pointer min-h-[44px]"
            id="sidebarLogoutBtn"
          >
            <span class="material-symbols-outlined text-[20px]">logout</span>
            <span>Keluar Konsol</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Modal Konfirmasi Logout -->
    <app-logout-confirm-modal
      [isOpen]="isLogoutModalOpen()"
      (confirmed)="executeLogout()"
      (cancelled)="closeLogoutModal()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardSidebarComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLogoutModalOpen = signal<boolean>(false);

  readonly menuItems: readonly DashboardSidebarMenuItem[] = [
    {
      routePath: '/dashboard/ringkasan',
      label: 'Ringkasan',
      icon: 'grid_view',
    },
    {
      routePath: '/dashboard/profile',
      label: 'Profil & Identitas',
      icon: 'person',
    },
    {
      routePath: '/dashboard/tarif-layanan',
      label: 'Tarif & Layanan',
      icon: 'sell',
    },
    {
      routePath: '/dashboard/logistik-radius',
      label: 'Logistik & Basecamp',
      icon: 'distance',
    },
    {
      routePath: '/dashboard/kalender-slot',
      label: 'Kalender & Slot',
      icon: 'calendar_month',
    },
    {
      routePath: '/dashboard/integrasi-whatsapp',
      label: 'Integrasi WhatsApp',
      icon: 'chat',
    },
    {
      routePath: '/dashboard/ulasan',
      label: 'Ulasan & Reputasi',
      icon: 'reviews',
    },
    {
      routePath: '/dashboard/plan',
      label: 'Paket & Langganan',
      icon: 'workspace_premium',
    },
    { routePath: '/dashboard/boost', label: 'Boost Visibilitas', icon: 'bolt' },
  ];

  openLogoutModal(): void {
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.isLogoutModalOpen.set(false);
    this.store.closeMobileSidebar();
    this.store.resetWorkerSelection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
