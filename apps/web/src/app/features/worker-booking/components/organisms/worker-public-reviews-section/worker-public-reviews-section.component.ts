import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicReviewItem } from '../../../models/worker-catalog.model';

@Component({
  selector: 'app-worker-public-reviews-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mt-10 pt-8 border-t border-outline-variant">
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-ink-primary font-display flex items-center gap-2">
            <span>Ulasan Pelanggan Terverifikasi</span>
            <span class="m3-badge text-xs px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary font-medium">
              {{ reviewCount() }} Ulasan
            </span>
          </h2>
          <p class="text-xs sm:text-sm text-ink-secondary mt-1">
            Ulasan nyata yang dikirimkan oleh pelanggan setelah pekerjaan berhasil diselesaikan.
          </p>
        </div>

        <!-- Rating Highlight Badge -->
        <div class="flex items-center gap-3 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant self-start sm:self-auto">
          <div class="flex items-center gap-1 text-amber-500">
            <span class="material-symbols-outlined text-2xl">star</span>
            <span class="text-2xl font-extrabold text-ink-primary font-mono leading-none">
              {{ formattedRating() }}
            </span>
          </div>
          <div class="text-xs text-ink-secondary leading-tight border-l border-outline-variant pl-3">
            <span class="font-semibold text-ink-primary block">Kepuasan Layanan</span>
            <span>dari {{ reviewCount() }} transaksi</span>
          </div>
        </div>
      </div>

      <!-- State: Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (i of [1, 2]; track i) {
            <div class="bg-surface-container-low rounded-2xl p-5 border border-outline-variant animate-pulse space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-surface-container-high"></div>
                <div class="space-y-1.5 flex-1">
                  <div class="h-4 bg-surface-container-high rounded w-1/3"></div>
                  <div class="h-3 bg-surface-container-high rounded w-1/4"></div>
                </div>
              </div>
              <div class="h-3 bg-surface-container-high rounded w-full"></div>
              <div class="h-3 bg-surface-container-high rounded w-4/5"></div>
            </div>
          }
        </div>
      }

      <!-- State: Empty Reviews -->
      @else if (reviews().length === 0) {
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center max-w-lg mx-auto">
          <div class="w-12 h-12 rounded-full bg-surface-container-high text-ink-secondary mx-auto mb-3 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">reviews</span>
          </div>
          <h3 class="text-base font-bold text-ink-primary mb-1">
            Belum Ada Ulasan
          </h3>
          <p class="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Belum ada ulasan terverifikasi untuk teknisi ini. Jadilah pelanggan pertama yang memesan dan membagikan pengalaman Anda!
          </p>
        </div>
      }

      <!-- State: Review Cards Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (rev of reviews(); track rev.id) {
            <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm hover:border-outline transition-colors flex flex-col justify-between">
              <div>
                <!-- Top Row: Client Info & Stars -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-sm font-bold text-ink-primary">
                        {{ rev.client_display_name }}
                      </span>
                      <span class="inline-flex items-center gap-0.5 text-[11px] font-medium text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                        <span class="material-symbols-outlined text-xs">verified</span>
                        Terverifikasi
                      </span>
                    </div>
                    <p class="text-xs text-ink-secondary mt-0.5 font-mono">
                      {{ rev.service_name }}
                    </p>
                  </div>

                  <!-- Stars -->
                  <div class="flex items-center gap-0.5 text-amber-500 shrink-0" [attr.aria-label]="rev.rating + ' bintang'">
                    @for (s of [1, 2, 3, 4, 5]; track s) {
                      <span class="material-symbols-outlined text-base">
                        {{ s <= rev.rating ? 'star' : 'star_border' }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Review Comment -->
                <p class="text-xs sm:text-sm text-ink-primary leading-relaxed whitespace-pre-line">
                  "{{ rev.comment }}"
                </p>
              </div>

              <!-- Date Footer -->
              <div class="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[11px] text-ink-disabled font-mono">
                <span>Pemesanan Berhasil</span>
                <span>{{ formatDate(rev.created_at) }}</span>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerPublicReviewsSectionComponent {
  readonly reviews = input<PublicReviewItem[]>([]);
  readonly rating = input<number>(0);
  readonly reviewCount = input<number>(0);
  readonly isLoading = input<boolean>(false);

  readonly formattedRating = computed(() => {
    const val = this.rating();
    return val > 0 ? val.toFixed(1) : 'Baru';
  });

  formatDate(rawDate: string): string {
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }
}

