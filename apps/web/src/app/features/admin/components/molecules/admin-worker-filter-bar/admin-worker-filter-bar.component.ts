import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AdminWorkerFilterStatus } from '../../../models/admin-worker.model';

@Component({
  selector: 'app-admin-worker-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[10px] bg-body-canvas border border-hairline-light shadow-none">
      <!-- Search Input Field -->
      <div class="relative flex-1">
        <label for="adminWorkerSearchInput" class="sr-only">Cari Mitra</label>
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-secondary">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="adminWorkerSearchInput"
          type="text"
          class="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded bg-surface-highlight border border-hairline-light text-xs font-mono-rate text-ink-on-light placeholder:text-ink-disabled focus:outline-none focus:border-accent-link focus:bg-body-canvas transition"
          placeholder="Cari berdasarkan nama, profesi, email, nomor WhatsApp, atau slug..."
          [value]="searchQuery()"
          (input)="handleSearchInput($event)"
        />
        @if (searchQuery().length > 0) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-secondary hover:text-ink-on-light min-w-[44px] justify-center cursor-pointer"
            aria-label="Bersihkan pencarian"
            (click)="clearSearch()"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        }
      </div>

      <!-- Filter Status Chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="group" aria-label="Filter status mitra">
        <button
          type="button"
          class="min-h-[40px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate whitespace-nowrap transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'ALL'"
          [class.text-ink-on-dark]="currentFilter() === 'ALL'"
          [class.border-hero-canvas]="currentFilter() === 'ALL'"
          [class.bg-surface-highlight]="currentFilter() !== 'ALL'"
          [class.text-ink-secondary]="currentFilter() !== 'ALL'"
          [class.border-hairline-light]="currentFilter() !== 'ALL'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'ALL'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'ALL'"
          (click)="filterChange.emit('ALL')"
          data-testid="filter-all-btn"
        >
          Semua ({{ totalCount() }})
        </button>

        <button
          type="button"
          class="min-h-[40px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate whitespace-nowrap transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'ACTIVE'"
          [class.text-ink-on-dark]="currentFilter() === 'ACTIVE'"
          [class.border-hero-canvas]="currentFilter() === 'ACTIVE'"
          [class.bg-surface-highlight]="currentFilter() !== 'ACTIVE'"
          [class.text-ink-secondary]="currentFilter() !== 'ACTIVE'"
          [class.border-hairline-light]="currentFilter() !== 'ACTIVE'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'ACTIVE'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'ACTIVE'"
          (click)="filterChange.emit('ACTIVE')"
          data-testid="filter-active-btn"
        >
          Aktif ({{ activeCount() }})
        </button>

        <button
          type="button"
          class="min-h-[40px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate whitespace-nowrap transition cursor-pointer border"
          [class.bg-hero-canvas]="currentFilter() === 'SUSPENDED'"
          [class.text-ink-on-dark]="currentFilter() === 'SUSPENDED'"
          [class.border-hero-canvas]="currentFilter() === 'SUSPENDED'"
          [class.bg-surface-highlight]="currentFilter() !== 'SUSPENDED'"
          [class.text-ink-secondary]="currentFilter() !== 'SUSPENDED'"
          [class.border-hairline-light]="currentFilter() !== 'SUSPENDED'"
          [class.hover:bg-body-canvas]="currentFilter() !== 'SUSPENDED'"
          [class.hover:text-ink-on-light]="currentFilter() !== 'SUSPENDED'"
          (click)="filterChange.emit('SUSPENDED')"
          data-testid="filter-suspended-btn"
        >
          Ditangguhkan ({{ suspendedCount() }})
        </button>
      </div>
    </div>
  `,
})
export class AdminWorkerFilterBarComponent {
  readonly searchQuery = input<string>('');
  readonly currentFilter = input<AdminWorkerFilterStatus>('ALL');
  readonly totalCount = input<number>(0);
  readonly activeCount = input<number>(0);
  readonly suspendedCount = input<number>(0);

  readonly searchChange = output<string>();
  readonly filterChange = output<AdminWorkerFilterStatus>();

  handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.searchChange.emit('');
  }
}

