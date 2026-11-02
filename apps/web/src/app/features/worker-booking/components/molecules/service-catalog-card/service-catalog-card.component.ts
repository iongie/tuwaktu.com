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
      class="p-4 sm:p-5 cursor-pointer select-none"
      [ngClass]="isSelected() ? 'm3-card-tonal-selected' : 'm3-card-outlined'"
      (click)="selectService.emit(serviceItem())"
      (keydown.enter)="selectService.emit(serviceItem())"
      (keydown.space)="$event.preventDefault(); selectService.emit(serviceItem())"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h4 class="text-sm sm:text-base font-semibold text-[#141413]">
              {{ serviceItem().name }}
            </h4>
            @if (isSelected()) {
              <span
                class="text-[11px] font-mono uppercase bg-[#C84B31] text-white px-2.5 py-0.5 rounded font-semibold"
              >
                Dipilih
              </span>
            }
          </div>
          <p class="text-xs sm:text-sm text-[#4E4642] mt-1.5 leading-relaxed">
            {{ serviceItem().description }}
          </p>
          <span class="inline-block mt-2.5 text-xs font-mono text-[#4E4642]">
            Estimasi durasi: {{ serviceItem().duration_minutes }} menit
          </span>
        </div>
        <div class="text-left sm:text-right sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D2C4BE]/50">
          <div class="text-base sm:text-lg font-mono font-bold text-[#C84B31]">
            {{ formattedPrice() }}
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ServiceCatalogCardComponent {
  readonly serviceItem = input.required<PublicServiceCatalogItem>();
  readonly isSelected = input<boolean>(false);
  readonly formattedPrice = input.required<string>();
  readonly selectService = output<PublicServiceCatalogItem>();
}

