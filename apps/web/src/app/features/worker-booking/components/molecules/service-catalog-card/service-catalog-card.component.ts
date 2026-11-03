import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicServiceCatalogItem } from '../../../models/worker-catalog.model';

@Component({
  selector: 'app-service-catalog-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="button"
      tabindex="0"
      [attr.aria-pressed]="isSelected()"
      class="p-space-lg rounded-xl cursor-pointer select-none transition-all relative"
      [ngClass]="isSelected() ? 'bg-surface-container-lowest shadow-md ring-2 ring-voltage-orange' : 'bg-surface-container-low hover:bg-surface-container shadow-sm opacity-85'"
      (click)="selectService.emit(serviceItem())"
      (keydown.enter)="selectService.emit(serviceItem())"
      (keydown.space)="$event.preventDefault(); selectService.emit(serviceItem())"
    >
      <div class="flex items-start justify-between">
        <div>
          @if (isSelected()) {
            <span class="inline-block px-space-xs py-0.5 rounded bg-voltage-orange text-ink-on-dark font-micro-uppercase text-micro-uppercase uppercase font-bold">
              PILIHAN TERPILIH
            </span>
          } @else {
            <span class="inline-block px-space-xs py-0.5 rounded bg-surface-container-high text-ink-secondary font-micro-uppercase text-micro-uppercase uppercase font-bold">
              STANDAR
            </span>
          }
          <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface mt-1">
            {{ serviceItem().name }}
          </h3>
        </div>
        <span class="font-mono-rate text-mono-rate font-bold text-on-surface">
          {{ formattedPrice() }}
        </span>
      </div>
      <p class="font-caption text-caption text-ink-secondary mt-2">
        {{ serviceItem().description }}
      </p>
    </div>
  `,
})
export class ServiceCatalogCardComponent {
  readonly serviceItem = input.required<PublicServiceCatalogItem>();
  readonly isSelected = input<boolean>(false);
  readonly formattedPrice = input.required<string>();
  readonly selectService = output<PublicServiceCatalogItem>();
}
