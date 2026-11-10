import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-feedback-alert-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message()) {
      <div
        [attr.role]="type() === 'success' ? 'status' : 'alert'"
        [attr.data-testid]="testId()"
        (mouseenter)="pauseAutoDismiss()"
        (mouseleave)="resumeAutoDismiss()"
        (touchstart)="pauseAutoDismiss()"
        (touchend)="resumeAutoDismiss()"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] p-4 rounded-xl text-sm flex items-center justify-between gap-3 shadow-lg border backdrop-blur-md transition-all duration-300"
        [class.bg-emerald-50/95]="type() === 'success'"
        [class.text-emerald-950]="type() === 'success'"
        [class.border-emerald-300]="type() === 'success'"
        [class.shadow-emerald-950/10]="type() === 'success'"
        [class.bg-red-50/95]="type() === 'error'"
        [class.text-red-950]="type() === 'error'"
        [class.border-red-300]="type() === 'error'"
        [class.shadow-red-950/10]="type() === 'error'"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span
            class="material-symbols-outlined text-xl shrink-0"
            [class.text-emerald-700]="type() === 'success'"
            [class.text-red-700]="type() === 'error'"
          >
            {{ type() === 'success' ? 'check_circle' : 'warning' }}
          </span>
          <div class="flex flex-col min-w-0">
            @if (title()) {
              <span
                class="font-bold text-xs uppercase tracking-wider font-mono-rate"
                [class.text-emerald-900]="type() === 'success'"
                [class.text-red-950]="type() === 'error'"
              >
                {{ title() }}
              </span>
            }
            <span class="font-medium text-xs sm:text-sm leading-snug break-words">
              {{ message() }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          @if (hasRetry()) {
            <button
              type="button"
              [attr.data-testid]="retryTestId()"
              (click)="retryAction.emit()"
              class="min-h-[40px] px-3.5 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-xs font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-none"
              aria-label="Coba lagi"
            >
              <span class="material-symbols-outlined text-[16px]">sync</span>
              <span>{{ retryLabel() }}</span>
            </button>
          }

          <button
            type="button"
            [attr.data-testid]="dismissTestId()"
            (click)="dismiss.emit()"
            class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer transition-colors"
            [class.text-emerald-800]="type() === 'success'"
            [class.hover:bg-emerald-100/60]="type() === 'success'"
            [class.hover:text-emerald-950]="type() === 'success'"
            [class.text-red-800]="type() === 'error'"
            [class.hover:bg-red-100/60]="type() === 'error'"
            [class.hover:text-red-950]="type() === 'error'"
            aria-label="Tutup notifikasi"
          >
            <span class="sr-only">Tutup</span>
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackAlertBannerComponent implements OnDestroy {
  readonly message = input<string | null>(null);
  readonly type = input<'success' | 'error'>('success');
  readonly title = input<string | null>(null);
  readonly autoDismiss = input<boolean>(true);
  readonly durationMs = input<number>(4000);
  readonly hasRetry = input<boolean>(false);
  readonly retryLabel = input<string>('Coba Lagi');
  readonly testId = input<string | null>(null);
  readonly retryTestId = input<string | null>(null);
  readonly dismissTestId = input<string | null>(null);

  readonly dismiss = output<void>();
  readonly retryAction = output<void>();

  private readonly platformId = inject(PLATFORM_ID);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private isPaused = false;

  constructor() {
    effect(() => {
      const msg = this.message();
      const alertType = this.type();
      const shouldDismiss = this.autoDismiss();
      const duration = this.durationMs();

      this.clearTimer();
      this.isPaused = false;

      if (
        isPlatformBrowser(this.platformId) &&
        msg &&
        alertType === 'success' &&
        shouldDismiss
      ) {
        this.startAutoDismiss(duration);
      }
    });
  }

  pauseAutoDismiss(): void {
    if (this.dismissTimer !== null) {
      this.isPaused = true;
      this.clearTimer();
    }
  }

  resumeAutoDismiss(): void {
    if (
      this.isPaused &&
      this.type() === 'success' &&
      this.autoDismiss() &&
      this.message() &&
      isPlatformBrowser(this.platformId)
    ) {
      this.isPaused = false;
      this.startAutoDismiss(this.durationMs());
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startAutoDismiss(ms: number): void {
    this.clearTimer();
    this.dismissTimer = setTimeout(() => {
      this.dismiss.emit();
    }, ms);
  }

  private clearTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
