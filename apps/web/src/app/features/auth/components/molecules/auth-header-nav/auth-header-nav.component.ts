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
  template: `
    <!-- Top Navigation Bar: Diselaraskan dengan Navbar Beranda dari Stitch Screen 807105efcba440adba559c3039aa034a -->
    <header
      class="sticky top-0 w-full z-50 bg-body-canvas/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-hairline-subtle/40"
    >
      <div
        class="h-16 max-w-7xl mx-auto px-margin-desktop flex items-center justify-between gap-gutter"
      >
        <!-- Sisi Kiri: Brand Identity, Verifikasi Badge & Navigasi -->
        <div class="flex items-center gap-space-xl">
          <a
            routerLink="/"
            class="flex items-center gap-space-sm cursor-pointer min-h-[44px]"
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
            class="hidden lg:flex items-center gap-space-xs px-space-sm py-1 bg-surface-warm-promo text-promo-ink rounded"
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
          </nav>
        </div>

        <!-- Sisi Kanan: Pencarian, Bantuan & Dropdown Akun Profil -->
        <div class="flex items-center gap-space-md relative">
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

          <!-- Pusat Bantuan -->
          <a
            routerLink="/"
            class="p-2 text-ink-secondary hover:text-on-surface hover:bg-surface-highlight transition-colors rounded flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
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
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeaderNavComponent {
  private readonly router = inject(Router);

  readonly activeTab = input<'login' | 'register' | null>(null);
  readonly searchTechnicianSlug = signal<string>('');

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
