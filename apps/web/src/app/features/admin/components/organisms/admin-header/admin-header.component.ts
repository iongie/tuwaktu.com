import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { BookingNavAccountMenuComponent } from '../../../../worker-booking/components/molecules/booking-nav-account-menu/booking-nav-account-menu.component';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, BookingNavAccountMenuComponent],
  template: `
    <header class="h-16 sticky top-0 z-40 bg-body-canvas/95 backdrop-blur-md border-b border-hairline-light shadow-none flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Sisi Kiri: Tombol Hamburger Mobile & Breadcrumb Halaman -->
      <div class="flex items-center gap-2 min-w-0">
        <button
          type="button"
          (click)="toggleMobileSidebar.emit()"
          class="lg:hidden p-2 rounded border border-hairline-light text-ink-secondary hover:text-ink-on-light hover:bg-surface-highlight transition-colors cursor-pointer mr-1"
          aria-label="Buka Menu Sidebar"
        >
          <span class="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <!-- Breadcrumb Navigasi -->
        <nav aria-label="Breadcrumb Admin" class="flex items-center gap-1.5 text-xs truncate">
          <span class="text-ink-secondary font-medium">Panel Admin</span>
          <span class="material-symbols-outlined text-[14px] text-ink-disabled">chevron_right</span>
          <span class="font-bold text-ink-on-light truncate font-mono-rate">
            {{ currentSectionTitle() }}
          </span>
        </nav>
      </div>

      <!-- Sisi Kanan: Status Role & Profil Akun -->
      <div class="flex items-center gap-3 shrink-0">
        <!-- Badge Hak Akses Admin -->
        <div class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-highlight text-ink-on-light font-mono-rate text-[10px] font-bold tracking-wider uppercase border border-hairline-light">
          <span class="material-symbols-outlined text-[14px] text-voltage-orange">admin_panel_settings</span>
          <span>Admin Super</span>
        </div>

        <div class="h-5 w-px bg-hairline-light hidden sm:block"></div>

        <!-- Dropdown Profil Akun -->
        <app-booking-nav-account-menu />
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeaderComponent {
  private readonly router = inject(Router);

  readonly toggleMobileSidebar = output<void>();

  private readonly currentUrlSignal = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly currentSectionTitle = computed<string>(() => {
    const url = this.currentUrlSignal() || '';
    if (url.includes('/admin/analytics')) {
      return 'Analitik Platform';
    }
    if (url.includes('/admin/workers')) {
      return 'Kelola Mitra';
    }
    if (url.includes('/admin/requests/reset')) {
      return 'Persetujuan Reset';
    }
    if (url.includes('/admin/categories')) {
      return 'Katalog Keahlian';
    }
    return 'Dashboard';
  });
}

