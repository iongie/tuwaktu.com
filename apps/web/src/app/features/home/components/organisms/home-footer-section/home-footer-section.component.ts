import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-footer-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="w-full bg-body-canvas border-t border-hairline-subtle" role="contentinfo">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
          <!-- Kolom 1: Identitas Brand -->
          <div class="md:col-span-5 space-y-3">
            <div class="flex items-center gap-2">
              <span
                class="font-heading-h3 text-heading-h3 font-bold text-ink-on-light uppercase tracking-tight"
              >
                TUWAKTU
              </span>
            </div>

            <p class="font-body-default text-body-default text-ink-secondary leading-relaxed max-w-sm">
              Platform pemesanan jasa teknisi AC, perbaikan listrik, dan bersih-bersih rumah langsung ke WhatsApp pekerja tanpa potongan komisi.
            </p>
          </div>

          <!-- Kolom 2: Direktori Layanan -->
          <div class="md:col-span-3 space-y-3">
            <h3 class="font-micro-uppercase text-caption font-bold text-on-surface uppercase tracking-wider">
              Kategori Layanan
            </h3>
            <ul class="space-y-1 text-caption font-body-default text-ink-secondary">
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Servis &amp; Pasang AC
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Bersih-Bersih Rumah
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Instalasi &amp; Perbaikan Listrik
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="katalog-disiplin"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Servis Elektronik
                </a>
              </li>
            </ul>
          </div>

          <!-- Kolom 3: Untuk Teknisi & Pekerja -->
          <div class="md:col-span-4 space-y-3">
            <h3 class="font-micro-uppercase text-caption font-bold text-on-surface uppercase tracking-wider">
              Untuk Teknisi &amp; Pekerja
            </h3>
            <ul class="space-y-1 text-caption font-body-default text-ink-secondary">
              <li>
                <a
                  routerLink="/register"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center gap-1 font-semibold text-voltage-orange"
                >
                  <span>Daftar Sebagai Mitra (Gratis 0%)</span>
                  <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/login"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Masuk ke Akun Teknisi
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="manifesto-kedaulatan"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Kenapa 0% Komisi
                </a>
              </li>
              <li>
                <a
                  routerLink="/bisnis"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center font-semibold text-ink-on-light"
                >
                  Paket Klien Bisnis &amp; Properti
                </a>
              </li>
              <li>
                <a
                  routerLink="/"
                  fragment="kalkulator-hemat"
                  class="hover:text-on-surface transition-colors py-1.5 inline-flex items-center"
                >
                  Kalkulator Penghematan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Baris Bawah: Copyright -->
        <div
          class="pt-6 border-t border-hairline-subtle flex flex-col sm:flex-row items-center justify-between gap-2 font-caption text-caption text-ink-secondary text-center sm:text-left"
        >
          <p>© 2025 Tuwaktu. Pemesanan jasa teknisi langsung tanpa komisi.</p>
          <p class="text-ink-disabled">Jabodetabek &amp; Sekitarnya</p>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFooterSectionComponent {}
