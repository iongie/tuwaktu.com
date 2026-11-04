import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';
import { RatesCatalogTabType } from '../../molecules/rates-filter-tabs/rates-filter-tabs.component';
import { RatesServiceCardComponent } from '../../molecules/rates-service-card/rates-service-card.component';

@Component({
  selector: 'app-worker-service-catalog-panel',
  standalone: true,
  imports: [CommonModule, RatesServiceCardComponent],
  template: `
    <div class="space-y-6">
      @for (item of services(); track item.id) {
        <app-rates-service-card
          [service]="item"
          (toggleVisibility)="toggleVisibility.emit($event)"
          (editService)="editService.emit($event)"
          (editDuration)="editDuration.emit($event)"
        />
      } @empty {
        <!-- Empty State -->
        <div
          class="bg-surface-container-lowest rounded-xl p-12 text-center space-y-4 border border-hairline-subtle shadow-xs"
        >
          <div
            class="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-ink-secondary"
          >
            <span class="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <div class="space-y-1">
            <h3 class="font-heading-3 text-heading-3 text-on-surface font-bold">
              Tidak ada layanan dalam tab {{ activeTabLabel() }}
            </h3>
            <p class="text-caption font-caption text-ink-secondary max-w-md mx-auto leading-relaxed">
              Tambahkan paket baru atau pindahkan status layanan Anda untuk menampilkannya di tab ini.
            </p>
          </div>
          <button
            type="button"
            (click)="addNewService.emit()"
            class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-button-label text-button-label hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Layanan Sekarang</span>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerServiceCatalogPanelComponent {
  readonly services = input.required<WorkerServiceCatalogItem[]>();
  readonly activeTab = input<RatesCatalogTabType>('ACTIVE');

  readonly toggleVisibility = output<string>();
  readonly editService = output<WorkerServiceCatalogItem>();
  readonly editDuration = output<WorkerServiceCatalogItem>();
  readonly addNewService = output<void>();

  activeTabLabel(): string {
    switch (this.activeTab()) {
      case 'DRAFT':
        return 'Draf';
      case 'ARCHIVED':
        return 'Arsip';
      default:
        return 'Semua Layanan Aktif';
    }
  }
}
