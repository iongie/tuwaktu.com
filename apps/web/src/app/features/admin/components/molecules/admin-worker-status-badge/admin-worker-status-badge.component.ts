import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-worker-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status() === 'ACTIVE') {
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono-rate text-[10px] font-bold uppercase tracking-wider bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/30"
        data-testid="status-badge-active"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse"></span>
        Aktif
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono-rate text-[10px] font-bold uppercase tracking-wider bg-[#fee2e2] text-[#991b1b] border border-red-300"
        data-testid="status-badge-suspended"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>
        Ditangguhkan
      </span>
    }
  `,
})
export class AdminWorkerStatusBadgeComponent {
  readonly status = input<string>('ACTIVE');
}

