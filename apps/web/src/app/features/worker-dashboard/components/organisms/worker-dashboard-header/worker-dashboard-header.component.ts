import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { resolveAvatarUrl } from '../../../../../core/utils/avatar-url.util';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

@Component({
  selector: 'app-worker-dashboard-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LogoutConfirmModalComponent,
  ],
  template: `
    <header
      class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-hairline-subtle z-40"
    >
      <div
        class="w-full max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
      >
        <!-- Left: Mobile Menu Toggle, Status Penerimaan, Slug Switcher & Quick Link -->
        <div class="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            (click)="store.toggleMobileSidebar()"
            class="lg:hidden h-9 w-9 rounded-lg text-on-surface hover:bg-surface-highlight cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Buka Menu Modul"
          >
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>

          <!-- Status Operasional Pill from Stitch ae83d8c55bf6406ea67c57238d5b90f9 -->
          <div
            class="flex items-center gap-space-sm px-space-md py-space-xs h-8 rounded-full border shrink-0 select-none"
            [class.bg-success-surface]="store.isStoreOnline()"
            [class.text-success]="store.isStoreOnline()"
            [class.border-success/20]="store.isStoreOnline()"
            [class.bg-surface-highlight]="!store.isStoreOnline()"
            [class.text-ink-secondary]="!store.isStoreOnline()"
            [class.border-hairline-subtle]="!store.isStoreOnline()"
          >
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              [class.bg-success]="store.isStoreOnline()"
              [class.bg-ink-disabled]="!store.isStoreOnline()"
              [class.animate-pulse]="store.isStoreOnline()"
            ></span>
            <span class="font-caption text-caption font-semibold hidden sm:inline">
              {{ store.isStoreOnline() ? 'Menerima Pesanan' : 'Operasional Nonaktif' }}
            </span>
            <span class="font-caption text-caption font-semibold sm:hidden">
              {{ store.isStoreOnline() ? 'Aktif' : 'Off' }}
            </span>
          </div>

          <!-- Integrated Slug & Link Bar from Stitch ae83d8c55bf6406ea67c57238d5b90f9 -->
          <div class="relative shrink-0 flex items-center gap-2">
            <button
              type="button"
              (click)="toggleSwitcher()"
              class="flex items-center gap-space-xs bg-surface-highlight hover:bg-surface-container px-space-md py-space-xs h-8 rounded border border-hairline-subtle transition-colors cursor-pointer"
              aria-label="Ganti Profil Mitra Aktif"
              aria-haspopup="dialog"
              [attr.aria-expanded]="isSwitcherOpen()"
            >
              <span class="material-symbols-outlined text-ink-secondary text-[16px]">link</span>
              <span class="font-mono-rate text-mono-rate text-ink-secondary truncate max-w-[140px] sm:max-w-[200px]">
                tuwaktu.com/{{ store.workerSlugIdentifier() || 'sarah-cleaning' }}
              </span>
              <span class="material-symbols-outlined text-[15px] text-ink-secondary ml-0.5">swap_horiz</span>
            </button>

            <button
              type="button"
              (click)="store.copyPublicProfileLink()"
              class="hidden md:inline-flex items-center justify-center h-8 w-8 rounded bg-surface-highlight hover:bg-surface-container border border-hairline-subtle text-ink-secondary hover:text-primary transition-colors cursor-pointer"
              title="Salin tautan"
              aria-label="Salin tautan profil publik"
            >
              <span class="material-symbols-outlined text-[16px]">
                {{ store.clipboardFeedbackMessage() ? 'check' : 'content_copy' }}
              </span>
            </button>

            <!-- Popover Modal / Dropdown Switcher -->
            @if (isSwitcherOpen()) {
              <button
                type="button"
                class="fixed inset-0 z-40 bg-black/10 w-full h-full cursor-default border-none p-0"
                (click)="closeSwitcher()"
                aria-label="Tutup Dialog Pilihan Profil"
              ></button>

              <div
                class="absolute left-0 top-full mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-hairline-subtle rounded-xl shadow-xl z-50 p-4 space-y-3"
                role="dialog"
                aria-modal="true"
                aria-label="Dialog Ganti Profil Mitra"
                (keydown.escape)="closeSwitcher()"
              >
                <div class="flex items-center justify-between pb-2 border-b border-hairline-subtle">
                  <div>
                    <h3 class="text-xs font-bold text-on-surface">Ganti Profil Mitra</h3>
                    <p class="text-[11px] text-on-surface-variant">Ketik slug untuk memuat konfigurasi API</p>
                  </div>
                  <button
                    type="button"
                    (click)="closeSwitcher()"
                    class="p-1 rounded text-on-surface-variant hover:text-on-surface min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Tutup Dialog Ganti Profil"
                  >
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                @if (store.profileFeedbackError()) {
                  <div class="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 font-medium">
                    {{ store.profileFeedbackError() }}
                  </div>
                }

                <form (ngSubmit)="applySlugSwitch()" class="space-y-3">
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono text-xs select-none"
                    >&#64;</span>
                    <input
                      type="text"
                      name="slugSwitcherInput"
                      [ngModel]="switcherSlugValue()"
                      (ngModelChange)="switcherSlugValue.set($event)"
                      placeholder="contoh: sarah-cleaning"
                      class="w-full pl-7 pr-3 min-h-[44px] bg-surface-container-low border border-hairline-subtle rounded-lg text-xs font-mono text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-voltage-orange transition-all"
                    />
                  </div>

                  <!-- Pilihan Cepat -->
                  <div>
                    <span class="text-[10px] font-mono uppercase text-on-surface-variant block mb-1.5 font-bold">
                      Pilihan Cepat:
                    </span>
                    <div class="flex flex-wrap gap-1.5">
                      @for (preset of quickPresets; track preset) {
                        <button
                          type="button"
                          (click)="selectPreset(preset)"
                          class="px-3 py-2 rounded text-[11px] font-mono border border-hairline-subtle hover:border-on-surface transition-colors cursor-pointer min-h-[44px] inline-flex items-center justify-center"
                          [class.bg-on-surface]="switcherSlugValue() === preset"
                          [class.text-white]="switcherSlugValue() === preset"
                          [class.bg-surface-container-low]="switcherSlugValue() !== preset"
                          [class.text-on-surface]="switcherSlugValue() !== preset"
                        >
                          &#64;{{ preset }}
                        </button>
                      }
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-2 border-t border-hairline-subtle">
                    <button
                      type="button"
                      (click)="closeSwitcher()"
                      class="min-h-[44px] px-3.5 rounded-lg border border-hairline-subtle text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      [disabled]="store.isProfileLoading()"
                      class="min-h-[44px] px-4 rounded-lg bg-on-surface hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {{ store.isProfileLoading() ? 'Memuat...' : 'Terapkan' }}
                    </button>
                  </div>
                </form>
              </div>
            }
          </div>
        </div>

        <!-- Right: Pratinjau Publik, Divider & User Profile Dropdown Menu -->
        <div class="flex items-center gap-space-lg shrink-0">
          <a
            [routerLink]="store.publicProfileRelativeUrl() || '/sarah-cleaning'"
            target="_blank"
            class="flex items-center gap-space-xs px-space-md py-space-sm h-9 rounded bg-surface-highlight text-ink-on-light border border-hairline-light hover:bg-surface-container-high transition-colors font-button-label text-button-label shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">visibility</span>
            <span class="hidden sm:inline">Pratinjau Publik</span>
          </a>

          <div class="hidden sm:block h-6 w-px bg-hairline-light shrink-0"></div>

          <!-- User Profile Dropdown Component (Matches Stitch & Main Navbar) -->
          <div class="relative group">
            <button
              type="button"
              (click)="toggleProfileMenu()"
              class="flex items-center gap-space-md p-1 sm:px-2 py-1 rounded hover:bg-surface-highlight transition-colors text-right focus:outline-none cursor-pointer"
              id="dashboardProfileMenuBtn"
              aria-label="Buka Menu Akun Mitra"
              aria-haspopup="menu"
              [attr.aria-expanded]="isProfileMenuOpen()"
            >
              <div class="hidden sm:flex flex-col text-right">
                <span class="font-body-strong text-body-strong text-primary leading-tight truncate max-w-[150px]">
                  {{ store.workerFullName() || 'Sarah Melinda' }}
                </span>
                <span class="font-caption text-caption text-ink-secondary leading-tight truncate max-w-[150px]">
                  {{ store.workerProfessionZone() || 'Spesialis Kebersihan' }}
                </span>
              </div>

              <div class="relative shrink-0">
                @if (resolvedHeaderAvatarUrl() && !isHeaderAvatarBroken()) {
                  <img
                    [src]="resolvedHeaderAvatarUrl()"
                    [alt]="store.workerFullName() || 'Avatar Mitra'"
                    (error)="isHeaderAvatarBroken.set(true)"
                    class="w-8 h-8 rounded-full object-cover ring-1 ring-hairline-light"
                  />
                } @else {
                  <div
                    class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs"
                  >
                    {{ (store.workerFullName() || 'TW').substring(0, 2).toUpperCase() }}
                  </div>
                }
                <span
                  class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-body-canvas"
                  [class.bg-success]="store.isStoreOnline()"
                  [class.bg-ink-disabled]="!store.isStoreOnline()"
                ></span>
              </div>

              <span
                class="material-symbols-outlined text-[18px] text-ink-secondary transition-transform group-hover:rotate-180"
                [class.rotate-180]="isProfileMenuOpen()"
              >
                expand_more
              </span>
            </button>

            @if (isProfileMenuOpen()) {
              <button
                type="button"
                class="fixed inset-0 z-40 bg-transparent w-full h-full cursor-default border-none p-0"
                (click)="closeProfileMenu()"
                aria-label="Tutup Menu Akun"
                tabindex="-1"
              ></button>
            }

            <!-- Elevated Popover / Dropdown Menu -->
            <div
              class="hidden group-hover:block hover:block absolute right-0 top-full pt-1.5 w-72 z-50 transition-all text-left"
              [class.!block]="isProfileMenuOpen()"
              role="menu"
              aria-orientation="vertical"
              tabindex="-1"
            >
              <div
                class="bg-body-canvas rounded-xl shadow-xl ring-1 ring-hairline-subtle overflow-hidden p-space-sm border border-hairline-subtle"
              >
                <!-- User Identity Capsule -->
                <div class="p-space-sm bg-surface-container-low rounded-lg mb-space-xs">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-body-strong text-body-strong text-on-surface truncate">
                      {{ store.workerFullName() || 'Sarah Melinda' }}
                    </span>
                    <span
                      class="px-space-xs py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase font-bold uppercase shrink-0"
                    >
                      {{ isAdmin() ? 'Super Admin' : 'Mitra Terverifikasi' }}
                    </span>
                  </div>
                  <p class="font-caption text-caption text-ink-secondary mt-0.5 truncate">
                    {{ store.workerProfessionZone() || 'Spesialis Sanitasi & Kebersihan Mandiri' }}
                  </p>
                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-hairline-subtle text-caption font-caption">
                    <span class="flex items-center gap-1 text-ink-secondary">
                      <span
                        class="w-2 h-2 rounded-full"
                        [class.bg-success]="store.isStoreOnline()"
                        [class.bg-ink-disabled]="!store.isStoreOnline()"
                      ></span>
                      Terima Order Baru
                    </span>
                    <span
                      class="font-mono-rate text-mono-rate font-bold"
                      [class.text-success]="store.isStoreOnline()"
                      [class.text-ink-secondary]="!store.isStoreOnline()"
                    >
                      {{ store.isStoreOnline() ? 'AKTIF' : 'OFFLINE' }}
                    </span>
                  </div>
                </div>

                <!-- Quick Portal Links -->
                <div class="space-y-0.5 py-1">
                  @if (isAdmin()) {
                    <a
                      routerLink="/admin/workers"
                      (click)="closeProfileMenu()"
                      class="flex items-center gap-space-sm px-space-sm py-2 rounded text-primary hover:bg-surface-highlight transition-colors font-button-label text-caption font-semibold cursor-pointer min-h-[44px]"
                      role="menuitem"
                    >
                      <span class="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                      <span>Panel Kelola Mitra</span>
                    </a>
                  }

                  <a
                    routerLink="/dashboard/ringkasan"
                    (click)="closeProfileMenu()"
                    class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                    role="menuitem"
                  >
                    <span class="material-symbols-outlined text-[18px] text-ink-secondary">space_dashboard</span>
                    <span>Ke Dashboard Teknisi</span>
                  </a>

                  <a
                    routerLink="/dashboard/profile"
                    (click)="closeProfileMenu()"
                    class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                    role="menuitem"
                  >
                    <span class="material-symbols-outlined text-[18px] text-ink-secondary">manage_accounts</span>
                    <span>Pengaturan Profil &amp; Foto</span>
                  </a>

                  <a
                    routerLink="/dashboard/kalender-slot"
                    (click)="closeProfileMenu()"
                    class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                    role="menuitem"
                  >
                    <span class="material-symbols-outlined text-[18px] text-ink-secondary">calendar_month</span>
                    <span>Kelola Jadwal &amp; Buffer Transit</span>
                  </a>

                  <a
                    [routerLink]="store.publicProfileRelativeUrl() || '/sarah-cleaning'"
                    (click)="closeProfileMenu()"
                    class="flex items-center gap-space-sm px-space-sm py-2 rounded text-on-surface hover:bg-surface-highlight transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px]"
                    role="menuitem"
                  >
                    <span class="material-symbols-outlined text-[18px] text-ink-secondary">storefront</span>
                    <span>Lihat Halaman Publik</span>
                  </a>
                </div>

                <!-- Separator -->
                <div class="h-px bg-hairline-subtle my-space-xs"></div>

                <!-- Tombol Keluar Logout -->
                <div class="pt-0.5">
                  <button
                    type="button"
                    (click)="openLogoutModal()"
                    class="w-full flex items-center gap-space-sm px-space-sm py-2 rounded text-error hover:bg-error-surface transition-colors font-button-label text-caption font-medium cursor-pointer min-h-[44px] text-left"
                    role="menuitem"
                    id="headerLogoutBtn"
                  >
                    <span class="material-symbols-outlined text-[18px] text-error">logout</span>
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Modal Konfirmasi Logout (Diletakkan di luar <header> agar tidak mengganggu flex justify-between) -->
    <app-logout-confirm-modal
      [isOpen]="isLogoutModalOpen()"
      (confirmed)="executeLogout()"
      (cancelled)="closeLogoutModal()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardHeaderComponent {
  readonly store = inject(WorkerDashboardStore);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly isLogoutModalOpen = signal<boolean>(false);
  readonly isSwitcherOpen = signal(false);
  readonly isProfileMenuOpen = signal(false);
  readonly isHeaderAvatarBroken = signal(false);
  readonly resolvedHeaderAvatarUrl = computed(() =>
    resolveAvatarUrl(this.store.workerAvatarUrl())
  );
  readonly switcherSlugValue = signal('');
  readonly quickPresets = ['sarah-cleaning', 'budi-santoso', 'eko-teknisi'];

  isAdmin(): boolean {
    const session = this.authService.currentUser();
    return (session?.role || '').toUpperCase() === 'ADMIN';
  }

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    if (this.isProfileMenuOpen()) {
      this.closeProfileMenu();
    }
    if (this.isSwitcherOpen()) {
      this.closeSwitcher();
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((open) => !open);
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  toggleSwitcher(): void {
    if (!this.isSwitcherOpen()) {
      this.store.profileFeedbackError.set('');
      this.switcherSlugValue.set(
        this.store.workerSlugIdentifier() || 'sarah-cleaning'
      );
      this.isSwitcherOpen.set(true);
    } else {
      this.isSwitcherOpen.set(false);
    }
  }

  closeSwitcher(): void {
    this.isSwitcherOpen.set(false);
  }

  selectPreset(preset: string): void {
    this.switcherSlugValue.set(preset);
  }

  applySlugSwitch(): void {
    const slug = this.switcherSlugValue().trim().toLowerCase();
    if (!slug) return;

    this.store.loadExistingWorkerProfile(slug, () => {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { slug: slug },
        queryParamsHandling: 'merge',
      });
      this.closeSwitcher();
    });
  }

  openLogoutModal(): void {
    this.closeProfileMenu();
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.isLogoutModalOpen.set(false);
    this.closeProfileMenu();
    this.store.resetWorkerSelection();
    this.router.navigate(['/login']);
    this.authService.logout()?.subscribe?.();
  }
}
