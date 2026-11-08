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

        <!-- 4-Column Bento Grid of Category Cards -->
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
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeDisciplinesSectionComponent implements OnInit {
  private readonly homeApiService = inject(HomeApiService, { optional: true });

  readonly selectCategory = output<string>();

  readonly categories = signal<DisciplineCategory[]>([
    {
      id: 'cat-ac',
      slug: 'ac-pendingin',
      title: 'Servis & Pasang AC',
      description:
        'Pembersihan filter, flushing freon berkala, perbaikan pipa bocor, dan perawatan unit inverter.',
      icon: 'ac_unit',
      startingPrice: 75000,
      priceUnit: 'unit',
      availabilityTag: 'Tersedia di Katalog',
      highlightTag: 'Populer',
    },
    {
      id: 'cat-cleaning',
      slug: 'sanitasi-cleaning',
      title: 'Sanitasi & Deep Clean',
      description:
        'Pembersihan menyeluruh kamar tidur, sofa, kamar mandi berkerak, dan sterilisasi tungau kasur.',
      icon: 'cleaning_services',
      startingPrice: 65000,
      priceUnit: 'jam',
      availabilityTag: 'Tersedia di Katalog',
      highlightTag: 'Higienis',
    },
    {
      id: 'cat-listrik',
      slug: 'instalasi-listrik',
      title: 'Instalasi Listrik Presisi',
      description:
        'Pemeriksaan beban daya, tracing korsleting listrik, perakitan panel MCB, dan instalasi stop kontak.',
      icon: 'bolt',
      startingPrice: 80000,
      priceUnit: 'kunjungan',
      availabilityTag: 'Tersedia di Katalog',
      highlightTag: 'Prioritas Aman',
    },
    {
      id: 'cat-elektronik',
      slug: 'elektronik-audio',
      title: 'Reparasi Elektronik',
      description:
        'Diagnostik mesin cuci digital, kulkas inverter, perbaikan audio speaker, dan instalasi TV dinding.',
      icon: 'tv',
      startingPrice: 120000,
      priceUnit: 'kunjungan',
      availabilityTag: 'Tersedia di Katalog',
      highlightTag: 'Spesialis Ahli',
    },
  ]);

  ngOnInit(): void {
    if (this.homeApiService && typeof this.homeApiService.fetchPublicCategories === 'function') {
      this.homeApiService.fetchPublicCategories().subscribe({
        next: (items) => {
          if (items && items.length > 0) {
            this.categories.set(items);
          }
        },
      });
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
