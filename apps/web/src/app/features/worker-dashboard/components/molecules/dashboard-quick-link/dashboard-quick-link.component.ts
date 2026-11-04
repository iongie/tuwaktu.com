import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-quick-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-9 px-3 rounded-lg bg-surface-highlight border border-hairline-subtle flex items-center gap-2 text-xs text-on-surface shrink-0"
    >
      <span class="material-symbols-outlined text-ink-secondary text-[16px]">link</span>
      <span class="font-mono text-ink-secondary select-all truncate max-w-[200px] sm:max-w-[260px]">
        {{ urlText() }}
      </span>
      <button
        type="button"
        (click)="copyLink.emit()"
        class="h-6 px-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        title="Salin tautan publik"
      >
        <span class="material-symbols-outlined text-[14px]">
          {{ feedbackMessage() ? 'check' : 'content_copy' }}
        </span>
        <span>{{ feedbackMessage() || 'Salin' }}</span>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardQuickLinkComponent {
  readonly urlText = input.required<string>();
  readonly feedbackMessage = input<string | null>(null);
  readonly copyLink = output<void>();
}

