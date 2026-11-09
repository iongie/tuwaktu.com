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
      class="p-4 rounded-[10px] bg-body-canvas border border-hairline-light shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      aria-label="Pencarian dan Filter Kategori"
    >
      <!-- Input Search -->
      <div class="relative flex-1 md:w-96">
        <label for="searchCategoryInput" class="sr-only">Cari Kategori</label>
        <span
          class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary text-lg pointer-events-none"
        >
          search
        </span>
        <input
          id="searchCategoryInput"
          type="text"
          placeholder="Cari nama, slug, atau tag kategori..."
          [value]="searchQuery()"
          (input)="handleSearchInput($event)"
          class="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded bg-surface-highlight border border-hairline-light focus:border-accent-link focus:bg-body-canvas text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled transition"
          data-testid="search-category-input"
        />
        @if (searchQuery().length > 0) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-secondary hover:text-ink-on-light min-w-[44px] justify-center cursor-pointer"
            aria-label="Bersihkan pencarian"
            (click)="clearSearch()"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        }
      </div>

      <!-- Tab Filter Status -->
      <div
        class="flex items-center gap-1.5 p-1 rounded bg-surface-highlight border border-hairline-light w-full md:w-auto"
        role="group"
        aria-label="Filter status kategori"
      >
        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[38px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'ALL'"
          [class.text-ink-on-dark]="currentFilter() === 'ALL'"
          [class.border-hero-canvas]="currentFilter() === 'ALL'"
          [class.bg-surface-highlight]="currentFilter() !== 'ALL'"
          [class.text-ink-secondary]="currentFilter() !== 'ALL'"
          [class.border-transparent]="currentFilter() !== 'ALL'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'ALL'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'ALL'"
          (click)="filterChange.emit('ALL')"
          data-testid="filter-all-btn"
        >
          Semua ({{ totalCount() }})
        </button>

        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[38px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'ACTIVE'"
          [class.text-ink-on-dark]="currentFilter() === 'ACTIVE'"
          [class.border-hero-canvas]="currentFilter() === 'ACTIVE'"
          [class.bg-surface-highlight]="currentFilter() !== 'ACTIVE'"
          [class.text-ink-secondary]="currentFilter() !== 'ACTIVE'"
          [class.border-transparent]="currentFilter() !== 'ACTIVE'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'ACTIVE'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'ACTIVE'"
          (click)="filterChange.emit('ACTIVE')"
          data-testid="filter-active-btn"
        >
          Aktif ({{ activeCount() }})
        </button>

        <button
          type="button"
          class="flex-1 md:flex-initial min-h-[38px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'INACTIVE'"
          [class.text-ink-on-dark]="currentFilter() === 'INACTIVE'"
          [class.border-hero-canvas]="currentFilter() === 'INACTIVE'"
          [class.bg-surface-highlight]="currentFilter() !== 'INACTIVE'"
          [class.text-ink-secondary]="currentFilter() !== 'INACTIVE'"
          [class.border-transparent]="currentFilter() !== 'INACTIVE'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'INACTIVE'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'INACTIVE'"
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
