import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-footer-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="w-full bg-surface-container-low py-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] mt-auto">
      <div
        class="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
      >
        <div class="flex flex-col gap-1">
          <span class="font-body-strong text-body-strong text-on-surface">
            Mandiri Penuh. Tanpa Potongan Komisi.
          </span>
          <p class="font-caption text-caption text-ink-secondary max-w-xl">
            Tuwaktu dirancang khusus bagi praktisi spesialis mandiri. Jadwal, tarif radius, dan
            komunikasi WhatsApp berada 100% di bawah kendali Anda sendiri tanpa campur tangan
            perantara.
          </p>
        </div>

        <div class="flex items-center gap-6">
          <div
            class="flex items-center gap-2 bg-body-canvas px-4 py-2 rounded shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
          >
            <span class="material-symbols-outlined text-whatsapp-green text-[18px]">
              verified_user
            </span>
            <div class="flex flex-col text-left">
              <span class="font-micro-uppercase text-micro-uppercase text-on-surface-variant uppercase">
                PROTOKOL KEAMANAN
              </span>
              <span class="font-mono-rate text-mono-rate text-on-surface">
                END-TO-END VERIFIED
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 text-ink-secondary">
            <span class="material-symbols-outlined text-[16px]">lock</span>
            <span class="font-caption text-caption">Tanpa OAuth Pihak Ketiga</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFooterBarComponent {}
