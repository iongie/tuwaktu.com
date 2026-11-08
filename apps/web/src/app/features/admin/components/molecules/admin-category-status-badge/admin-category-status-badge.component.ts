import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-category-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isActive()) {
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
        data-testid="category-badge-active"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        Aktif di Katalog
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-hairline-subtle"
        data-testid="category-badge-inactive"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>
        Nonaktif
      </span>
    }
  `,
})
export class AdminCategoryStatusBadgeComponent {
  readonly isActive = input<boolean>(true);
}
