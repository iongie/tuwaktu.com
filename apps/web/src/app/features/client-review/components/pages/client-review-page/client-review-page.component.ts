import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientReviewApiService } from '../../../services/client-review-api.service';
import { ReviewInvitationDetail } from '../../../models/client-review.model';
import { ClientReviewFormComponent } from '../../organisms/client-review-form/client-review-form.component';
import { ReviewSuccessBannerComponent } from '../../organisms/review-success-banner/review-success-banner.component';

@Component({
  selector: 'app-client-review-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ClientReviewFormComponent,
    ReviewSuccessBannerComponent,
  ],
  template: `
    <main class="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div class="max-w-xl w-full mx-auto">
        <!-- Logo Header -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 group focus:outline-none">
            <span class="text-2xl font-black tracking-tight text-ink-primary font-display">
              Tu<span class="text-primary">waktu</span>
            </span>
          </a>
          <p class="text-xs sm:text-sm text-ink-secondary mt-1">
            Ulasan Kepuasan Layanan Teknisi
          </p>
        </div>

        <!-- State 1: Loading Invitation -->
        @if (isLoading()) {
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 max-w-xl mx-auto text-center shadow-sm">
            <div class="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-medium text-ink-secondary">Memverifikasi data pesanan ulasan...</p>
          </div>
        }

        <!-- State 2: Error Validasi Token / Status -->
        @else if (pageError()) {
          <div class="bg-surface-container-lowest rounded-2xl border border-error/20 p-8 max-w-xl mx-auto text-center shadow-sm">
            <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span class="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
            </div>
            <h2 class="text-xl font-bold text-ink-primary mb-2">
              Tidak Dapat Memberikan Ulasan
            </h2>
            <p class="text-sm text-ink-secondary mb-6 leading-relaxed">
              {{ pageError() }}
            </p>
            <a
              routerLink="/"
              class="m3-btn-outlined inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold min-h-[44px]"
            >
              <span class="material-symbols-outlined text-base">home</span>
              Kembali ke Beranda
            </a>
          </div>
        }

        <!-- State 3: Sukses Terkirim -->
        @else if (isSubmitted()) {
          <app-review-success-banner [workerName]="invitation()?.worker_name || 'Teknisi'" />
        }

        <!-- State 4: Form Siap Diisi -->
        @else if (invitation()) {
          <app-client-review-form
            [invitation]="invitation()!"
            [isSubmitting]="isSubmitting()"
            [errorMessage]="submitError()"
            (submitReview)="onSubmitReview($event)"
          />
        }
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reviewApi = inject(ClientReviewApiService);

  readonly isLoading = signal<boolean>(true);
  readonly pageError = signal<string | null>(null);
  readonly invitation = signal<ReviewInvitationDetail | null>(null);

  readonly isSubmitting = signal<boolean>(false);
  readonly submitError = signal<string | null>(null);
  readonly isSubmitted = signal<boolean>(false);

  private bookingCode = '';
  private token = '';

  ngOnInit(): void {
    this.bookingCode = this.route.snapshot.params['bookingCode'] || '';
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.bookingCode || !this.token) {
      this.isLoading.set(false);
      this.pageError.set(
        'Tautan ulasan tidak lengkap. Pastikan Anda membuka tautan yang dibagikan oleh teknisi melalui WhatsApp.'
      );
      return;
    }

    this.loadInvitation();
  }

  loadInvitation(): void {
    this.isLoading.set(true);
    this.pageError.set(null);

    this.reviewApi.fetchReviewInvitation(this.bookingCode, this.token).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          if (res.data.is_reviewed) {
            this.invitation.set(null);
            this.pageError.set('Pesanan ini sudah pernah Anda beri ulasan sebelumnya. Terima kasih!');
          } else {
            this.invitation.set(res.data);
          }
        } else {
          this.invitation.set(null);
          this.pageError.set(res.message || 'Gagal memverifikasi formulir ulasan.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.invitation.set(null);
        const msg =
          err?.error?.message ||
          'Tautan ulasan tidak valid atau pesanan belum selesai dikerjakan.';
        this.pageError.set(msg);
      },
    });
  }

  onSubmitReview(event: { rating: number; comment: string; isAnonymous: boolean }): void {
    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.reviewApi
      .submitClientReview({
        booking_code: this.bookingCode,
        token: this.token,
        rating: event.rating,
        comment: event.comment,
        is_anonymous: event.isAnonymous,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.isSubmitted.set(true);
          } else {
            this.submitError.set(res.message || 'Gagal mengirim ulasan.');
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg =
            err?.error?.message ||
            'Terjadi kesalahan saat menyimpan ulasan. Silakan coba beberapa saat lagi.';
          this.submitError.set(msg);
        },
      });
  }
}
