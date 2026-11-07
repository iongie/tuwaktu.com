import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AltchaStatus } from '../../../models/auth.models';

@Component({
  selector: 'app-altcha-captcha-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-1.5">
      <div
        class="w-full rounded-lg border px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors min-h-[52px]"
        [class.bg-surface-container-low]="status() === 'idle' || status() === 'verifying'"
        [class.border-hairline-light]="status() === 'idle' || status() === 'verifying'"
        [class.bg-success-surface]="status() === 'verified'"
        [class.border-whatsapp-green]="status() === 'verified'"
        [class.bg-error-surface]="status() === 'error'"
        [class.border-error]="status() === 'error'"
      >
        <button
          type="button"
          role="checkbox"
          [attr.aria-checked]="status() === 'verified'"
          [attr.aria-busy]="status() === 'verifying'"
          [disabled]="disabled() || status() === 'verifying' || status() === 'verified'"
          (click)="startVerification()"
          data-testid="altcha-verify-button"
          class="flex items-center gap-3 text-left flex-1 min-h-[44px] cursor-pointer disabled:cursor-default bg-transparent border-0 p-0 focus-visible:outline-2 focus-visible:outline-(--voltage-orange) focus-visible:outline-offset-2 rounded"
        >
          <span
            class="w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-colors"
            [class.bg-body-canvas]="status() === 'idle'"
            [class.border-ink-secondary]="status() === 'idle'"
            [class.bg-surface-container-high]="status() === 'verifying'"
            [class.border-ink-on-light]="status() === 'verifying'"
            [class.bg-whatsapp-green]="status() === 'verified'"
            [class.border-whatsapp-green]="status() === 'verified'"
            [class.text-white]="status() === 'verified'"
            [class.bg-body-canvas]="status() === 'error'"
            [class.border-error]="status() === 'error'"
            [class.text-error]="status() === 'error'"
          >
            @if (status() === 'verifying') {
              <span class="material-symbols-outlined text-[16px] animate-spin text-ink-on-light">
                progress_activity
              </span>
            } @else if (status() === 'verified') {
              <span class="material-symbols-outlined text-[16px]">check</span>
            } @else if (status() === 'error') {
              <span class="material-symbols-outlined text-[16px]">priority_high</span>
            }
          </span>

          <span class="flex flex-col">
            <span class="font-body-strong text-body-strong text-ink-on-light">
              @if (status() === 'verifying') {
                Memverifikasi bukti kriptografi perangkat...
              } @else if (status() === 'verified') {
                Perangkat terverifikasi aman (Bebas Bot)
              } @else if (status() === 'error') {
                Gagal memuat tantangan keamanan
              } @else {
                Saya bukan robot (Verifikasi Keamanan Mandiri)
              }
            </span>
            <span class="font-caption text-caption text-ink-secondary">
              @if (status() === 'verified') {
                Bukti kerja SHA-256 tervalidasi tanpa pelacak pihak ketiga
              } @else if (status() === 'error') {
                {{ errorMessage() }}
              } @else {
                Proteksi Proof-of-Work ALTCHA lokal tanpa pelacakan privasi
              }
            </span>
          </span>
        </button>

        <div class="flex items-center gap-2 shrink-0">
          @if (status() === 'error') {
            <button
              type="button"
              (click)="startVerification()"
              data-testid="altcha-retry-button"
              class="px-2.5 py-1.5 min-h-[44px] rounded bg-body-canvas hover:bg-surface-container text-ink-on-light font-button-label text-caption border border-hairline-light cursor-pointer focus-visible:outline-2 focus-visible:outline-(--voltage-orange)"
            >
              Muat Ulang
            </button>
          }
          <div
            class="hidden sm:flex flex-col items-end text-right select-none pl-2 border-l border-hairline-subtle"
          >
            <span class="font-mono-rate text-[11px] font-bold text-ink-on-light tracking-wider">
              ALTCHA
            </span>
            <span class="font-caption text-[10px] text-ink-secondary">SHA-256 PoW</span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AltchaCaptchaFieldComponent {
  private readonly authService = inject(AuthService);

  readonly disabled = input<boolean>(false);
  readonly resetTick = input<number>(0);
  readonly verifiedPayload = output<string>();

  readonly status = signal<AltchaStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly currentPayload = signal<string>('');

  private lastResetTick = 0;

  constructor() {
    effect(() => {
      const tick = this.resetTick();
      if (tick !== this.lastResetTick) {
        this.lastResetTick = tick;
        this.reset();
      }
    });
  }

  reset(): void {
    this.status.set('idle');
    this.errorMessage.set('');
    this.currentPayload.set('');
    this.verifiedPayload.emit('');
  }

  async startVerification(): Promise<void> {
    if (this.disabled() || this.status() === 'verifying' || this.status() === 'verified') {
      return;
    }

    this.status.set('verifying');
    this.errorMessage.set('');

    try {
      const challenge = await firstValueFrom(this.authService.fetchAltchaChallenge());
      if (!challenge) {
        this.status.set('error');
        this.errorMessage.set('Server tantangan tidak merespons. Silakan tekan Muat Ulang.');
        this.verifiedPayload.emit('');
        return;
      }

      const solvedPayload = await this.authService.solveAltchaChallenge(challenge);
      if (!solvedPayload) {
        this.status.set('error');
        this.errorMessage.set('Gagal menyelesaikan verifikasi kriptografi. Silakan coba lagi.');
        this.verifiedPayload.emit('');
        return;
      }

      this.currentPayload.set(solvedPayload);
      this.status.set('verified');
      this.verifiedPayload.emit(solvedPayload);
    } catch {
      this.status.set('error');
      this.errorMessage.set('Terjadi gangguan jaringan saat memuat tantangan keamanan.');
      this.verifiedPayload.emit('');
    }
  }
}
