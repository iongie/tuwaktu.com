import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-footer-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="w-full bg-body-canvas border-t border-hairline-subtle" role="contentinfo">
      <div class="max-w-7xl mx-auto px-margin-desktop py-space-3xl space-y-space-2xl">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-space-2xl">
          <!-- Kolom 1: Identitas Brand & Pernyataan Misi -->
          <div class="md:col-span-5 space-y-space-sm">
            <div class="flex items-center gap-space-sm">
              <span
                class="font-heading-h3 text-heading-h3 font-bold text-ink-on-light uppercase tracking-tight"
              >
                TUWAKTU
              </span>
              <span
                class="px-space-xs py-0.5 bg-hero-canvas text-ink-on-dark font-micro-uppercase text-micro-uppercase uppercase tracking-wider rounded"
              >
                MANDIRI
              </span>
            </div>

            <p class="font-body-default text-body-default text-ink-secondary leading-relaxed max-w-sm">
              Infrastruktur protokol pemesanan mandiri untuk praktisi, teknisi HVAC, dan spesialis independen di Indonesia. Menghubungkan keahlian langsung ke pemesan tanpa potongan komisi.
            </p>

            <div class="flex items-center gap-space-xs text-caption font-mono-rate text-success pt-1">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              <span>100% BEBAS POTONGAN PLATFORM</span>
            </div>
          </div>

          <!-- Kolom 2: Direktori Layanan -->
          <div class="md:col-span-3 space-y-space-sm">
            <h3 class="font-micro-uppercase text-caption font-bold text-on-surface uppercase tracking-wider">
              Katalog Keahlian
            </h3>
            <ul class="space-y-2 text-caption font-body-default text-ink-secondary">
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors"
                >
                  Servis &amp; Pasang AC
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors"
                >
                  Sanitasi &amp; Deep Clean
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors"
                >
                  Instalasi Listrik Presisi
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors"
                >
                  Elektronik &amp; Audio Rumah
                </a>
              </li>
            </ul>
          </div>

          <!-- Kolom 3: Portal Mitra & Kedaulatan -->
          <div class="md:col-span-4 space-y-space-sm">
            <h3 class="font-micro-uppercase text-caption font-bold text-on-surface uppercase tracking-wider">
              Portal Pekerja Mandiri
            </h3>
            <ul class="space-y-2 text-caption font-body-default text-ink-secondary">
              <li>
                <a
                  routerLink="/register"
                  class="hover:text-on-surface transition-colors flex items-center gap-1 font-semibold text-voltage-orange"
                >
                  <span>Daftar Sebagai Mitra (Gratis 0%)</span>
                  <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/login"
                  class="hover:text-on-surface transition-colors"
                >
                  Masuk ke Akun Teknisi
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="manifesto-kedaulatan"
                  class="hover:text-on-surface transition-colors"
                >
                  Manifesto 0% Komisi
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="kalkulator-hemat"
                  class="hover:text-on-surface transition-colors"
                >
                  Kalkulator Penghematan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Baris Bawah: Copyright & Telemetri Jaringan -->
        <div
          class="pt-space-lg border-t border-hairline-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm font-caption text-caption text-ink-secondary"
        >
          <p>© 2025 Tuwaktu. Platform Mandiri Mandat Bebas Komisi.</p>
          <p class="font-mono-rate text-ink-disabled">
            STATUS SISTEM: NORMAL • BUFFER DISPATCH SIAGA
          </p>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFooterSectionComponent {}
