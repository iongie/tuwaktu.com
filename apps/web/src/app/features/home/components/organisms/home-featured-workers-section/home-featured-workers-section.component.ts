import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeWorkerCardComponent } from '../../molecules/home-worker-card/home-worker-card.component';
import { FeaturedWorker } from '../../../models/home.model';
import { HomeApiService } from '../../../services/home-api.service';

@Component({
  selector: 'app-home-featured-workers-section',
  standalone: true,
  imports: [CommonModule, HomeWorkerCardComponent],
  template: `
    <section
      id="spesialis-unggulan"
      class="w-full bg-surface-container-low py-space-3xl border-b border-hairline-subtle"
      aria-labelledby="featured-workers-heading"
    >
      <div class="max-w-7xl mx-auto px-margin-desktop space-y-space-2xl">
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div class="max-w-2xl space-y-space-xs">
            <div class="flex items-center gap-space-xs">
              <span
                class="px-2 py-0.5 rounded bg-success-surface text-success font-micro-uppercase text-micro-uppercase uppercase font-bold tracking-wider"
              >
                Pilihan Minggu Ini
              </span>
            </div>

            <h2
              id="featured-workers-heading"
              class="font-heading-h2 text-heading-h2 sm:text-[32px] font-bold text-on-surface tracking-tight"
            >
              Teknisi Terverifikasi Siaga Jabodetabek
            </h2>

            <p class="font-body-default text-body-default text-ink-secondary leading-relaxed">
              Pilih mitra mandiri, periksa slot ketersediaan waktu yang terlindungi buffer transit, dan kirimkan konfirmasi langsung ke nomor WhatsApp mitra.
            </p>
          </div>

          <div class="text-caption font-mono-rate text-ink-disabled shrink-0">
            @if (isLoading()) {
              <span class="inline-block w-24 h-4 bg-surface-container-high rounded animate-pulse"></span>
            } @else {
              TOTAL {{ totalWorkersCount() }} PEKERJA AKTIF
            }
          </div>
        </div>

        <!-- Quick Filter Chips Kategori -->
        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline-subtle text-caption">
          <span class="text-ink-disabled font-mono-rate">Kategori:</span>
          @for (cat of categoryFilterOptions; track cat) {
            <button
              type="button"
              (click)="setCategoryFilter(cat)"
              [class.bg-on-surface]="activeCategory() === cat"
              [class.text-surface]="activeCategory() === cat"
              [class.font-bold]="activeCategory() === cat"
              [class.bg-surface-container]="activeCategory() !== cat"
              [class.text-on-surface-variant]="activeCategory() !== cat"
              class="px-3.5 py-1.5 min-h-[36px] inline-flex items-center rounded-full border border-hairline-subtle text-caption transition-colors cursor-pointer"
            >
              {{ cat }}
            </button>
          }
        </div>

        <!-- Bilah Status Filter Aktif (Active Filter Bar) -->
        @if (hasActiveFilters()) {
          <div
            class="p-space-md rounded-xl bg-surface-container border border-hairline-subtle flex flex-wrap items-center justify-between gap-3"
            data-testid="active-filter-bar"
          >
            <div class="flex flex-wrap items-center gap-2 text-caption">
              <span class="font-medium text-ink-secondary">Filter Aktif:</span>

              @if (activeSpecialtyFilter()) {
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-voltage-orange/15 text-voltage-orange border border-voltage-orange/30 font-medium"
                >
                  <span>Keahlian/Nama: "{{ activeSpecialtyFilter() }}"</span>
                  <button
                    type="button"
                    (click)="clearSpecialtyFilter()"
                    class="hover:opacity-75 cursor-pointer flex items-center"
                    aria-label="Hapus filter keahlian"
                  >
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              }

              @if (activeLocationFilter()) {
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container border border-outline-variant font-medium"
                >
                  <span>Wilayah: "{{ activeLocationFilter() }}"</span>
                  <button
                    type="button"
                    (click)="clearLocationFilter()"
                    class="hover:opacity-75 cursor-pointer flex items-center"
                    aria-label="Hapus filter wilayah"
                  >
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              }

              @if (activeCategory() !== 'Semua') {
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface border border-outline-variant font-medium"
                >
                  <span>Kategori: "{{ activeCategory() }}"</span>
                  <button
                    type="button"
                    (click)="clearCategoryFilter()"
                    class="hover:opacity-75 cursor-pointer flex items-center"
                    aria-label="Hapus filter kategori"
                  >
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              }
            </div>

            <div class="flex items-center gap-3">
              <span class="text-caption font-mono-rate text-ink-secondary">
                Ditemukan {{ filteredWorkers().length }} teknisi
              </span>
              <button
                type="button"
                (click)="resetAllFiltersAction()"
                class="text-caption text-voltage-orange hover:underline font-bold cursor-pointer"
              >
                Reset Semua
              </button>
            </div>
          </div>
        }

        <!-- Content Area: Skeleton, Error, Empty, or Worker Grid -->
        @if (isLoading()) {
          <!-- Skeleton Loading State (4 Cards) -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg"
            data-testid="workers-loading-skeleton"
          >
            @for (sk of [1, 2, 3, 4]; track sk) {
              <div
                class="m3-card-outlined p-space-xl bg-body-canvas space-y-space-md animate-pulse"
                aria-hidden="true"
              >
                <div class="flex items-start gap-space-md">
                  <div class="w-16 h-16 rounded-xl bg-surface-container-high shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-surface-container-high rounded w-3/4"></div>
                    <div class="h-3 bg-surface-container rounded w-1/2"></div>
                    <div class="h-3 bg-surface-container-low rounded w-1/3"></div>
                  </div>
                </div>
                <div class="h-10 bg-surface-container-low rounded-lg"></div>
                <div class="flex gap-2">
                  <div class="h-5 bg-surface-container rounded w-16"></div>
                  <div class="h-5 bg-surface-container rounded w-20"></div>
                </div>
                <div class="pt-space-md border-t border-hairline-subtle flex justify-between items-center">
                  <div class="h-6 bg-surface-container rounded w-20"></div>
                  <div class="h-8 bg-surface-container-high rounded w-28"></div>
                </div>
              </div>
            }
          </div>
        } @else if (errorMessage()) {
          <!-- Error State with Retry Button -->
          <div
            class="p-space-xl rounded-xl bg-error/10 border border-error/30 text-on-surface space-y-space-sm max-w-xl mx-auto text-center"
            role="alert"
          >
            <span class="material-symbols-outlined text-[32px] text-error">error</span>
            <p class="font-body-strong text-body-strong text-on-surface">
              {{ errorMessage() }}
            </p>
            <p class="font-caption text-ink-secondary">
              Gagal memuat katalog pekerja mandiri dari server. Silakan coba kembali.
            </p>
            <button
              type="button"
              (click)="loadWorkers()"
              class="m3-btn-outlined inline-flex items-center gap-1.5 px-4 py-2 mt-2 text-caption font-bold rounded-lg cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">refresh</span>
              <span>Coba Lagi</span>
            </button>
          </div>
        } @else if (filteredWorkers().length === 0) {
          <!-- Empty State yang Terstruktur -->
          <div class="space-y-space-2xl">
            <div
              class="p-space-2xl rounded-2xl bg-surface-container border border-hairline-subtle text-center space-y-space-sm max-w-lg mx-auto"
              data-testid="workers-empty-state"
            >
              <span class="material-symbols-outlined text-[48px] text-ink-disabled">
                search_off
              </span>
              <h3 class="font-heading-h3 text-heading-h3 font-bold text-on-surface">
                Belum Ada Teknisi Ditemukan
              </h3>
              <p class="font-body-default text-body-default text-ink-secondary">
                Tidak ada mitra terverifikasi yang cocok dengan kriteria pencarian Anda. Coba ubah kata kunci atau pilih opsi 'Semua Wilayah'.
              </p>
              <div class="pt-2">
                <button
                  type="button"
                  (click)="resetAllFiltersAction()"
                  class="m3-btn-filled px-5 py-2.5 text-caption font-bold rounded-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Tampilkan Semua Teknisi</span>
                </button>
              </div>
            </div>

            <!-- Rekomendasi Spesialis Alternatif Berating Tinggi -->
            @if (topRatedWorkers().length > 0) {
              <div class="space-y-space-md pt-space-lg border-t border-hairline-subtle">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-heading-h3 text-[18px] font-bold text-on-surface">
                      Rekomendasi Spesialis Terverifikasi Siaga Lainnya
                    </h3>
                    <p class="text-caption text-ink-secondary">
                      Mitra dengan reputasi terbaik yang siap menerima reservasi langsung.
                    </p>
                  </div>
                  <span class="text-caption font-mono-rate text-ink-disabled hidden sm:inline">
                    PILIHAN TERBAIK
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
                  @for (worker of topRatedWorkers(); track worker.id) {
                    <app-home-worker-card [worker]="worker" />
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- 4-Column Grid of Real Worker Cards from API -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            @for (worker of filteredWorkers(); track worker.id) {
              <app-home-worker-card [worker]="worker" />
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeFeaturedWorkersSectionComponent implements OnInit {
  private readonly homeApiService = inject(HomeApiService);

  readonly searchSpecialty = input<string>('');
  readonly searchLocation = input<string>('');
  readonly selectedCategory = input<string>('');

  readonly resetAllFilters = output<void>();

  readonly workers = signal<FeaturedWorker[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  readonly activeCategory = signal<string>('Semua');
  readonly activeSpecialtyFilter = signal<string>('');
  readonly activeLocationFilter = signal<string>('');

  readonly categoryFilterOptions = [
    'Semua',
    'Servis AC',
    'Sanitasi',
    'Kelistrikan',
    'Elektronik',
  ];

  readonly totalWorkersCount = computed(() => this.workers().length);

  readonly hasActiveFilters = computed(() => {
    return (
      Boolean(this.activeSpecialtyFilter()) ||
      Boolean(this.activeLocationFilter()) ||
      this.activeCategory() !== 'Semua'
    );
  });

  readonly topRatedWorkers = computed<FeaturedWorker[]>(() => {
    return [...this.workers()]
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 4);
  });

  readonly filteredWorkers = computed(() => {
    let result = this.workers();

    // 1. Filter Kategori
    const category = this.activeCategory();
    if (category !== 'Semua') {
      const lowerCat = category.toLowerCase();
      result = result.filter((w) => {
        const catMatch = w.category.toLowerCase().includes(lowerCat);
        const specMatch = w.specialty.toLowerCase().includes(lowerCat);
        const tagMatch = w.specialtyTags.some((t) => t.toLowerCase().includes(lowerCat));
        return catMatch || specMatch || tagMatch;
      });
    }

    // 2. Filter Wilayah Operasional
    const loc = this.activeLocationFilter().trim().toLowerCase();
    if (loc && loc !== 'semua wilayah') {
      result = result.filter((w) => {
        return w.basecampZone.toLowerCase().includes(loc);
      });
    }

    // 3. Filter Keahlian atau Nama Pekerja
    const query = this.activeSpecialtyFilter().trim().toLowerCase();
    if (query) {
      result = result.filter((w) => {
        const nameMatch = w.name.toLowerCase().includes(query);
        const slugMatch = w.slug.toLowerCase().includes(query);
        const specMatch = w.specialty.toLowerCase().includes(query);
        const catMatch = w.category.toLowerCase().includes(query);
        const tagMatch = w.specialtyTags.some((t) => t.toLowerCase().includes(query));
        return nameMatch || slugMatch || specMatch || catMatch || tagMatch;
      });
    }

    return result;
  });

  constructor() {
    // Sinkronisasi input external ke state internal
    effect(() => {
      this.activeSpecialtyFilter.set(this.searchSpecialty());
    });

    effect(() => {
      this.activeLocationFilter.set(this.searchLocation());
    });

    effect(() => {
      const externalCat = this.selectedCategory();
      if (externalCat) {
        const lower = externalCat.toLowerCase();
        if (lower.includes('ac')) {
          this.activeCategory.set('Servis AC');
        } else if (lower.includes('clean') || lower.includes('sanitasi')) {
          this.activeCategory.set('Sanitasi');
        } else if (lower.includes('listrik')) {
          this.activeCategory.set('Kelistrikan');
        } else if (lower.includes('elektronik') || lower.includes('audio')) {
          this.activeCategory.set('Elektronik');
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.homeApiService.fetchPublicWorkers().subscribe({
      next: (items) => {
        this.workers.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Terjadi kendala saat memuat data teknisi.');
        this.isLoading.set(false);
      },
    });
  }

  setCategoryFilter(cat: string): void {
    this.activeCategory.set(cat);
  }

  clearSpecialtyFilter(): void {
    this.activeSpecialtyFilter.set('');
  }

  clearLocationFilter(): void {
    this.activeLocationFilter.set('');
  }

  clearCategoryFilter(): void {
    this.activeCategory.set('Semua');
  }

  resetAllFiltersAction(): void {
    this.activeCategory.set('Semua');
    this.activeSpecialtyFilter.set('');
    this.activeLocationFilter.set('');
    this.resetAllFilters.emit();
  }
}
