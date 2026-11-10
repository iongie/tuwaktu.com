import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

export interface AdminNavMenuItem {
  readonly route: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LogoutConfirmModalComponent,
  ],
  template: `
    <!-- Mobile Backdrop Overlay -->
    @if (isMobileOpen()) {
      <button
        type="button"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default w-full h-full border-0"
        (click)="closeMobile.emit()"
        aria-label="Tutup Bilah Navigasi Admin"
      ></button>
    }

    <!-- Sidebar Container -->
    <aside
      class="fixed left-0 top-0 h-full w-64 bg-hero-canvas z-50 flex flex-col justify-between py-6 border-r border-[#262626] shadow-none transition-transform duration-200 lg:translate-x-0"
      [class.translate-x-0]="isMobileOpen()"
      [class.-translate-x-full]="!isMobileOpen()"
    >
      <div class="flex flex-col gap-6">
        <!-- Logo Brand & Badge Admin Console -->
        <div class="px-6 flex items-center justify-between">
          <a
            routerLink="/admin/analytics"
            (click)="closeMobile.emit()"
            class="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              class="w-8 h-8 rounded bg-voltage-orange flex items-center justify-center text-white font-bold text-sm tracking-wider font-mono-rate"
            >
              TW
            </div>
            <div>
              <div
                class="font-heading-h3 text-[14px] font-bold tracking-tight text-white uppercase leading-none"
              >
                TUWAKTU
              </div>
              <div
                class="text-[10px] font-mono-rate uppercase tracking-widest text-voltage-orange font-bold mt-0.5"
              >
                ADMIN CONSOLE
              </div>
            </div>
          </a>

          <!-- Tombol Close Drawer Mobile -->
          <button
            type="button"
            class="lg:hidden p-1.5 rounded border border-[#333333] hover:bg-[#1f1f1f] text-gray-400 hover:text-white transition-colors cursor-pointer"
            (click)="closeMobile.emit()"
            aria-label="Tutup Menu"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <!-- Kelompok 1: Menu Inti Admin -->
        <nav aria-label="Navigasi Utama Admin" class="flex flex-col gap-1 px-3">
          <span
            class="px-3 pb-1 text-[10px] font-mono-rate uppercase tracking-wider text-[#737373] font-bold"
          >
            Menu Operasional
          </span>

          @for (item of coreAdminNav; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-[#1f1f1f] text-white font-bold border-l-2 border-voltage-orange rounded-r"
              (click)="closeMobile.emit()"
              class="flex items-center gap-3 px-3 py-2.5 rounded text-xs text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white transition-colors cursor-pointer group"
            >
              <span
                class="material-symbols-outlined text-[18px] text-[#737373] group-hover:text-voltage-orange transition-colors"
              >
                {{ item.icon }}
              </span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <!-- Kelompok 2: Pintasan Bawah (Switcher & Logout) -->
      <div class="flex flex-col gap-1 px-3 border-t border-[#262626] pt-4">
        <span
          class="px-3 pb-1 text-[10px] font-mono-rate uppercase tracking-wider text-[#737373] font-bold"
        >
          Akses Platform
        </span>

        <!-- Tautan ke Web Publik -->
        <a
          routerLink="/"
          target="_blank"
          class="flex items-center justify-between px-3 py-2 rounded text-xs text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white transition-colors cursor-pointer group"
          title="Buka Beranda Publik Tuwaktu"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="material-symbols-outlined text-[16px] text-[#737373] group-hover:text-voltage-orange transition-colors"
            >
              visibility
            </span>
            <span>Lihat Web Publik</span>
          </div>
          <span class="material-symbols-outlined text-[14px] text-[#555555]">
            open_in_new
          </span>
        </a>

        <!-- Tautan ke Dashboard Teknisi -->
        <a
          routerLink="/dashboard"
          class="flex items-center gap-2.5 px-3 py-2 rounded text-xs text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white transition-colors cursor-pointer group"
          title="Buka Dashboard Mandiri Teknisi"
        >
          <span
            class="material-symbols-outlined text-[16px] text-[#737373] group-hover:text-voltage-orange transition-colors"
          >
            build
          </span>
          <span>Dashboard Teknisi</span>
        </a>

        <!-- Tombol Logout -->
        <button
          type="button"
          (click)="isLogoutModalOpen.set(true)"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-bold text-error text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer mt-1"
        >
          <span class="material-symbols-outlined text-[16px] text-red-400">
            logout
          </span>
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>

    <!-- Modal Konfirmasi Logout -->
    <app-logout-confirm-modal
      [isOpen]="isLogoutModalOpen()"
      (confirm)="handleConfirmLogout()"
      (cancel)="isLogoutModalOpen.set(false)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isMobileOpen = input<boolean>(false);
  readonly closeMobile = output<void>();

  readonly isLogoutModalOpen = signal<boolean>(false);

  readonly coreAdminNav: readonly AdminNavMenuItem[] = [
    {
      route: '/admin/analytics',
      label: 'Analitik Platform',
      icon: 'query_stats',
    },
    {
      route: '/admin/workers',
      label: 'Kelola Mitra',
      icon: 'engineering',
    },
    {
      route: '/admin/requests/reset',
      label: 'Persetujuan Reset',
      icon: 'vpn_key',
    },
    {
      route: '/admin/categories',
      label: 'Katalog Keahlian',
      icon: 'category',
    },
  ];

  handleConfirmLogout(): void {
    this.isLogoutModalOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
