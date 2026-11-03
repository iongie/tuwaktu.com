import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-technician-search-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface-container-lowest border border-hairline-light rounded-xl p-space-md sm:p-space-lg shadow-sm">
      <label
        for="technicianSlugInput"
        class="block font-micro-uppercase text-micro-uppercase font-bold uppercase text-ink-secondary tracking-wider mb-2"
      >
        Cari Berdasarkan Slug URL Mitra
      </label>
      <div class="flex flex-col sm:flex-row gap-space-sm">
        <input
          id="technicianSlugInput"
          type="text"
          [value]="slugQuery()"
          (input)="onSlugInputChange($event)"
          (keydown.enter)="triggerSearch.emit()"
          placeholder="Ketik slug profil mitra (misal: budi-santoso)..."
          class="h-11 px-space-md bg-surface-highlight focus:bg-body-canvas rounded text-on-surface font-mono-rate text-caption outline-none border border-hairline-subtle flex-1"
        />
        <button
          type="button"
          (click)="triggerSearch.emit()"
          class="h-11 px-space-lg bg-hero-canvas hover:bg-surface-elevated-dark text-ink-on-dark font-button-label text-button-label font-bold rounded transition-colors cursor-pointer"
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
