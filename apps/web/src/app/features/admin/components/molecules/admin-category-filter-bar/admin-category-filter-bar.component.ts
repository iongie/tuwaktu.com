import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-admin-category-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="p-4 rounded-2xl bg-surface border border-hairline-subtle shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      aria-label="Pencarian dan Filter Kategori"
    >
      <!-- Input Search -->
      <div class="relative flex-1 md:w-96">
        <label for="searchCategoryInput" class="sr-only">Cari Kategori</label>
        <span
          class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none"
        >
          search
        </span>
        <input
          id="searchCategoryInput"
          type="text"
          placeholder="Cari nama, slug, atau tag kategori..."
          [value]="searchQuery()"
          (input)="handleSearchInput($event)"
          class="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline/30 focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface transition"
          data-testid="search-category-input"
        />
        @if (searchQuery().length > 0) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface min-w-[44px] justify-center cursor-pointer"
            aria-label="Bersihkan pencarian"
            (click)="clearSearch()"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        }
      </div>

      <!-- Tab Filter Status -->
      <div
        class="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low w-full md:w-auto"
        role="group"
        aria-label="Filter status kategori"
      >
        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          [class.bg-surface]="currentFilter() === 'ALL'"
          [class.text-on-surface]="currentFilter() === 'ALL'"
          [class.shadow-xs]="currentFilter() === 'ALL'"
          [class.text-on-surface-variant]="currentFilter() !== 'ALL'"
          (click)="filterChange.emit('ALL')"
          data-testid="filter-all-btn"
        >
          Semua ({{ totalCount() }})
        </button>
        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          [class.bg-surface]="currentFilter() === 'ACTIVE'"
          [class.text-emerald-700]="currentFilter() === 'ACTIVE'"
          [class.shadow-xs]="currentFilter() === 'ACTIVE'"
          [class.text-on-surface-variant]="currentFilter() !== 'ACTIVE'"
          (click)="filterChange.emit('ACTIVE')"
          data-testid="filter-active-btn"
        >
          Aktif ({{ activeCount() }})
        </button>
        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[44px] px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          [class.bg-surface]="currentFilter() === 'INACTIVE'"
          [class.text-on-surface]="currentFilter() === 'INACTIVE'"
          [class.shadow-xs]="currentFilter() === 'INACTIVE'"
          [class.text-on-surface-variant]="currentFilter() !== 'INACTIVE'"
          (click)="filterChange.emit('INACTIVE')"
          data-testid="filter-inactive-btn"
        >
          Nonaktif ({{ inactiveCount() }})
        </button>
      </div>
    </section>
  `,
})
export class AdminCategoryFilterBarComponent {
  readonly searchQuery = input<string>('');
  readonly currentFilter = input<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  readonly totalCount = input<number>(0);
  readonly activeCount = input<number>(0);
  readonly inactiveCount = input<number>(0);

  readonly searchChange = output<string>();
  readonly filterChange = output<'ALL' | 'ACTIVE' | 'INACTIVE'>();

  handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.searchChange.emit('');
  }
}
