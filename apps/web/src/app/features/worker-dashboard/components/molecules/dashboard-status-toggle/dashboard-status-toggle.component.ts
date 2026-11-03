import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-status-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-between sm:justify-start gap-3 bg-white/10 px-4 py-2.5 rounded-lg border border-white/10"
    >
      <div class="flex flex-col">
        <span class="text-[11px] text-white/60">{{ titleLabel() }}</span>
        <span
          class="font-bold text-xs flex items-center gap-1.5"
          [class.text-emerald-400]="isOnline()"
          [class.text-gray-400]="!isOnline()"
        >
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-emerald-400]="isOnline()"
            [class.bg-gray-400]="!isOnline()"
            [class.animate-pulse]="isOnline()"
          ></span>
          {{ isOnline() ? onlineText() : offlineText() }}
        </span>
      </div>

      <button
        type="button"
        role="switch"
        [attr.aria-checked]="isOnline()"
        [attr.aria-label]="isOnline() ? 'Nonaktifkan status operasional' : 'Aktifkan status operasional'"
        (click)="toggleStatus.emit()"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--voltage-orange)"
        [class.bg-(--voltage-orange)]="isOnline()"
        [class.bg-gray-600]="!isOnline()"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          [class.translate-x-6]="isOnline()"
          [class.translate-x-1]="!isOnline()"
        ></span>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatusToggleComponent {
  readonly isOnline = input.required<boolean>();
  readonly titleLabel = input<string>('Penerimaan Pesanan');
  readonly onlineText = input<string>('ONLINE • SIAP TERIMA');
  readonly offlineText = input<string>('OFFLINE • ISTIRAHAT');
  readonly toggleStatus = output<void>();
}

