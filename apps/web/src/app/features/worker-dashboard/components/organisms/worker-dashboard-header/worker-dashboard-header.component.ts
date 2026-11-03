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
      class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-(--hairline-light) z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs"
    >
      <!-- Left: Status Penerimaan & Quick Link Pill -->
      <div class="flex items-center gap-3 sm:gap-4 overflow-hidden">
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
            class="h-9 px-3 rounded-lg bg-(--surface-container) hover:bg-(--surface-container-high) text-(--brand-ink) font-semibold text-xs flex items-center gap-1.5 transition-colors border border-(--hairline-light)"
          >
            <span class="material-symbols-outlined text-[16px]">visibility</span>
            <span class="hidden sm:inline">Pratinjau Publik</span>
          </a>
        }

        <div class="hidden sm:block h-6 w-px bg-(--hairline-light)"></div>

        <div class="flex items-center gap-2.5">
          <div class="flex flex-col text-right hidden sm:flex">
            <span class="text-xs font-bold text-(--brand-ink) truncate max-w-[140px]">
              {{ store.workerFullName() || 'Mitra Tuwaktu' }}
            </span>
            <span class="text-[10px] text-(--brand-ink)/60 truncate max-w-[140px]">
              {{ store.workerProfessionZone() || 'Spesialis Mandiri' }}
            </span>
          </div>

          @if (store.workerAvatarUrl()) {
            <img
              [src]="store.workerAvatarUrl()"
              [alt]="store.workerFullName() || 'Avatar Mitra'"
              class="w-8 h-8 rounded-full object-cover ring-1 ring-(--hairline-light)"
            />
          } @else {
            <div
              class="w-8 h-8 rounded-full bg-(--brand-ink) text-white flex items-center justify-center font-bold text-xs"
            >
              {{ (store.workerFullName() || 'M').substring(0, 2).toUpperCase() }}
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

