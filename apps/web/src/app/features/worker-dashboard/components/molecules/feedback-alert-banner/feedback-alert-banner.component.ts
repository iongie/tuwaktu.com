import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback-alert-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message()) {
      <div
        role="alert"
        class="p-4 rounded-xl text-sm flex items-center justify-between gap-3 shadow-xs border transition-all"
        [class.bg-emerald-50]="type() === 'success'"
        [class.text-emerald-950]="type() === 'success'"
        [class.border-emerald-300]="type() === 'success'"
        [class.bg-red-50]="type() === 'error'"
        [class.text-red-950]="type() === 'error'"
        [class.border-red-300]="type() === 'error'"
      >
        <div class="flex items-center gap-2.5">
          <span
            class="material-symbols-outlined text-base shrink-0"
            [class.text-emerald-700]="type() === 'success'"
            [class.text-red-700]="type() === 'error'"
          >
            {{ type() === 'success' ? 'check_circle' : 'warning' }}
          </span>
          <span class="font-medium">{{ message() }}</span>
        </div>

        <button
          type="button"
          (click)="dismiss.emit()"
          class="text-xs font-semibold underline cursor-pointer shrink-0 min-h-[36px] px-2 flex items-center"
          [class.text-emerald-800]="type() === 'success'"
          [class.hover:text-emerald-950]="type() === 'success'"
          [class.text-red-800]="type() === 'error'"
          [class.hover:text-red-950]="type() === 'error'"
        >
          Tutup
        </button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackAlertBannerComponent {
  readonly message = input<string | null>(null);
  readonly type = input<'success' | 'error'>('success');
  readonly dismiss = output<void>();
}

