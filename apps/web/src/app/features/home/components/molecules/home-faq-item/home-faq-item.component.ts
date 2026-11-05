import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqItem } from '../../../models/home.model';

@Component({
  selector: 'app-home-faq-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="border border-hairline-subtle rounded-xl bg-body-canvas overflow-hidden transition-colors"
      [class.border-hero-canvas]="isOpen()"
    >
      <button
        type="button"
        (click)="toggleItem.emit()"
        class="w-full p-space-lg flex items-center justify-between gap-space-md text-left font-button-label text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer min-h-[48px]"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="'faq-panel-' + faq().id"
        [id]="'faq-header-' + faq().id"
      >
        <span class="font-heading-h3 text-[16px] font-semibold text-on-surface leading-snug">
          {{ faq().question }}
        </span>
        <span
          class="material-symbols-outlined text-[20px] text-ink-secondary transition-transform duration-200 shrink-0"
          [class.rotate-180]="isOpen()"
        >
          expand_more
        </span>
      </button>

      @if (isOpen()) {
        <div
          [id]="'faq-panel-' + faq().id"
          role="region"
          [attr.aria-labelledby]="'faq-header-' + faq().id"
          class="px-space-lg pb-space-lg pt-1 text-ink-secondary font-body-default text-body-default leading-relaxed border-t border-hairline-subtle/50"
        >
          {{ faq().answer }}
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFaqItemComponent {
  readonly faq = input.required<FaqItem>();
  readonly isOpen = input<boolean>(false);
  readonly toggleItem = output<void>();
}
