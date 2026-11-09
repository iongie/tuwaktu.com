import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveAvatarUrl } from '../../../../../core/utils/avatar-url.util';
import { FeaturedWorker } from '../../../models/home.model';

@Component({
  selector: 'app-search-auto-suggest-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen() && query().trim().length >= 1) {
      <div
        class="absolute left-0 right-0 top-full mt-2 z-50 bg-[#1E1E1E] text-white border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-lg"
        role="listbox"
        aria-label="Saran pencarian teknisi dan keahlian"
      >
        <!-- Kelompok 1: Profil Spesialis Terverifikasi -->
        @if (workerSuggestions().length > 0) {
          <div class="p-2 border-b border-white/10">
            <div class="px-3 py-1 text-[11px] font-mono-rate uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px] text-voltage-orange">engineering</span>
              <span>Spesialis Terverifikasi</span>
            </div>
            <div class="mt-1 space-y-1">
              @for (worker of workerSuggestions(); track worker.id) {
                <button
                  type="button"
                  (click)="onWorkerClick(worker)"
                  class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center border border-white/20">
                      @if (worker.avatarUrl) {
                        <img
                          [src]="resolveUrl(worker.avatarUrl)"
                          [alt]="worker.name"
                          (error)="onImgError($event)"
                          class="w-full h-full object-cover"
                        />
                        <span class="material-symbols-outlined text-[18px] text-white/70 hidden">person</span>
                      } @else {
                        <span class="material-symbols-outlined text-[18px] text-white/70">person</span>
                      }
                    </div>
                    <div class="truncate">
                      <div class="font-bold text-[13px] text-white group-hover:text-voltage-orange transition-colors truncate">
                        {{ worker.name }}
                      </div>
                      <div class="text-[11px] text-white/60 truncate">
                        {{ worker.specialty }} • {{ worker.basecampZone }}
                      </div>
                    </div>
                  </div>

                  <div class="shrink-0 flex items-center gap-1 text-[11px] font-mono-rate bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/90">
                    <span class="material-symbols-outlined text-[13px] text-amber-400">star</span>
                    <span>{{ worker.rating > 0 ? worker.rating.toFixed(1) : 'Baru' }}</span>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- Kelompok 2: Kategori & Keahlian Populer -->
        @if (categorySuggestions().length > 0) {
          <div class="p-2">
            <div class="px-3 py-1 text-[11px] font-mono-rate uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px] text-voltage-orange">category</span>
              <span>Kategori & Layanan</span>
            </div>
            <div class="mt-1 space-y-1">
              @for (cat of categorySuggestions(); track cat) {
                <button
                  type="button"
                  (click)="onCategoryClick(cat)"
                  class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer text-[13px] text-white/90 hover:text-white"
                >
                  <span class="material-symbols-outlined text-[16px] text-white/40">search</span>
                  <span class="font-medium truncate">{{ cat }}</span>
                </button>
              }
            </div>
          </div>
        }

        <!-- Kondisi Jika Tidak Ada Saran -->
        @if (workerSuggestions().length === 0 && categorySuggestions().length === 0) {
          <div class="px-4 py-3 text-center text-[12px] text-white/50">
            Tekan Enter atau klik 'Temukan Pekerja' untuk mencari "{{ query() }}"
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAutoSuggestDropdownComponent {
  readonly isOpen = input<boolean>(false);
  readonly query = input<string>('');
  readonly workerSuggestions = input<FeaturedWorker[]>([]);
  readonly categorySuggestions = input<string[]>([]);

  readonly selectWorker = output<FeaturedWorker>();
  readonly selectCategory = output<string>();
  readonly close = output<void>();

  onWorkerClick(worker: FeaturedWorker): void {
    this.selectWorker.emit(worker);
  }

  onCategoryClick(category: string): void {
    this.selectCategory.emit(category);
  }

  resolveUrl(url: string | null | undefined): string {
    return resolveAvatarUrl(url);
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
      if (target.nextElementSibling) {
        (target.nextElementSibling as HTMLElement).classList.remove('hidden');
      }
    }
  }
}

