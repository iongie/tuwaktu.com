import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-technician-search-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white border border-(--hairline-light) rounded-xl p-4 sm:p-5 shadow-xs">
      <label
        for="technicianSlugInput"
        class="block text-xs font-mono font-semibold text-(--brand-ink)/70 mb-2"
      >
        Cari Berdasarkan Slug URL Mitra
      </label>
      <div class="flex flex-col sm:flex-row gap-2.5">
        <input
          id="technicianSlugInput"
          type="text"
          [value]="slugQuery()"
          (input)="onSlugInputChange($event)"
          (keydown.enter)="triggerSearch.emit()"
          placeholder="Ketik slug profil mitra..."
          class="m3-field-outlined flex-1 font-mono"
        />
        <button
          type="button"
          (click)="triggerSearch.emit()"
          class="m3-btn-filled font-mono uppercase tracking-wider"
        >
          Cari Mitra
        </button>
      </div>
    </div>
  `,
})
export class TechnicianSearchBarComponent {
  readonly slugQuery = input.required<string>();
  readonly slugQueryChange = output<string>();
  readonly triggerSearch = output<void>();
  readonly selectPresetSlug = output<string>();

  readonly availableSlugs: readonly string[] = [];

  onSlugInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.slugQueryChange.emit(target?.value ?? '');
  }
}
