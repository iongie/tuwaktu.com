import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-2">
      <!-- Stars row -->
      <div
        class="flex items-center gap-1.5 focus:outline-none"
        role="radiogroup"
        aria-label="Penilaian Bintang"
        (mouseleave)="onMouseLeave()"
      >
        @for (star of starList; track star) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="rating() === star"
            [attr.aria-label]="starLabels[star]"
            (mouseenter)="onMouseEnter(star)"
            (click)="selectRating(star)"
            class="p-2 rounded-full transition-transform duration-150 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer select-none"
          >
            <span
              class="material-symbols-outlined text-4xl transition-colors duration-150"
              [class.text-amber-500]="isFilled(star)"
              [class.text-outline-variant]="!isFilled(star)"
            >
              {{ isFilled(star) ? 'star' : 'star_border' }}
            </span>
          </button>
        }
      </div>

      <!-- Rating Text Label -->
      <p
        class="text-sm font-semibold tracking-wide transition-all duration-200 min-h-[20px]"
        [class.text-ink-primary]="displayedRating() > 0"
        [class.text-ink-disabled]="displayedRating() === 0"
      >
        {{ starLabels[displayedRating()] || 'Pilih jumlah bintang (1 sampai 5)' }}
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingInputComponent {
  readonly rating = model<number>(0);
  readonly hoveredRating = signal<number>(0);

  readonly starList = [1, 2, 3, 4, 5];

  readonly starLabels: Record<number, string> = {
    1: '1 Bintang - Sangat Buruk',
    2: '2 Bintang - Kurang Memuaskan',
    3: '3 Bintang - Cukup Baik',
    4: '4 Bintang - Bagus & Memuaskan',
    5: '5 Bintang - Sangat Memuaskan!',
  };

  readonly displayedRating = computed(() => {
    return this.hoveredRating() > 0 ? this.hoveredRating() : this.rating();
  });

  isFilled(starNumber: number): boolean {
    return this.displayedRating() >= starNumber;
  }

  onMouseEnter(starNumber: number): void {
    this.hoveredRating.set(starNumber);
  }

  onMouseLeave(): void {
    this.hoveredRating.set(0);
  }

  selectRating(starNumber: number): void {
    this.rating.set(starNumber);
  }
}

