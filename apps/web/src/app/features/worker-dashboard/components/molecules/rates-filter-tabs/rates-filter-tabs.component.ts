import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RatesCatalogTabType = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

@Component({
  selector: 'app-rates-filter-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
      <!-- Tabs Switcher -->
      <div class="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl shadow-inner">
        <button
          type="button"
          (click)="tabChange.emit('ACTIVE')"
          class="px-4 py-2 rounded-lg font-button-label text-button-label transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          [class.bg-surface-container-lowest]="activeTab() === 'ACTIVE'"
          [class.text-on-surface]="activeTab() === 'ACTIVE'"
          [class.shadow-xs]="activeTab() === 'ACTIVE'"
          [class.text-ink-secondary]="activeTab() !== 'ACTIVE'"
          [class.hover:text-on-surface]="activeTab() !== 'ACTIVE'"
        >
          <span>Semua Layanan Aktif</span>
          <span
            class="text-micro-uppercase font-micro-uppercase px-2 py-0.5 rounded-full"
            [class.bg-primary]="activeTab() === 'ACTIVE'"
            [class.text-on-primary]="activeTab() === 'ACTIVE'"
            [class.bg-surface-variant]="activeTab() !== 'ACTIVE'"
            [class.text-ink-secondary]="activeTab() !== 'ACTIVE'"
          >
            {{ activeCount() }}
          </span>
        </button>

        <button
          type="button"
          (click)="tabChange.emit('DRAFT')"
          class="px-4 py-2 rounded-lg font-button-label text-button-label transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          [class.bg-surface-container-lowest]="activeTab() === 'DRAFT'"
          [class.text-on-surface]="activeTab() === 'DRAFT'"
          [class.shadow-xs]="activeTab() === 'DRAFT'"
          [class.text-ink-secondary]="activeTab() !== 'DRAFT'"
          [class.hover:text-on-surface]="activeTab() !== 'DRAFT'"
        >
          <span>Draf</span>
          <span
            class="text-micro-uppercase font-micro-uppercase px-2 py-0.5 rounded-full"
            [class.bg-primary]="activeTab() === 'DRAFT'"
            [class.text-on-primary]="activeTab() === 'DRAFT'"
            [class.bg-surface-variant]="activeTab() !== 'DRAFT'"
            [class.text-ink-secondary]="activeTab() !== 'DRAFT'"
          >
            {{ draftCount() }}
          </span>
        </button>

        <button
          type="button"
          (click)="tabChange.emit('ARCHIVED')"
          class="px-4 py-2 rounded-lg font-button-label text-button-label transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          [class.bg-surface-container-lowest]="activeTab() === 'ARCHIVED'"
          [class.text-on-surface]="activeTab() === 'ARCHIVED'"
          [class.shadow-xs]="activeTab() === 'ARCHIVED'"
          [class.text-ink-secondary]="activeTab() !== 'ARCHIVED'"
          [class.hover:text-on-surface]="activeTab() !== 'ARCHIVED'"
        >
          <span>Arsip</span>
          <span
            class="text-micro-uppercase font-micro-uppercase px-2 py-0.5 rounded-full"
            [class.bg-primary]="activeTab() === 'ARCHIVED'"
            [class.text-on-primary]="activeTab() === 'ARCHIVED'"
            [class.bg-surface-variant]="activeTab() !== 'ARCHIVED'"
            [class.text-ink-secondary]="activeTab() !== 'ARCHIVED'"
          >
            {{ archivedCount() }}
          </span>
        </button>
      </div>

      <!-- Legend Indicators -->
      <div class="hidden lg:flex items-center gap-4 text-caption font-caption text-ink-secondary">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-voltage-orange"></span>
          Model Hourly
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-secondary"></span>
          Model Unit Sesi
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-success"></span>
          Terverifikasi Bebas Komisi
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesFilterTabsComponent {
  readonly activeTab = input<RatesCatalogTabType>('ACTIVE');
  readonly activeCount = input<number>(0);
  readonly draftCount = input<number>(0);
  readonly archivedCount = input<number>(0);

  readonly tabChange = output<RatesCatalogTabType>();
}
