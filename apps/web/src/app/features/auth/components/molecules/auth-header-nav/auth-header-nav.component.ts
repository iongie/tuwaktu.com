import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-header-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="w-full bg-body-canvas shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a
            routerLink="/"
            class="flex items-center gap-2 transition-opacity hover:opacity-90 min-h-[44px]"
            aria-label="Kembali ke Beranda Tuwaktu"
          >
            <div class="w-7 h-7 bg-primary rounded flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-on-primary text-[18px]">schedule</span>
            </div>
            <span class="font-heading-h3 text-heading-h3 tracking-tight text-ink-on-light font-bold">
              TUWAKTU
            </span>
          </a>
          <div
            class="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded"
            role="status"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-voltage-orange animate-pulse"></span>
            <span class="font-micro-uppercase text-micro-uppercase text-on-surface-variant uppercase font-semibold">
              PORTAL KEDAULATAN KERJA
            </span>
          </div>
        </div>

        <nav
          class="flex items-center bg-surface-container-low p-1 rounded"
          aria-label="Navigasi Autentikasi"
        >
          <a
            routerLink="/login"
            [attr.aria-current]="activeTab() === 'login' ? 'page' : null"
            class="px-3.5 py-1.5 font-button-label text-button-label rounded transition-colors min-h-[44px] flex items-center justify-center"
            [class.bg-primary]="activeTab() === 'login'"
            [class.text-on-primary]="activeTab() === 'login'"
            [class.text-on-surface-variant]="activeTab() !== 'login'"
            [class.hover:text-on-surface]="activeTab() !== 'login'"
          >
            Masuk
          </a>
          <a
            routerLink="/register"
            [attr.aria-current]="activeTab() === 'register' ? 'page' : null"
            class="px-3.5 py-1.5 font-button-label text-button-label rounded transition-colors min-h-[44px] flex items-center justify-center"
            [class.bg-primary]="activeTab() === 'register'"
            [class.text-on-primary]="activeTab() === 'register'"
            [class.text-on-surface-variant]="activeTab() !== 'register'"
            [class.hover:text-on-surface]="activeTab() !== 'register'"
          >
            Daftar Akun Baru
          </a>
        </nav>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeaderNavComponent {
  readonly activeTab = input.required<'login' | 'register'>();
}
