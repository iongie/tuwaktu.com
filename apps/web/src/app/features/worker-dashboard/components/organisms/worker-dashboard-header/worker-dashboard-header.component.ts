import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { DashboardQuickLinkComponent } from '../../molecules/dashboard-quick-link/dashboard-quick-link.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { LogoutConfirmModalComponent } from '../../../../auth/components/molecules/logout-confirm-modal/logout-confirm-modal.component';

@Component({
  selector: 'app-worker-dashboard-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DashboardQuickLinkComponent,
    LogoutConfirmModalComponent,
  ],
  template: `
    <header
      class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-hairline-subtle z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs"
    >
      <!-- Left: Mobile Menu Toggle & Status Penerimaan & Quick Link Pill -->
      <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          (click)="store.toggleMobileSidebar()"
          class="lg:hidden h-9 w-9 rounded-lg text-on-surface hover:bg-surface-highlight cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Buka Menu Modul"
        >
          <span class="material-symbols-outlined text-2xl">menu</span>
        </button>

        <!-- Status Operasional Pill (Height h-9 Seragam) -->
        <div
          class="h-9 px-3.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-2 select-none"
          [class.bg-emerald-50]="store.isStoreOnline()"
          [class.text-emerald-800]="store.isStoreOnline()"
          [class.border]="true"
          [class.border-emerald-200]="store.isStoreOnline()"
          [class.bg-gray-100]="!store.isStoreOnline()"
          [class.text-gray-700]="!store.isStoreOnline()"
          [class.border-gray-200]="!store.isStoreOnline()"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            [class.bg-emerald-500]="store.isStoreOnline()"
            [class.bg-gray-400]="!store.isStoreOnline()"
            [class.animate-pulse]="store.isStoreOnline()"
          ></span>
          <span class="hidden sm:inline">
            {{ store.isStoreOnline() ? 'Menerima Pesanan' : 'Operasional Nonaktif' }}
          </span>
          <span class="sm:hidden">{{ store.isStoreOnline() ? 'Aktif' : 'Off' }}</span>
        </div>

        <!-- Integrated Header Slug Switcher Pill (Height h-9 Seragam) -->
        <div class="relative shrink-0">
          <button
            type="button"
            (click)="toggleSwitcher()"
            class="h-9 px-3 rounded-lg bg-surface-highlight hover:bg-surface-container text-on-surface font-semibold text-xs inline-flex items-center gap-1.5 transition-colors border border-hairline-subtle cursor-pointer shrink-0"
            aria-label="Ganti Profil Mitra Aktif"
            aria-haspopup="dialog"
            [attr.aria-expanded]="isSwitcherOpen()"
          >
            <span class="text-on-surface-variant font-mono">&#64;</span>
            <span class="font-mono font-bold truncate max-w-[110px] sm:max-w-[150px]">
              {{ store.workerSlugIdentifier() || 'sarah-cleaning' }}
            </span>
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant">swap_horiz</span>
          </button>

          <!-- Popover Modal / Dropdown -->
          @if (isSwitcherOpen()) {
            <button
              type="button"
              class="fixed inset-0 z-40 bg-black/10 w-full h-full cursor-default border-none p-0"
              (click)="closeSwitcher()"
              aria-label="Tutup Dialog Pilihan Profil"
            ></button>

            <div
              class="absolute left-0 mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-hairline-subtle rounded-xl shadow-xl z-50 p-4 space-y-3"
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
                    class="w-full pl-7 pr-3 min-h-[44px] bg-surface-container-low border border-hairline-subtle rounded-lg text-xs font-mono text-on-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--voltage-orange) transition-all"
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

        @if (store.workerSlugIdentifier()) {
          <div class="hidden xl:block shrink-0">
            <app-dashboard-quick-link
              [urlText]="store.publicProfileRelativeUrl()"
              [feedbackMessage]="store.clipboardFeedbackMessage()"
              (copyLink)="store.copyPublicProfileLink()"
            />
          </div>
        }
      </div>

      <!-- Right: Preview Link Button, Separator & Identity (All Height h-9 Seragam) -->
      <div class="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        @if (store.workerSlugIdentifier()) {
          <a
            [routerLink]="store.publicProfileRelativeUrl()"
            target="_blank"
            class="h-9 px-3.5 rounded-lg bg-surface-highlight hover:bg-surface-container text-on-surface font-semibold text-xs inline-flex items-center gap-1.5 transition-colors border border-hairline-subtle cursor-pointer shrink-0"
          >
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span class="hidden sm:inline">Pratinjau Publik</span>
          </a>

          <div class="hidden sm:block h-5 w-px bg-hairline-subtle shrink-0 self-center"></div>
        }

        <!-- User Identity Block (Height h-9 Seragam dengan Avatar w-9 h-9) -->
        <div class="flex items-center gap-2.5 h-9 shrink-0">
          <div class="flex flex-col text-right hidden sm:flex justify-center">
            <span class="font-body-strong text-body-strong text-primary truncate max-w-[140px] leading-tight">
              {{ store.workerFullName() || 'Sarah Melinda' }}
            </span>
            <span class="font-caption text-caption text-ink-secondary truncate max-w-[140px] leading-tight mt-0.5">
              {{ store.workerProfessionZone() || 'Spesialis Mandiri' }}
            </span>
          </div>

          @if (store.workerAvatarUrl()) {
            <img
              [src]="store.workerAvatarUrl()"
              [alt]="store.workerFullName() || 'Avatar Mitra'"
              class="w-9 h-9 rounded-full object-cover ring-1 ring-hairline-subtle shrink-0"
            />
          } @else {
            <div
              class="w-9 h-9 rounded-full bg-hero-canvas text-ink-on-dark flex items-center justify-center font-bold text-xs ring-1 ring-hairline-subtle shrink-0"
            >
              <span class="material-symbols-outlined text-[18px]">person</span>
            </div>
          }
        </div>

        <!-- Tombol Keluar dari Konsol Kerja (Height h-9 Seragam) -->
        <button
          type="button"
          (click)="openLogoutModal()"
          class="h-9 px-3 rounded-lg bg-surface-highlight hover:bg-red-50 text-on-surface hover:text-red-600 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors border border-hairline-subtle cursor-pointer shrink-0"
          title="Keluar dari Konsol Kerja"
          aria-label="Keluar dari Konsol Kerja"
          id="headerLogoutBtn"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span class="hidden sm:inline">Keluar</span>
        </button>
      </div>

      <!-- Modal Konfirmasi Logout -->
      <app-logout-confirm-modal
        [isOpen]="isLogoutModalOpen()"
        (confirmed)="executeLogout()"
        (cancelled)="closeLogoutModal()"
      />
    </header>
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
  readonly switcherSlugValue = signal('');
  readonly quickPresets = ['sarah-cleaning', 'budi-santoso', 'eko-teknisi'];

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
    this.isLogoutModalOpen.set(true);
  }

  closeLogoutModal(): void {
    this.isLogoutModalOpen.set(false);
  }

  executeLogout(): void {
    this.isLogoutModalOpen.set(false);
    this.store.resetWorkerSelection();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
