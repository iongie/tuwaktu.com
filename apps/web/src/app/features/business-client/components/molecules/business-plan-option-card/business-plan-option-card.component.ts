import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BusinessPlanOption,
  BusinessPlanTier,
  formatRupiahIdr,
} from '../../../models/business-inquiry.model';

@Component({
  selector: 'app-business-plan-option-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-xl p-5 bg-body-canvas border transition-colors flex flex-col gap-3.5"
      [class.border-voltage-orange]="isSelected()"
      [class.ring-2]="isSelected()"
      [class.ring-voltage-orange]="isSelected()"
      [class.border-hairline-subtle]="!isSelected()"
    >
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="font-mono-rate text-[11px] uppercase tracking-wider text-ink-secondary font-semibold">
            {{ plan().audienceLabel }}
          </span>
          <h3 class="font-heading-h3 text-heading-h3 font-bold text-ink-on-light">
            {{ plan().name }}
          </h3>
        </div>

        <button
          type="button"
          (click)="selected.emit(plan().tier)"
          [attr.aria-pressed]="isSelected()"
          [attr.data-testid]="'select-plan-' + plan().tier"
          class="min-h-11 px-4 py-2 rounded-lg font-button-label text-xs font-bold transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-(--voltage-orange) focus-visible:outline-offset-2"
          [class.bg-voltage-orange]="isSelected()"
          [class.text-white]="isSelected()"
          [class.bg-surface-highlight]="!isSelected()"
          [class.text-ink-on-light]="!isSelected()"
          [class.hover:bg-surface-container]="!isSelected()"
        >
          {{ isSelected() ? 'Paket Terpilih' : 'Pilih Paket Ini' }}
        </button>
      </div>

      <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
        {{ plan().summary }}
      </p>

      <div class="p-3 rounded-lg bg-surface-container-low border border-hairline-subtle flex flex-wrap items-baseline justify-between gap-2">
        <div class="flex items-baseline gap-1">
          <span class="font-mono-rate text-base font-bold text-ink-on-light tabular-nums">
            Mulai {{ formatRupiah(plan().baseMonthlyFee) }}
          </span>
          <span class="text-xs text-ink-secondary">/ bulan</span>
        </div>
        <span class="font-mono-rate text-xs text-ink-secondary tabular-nums">
          + {{ formatRupiah(plan().perUnitFee) }} / unit
        </span>
      </div>

      <ul class="space-y-2 text-xs text-on-surface-variant">
        @for (item of plan().scopeItems; track item) {
          <li class="flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] text-whatsapp-green shrink-0 mt-0.5">
              check_circle
            </span>
            <span class="leading-relaxed">{{ item }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanOptionCardComponent {
  readonly plan = input.required<BusinessPlanOption>();
  readonly isSelected = input<boolean>(false);
  readonly selected = output<BusinessPlanTier>();

  formatRupiah(amount: number): string {
    return formatRupiahIdr(amount);
  }
}

