import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookingNavAccountMenuComponent } from '../../../../worker-booking/components/molecules/booking-nav-account-menu/booking-nav-account-menu.component';

@Component({
  selector: 'app-auth-header-nav',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BookingNavAccountMenuComponent,
  ],
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()',
  },
  template: `
    <!-- Top Navigation Bar: Diselaraskan dengan Navbar Beranda dari Stitch Screen 807105efcba440adba559c3039aa034a -->
    <header
      class="sticky top-0 w-full z-50 bg-body-canvas/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-hairline-subtle/40"
    >
      <div
        class="h-16 max-w-7xl mx-auto px-4 sm:px-margin-desktop flex items-center justify-between gap-2 sm:gap-gutter"
      >
        <!-- Sisi Kiri: Brand Identity, Verifikasi Badge & Navigasi -->
        <div class="flex items-center gap-3 sm:gap-space-xl min-w-0">
          <a
            routerLink="/"
            class="flex items-center gap-space-sm cursor-pointer min-h-[44px] shrink-0"
            aria-label="Kembali ke Beranda Tuwaktu"
          >
            <span
              class="font-heading-h3 text-heading-h3 font-bold tracking-tight text-ink-on-light uppercase"
            >
              TUWAKTU
            </span>
            <span
              class="px-space-xs py-0.5 bg-hero-canvas text-ink-on-dark font-micro-uppercase text-micro-uppercase uppercase tracking-wider rounded"
            >
              MANDIRI
            </span>
          </a>

          <div
            class="hidden lg:flex items-center gap-space-xs px-space-sm py-1 bg-surface-warm-promo text-promo-ink rounded shrink-0"
          >
            <span class="material-symbols-outlined text-[14px] text-promo-ink">
              verified_user
            </span>
            <span
              class="font-caption text-caption font-semibold uppercase tracking-wider"
            >
              Verifikasi Pekerja
            </span>
          </div>

          <nav aria-label="Navigasi Utama" class="hidden md:flex items-center gap-space-xs">
            <a
              routerLink="/"
              fragment="spesialis-unggulan"
              class="px-space-md py-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-button-label text-button-label rounded cursor-pointer min-h-[44px] flex items-center"
            >
              Jelajah Pekerja
            </a>
            <a
              routerLink="/"
              fragment="katalog-disiplin"
              class="px-space-md py-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-button-label text-button-label rounded cursor-pointer min-h-[44px] flex items-center"
            >
              Katalog Layanan
            </a>
            <a
              routerLink="/"
              fragment="manifesto-kedaulatan"
              class="px-space-md py-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-button-label text-button-label rounded cursor-pointer min-h-[44px] flex items-center"
            >
              Tentang Mandiri
            </a>
            <a
              routerLink="/bisnis"
              class="px-space-md py-1.5 text-voltage-orange hover:bg-surface-warm-promo transition-colors font-button-label text-button-label rounded cursor-pointer min-h-[44px] flex items-center font-semibold"
            >
              Untuk Bisnis
            </a>
          </nav>
        </div>

        <!-- Sisi Kanan: Pencarian, Bantuan, Menu Mobile & Dropdown Akun Profil -->
        <div class="flex items-center gap-1.5 sm:gap-space-md relative shrink-0">
          <!-- Input Pencarian Cepat -->
          <div class="relative hidden lg:flex items-center">
            <span
              class="material-symbols-outlined absolute left-3 text-ink-disabled text-[18px]"
            >
              search
            </span>
            <input
              type="text"
              [ngModel]="searchTechnicianSlug()"
              (ngModelChange)="searchTechnicianSlug.set($event)"
              (keydown.enter)="executeTechnicianLookup()"
              placeholder="Cari keahlian atau area..."
              class="w-52 h-10 pl-9 pr-3 bg-surface-highlight hover:bg-surface-container focus:bg-body-canvas text-on-surface placeholder:text-ink-disabled font-body-default text-caption rounded transition-all outline-none focus:ring-1 focus:ring-accent-focus"
              aria-label="Cari keahlian atau area teknisi"
            />
          </div>

          <!-- Tombol Menu Mobile -->
          <button
            type="button"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-controls="mobile-primary-nav"
            data-testid="mobile-nav-menu-btn"
            class="md:hidden min-h-11 px-3 py-2 rounded-lg border border-hairline-light bg-surface-highlight hover:bg-surface-container text-ink-on-light text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">
              {{ isMobileMenuOpen() ? 'close' : 'menu' }}
            </span>
            <span>Menu</span>
          </button>

          <!-- Pusat Bantuan -->
          <a
            routerLink="/"
            class="hidden sm:flex p-2 text-ink-secondary hover:text-on-surface hover:bg-surface-highlight transition-colors rounded items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
            title="Pusat Bantuan"
            aria-label="Pusat Bantuan"
          >
            <span class="material-symbols-outlined text-[20px]">help_outline</span>
          </a>

          <!-- Garis Pemisah Vertikal Halus -->
          <div class="h-5 w-px bg-hairline-subtle hidden sm:block"></div>

          <!-- Komponen Dropdown Menu Profil Akun -->
          <app-booking-nav-account-menu />
        </div>
      </div>

      @if (isMobileMenuOpen()) {
        <nav
          id="mobile-primary-nav"
          aria-label="Navigasi Mobile"
          class="md:hidden bg-body-canvas border-t border-hairline-subtle px-4 py-3 flex flex-col gap-1"
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
            routerLink="/"
            fragment="manifesto-kedaulatan"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-highlight flex items-center"
          >
            Tentang Mandiri
          </a>
          <a
            routerLink="/bisnis"
            (click)="closeMobileMenu()"
            class="min-h-11 px-3 py-2 rounded-lg text-sm font-bold text-voltage-orange bg-surface-warm-promo hover:bg-surface-container flex items-center justify-between"
          >
            <span>Untuk Bisnis &amp; Properti</span>
            <span class="material-symbols-outlined text-[18px]">apartment</span>
          </a>
        </nav>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeaderNavComponent {
  private readonly router = inject(Router);

  readonly activeTab = input<'login' | 'register' | null>(null);
  readonly searchTechnicianSlug = signal<string>('');
  readonly isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  executeTechnicianLookup(): void {
    const raw = this.searchTechnicianSlug().trim().toLowerCase();
    if (!raw) return;

    if (raw.includes('sarah')) {
      this.router.navigate(['/', 'sarah-cleaning']);
    } else if (raw.includes('budi')) {
      this.router.navigate(['/', 'budi-santoso']);
    } else if (raw.includes('hendra')) {
      this.router.navigate(['/', 'hendra-listrik']);
    } else if (raw.includes('rian')) {
      this.router.navigate(['/', 'rian-audio']);
    } else if (
      raw.includes('ac') ||
      raw.includes('clean') ||
      raw.includes('listrik') ||
      raw.includes('elektronik') ||
      raw.includes('reparasi')
    ) {
      this.router.navigate(['/'], { fragment: 'katalog-disiplin' });
    } else {
      this.router.navigate(['/', raw]);
    }
  }
}
