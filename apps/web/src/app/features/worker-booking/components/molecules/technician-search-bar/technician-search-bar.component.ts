import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-technician-search-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="m3-card-surface p-4 sm:p-5">
      <label
        for="technicianSlugInput"
        class="block text-xs font-mono font-semibold text-[#4E4642] mb-2"
      >
        Cari Berdasarkan Slug URL Teknisi
      </label>
      <div class="flex flex-col sm:flex-row gap-2.5">
        <input
          id="technicianSlugInput"
          type="text"
          [value]="slugQuery()"
          (input)="onSlugInputChange($event)"
          (keydown.enter)="triggerSearch.emit()"
          placeholder="contoh: budi-santoso"
          class="m3-field-outlined flex-1 font-mono"
        />
        <button
          type="button"
          (click)="triggerSearch.emit()"
          class="m3-btn-filled font-mono uppercase tracking-wider"
        >
          Cari Teknisi
        </button>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#4E4642]">
        <span class="font-medium">Profil tersedia:</span>
        @for (presetSlug of availableSlugs; track presetSlug) {
          <button
            type="button"
            (click)="selectPresetSlug.emit(presetSlug)"
            class="m3-chip"
            [class.m3-chip-active]="slugQuery() === presetSlug"
          >
            {{ presetSlug }}
          </button>
        }
      </div>
    </div>
  `,
})
export class TechnicianSearchBarComponent {
  readonly slugQuery = input.required<string>();
  readonly slugQueryChange = output<string>();
  readonly triggerSearch = output<void>();
  readonly selectPresetSlug = output<string>();

  readonly availableSlugs = ['budi-santoso', 'siti-aminah'];

  onSlugInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.slugQueryChange.emit(target?.value ?? '');
  }
}

