import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="fixed inset-0 bg-black/60 backdrop-blur-xs w-full h-full cursor-default border-none p-0"
          (click)="cancelled.emit()"
          aria-label="Tutup Dialog Konfirmasi"
          id="logoutBackdropBtn"
        ></button>

        <div
          class="relative bg-body-canvas rounded-xl max-w-sm w-full p-6 shadow-2xl border border-hairline-subtle space-y-4 z-10"
          role="alertdialog"
          aria-labelledby="logoutModalTitle"
          aria-describedby="logoutModalDesc"
          (keydown.escape)="cancelled.emit()"
          tabindex="-1"
        >
          <div class="flex items-start gap-3.5">
            <div
              class="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200"
            >
              <span class="material-symbols-outlined text-[22px]">logout</span>
            </div>
            <div class="space-y-1">
              <h3 id="logoutModalTitle" class="text-base font-bold text-ink-on-light leading-snug">
                Konfirmasi Keluar Akun
              </h3>
              <p id="logoutModalDesc" class="text-xs text-ink-secondary leading-relaxed">
                Apakah Anda yakin ingin mengakhiri sesi kerja mandiri Anda? Sesi aktif di perangkat ini akan dibersihkan.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline-subtle/50">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="px-4 py-2 min-h-[44px] rounded-lg border border-hairline-subtle text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              id="cancelLogoutBtn"
            >
              Batal
            </button>
            <button
              type="button"
              (click)="confirmed.emit()"
              class="px-4 py-2 min-h-[44px] rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              id="confirmLogoutBtn"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LogoutConfirmModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
