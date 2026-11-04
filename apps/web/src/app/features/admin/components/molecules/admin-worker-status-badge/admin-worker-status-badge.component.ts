import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-worker-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status() === 'ACTIVE') {
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
        data-testid="status-badge-active"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        Aktif
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30"
        data-testid="status-badge-suspended"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        Ditangguhkan
      </span>
    }
  `,
})
export class AdminWorkerStatusBadgeComponent {
  readonly status = input<string>('ACTIVE');
}

