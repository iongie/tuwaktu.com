import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sanitizePlainText } from '../../../../../core/utils/sanitize.utils';
import { ReviewInvitationDetail } from '../../../models/client-review.model';
import { StarRatingInputComponent } from '../../molecules/star-rating-input/star-rating-input.component';

@Component({
  selector: 'app-client-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingInputComponent],
  template: `
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 max-w-xl mx-auto shadow-sm">
      <!-- Order Summary Card -->
      <div class="bg-surface-container-low rounded-xl p-4 sm:p-5 border border-outline-variant mb-6 flex items-start gap-4">
        <div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant shrink-0 flex items-center justify-center">
          @if (invitation().worker_avatar) {
            <img
              [src]="invitation().worker_avatar"
              [alt]="invitation().worker_name"
              class="w-full h-full object-cover"
            />
          } @else {
            <span class="material-symbols-outlined text-ink-disabled text-2xl">person</span>
          }
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="m3-badge text-xs px-2 py-0.5 rounded-full bg-secondary-container text-secondary font-medium">
              Pesanan Selesai
            </span>
            <span class="text-xs text-ink-disabled font-mono">#{{ invitation().booking_code }}</span>
          </div>
          <h3 class="text-base font-bold text-ink-primary truncate">
            {{ invitation().worker_name }}
          </h3>
          <p class="text-xs sm:text-sm text-ink-secondary truncate">
            {{ invitation().service_name }} &bull; {{ invitation().worker_zone }}
          </p>
        </div>
      </div>

      <!-- Form Error Banner -->
      @if (errorMessage()) {
        <div class="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs sm:text-sm flex items-start gap-2.5">
          <span class="material-symbols-outlined text-base shrink-0">error</span>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form (ngSubmit)="handleFormSubmit()" class="space-y-6">
        <!-- Rating Bintang Input -->
        <div class="text-center pb-2">
          <label class="block text-sm font-semibold text-ink-primary mb-3">
            Beri Nilai Kepuasan Pekerjaan <span class="text-error">*</span>
          </label>
          <app-star-rating-input [(rating)]="selectedRating" />
          @if (ratingError()) {
            <p class="text-xs text-error mt-2 font-medium">{{ ratingError() }}</p>
          }
        </div>

        <!-- Komentar Pengalaman -->
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label for="reviewComment" class="block text-sm font-semibold text-ink-primary">
              Ceritakan Pengalaman Anda <span class="text-error">*</span>
            </label>
            <span class="text-xs font-mono text-ink-disabled">
              {{ commentText().length }}/1000
            </span>
          </div>
          <textarea
            id="reviewComment"
            rows="4"
            [ngModel]="commentText()"
            (ngModelChange)="onCommentChange($event)"
            name="comment"
            maxlength="1000"
            placeholder="Bagaimana kerapian kerja, keramahan, dan ketepatan waktu teknisi? Bagikan pengalaman Anda untuk membantu calon pelanggan lain."
            class="m3-field-outlined w-full p-3.5 text-sm rounded-xl resize-none transition-colors duration-150"
            [class.border-error]="commentError()"
            [disabled]="isSubmitting()"
          ></textarea>
          @if (commentError()) {
            <p class="text-xs text-error mt-1.5 font-medium">{{ commentError() }}</p>
          }
        </div>

        <!-- Opsi Anonim / Inisial -->
        <div class="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant flex items-start gap-3">
          <input
            type="checkbox"
            id="isAnonymous"
            [ngModel]="isAnonymous()"
            (ngModelChange)="isAnonymous.set($event)"
            name="isAnonymous"
            class="w-4 h-4 mt-0.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
            [disabled]="isSubmitting()"
          />
          <label for="isAnonymous" class="text-xs sm:text-sm text-ink-primary cursor-pointer select-none leading-relaxed">
            <span class="font-semibold block">Tampilkan nama saya sebagai inisial (Anonim)</span>
            <span class="text-ink-secondary text-xs">
              Nama Anda akan disamarkan menjadi <span class="font-medium text-ink-primary">{{ anonymizedPreview() }}</span> di ulasan publik profil teknisi.
            </span>
          </label>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button
            type="submit"
            [disabled]="isSubmitting()"
            class="m3-btn-filled w-full py-3.5 px-6 rounded-xl text-sm font-bold min-h-[48px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
          >
            @if (isSubmitting()) {
              <span class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Mengirim Ulasan...</span>
            } @else {
              <span class="material-symbols-outlined text-lg">send</span>
              <span>Kirim Ulasan Sekarang</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientReviewFormComponent {
  readonly invitation = input.required<ReviewInvitationDetail>();
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly submitReview = output<{
    rating: number;
    comment: string;
    isAnonymous: boolean;
  }>();

  readonly selectedRating = signal<number>(0);
  readonly commentText = signal<string>('');
  readonly isAnonymous = signal<boolean>(false);

  readonly ratingError = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);

  readonly anonymizedPreview = computed(() => {
    const rawName = this.invitation().client_name || 'Pelanggan';
    const words = rawName.trim().split(/\s+/);
    if (words.length <= 1) {
      return (words[0] || 'Pelanggan') + ' (Pelanggan)';
    }
    const first = words[0];
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  });

  onCommentChange(val: string): void {
    this.commentText.set(val);
    if (val.trim().length >= 5) {
      this.commentError.set(null);
    }
  }

  handleFormSubmit(): void {
    let hasError = false;

    if (this.selectedRating() < 1 || this.selectedRating() > 5) {
      this.ratingError.set('Silakan pilih bintang penilaian kepuasan (1 sampai 5).');
      hasError = true;
    } else {
      this.ratingError.set(null);
    }

    const cleanedComment = sanitizePlainText(this.commentText(), 1000);
    if (cleanedComment.length < 5) {
      this.commentError.set('Ulasan pengalaman minimal harus 5 karakter.');
      hasError = true;
    } else if (cleanedComment.length > 1000) {
      this.commentError.set('Ulasan pengalaman maksimal 1.000 karakter.');
      hasError = true;
    } else {
      this.commentError.set(null);
    }

    if (hasError) {
      return;
    }

    this.submitReview.emit({
      rating: this.selectedRating(),
      comment: cleanedComment,
      isAnonymous: this.isAnonymous(),
    });
  }
}
