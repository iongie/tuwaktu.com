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
      class="p-5 sm:p-6 cursor-pointer select-none transition-all rounded-xl relative"
      [ngClass]="isSelected() ? 'bg-white ring-2 ring-[#ff5500] border-transparent shadow-md' : 'bg-white border border-[#cccccc] hover:border-[#121212] shadow-sm'"
      (click)="selectService.emit(serviceItem())"
      (keydown.enter)="selectService.emit(serviceItem())"
      (keydown.space)="$event.preventDefault(); selectService.emit(serviceItem())"
    >
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div class="flex-1 space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            @if (isSelected()) {
              <span
                class="inline-block px-2 py-0.5 rounded bg-[#ff5500] text-white font-mono text-[10px] uppercase font-bold tracking-wider"
              >
                PILIHAN TERPILIH
              </span>
            } @else {
              <span
                class="inline-block px-2 py-0.5 rounded bg-[#f3f3f3] text-[#666666] font-mono text-[10px] uppercase font-semibold tracking-wider"
              >
                TERSEDIA
              </span>
            }
            <h4 class="text-base sm:text-lg font-bold text-[#121212] tracking-tight">
              {{ serviceItem().name }}
            </h4>
          </div>
          <p class="text-xs sm:text-sm text-[#666666] leading-relaxed">
            {{ serviceItem().description }}
          </p>
          <div class="flex items-center gap-3 pt-1 text-xs font-mono text-[#666666]">
            <span class="inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-[#1e4d3b]"></span>
              Durasi: {{ serviceItem().duration_minutes }} menit
            </span>
          </div>
        </div>
        <div class="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#cccccc]/40">
          <div class="text-base sm:text-lg font-mono-rate font-bold text-[#121212]">
            {{ formattedPrice() }}
          </div>
          <span class="text-[11px] font-mono text-[#666666]">
            {{ (serviceItem().rate_type || '').toUpperCase() === 'UNIT' ? 'Per Sesi' : 'Per Jam' }}
          </span>
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
