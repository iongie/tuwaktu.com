import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { WorkerDashboardReviewRecord } from '../../../models/worker-profile.model';

@Component({
  selector: 'app-worker-dashboard-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Title & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline-light">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-ink-on-light flex items-center gap-2.5">
            <span>Ulasan &amp; Reputasi Layanan</span>
            <span class="px-2 py-0.5 rounded bg-surface-highlight border border-hairline-light text-ink-on-light font-mono-rate text-xs font-bold">
              {{ reviews().length }} Ulasan
            </span>
          </h1>
          <p class="text-xs sm:text-sm text-ink-secondary mt-1">
            Pantau masukan, kepuasan pelanggan, dan reputasi terverifikasi dari pekerjaan yang telah Anda selesaikan.
          </p>
        </div>
      </div>

      <!-- Metric Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Card 1: Rata-rata Rating -->
        <div class="bg-body-canvas rounded-[10px] p-5 border border-hairline-light shadow-none flex items-center justify-between">
          <div>
            <p class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">
              Rating Rata-rata
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-on-light font-mono-rate tabular-nums">
                {{ averageRating() }}
              </span>
              <div class="flex items-center text-amber-500 text-sm">
                <span class="material-symbols-outlined text-base">star</span>
              </div>
            </div>
          </div>
          <div class="w-10 h-10 rounded bg-[#fff8e1] text-[#b78103] border border-[#ffe082] flex items-center justify-center">
            <span class="material-symbols-outlined text-xl">grade</span>
          </div>
        </div>

        <!-- Card 2: Total Ulasan Masuk -->
        <div class="bg-body-canvas rounded-[10px] p-5 border border-hairline-light shadow-none flex items-center justify-between">
          <div>
            <p class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">
              Total Ulasan Terverifikasi
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-on-light font-mono-rate tabular-nums">
                {{ reviews().length }}
              </span>
              <span class="text-xs text-ink-disabled font-medium">pelanggan</span>
            </div>
          </div>
          <div class="w-10 h-10 rounded bg-surface-highlight text-ink-on-light border border-hairline-light flex items-center justify-center">
            <span class="material-symbols-outlined text-xl">verified</span>
          </div>
        </div>

        <!-- Card 3: Tingkat Kepuasan Bintang 5 -->
        <div class="bg-body-canvas rounded-[10px] p-5 border border-hairline-light shadow-none flex items-center justify-between">
          <div>
            <p class="text-[11px] font-mono-rate uppercase tracking-wider text-ink-secondary font-bold">
              Kepuasan Bintang 5
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-on-light font-mono-rate tabular-nums">
                {{ fiveStarPercentage() }}%
              </span>
              <span class="text-xs text-ink-disabled font-medium">skor maksimal</span>
            </div>
          </div>
          <div class="w-10 h-10 rounded bg-whatsapp-surface text-whatsapp-ink border border-whatsapp-green/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-xl">sentiment_very_satisfied</span>
          </div>
        </div>
      </div>

      <!-- Reviews Section Container -->
      <div class="bg-body-canvas rounded-[10px] border border-hairline-light p-5 sm:p-6 shadow-none space-y-5">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline-light">
          <div class="flex flex-wrap items-center gap-1.5 p-1 bg-surface-highlight border border-hairline-light rounded" role="tablist" aria-label="Filter bintang ulasan">
            @for (opt of filterOptions; track opt.value) {
              <button
                type="button"
                (click)="selectedStarFilter.set(opt.value)"
                [class]="selectedStarFilter() === opt.value
                  ? 'px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-body-canvas text-ink-on-light border border-hairline-light shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
                  : 'px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-ink-secondary hover:text-ink-on-light transition-colors cursor-pointer border border-transparent'"
              >
                @if (selectedStarFilter() === opt.value) {
                  <span class="w-1.5 h-1.5 rounded-full bg-voltage-orange shrink-0"></span>
                }
                <span>{{ opt.label }}</span>
              </button>
            }
          </div>

          <div class="text-xs text-ink-secondary font-mono-rate">
            Menampilkan {{ filteredReviews().length }} ulasan
          </div>
        </div>

        <!-- State: Loading -->
        @if (isLoading()) {
          <div class="py-12 text-center">
            <div class="inline-block w-8 h-8 border-3 border-hero-canvas border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-mono-rate text-ink-secondary uppercase tracking-wider font-bold">Memuat data ulasan pelanggan...</p>
          </div>
        }

        <!-- State: Empty Reviews -->
        @else if (filteredReviews().length === 0) {
          <div class="py-12 text-center max-w-sm mx-auto">
            <div class="w-12 h-12 rounded bg-surface-highlight border border-hairline-light text-ink-secondary mx-auto mb-3 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">rate_review</span>
            </div>
            <h3 class="text-base font-bold text-ink-on-light mb-1">
              Belum Ada Ulasan Ditemukan
            </h3>
            <p class="text-xs text-ink-secondary leading-relaxed">
              @if (reviews().length === 0) {
                Setelah pekerjaan selesai, jangan lupa gunakan tombol "Minta Ulasan WA" di ringkasan transaksi agar pelanggan dapat memberikan penilaian.
              } @else {
                Tidak ada ulasan yang cocok dengan kriteria filter bintang ini.
              }
            </p>
          </div>
        }

        <!-- State: Review Cards List -->
        @else {
          <div class="divide-y divide-hairline-light">
            @for (rev of filteredReviews(); track rev.id) {
              <div class="py-4.5 first:pt-0 last:pb-0 space-y-2.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold text-ink-on-light">
                      {{ rev.client_name }}
                    </span>
                    @if (rev.is_anonymous) {
                      <span class="text-[10px] bg-surface-highlight border border-hairline-light text-ink-secondary px-2 py-0.5 rounded font-mono-rate uppercase tracking-wider">
                        Publik Disamarkan
                      </span>
                    }
                    <span class="text-xs text-ink-disabled font-mono-rate">
                      #{{ rev.booking_code }}
                    </span>
                    <span class="text-xs text-ink-secondary">
                      &bull; {{ rev.service_name }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="flex items-center text-amber-500">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <span class="material-symbols-outlined text-base">
                          {{ s <= rev.rating ? 'star' : 'star_border' }}
                        </span>
                      }
                    </div>
                    <span class="text-xs text-ink-disabled font-mono-rate whitespace-nowrap">
                      {{ formatDate(rev.created_at) }}
                    </span>
                  </div>
                </div>

                <p class="text-xs sm:text-sm text-ink-on-light leading-relaxed whitespace-pre-line bg-surface-highlight p-3.5 rounded border border-hairline-light">
                  "{{ rev.comment }}"
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerDashboardReviewsComponent implements OnInit {
  readonly store = inject(WorkerDashboardStore);
  private readonly apiService = inject(WorkerDashboardApiService);

  readonly reviews = signal<WorkerDashboardReviewRecord[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly selectedStarFilter = signal<number>(0); // 0 = Semua

  readonly filterOptions = [
    { label: 'Semua Bintang', value: 0 },
    { label: '5 Bintang', value: 5 },
    { label: '4 Bintang', value: 4 },
    { label: '3 Bintang', value: 3 },
    { label: '1 - 2 Bintang', value: 2 },
  ];

  readonly filteredReviews = computed(() => {
    const filter = this.selectedStarFilter();
    const list = this.reviews();
    if (filter === 0) return list;
    if (filter === 2) return list.filter((r) => r.rating <= 2);
    return list.filter((r) => r.rating === filter);
  });

  readonly averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return '0.0';
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return (sum / list.length).toFixed(1);
  });

  readonly fiveStarPercentage = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const fiveStar = list.filter((r) => r.rating === 5).length;
    return Math.round((fiveStar / list.length) * 100);
  });

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    const workerId =
      this.store.workerRecordId() ||
      this.store.workerSlugIdentifier() ||
      'budi-santoso';

    this.isLoading.set(true);
    this.apiService.fetchWorkerReviews(workerId, 50, 0).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.reviews.set(res.data.reviews || []);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.reviews.set([]);
      },
    });
  }

  formatDate(rawDate: string): string {
    if (!rawDate) return '-';
    try {
      const d = new Date(rawDate);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return rawDate;
    }
  }
}

