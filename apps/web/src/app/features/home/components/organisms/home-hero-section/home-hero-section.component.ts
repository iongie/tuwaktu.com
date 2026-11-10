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
    <!-- Dark Nocturne Theater Canvas Hero (#121212) -->
    <section
      class="w-full bg-hero-canvas text-ink-on-dark relative overflow-hidden py-space-3xl sm:py-space-4xl border-b border-white/10"
      aria-labelledby="hero-title"
    >
      <!-- Background Architectural Grid Pattern -->
      <div
        class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      ></div>

      <div
        class="max-w-7xl mx-auto px-margin-desktop relative z-10 space-y-space-2xl"
      >
        <!-- Telemetry Status Bar -->
        <div class="flex flex-wrap items-center justify-between gap-space-sm">
          <div
            class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-caption font-mono-rate"
          >
            <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span
              class="text-ink-on-dark font-medium uppercase tracking-wider text-[11px]"
            >
              Protokol Kedaulatan Pekerja Mandiri • 0% Komisi
            </span>
          </div>
        </div>

        <!-- Asymmetric Headline & Copy -->
        <div class="max-w-4xl space-y-space-md">
          <h1
            id="hero-title"
            class="font-heading-h1 text-[32px] sm:text-[44px] md:text-[52px] font-bold text-white tracking-tight leading-[1.12]"
          >
            Cari Spesialis Terverifikasi.
            <span class="text-voltage-orange block sm:inline"
              >Terhubung Langsung Tanpa Perantara.</span
            >
          </h1>

          <p
            class="font-lead-body text-body-default sm:text-lead-body text-white/70 max-w-2xl leading-relaxed"
          >
            Platform reservasi mandiri untuk teknisi AC, instalasi kelistrikan,
            sanitasi deep clean, dan servis elektronik. Tarif transparan,
            proteksi buffer transit perjalanan, dan kontak langsung ke WhatsApp
            mitra.
          </p>
        </div>

        <!-- Interactive Booking Search Console -->
        <div
          class="p-space-lg sm:p-space-xl bg-surface-elevated-dark/80 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl max-w-5xl relative z-30"
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
                  class="px-3.5 py-1.5 min-h-[36px] inline-flex items-center rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-caption transition-colors cursor-pointer"
                >
                  {{ chip.label }}
                </button>
              }
            </div>
          </form>
        </div>

        <!-- 4 Pilar Kepercayaan Tuwaktu -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-lg"
        >
          @for (pillar of trustPillars; track pillar.title) {
            <div
              class="p-space-lg rounded-xl bg-white/5 border border-white/10 space-y-space-xs hover:bg-white/[0.07] transition-colors"
            >
              <div class="flex items-center justify-between">
                <span
                  class="material-symbols-outlined text-[24px] text-voltage-orange"
                >
                  {{ pillar.icon }}
                </span>
                <span
                  class="font-mono-rate text-[10px] uppercase font-bold text-success bg-success/15 px-2 py-0.5 rounded"
                >
                  {{ pillar.badge }}
                </span>
              </div>
              <h3 class="font-heading-h3 text-[15px] font-bold text-white pt-1">
                {{ pillar.title }}
              </h3>
              <p
                class="font-body-default text-caption text-white/60 leading-relaxed"
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
    { label: 'Servis AC HVAC', query: 'ac' },
    { label: 'Sanitasi Deep Clean', query: 'deep clean' },
    { label: 'Instalasi Listrik', query: 'listrik' },
    { label: 'Elektronik & Audio', query: 'elektronik' },
  ];

  readonly trustPillars = [
    {
      title: '0% Potongan Komisi',
      description:
        'Seluruh pembayaran klien 100% diterima langsung oleh pekerja mandiri tanpa potongan.',
      icon: 'percent',
      badge: 'Bebas Potongan',
    },
    {
      title: '100% WhatsApp Langsung',
      description:
        'Komunikasi langsung ke kontak asli pekerja. Tanpa perantara dan tanpa sensor nomor.',
      icon: 'chat',
      badge: 'Kontak Mandiri',
    },
    {
      title: 'Buffer Transit Otomatis',
      description:
        'Jeda 60-90 menit antar slot reservasi untuk perjalanan tenang dan tepat waktu.',
      icon: 'timer',
      badge: 'Bebas Bentrok',
    },
    {
      title: 'Kredensial Terverifikasi',
      description:
        'Spesialis melalui verifikasi identitas KTP dan penentuan zona pangkalan nyata.',
      icon: 'verified_user',
      badge: 'Kurasi Ketat',
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

    const categoriesPool = this.dynamicCategories().length > 0
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
    if (this.homeApiService && typeof this.homeApiService.fetchPublicCategories === 'function') {
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
