import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

@Component({
  selector: 'app-booking-nav-account-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, LogoutConfirmModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!authService.isInitialized()) {
      <!-- Kondisi 0: Skeleton Indikator Loading Sesi saat Inisialisasi/Refresh (Mencegah Kedipan) -->
      <div
        class="flex items-center gap-2 h-10 px-2 animate-pulse"
        role="status"
        aria-label="Memeriksa status sesi pengguna"
        data-testid="nav-session-skeleton"
      >
        <div class="w-8 h-8 rounded-full bg-surface-container-high shrink-0"></div>
        <div class="hidden sm:flex flex-col gap-1 w-20">
          <div class="h-3 bg-surface-container-high rounded w-16"></div>
          <div class="h-2 bg-surface-container rounded w-12"></div>
        </div>
        <span class="sr-only">Memeriksa status sesi...</span>
      </div>
    } @else if (authService.isLoggedIn() && isAdmin()) {
      <!-- Kondisi 1: Logged-in Admin (Pintasan Panel Kelola Mitra & Web Publik) -->
      <div class="relative group" data-testid="nav-admin-menu">
        <button
          type="button"
          (click)="toggleMenu()"
          class="flex items-center gap-space-sm p-1 sm:px-2 py-1 rounded hover:bg-surface-highlight transition-colors text-left focus:outline-none min-h-[44px] cursor-pointer"
          id="adminProfileMenuBtn"
          aria-label="Buka Menu Administrator"
          aria-haspopup="menu"
          [attr.aria-expanded]="isMenuOpen()"
        >
          <div class="relative shrink-0">
            <div
              class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-caption ring-2 ring-primary/20 overflow-hidden"
            >
              @if (sessionAvatarUrl()) {
                <img [src]="sessionAvatarUrl()" [alt]="sessionName()" class="w-full h-full object-cover" />
              } @else {
                <span>{{ sessionInitials() }}</span>
              }
            </div>
            <span
              class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-body-canvas"
              title="Status: Administrator Sistem"
            ></span>
          </div>

          <div class="hidden sm:flex flex-col min-w-0 text-left">
            <div class="flex items-center gap-1">
              <span class="font-body-strong text-body-strong text-on-surface leading-tight truncate max-w-[130px]">
                {{ sessionName() }}
              </span>
              <span
                class="inline-block px-1.5 py-0.5 rounded bg-primary text-on-primary font-micro-uppercase text-[10px] uppercase font-bold tracking-wider"
              >
                ADMIN
              </span>
            </div>
            <span class="font-micro-uppercase text-caption text-ink-secondary leading-none mt-0.5 truncate max-w-[140px]">
              {{ sessionEmail() || 'Administrator Sistem' }}
            </span>
          </div>

          <span
            class="material-symbols-outlined text-[18px] text-ink-secondary transition-transform group-hover:rotate-180"
            [class.rotate-180]="isMenuOpen()"
          >
            expand_more
          </span>
        </button>

        @if (isMenuOpen()) {
          <button
            type="button"
            class="fixed inset-0 z-40 bg-transparent w-full h-full cursor-default border-none p-0"
            (click)="closeMenu()"
            aria-label="Tutup Menu Akun Admin"
            tabindex="-1"
          ></button>
        }

        <div
          class="hidden group-hover:block hover:block absolute right-0 top-full pt-1.5 w-72 z-50 transition-all text-left"
          [class.!block]="isMenuOpen()"
          role="menu"
          aria-orientation="vertical"
          tabindex="-1"
        >
          <div
            class="bg-body-canvas rounded-xl shadow-xl ring-1 ring-hairline-subtle overflow-hidden p-space-sm border border-hairline-subtle"
          >
            <!-- User Identity Capsule Khusus Admin -->
            <div class="p-space-sm bg-surface-container-low rounded-lg mb-space-xs">
              <div class="flex items-center justify-between gap-2">
                <span class="font-body-strong text-body-strong text-on-surface truncate">
                  {{ sessionName() }}
                </span>
                <span
                  class="px-space-xs py-0.5 rounded bg-primary text-on-primary font-micro-uppercase text-[10px] font-bold uppercase tracking-wider shrink-0"
                >
                  Super Admin
                </span>
              </div>
              <p class="font-caption text-caption text-ink-secondary mt-1 truncate">
                {{ sessionEmail() || 'Administrator Sistem Tuwaktu' }}
              </p>
            </div>

            <!-- Pintasan Rute Khusus Admin -->
            <div class="space-y-0.5 py-1">
              <a
                routerLink="/admin/workers"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-primary hover:bg-surface-highlight transition-colors font-button-label text-caption font-semibold cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemAdminPanel"
              >
                <span class="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                <span>Panel Kelola Mitra</span>
              </a>

              <a
                routerLink="/"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemPublicHome"
              >
                <span class="material-symbols-outlined text-[18px] text-ink-secondary">public</span>
                <span>Kembali ke Web Publik</span>
              </a>
            </div>

            <!-- Separator -->
            <div class="h-px bg-hairline-subtle my-space-xs"></div>

            <!-- Tombol Keluar Admin -->
            <div class="pt-0.5">
              <button
                type="button"
                (click)="openLogoutConfirm()"
                class="w-full flex items-center gap-space-sm px-space-sm py-2 rounded text-error hover:bg-error-surface transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px] text-left"
                role="menuitem"
                id="adminMenuItemLogout"
              >
                <span class="material-symbols-outlined text-[18px] text-error">logout</span>
                <span>Keluar / Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Konfirmasi Logout -->
      <app-logout-confirm-modal
        [isOpen]="isLogoutModalOpen()"
        (confirmed)="executeLogout()"
        (cancelled)="closeLogoutConfirm()"
      />
    } @else if (authService.isLoggedIn()) {
      <!-- Kondisi 2: Logged-in Worker (Pintasan Dashboard & Profil Publik Mitra) -->
      <div class="relative group" data-testid="nav-worker-menu">
        <button
          type="button"
          (click)="toggleMenu()"
          class="flex items-center gap-space-sm p-1 sm:px-2 py-1 rounded hover:bg-surface-highlight transition-colors text-left focus:outline-none min-h-[44px] cursor-pointer"
          id="userProfileMenuBtn"
          aria-label="Buka Menu Akun Mitra"
          aria-haspopup="menu"
          [attr.aria-expanded]="isMenuOpen()"
        >
          <div class="relative shrink-0">
            <div
              class="w-8 h-8 rounded-full bg-hero-canvas text-ink-on-dark flex items-center justify-center font-bold text-caption ring-2 ring-hairline-subtle overflow-hidden"
            >
              @if (sessionAvatarUrl()) {
                <img [src]="sessionAvatarUrl()" [alt]="sessionName()" class="w-full h-full object-cover" />
              } @else {
                <span>{{ sessionInitials() }}</span>
              }
            </div>
            <span
              class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-body-canvas"
              title="Status: Aktif Menerima Pesanan"
            ></span>
          </div>

          <div class="hidden sm:flex flex-col min-w-0 text-left">
            <div class="flex items-center gap-1">
              <span class="font-body-strong text-body-strong text-on-surface leading-tight truncate max-w-[130px]">
                {{ sessionName() }}
              </span>
              <span
                class="inline-block px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-[10px] uppercase font-semibold"
              >
                Mitra
              </span>
            </div>
            <span class="font-micro-uppercase text-caption text-ink-secondary leading-none mt-0.5 truncate max-w-[140px]">
              {{ sessionProfession() }}
            </span>
          </div>

          <span
            class="material-symbols-outlined text-[18px] text-ink-secondary transition-transform group-hover:rotate-180"
            [class.rotate-180]="isMenuOpen()"
          >
            expand_more
          </span>
        </button>

        @if (isMenuOpen()) {
          <button
            type="button"
            class="fixed inset-0 z-40 bg-transparent w-full h-full cursor-default border-none p-0"
            (click)="closeMenu()"
            aria-label="Tutup Menu Akun Mitra"
            tabindex="-1"
          ></button>
        }

        <div
          class="hidden group-hover:block hover:block absolute right-0 top-full pt-1.5 w-72 z-50 transition-all text-left"
          [class.!block]="isMenuOpen()"
          role="menu"
          aria-orientation="vertical"
          tabindex="-1"
        >
          <div
            class="bg-body-canvas rounded-xl shadow-xl ring-1 ring-hairline-subtle overflow-hidden p-space-sm border border-hairline-subtle"
          >
            <!-- User Identity Capsule Mitra -->
            <div class="p-space-sm bg-surface-container-low rounded-lg mb-space-xs">
              <div class="flex items-center justify-between gap-2">
                <span class="font-body-strong text-body-strong text-on-surface truncate">
                  {{ sessionName() }}
                </span>
                <span
                  class="px-space-xs py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold uppercase shrink-0"
                >
                  Mitra Terverifikasi
                </span>
              </div>
              <p class="font-caption text-caption text-ink-secondary mt-0.5 truncate">
                {{ sessionZone() }}
              </p>
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-hairline-subtle text-caption font-caption">
                <span class="flex items-center gap-1 text-ink-secondary">
                  <span class="w-2 h-2 rounded-full bg-success"></span> Terima Order Baru
                </span>
                <span class="font-mono-rate text-mono-rate font-bold text-success">AKTIF</span>
              </div>
            </div>

            <!-- Quick Portal Links Mitra -->
            <div class="space-y-0.5 py-1">
              <a
                routerLink="/dashboard/ringkasan"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemDashboard"
              >
                <span class="material-symbols-outlined text-[18px] text-ink-secondary">space_dashboard</span>
                <span>Ke Dashboard Teknisi</span>
              </a>

              <a
                routerLink="/dashboard/tarif-layanan"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemRates"
              >
                <span class="material-symbols-outlined text-[18px] text-ink-secondary">manage_accounts</span>
                <span>Pengaturan Profil &amp; Tarif Mandiri</span>
              </a>

              <a
                routerLink="/dashboard/kalender-slot"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemSchedule"
              >
                <span class="material-symbols-outlined text-[18px] text-ink-secondary">calendar_month</span>
                <span>Kelola Jadwal &amp; Buffer Transit</span>
              </a>

              <a
                [routerLink]="'/' + sessionSlug()"
                (click)="closeMenu()"
                class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                role="menuitem"
                id="menuItemPublicProfile"
              >
                <span class="material-symbols-outlined text-[18px] text-ink-secondary">storefront</span>
                <span>Profil Publik Saya</span>
              </a>
            </div>

            <!-- Separator -->
            <div class="h-px bg-hairline-subtle my-space-xs"></div>

            <!-- Logout Aksi Mitra -->
            <div class="pt-0.5">
              <button
                type="button"
                (click)="openLogoutConfirm()"
                class="w-full flex items-center gap-space-sm px-space-sm py-2 rounded text-error hover:bg-error-surface transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px] text-left"
                role="menuitem"
                id="menuItemLogout"
              >
                <span class="material-symbols-outlined text-[18px] text-error">logout</span>
                <span>Keluar / Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Konfirmasi Logout -->
      <app-logout-confirm-modal
        [isOpen]="isLogoutModalOpen()"
        (confirmed)="executeLogout()"
        (cancelled)="closeLogoutConfirm()"
      />
    } @else {
      <!-- Kondisi 3: Guest (Tamu / Belum Masuk) -->
      <div
        class="flex items-center gap-space-xs sm:gap-space-sm"
        role="group"
        aria-label="Aksi Autentikasi Mitra"
        data-testid="nav-guest-actions"
      >
        <a
          routerLink="/login"
          id="navLoginBtn"
          class="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 h-10 min-h-[44px] rounded-lg border border-hairline-subtle bg-body-canvas hover:bg-surface-highlight text-on-surface font-button-label text-button-label font-medium transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px] text-ink-secondary">login</span>
          <span>Masuk</span>
        </a>
        <a
          routerLink="/register"
          id="navRegisterBtn"
          class="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-10 min-h-[44px] rounded-lg bg-primary hover:opacity-90 text-on-primary font-button-label text-button-label font-semibold shadow-xs transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          <span>Daftar Mitra</span>
        </a>
      </div>
    }
  `,
})
export class BookingNavAccountMenuComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly activeWorker = input<PublicTechnicianProfile | null>(null);

  readonly isMenuOpen = signal<boolean>(false);
  readonly isLogoutModalOpen = signal<boolean>(false);

  sessionName(): string {
    const session = this.authService.currentUser();
    if (session?.name) return session.name;
    return 'Mitra Terdaftar';
  }

  sessionEmail(): string {
    const session = this.authService.currentUser();
    return session?.email || '';
  }

  sessionInitials(): string {
    const name = this.sessionName().trim();
    if (!name) return 'MT';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  sessionProfession(): string {
    if (this.isAdmin()) return 'Super Administrator';
    const worker = this.activeWorker();
    const session = this.authService.currentUser();
    if (worker && session && worker.slug === session.slug && worker.bio) {
      return worker.bio.length > 25 ? worker.bio.slice(0, 22) + '...' : worker.bio;
    }
    return 'Mitra Mandiri';
  }

  sessionZone(): string {
    const worker = this.activeWorker();
    const session = this.authService.currentUser();
    if (worker && session && worker.slug === session.slug && worker.zone) {
      return `Pangkalan: ${worker.zone}`;
    }
    return 'Konsol Kerja Mandiri Tuwaktu';
  }

  isAdmin(): boolean {
    const session = this.authService.currentUser();
    return (session?.role || '').toUpperCase() === 'ADMIN';
  }

  sessionSlug(): string {
    const session = this.authService.currentUser();
    if (session?.slug) return session.slug;
    return 'mitra-mandiri';
  }

  sessionAvatarUrl(): string | undefined {
    const session = this.authService.currentUser();
    if (session?.avatarUrl) return session.avatarUrl;
    const worker = this.activeWorker();
    if (worker && session && worker.slug === session.slug) {
      return worker.avatar_url;
    }
    return undefined;
  }

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  openLogoutConfirm(): void {
    this.closeMenu();
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutConfirm(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.closeLogoutConfirm();
    this.closeMenu();
    this.router.navigate(['/login']);
    this.authService.logout()?.subscribe?.();
  }
}
