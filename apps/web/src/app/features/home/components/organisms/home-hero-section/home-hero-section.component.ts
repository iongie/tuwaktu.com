import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchAutoSuggestDropdownComponent } from '../../molecules/search-auto-suggest-dropdown/search-auto-suggest-dropdown.component';
import { HomeApiService } from '../../../services/home-api.service';
import { FeaturedWorker } from '../../../models/home.model';
import { AnalyticsService } from '../../../../../core/services/analytics.service';

@Component({
  selector: 'app-home-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchAutoSuggestDropdownComponent],
  template: `
    <section
      class="w-full bg-hero-canvas text-ink-on-dark relative overflow-hidden py-10 sm:py-16 lg:py-20 border-b border-white/10"
      aria-labelledby="hero-title"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-10"
      >
        <!-- Headline & Copy -->
        <div class="max-w-4xl space-y-4">
          <h1
            id="hero-title"
            class="font-heading-h1 text-[30px] sm:text-[42px] md:text-[50px] font-bold text-white tracking-tight leading-[1.15]"
          >
            Cari Teknisi Berpengalaman.
            <span class="text-voltage-orange block sm:inline"
              >Hubungi Langsung Tanpa Perantara.</span
            >
          </h1>

          <p
            class="font-lead-body text-body-default sm:text-lead-body text-white/75 max-w-2xl leading-relaxed"
          >
            Pesan layanan servis AC, perbaikan listrik, bersih-bersih rumah,
            hingga servis elektronik. Tarif jelas sejak awal, jadwal tertata,
            dan langsung terhubung ke WhatsApp pekerja.
          </p>
        </div>

        <!-- Interactive Booking Search Console -->
        <div
          class="p-4 sm:p-6 bg-surface-elevated-dark rounded-2xl border border-white/15 max-w-5xl relative z-30"
        >
          <form (ngSubmit)="handleSearchSubmit()" class="space-y-space-md">
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center"
            >
              <!-- Input Keahlian / Spesialisasi dengan Auto-Suggest -->
              <div class="md:col-span-5 relative">
                <label
                  for="heroSpecialtyInput"
                  class="block font-micro-uppercase text-caption text-white/60 uppercase mb-1.5"
                >
                  Keahlian atau Nama Pekerja
                </label>
                <div class="relative flex items-center">
                  <span
                    class="material-symbols-outlined absolute left-3.5 text-white/40 text-[20px]"
                  >
                    handyman
                  </span>
                  <input
                    id="heroSpecialtyInput"
                    type="text"
                    autocomplete="off"
                    [ngModel]="specialtyQuery()"
                    (ngModelChange)="onSpecialtyQueryChange($event)"
                    (focus)="onSpecialtyInputFocus()"
                    (blur)="onSpecialtyInputBlur()"
                    name="specialty"
                    placeholder="Contoh: AC Inverter, Listrik, Budi..."
                    class="w-full h-12 pl-11 pr-4 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder:text-white/40 rounded-lg text-body-default transition-all outline-none border border-white/10 focus:border-voltage-orange"
                  />
                </div>

                <!-- Floating Auto-Suggest Dropdown -->
                <app-search-auto-suggest-dropdown
                  [isOpen]="isSuggestOpen()"
                  [query]="specialtyQuery()"
                  [workerSuggestions]="filteredWorkerSuggestions()"
                  [categorySuggestions]="filteredCategorySuggestions()"
                  (selectWorker)="onSelectWorker($event)"
                  (selectCategory)="onSelectCategory($event)"
                  (close)="isSuggestOpen.set(false)"
                />
              </div>

              <!-- Dropdown Lokasi / Wilayah Pangkalan Terstandarisasi -->
              <div class="md:col-span-4 relative">
                <label
                  for="heroLocationSelect"
                  class="block font-micro-uppercase text-caption text-white/60 uppercase mb-1.5"
                >
                  Wilayah / Pangkalan
                </label>
                <div class="relative flex items-center">
                  <span
                    class="material-symbols-outlined absolute left-3.5 text-white/40 text-[20px] pointer-events-none"
                  >
                    location_on
                  </span>
                  <select
                    id="heroLocationSelect"
                    [ngModel]="locationQuery()"
                    (ngModelChange)="locationQuery.set($event)"
                    name="location"
                    class="w-full h-12 pl-11 pr-9 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white rounded-lg text-body-default transition-all outline-none border border-white/10 focus:border-voltage-orange appearance-none cursor-pointer"
                  >
                    @for (zone of availableZones(); track zone) {
                      <option
                        [value]="zone"
                        class="bg-[#1E1E1E] text-white py-1.5"
                      >
                        {{ zone }}
                      </option>
                    }
                  </select>
                  <span
                    class="material-symbols-outlined absolute right-3 text-white/40 text-[20px] pointer-events-none"
                  >
                    expand_more
                  </span>
                </div>
              </div>

              <!-- Tombol Aksi Cari -->
              <div class="md:col-span-3 flex md:self-end pt-2 md:pt-0">
                <button
                  type="submit"
                  class="w-full h-12 px-space-xl bg-voltage-orange hover:bg-voltage-orange/90 text-white font-button-label text-button-label font-bold rounded-lg flex items-center justify-center gap-space-xs transition-all shadow-md cursor-pointer min-h-[48px]"
                >
                  <span class="material-symbols-outlined text-[20px]"
                    >search</span
                  >
                  <span>Temukan Pekerja</span>
                </button>
              </div>
            </div>

            <!-- Quick Filter Chips -->
            <div
              class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-caption"
            >
              <span class="text-white/50 text-caption font-mono-rate"
                >Kategori Populer:</span
              >
              @for (chip of popularChips; track chip.label) {
                <button
                  type="button"
                  (click)="applyFilterChip(chip.query)"
                  class="px-4 py-2 min-h-11 inline-flex items-center rounded-full bg-white/5 hover:bg-white/15 text-white/85 hover:text-white border border-white/10 text-caption transition-colors cursor-pointer"
                >
                  {{ chip.label }}
                </button>
              }
            </div>
          </form>
        </div>

        <!-- 4 Pilar Kepercayaan Tuwaktu -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
        >
          @for (pillar of trustPillars; track pillar.title) {
            <div
              class="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/[0.07] transition-colors"
            >
              <div class="flex items-center justify-between">
                <span
                  class="material-symbols-outlined text-[24px] text-voltage-orange"
                >
                  {{ pillar.icon }}
                </span>
              </div>
              <h3 class="font-heading-h3 text-[15px] font-bold text-white pt-1">
                {{ pillar.title }}
              </h3>
              <p
                class="font-body-default text-caption text-white/65 leading-relaxed"
              >
                {{ pillar.description }}
              </p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroSectionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly homeApiService = inject(HomeApiService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly specialtyQuery = signal<string>('');
  readonly locationQuery = signal<string>('Semua Wilayah');
  readonly isSuggestOpen = signal<boolean>(false);
  readonly workers = signal<FeaturedWorker[]>([]);

  readonly searchTrigger = output<{ specialty: string; location: string }>();

  readonly popularChips = [
    { label: 'Servis AC', query: 'ac' },
    { label: 'Bersih-Bersih Rumah', query: 'deep clean' },
    { label: 'Instalasi Listrik', query: 'listrik' },
    { label: 'Servis Elektronik', query: 'elektronik' },
  ];

  readonly trustPillars = [
    {
      title: '0% Potongan Komisi',
      description:
        'Seluruh biaya jasa 100% diterima langsung oleh pekerja tanpa potongan aplikasi.',
      icon: 'percent',
    },
    {
      title: '100% WhatsApp Langsung',
      description:
        'Komunikasi langsung ke nomor WhatsApp asli pekerja tanpa perantara atau sensor nomor.',
      icon: 'chat',
    },
    {
      title: 'Jeda Perjalanan Otomatis',
      description:
        'Jeda 60-90 menit antar jadwal kunjungan agar teknisi datang tepat waktu dan tidak terburu-buru.',
      icon: 'timer',
    },
    {
      title: 'Identitas Terverifikasi',
      description:
        'Setiap teknisi telah melalui pengecekan identitas KTP dan lokasi pangkalan kerja yang jelas.',
      icon: 'verified_user',
    },
  ];

  readonly availableZones = computed<string[]>(() => {
    const list = this.workers();
    const zoneSet = new Set<string>();

    for (const w of list) {
      if (w.basecampZone && w.basecampZone.trim()) {
        zoneSet.add(w.basecampZone.trim());
      }
    }

    if (zoneSet.size === 0) {
      return [
        'Semua Wilayah',
        'Jakarta Selatan',
        'Jakarta Pusat',
        'Jakarta Barat',
        'Jakarta Timur',
        'Jakarta Utara',
        'Tangerang Selatan',
        'Tangerang',
        'Depok',
        'Bekasi',
        'Bogor',
      ];
    }

    return ['Semua Wilayah', ...Array.from(zoneSet).sort()];
  });

  readonly filteredWorkerSuggestions = computed<FeaturedWorker[]>(() => {
    const q = this.specialtyQuery().trim().toLowerCase();
    if (!q) return [];

    return this.workers()
      .filter((w) => {
        const nameMatch = w.name.toLowerCase().includes(q);
        const specMatch = w.specialty.toLowerCase().includes(q);
        const tagMatch = w.specialtyTags.some((t) =>
          t.toLowerCase().includes(q),
        );
        return nameMatch || specMatch || tagMatch;
      })
      .slice(0, 4);
  });

  readonly dynamicCategories = signal<string[]>([]);

  readonly filteredCategorySuggestions = computed<string[]>(() => {
    const q = this.specialtyQuery().trim().toLowerCase();
    if (!q) return [];

    const categoriesPool =
      this.dynamicCategories().length > 0
        ? this.dynamicCategories()
        : [
            'Servis AC',
            'Instalasi Listrik',
            'Sanitasi Deep Clean',
            'Elektronik & Audio',
            'Service Kulkas',
            'Pipa & Saluran Air',
          ];

    return categoriesPool
      .filter((cat) => cat.toLowerCase().includes(q))
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.loadWorkers();
    this.loadCategories();
  }

  loadCategories(): void {
    if (
      this.homeApiService &&
      typeof this.homeApiService.fetchPublicCategories === 'function'
    ) {
      this.homeApiService.fetchPublicCategories().subscribe({
        next: (cats) => {
          if (Array.isArray(cats) && cats.length > 0) {
            this.dynamicCategories.set(cats.map((c) => c.title));
          }
        },
        error: () => {
          // Fallback gracefully jika ada kendala jaringan
        },
      });
    }
  }

  loadWorkers(): void {
    this.homeApiService.fetchPublicWorkers().subscribe({
      next: (items) => {
        if (Array.isArray(items)) {
          this.workers.set(items);
        }
      },
      error: () => {
        // Fallback gracefully jika ada kendala jaringan
      },
    });
  }

  onSpecialtyQueryChange(newQuery: string): void {
    this.specialtyQuery.set(newQuery);
    if (newQuery.trim().length >= 1) {
      this.isSuggestOpen.set(true);
    }
  }

  onSpecialtyInputFocus(): void {
    if (this.specialtyQuery().trim().length >= 1) {
      this.isSuggestOpen.set(true);
    }
  }

  onSpecialtyInputBlur(): void {
    // Delay penutupan sedikit agar klik pada item popover sempat tereksekusi
    setTimeout(() => {
      this.isSuggestOpen.set(false);
    }, 200);
  }

  onSelectWorker(worker: FeaturedWorker): void {
    this.isSuggestOpen.set(false);
    this.router.navigate(['/' + worker.slug]);
  }

  onSelectCategory(category: string): void {
    this.specialtyQuery.set(category);
    this.isSuggestOpen.set(false);
    this.handleSearchSubmit();
  }

  applyFilterChip(query: string): void {
    this.specialtyQuery.set(query);
    this.handleSearchSubmit();
  }

  handleSearchSubmit(): void {
    this.isSuggestOpen.set(false);

    const specialty = this.specialtyQuery().trim();
    const locationVal = this.locationQuery();
    const location = locationVal === 'Semua Wilayah' ? '' : locationVal.trim();

    this.searchTrigger.emit({
      specialty,
      location,
    });

    this.analyticsService.trackSearch(specialty, location);

    const targetElement = document.getElementById('spesialis-unggulan');
    if (targetElement && typeof targetElement.scrollIntoView === 'function') {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
