import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { DashboardQuickLinkComponent } from '../../molecules/dashboard-quick-link/dashboard-quick-link.component';

@Component({
  selector: 'app-worker-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardQuickLinkComponent],
  template: `
    <header
      class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-hairline-subtle z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs"
    >
      <!-- Left: Mobile Menu Toggle & Status Penerimaan & Quick Link Pill -->
      <div class="flex items-center gap-3 sm:gap-4 overflow-hidden">
        <button
          type="button"
          (click)="store.toggleMobileSidebar()"
          class="lg:hidden p-2 text-on-surface hover:bg-surface-highlight rounded cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Buka Menu Modul"
        >
          <span class="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div
          class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shrink-0"
          [class.bg-emerald-50]="store.isStoreOnline()"
          [class.text-emerald-800]="store.isStoreOnline()"
          [class.border]="true"
          [class.border-emerald-200]="store.isStoreOnline()"
          [class.bg-gray-100]="!store.isStoreOnline()"
          [class.text-gray-700]="!store.isStoreOnline()"
          [class.border-gray-200]="!store.isStoreOnline()"
        >
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-emerald-500]="store.isStoreOnline()"
            [class.bg-gray-400]="!store.isStoreOnline()"
            [class.animate-pulse]="store.isStoreOnline()"
          ></span>
          <span class="hidden sm:inline">
            {{ store.isStoreOnline() ? 'Menerima Pesanan' : 'Operasional Nonaktif' }}
          </span>
          <span class="sm:hidden">{{ store.isStoreOnline() ? 'Aktif' : 'Off' }}</span>
        </div>

        @if (store.workerSlugIdentifier()) {
          <div class="hidden md:block">
            <app-dashboard-quick-link
              [urlText]="store.publicProfileRelativeUrl()"
              [feedbackMessage]="store.clipboardFeedbackMessage()"
              (copyLink)="store.copyPublicProfileLink()"
            />
          </div>
        }
      </div>

      <!-- Right: Preview Link Button, Separator & Identity -->
      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        @if (store.workerSlugIdentifier()) {
          <a
            [routerLink]="store.publicProfileRelativeUrl()"
            target="_blank"
            class="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors border border-hairline-subtle min-h-[44px]"
          >
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span class="hidden sm:inline">Pratinjau Publik</span>
          </a>
        }

        <div class="hidden sm:block h-6 w-px bg-hairline-subtle"></div>

        <div class="flex items-center gap-2.5">
          <div class="flex flex-col text-right hidden sm:flex">
            <span class="font-body-strong text-body-strong text-primary truncate max-w-[140px]">
              {{ store.workerFullName() || 'Mitra Tuwaktu' }}
            </span>
            <span class="font-caption text-caption text-ink-secondary truncate max-w-[140px]">
              {{ store.workerProfessionZone() || 'Spesialis Mandiri' }}
            </span>
          </div>

          @if (store.workerAvatarUrl()) {
            <img
              [src]="store.workerAvatarUrl()"
              [alt]="store.workerFullName() || 'Avatar Mitra'"
              class="w-8 h-8 rounded-full object-cover ring-1 ring-hairline-light"
            />
          } @else {
            <div
              class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs"
            >
              <span class="material-symbols-outlined text-[18px]">person</span>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardHeaderComponent {
  readonly store = inject(WorkerDashboardStore);
}

