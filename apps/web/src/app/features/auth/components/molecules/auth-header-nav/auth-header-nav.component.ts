import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PublicTechnicianProfile } from '../../../../worker-booking/models/worker-catalog.model';
import { BookingNavAccountMenuComponent } from '../../../../worker-booking/components/molecules/booking-nav-account-menu/booking-nav-account-menu.component';

@Component({
  selector: 'app-auth-header-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    BookingNavAccountMenuComponent,
  ],
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()',
  },
  template: `
    <header
      class="sticky top-0 w-full z-50 bg-body-canvas/95 backdrop-blur-md border-b border-hairline-subtle/60"
    >
      <div
        class="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3"
      >
        <!-- Zona Kiri: Identitas Merek -->
        <a
          routerLink="/"
          class="flex items-center gap-2 cursor-pointer min-h-11 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          aria-label="Kembali ke Beranda Tuwaktu"
        >
          <span
            class="font-heading-h3 text-heading-h3 font-bold tracking-tight text-ink-on-light uppercase"
          >
            TUWAKTU
          </span>
          <span
            class="px-1.5 py-0.5 bg-hero-canvas text-ink-on-dark font-micro-uppercase text-[10px] uppercase tracking-wider rounded"
          >
            MANDIRI
          </span>
        </a>

        <!-- Zona Tengah: Navigasi Utama Desktop (>= lg agar tidak berdesakan di tablet 768px) -->
        <nav aria-label="Navigasi Utama" class="hidden lg:flex items-center gap-1">
          <a
            routerLink="/"
            fragment="spesialis-unggulan"
            class="min-h-11 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-sm font-medium rounded-lg whitespace-nowrap flex items-center focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          >
            Jelajah Pekerja
          </a>
          <a
            routerLink="/"
            fragment="katalog-disiplin"
            class="min-h-11 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-sm font-medium rounded-lg whitespace-nowrap flex items-center focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          >
            Katalog Layanan
          </a>
          <a
            routerLink="/bisnis"
            routerLinkActive="bg-surface-warm-promo text-voltage-orange font-semibold"
            class="min-h-11 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-sm font-medium rounded-lg whitespace-nowrap flex items-center focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          >
            Untuk Bisnis
          </a>
          <a
            routerLink="/"
            fragment="manifesto-kedaulatan"
            class="min-h-11 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-sm font-medium rounded-lg whitespace-nowrap flex items-center focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          >
            Tentang Mandiri
          </a>
        </nav>

        <!-- Zona Kanan: Menu Akun & Tombol Menu Mobile/Tablet -->
        <div class="flex items-center gap-2 shrink-0">
          <app-booking-nav-account-menu [activeWorker]="activeWorker()" />

          <button
            type="button"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-controls="mobile-primary-nav"
            data-testid="mobile-nav-menu-btn"
            class="lg:hidden min-h-11 px-3 py-2 rounded-lg border border-hairline-light bg-surface-highlight hover:bg-surface-container text-ink-on-light text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
          >
            <span class="material-symbols-outlined text-[18px]">
              {{ isMobileMenuOpen() ? 'close' : 'menu' }}
            </span>
            <span>Menu</span>
          </button>
        </div>
      </div>

      <!-- Panel Drawer Navigasi Mobile & Tablet (< lg) -->
      @if (isMobileMenuOpen()) {
        <nav
          id="mobile-primary-nav"
          aria-label="Navigasi Mobile"
          class="lg:hidden bg-body-canvas border-t border-hairline-subtle px-4 py-3 flex flex-col gap-1"
        >
          <a
            routerLink="/"
            fragment="spesialis-unggulan"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-highlight flex items-center"
          >
            Jelajah Pekerja
          </a>
          <a
            routerLink="/"
            fragment="katalog-disiplin"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-highlight flex items-center"
          >
            Katalog Layanan
          </a>
          <a
            routerLink="/bisnis"
            routerLinkActive="bg-surface-warm-promo text-voltage-orange font-bold"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-highlight flex items-center justify-between"
          >
            <span>Untuk Bisnis &amp; Properti</span>
            <span class="material-symbols-outlined text-[18px] text-voltage-orange">apartment</span>
          </a>
          <a
            routerLink="/"
            fragment="manifesto-kedaulatan"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-highlight flex items-center"
          >
            Tentang Mandiri
          </a>

          @if (authService.isInitialized() && !authService.isLoggedIn()) {
            <div class="sm:hidden pt-2 mt-1 border-t border-hairline-subtle">
              <a
                routerLink="/register"
                (click)="closeMobileMenu()"
                data-testid="mobile-drawer-register-btn"
                class="w-full min-h-11 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">person_add</span>
                <span>Daftar Mitra (Gratis 0%)</span>
              </a>
            </div>
          }
        </nav>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeaderNavComponent {
  readonly authService = inject(AuthService);

  readonly activeTab = input<'login' | 'register' | null>(null);
  readonly activeWorker = input<PublicTechnicianProfile | null>(null);
  readonly isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
