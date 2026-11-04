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
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container border border-hairline-subtle shadow-xs">
      <!-- Search Input Field -->
      <div class="relative flex-1">
        <label for="adminWorkerSearchInput" class="sr-only">Cari Mitra</label>
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="adminWorkerSearchInput"
          type="text"
          class="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-xl bg-surface border border-hairline text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="Cari berdasarkan nama, profesi, email, nomor WhatsApp, atau slug..."
          [value]="searchQuery()"
          (input)="handleSearchInput($event)"
        />
        @if (searchQuery().length > 0) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface min-w-[44px] justify-center"
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
          class="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          [class.bg-primary]="currentFilter() === 'ALL'"
          [class.text-on-primary]="currentFilter() === 'ALL'"
          [class.bg-surface]="currentFilter() !== 'ALL'"
          [class.text-on-surface-variant]="currentFilter() !== 'ALL'"
          [class.hover:bg-surface-container-high]="currentFilter() !== 'ALL'"
          (click)="filterChange.emit('ALL')"
          data-testid="filter-all-btn"
        >
          Semua ({{ totalCount() }})
        </button>

        <button
          type="button"
          class="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          [class.bg-emerald-600]="currentFilter() === 'ACTIVE'"
          [class.text-white]="currentFilter() === 'ACTIVE'"
          [class.bg-surface]="currentFilter() !== 'ACTIVE'"
          [class.text-emerald-700]="currentFilter() !== 'ACTIVE'"
          [class.hover:bg-emerald-500/10]="currentFilter() !== 'ACTIVE'"
          (click)="filterChange.emit('ACTIVE')"
          data-testid="filter-active-btn"
        >
          Aktif ({{ activeCount() }})
        </button>

        <button
          type="button"
          class="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          [class.bg-rose-600]="currentFilter() === 'SUSPENDED'"
          [class.text-white]="currentFilter() === 'SUSPENDED'"
          [class.bg-surface]="currentFilter() !== 'SUSPENDED'"
          [class.text-rose-700]="currentFilter() !== 'SUSPENDED'"
          [class.hover:bg-rose-500/10]="currentFilter() !== 'SUSPENDED'"
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

