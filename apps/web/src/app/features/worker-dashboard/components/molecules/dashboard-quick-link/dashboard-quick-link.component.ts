import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-quick-link',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-xs"
    >
      <span class="material-symbols-outlined text-white/50 text-[16px]">link</span>
      <span class="font-mono text-white/90 select-all truncate max-w-[200px] sm:max-w-[260px]">
        {{ urlText() }}
      </span>
      <button
        type="button"
        (click)="copyLink.emit()"
        class="h-8 px-2.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
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

