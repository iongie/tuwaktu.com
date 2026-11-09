import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-category-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isActive()) {
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono-rate text-[10px] font-bold uppercase tracking-wider bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/30"
        data-testid="category-badge-active"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse"></span>
        Aktif di Katalog
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono-rate text-[10px] font-bold uppercase tracking-wider bg-surface-highlight text-ink-secondary border border-hairline-light"
        data-testid="category-badge-inactive"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-ink-disabled"></span>
        Nonaktif
      </span>
    }
  `,
})
export class AdminCategoryStatusBadgeComponent {
  readonly isActive = input<boolean>(true);
}
