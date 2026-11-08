import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeCategoryCardComponent } from '../../molecules/home-category-card/home-category-card.component';
import { DisciplineCategory } from '../../../models/home.model';
import { HomeApiService } from '../../../services/home-api.service';

@Component({
  selector: 'app-home-disciplines-section',
  standalone: true,
  imports: [CommonModule, HomeCategoryCardComponent],
  template: `
    <section
      id="katalog-disiplin"
      class="w-full bg-body-canvas py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="disciplines-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="max-w-2xl space-y-space-xs">
          <div class="flex items-center gap-space-xs">
            <span
              class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
            >
              Katalog Keahlian Teknisi
            </span>
          </div>

          <h2
            id="disciplines-heading"
            class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
          >
            Pilihan Spesialisasi untuk Rumah &amp; Usaha
          </h2>

          <p
            class="font-body-default text-body-default text-ink-secondary leading-relaxed"
          >
            Dari perawatan pendingin ruangan berkala hingga penelusuran gangguan
            instalasi listrik. Seluruh estimasi tarif transparan tanpa markup
            perantara.
          </p>
        </div>

        <!-- Content Area: Skeleton, Empty, or Category Bento Grid -->
        @if (isLoading()) {
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg"
            data-testid="categories-loading-skeleton"
          >
            @for (sk of [1, 2, 3, 4]; track sk) {
              <div
                class="m3-card-outlined p-space-xl bg-body-canvas space-y-space-md animate-pulse rounded-2xl border border-hairline-subtle"
                aria-hidden="true"
              >
                <div class="w-12 h-12 rounded-xl bg-surface-container-high shrink-0"></div>
                <div class="space-y-2">
                  <div class="h-5 bg-surface-container-high rounded w-3/4"></div>
                  <div class="h-3 bg-surface-container rounded w-full"></div>
                  <div class="h-3 bg-surface-container-low rounded w-4/5"></div>
                </div>
                <div class="pt-space-md border-t border-hairline-subtle flex justify-between items-center">
                  <div class="h-4 bg-surface-container rounded w-20"></div>
                  <div class="h-6 bg-surface-container-high rounded w-24"></div>
                </div>
              </div>
            }
          </div>
        } @else if (categories().length === 0) {
          <div
            class="p-space-2xl rounded-2xl bg-surface-container border border-hairline-subtle text-center space-y-space-sm max-w-md mx-auto"
            data-testid="categories-empty-state"
          >
            <span class="material-symbols-outlined text-[40px] text-ink-disabled">
              category
            </span>
            <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
              Katalog Keahlian Sedang Disiapkan
            </h3>
            <p class="font-body-default text-body-default text-ink-secondary">
              Belum ada kategori keahlian aktif saat ini. Silakan periksa kembali nanti.
            </p>
          </div>
        } @else {
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg"
          >
            @for (category of categories(); track category.id) {
              <app-home-category-card
                [category]="category"
                (selectCategory)="onCategorySelected($event)"
              />
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeDisciplinesSectionComponent implements OnInit {
  private readonly homeApiService = inject(HomeApiService, { optional: true });

  readonly selectCategory = output<string>();

  readonly categories = signal<DisciplineCategory[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    if (
      this.homeApiService &&
      typeof this.homeApiService.fetchPublicCategories === 'function'
    ) {
      this.homeApiService.fetchPublicCategories().subscribe({
        next: (items) => {
          this.categories.set(items || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.categories.set([]);
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  onCategorySelected(categorySlug: string): void {
    this.selectCategory.emit(categorySlug);
    const featuredSection = document.getElementById('spesialis-unggulan');
    if (
      featuredSection &&
      typeof featuredSection.scrollIntoView === 'function'
    ) {
      featuredSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
