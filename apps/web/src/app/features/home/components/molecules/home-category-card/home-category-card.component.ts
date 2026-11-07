import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisciplineCategory } from '../../../models/home.model';

@Component({
  selector: 'app-home-category-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      (click)="onCardClick()"
      class="m3-card-outlined p-space-xl bg-body-canvas hover:border-hero-canvas hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between h-full group"
      [attr.aria-label]="'Kategori layanan ' + category().title"
      tabindex="0"
      (keydown.enter)="onCardClick()"
    >
      <div class="space-y-space-md">
        <!-- Icon & Tag Badge -->
        <div class="flex items-center justify-between gap-space-sm">
          <div
            class="w-12 h-12 rounded-xl bg-surface-container-low text-ink-on-light flex items-center justify-center group-hover:bg-hero-canvas group-hover:text-ink-on-dark transition-colors"
          >
            <span class="material-symbols-outlined text-[26px]">
              {{ category().icon }}
            </span>
          </div>

          <span
            class="px-2 py-0.5 rounded bg-surface-warm-promo text-promo-ink font-micro-uppercase text-micro-uppercase font-semibold uppercase tracking-wider"
          >
            {{ category().highlightTag }}
          </span>
        </div>

        <!-- Judul & Deskripsi Kategori -->
        <div>
          <h3
            class="font-heading-h3 text-heading-h3 font-bold text-on-surface group-hover:text-voltage-orange transition-colors"
          >
            {{ category().title }}
          </h3>
          <p class="font-body-default text-body-default text-ink-secondary mt-1.5 leading-relaxed">
            {{ category().description }}
          </p>
        </div>
      </div>

      <!-- Estimasi Tarif & Spesialis Aktif -->
      <div class="mt-space-lg pt-space-md border-t border-hairline-subtle space-y-space-xs">
        <div class="flex items-center justify-between text-caption">
          <span class="text-ink-disabled font-micro-uppercase uppercase">Standar Tarif</span>
          <span class="font-mono-rate font-bold text-on-surface">
            {{ formattedStartingPrice() }} / {{ category().priceUnit }}
          </span>
        </div>

        <div class="flex items-center justify-between text-caption pt-0.5">
          <span class="text-ink-disabled">Ketersediaan</span>
          <span class="text-success font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
            {{ category().availabilityTag || 'Tersedia di Katalog' }}
          </span>
        </div>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeCategoryCardComponent {
  readonly category = input.required<DisciplineCategory>();
  readonly selectCategory = output<string>();

  readonly formattedStartingPrice = computed(() => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(this.category().startingPrice);
  });

  onCardClick(): void {
    this.selectCategory.emit(this.category().slug);
  }
}
