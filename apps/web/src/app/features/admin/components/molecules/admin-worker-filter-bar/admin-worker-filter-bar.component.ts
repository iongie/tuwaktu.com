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
    <div class="bg-body-canvas rounded-[10px] p-3 border border-hairline-light shadow-none flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      <!-- Search Field -->
      <div class="relative flex-1">
        <label for="adminWorkerSearchInput" class="sr-only">Cari Mitra</label>
        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-disabled text-[18px] pointer-events-none">search</span>
        <input
          id="adminWorkerSearchInput"
          type="text"
          class="w-full h-11 pl-10 pr-10 bg-surface-highlight focus:bg-body-canvas text-ink-on-light text-xs font-mono-rate rounded border border-hairline-light outline-none focus:border-hero-canvas transition-all placeholder:text-ink-disabled"
          placeholder="Cari nama mitra, spesialisasi, WhatsApp, kelurahan basecamp, atau slug..."
          [value]="searchQuery()"
          (input)="handleSearchInput($event)"
        />
        @if (searchQuery().length > 0) {
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-disabled hover:text-ink-on-light cursor-pointer rounded"
            aria-label="Bersihkan pencarian"
            (click)="clearSearch()"
          >
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        }
      </div>

      <!-- Status Pills -->
      <div class="flex flex-wrap items-center gap-1.5 self-start lg:self-auto" role="group" aria-label="Filter status mitra">
        <div class="inline-flex items-center bg-surface-highlight p-1 rounded border border-hairline-light">
          <button
            type="button"
            (click)="filterChange.emit('ALL')"
            class="min-h-[36px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer select-none"
            [class.bg-hero-canvas]="currentFilter() === 'ALL'"
            [class.text-ink-on-dark]="currentFilter() === 'ALL'"
            [class.text-ink-secondary]="currentFilter() !== 'ALL'"
            [class.hover:text-ink-on-light]="currentFilter() !== 'ALL'"
            data-testid="filter-all-btn"
          >
            Semua ({{ totalCount() }})
          </button>

          <button
            type="button"
            (click)="filterChange.emit('ACTIVE')"
            class="min-h-[36px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer inline-flex items-center gap-1.5 select-none"
            [class.bg-hero-canvas]="currentFilter() === 'ACTIVE'"
            [class.text-ink-on-dark]="currentFilter() === 'ACTIVE'"
            [class.text-ink-secondary]="currentFilter() !== 'ACTIVE'"
            [class.hover:text-ink-on-light]="currentFilter() !== 'ACTIVE'"
            data-testid="filter-active-btn"
          >
            <span>Aktif</span>
            <span class="px-1.5 py-0.5 bg-whatsapp-green text-white rounded text-[10px] font-mono-rate font-bold leading-tight">{{ activeCount() }}</span>
          </button>

          <button
            type="button"
            (click)="filterChange.emit('SUSPENDED')"
            class="min-h-[36px] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider font-mono-rate transition-colors cursor-pointer inline-flex items-center gap-1.5 select-none"
            [class.bg-hero-canvas]="currentFilter() === 'SUSPENDED'"
            [class.text-ink-on-dark]="currentFilter() === 'SUSPENDED'"
            [class.text-ink-secondary]="currentFilter() !== 'SUSPENDED'"
            [class.hover:text-ink-on-light]="currentFilter() !== 'SUSPENDED'"
            data-testid="filter-suspended-btn"
          >
            <span>Ditangguhkan</span>
            <span class="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-mono-rate font-bold leading-tight">{{ suspendedCount() }}</span>
          </button>
        </div>
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
