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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-ink-primary font-display flex items-center gap-2.5">
            <span>Ulasan &amp; Reputasi Layanan</span>
            <span class="m3-badge text-xs px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary font-medium">
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
        <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Rating Rata-rata
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-primary font-mono">
                {{ averageRating() }}
              </span>
              <div class="flex items-center text-amber-500 text-sm">
                <span class="material-symbols-outlined text-base">star</span>
              </div>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <span class="material-symbols-outlined text-2xl">grade</span>
          </div>
        </div>

        <!-- Card 2: Total Ulasan Masuk -->
        <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Total Ulasan Terverifikasi
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-primary font-mono">
                {{ reviews().length }}
              </span>
              <span class="text-xs text-ink-disabled font-medium">pelanggan</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-secondary-container text-secondary flex items-center justify-center border border-secondary/20">
            <span class="material-symbols-outlined text-2xl">verified</span>
          </div>
        </div>

        <!-- Card 3: Tingkat Kepuasan Bintang 5 -->
        <div class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
              Kepuasan Bintang 5
            </p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold text-ink-primary font-mono">
                {{ fiveStarPercentage() }}%
              </span>
              <span class="text-xs text-ink-disabled font-medium">skor maksimal</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <span class="material-symbols-outlined text-2xl">sentiment_very_satisfied</span>
          </div>
        </div>
      </div>

      <!-- Reviews Section Container -->
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 sm:p-6 shadow-xs space-y-5">
        <!-- Filter Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant">
          <div class="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter bintang ulasan">
            @for (opt of filterOptions; track opt.value) {
              <button
                type="button"
                (click)="selectedStarFilter.set(opt.value)"
                [class]="selectedStarFilter() === opt.value
                  ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-on-surface text-surface shadow-xs transition-colors'
                  : 'px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:bg-surface-container transition-colors cursor-pointer'"
              >
                {{ opt.label }}
              </button>
            }
          </div>

          <div class="text-xs text-ink-secondary font-mono">
            Menampilkan {{ filteredReviews().length }} ulasan
          </div>
        </div>

        <!-- State: Loading -->
        @if (isLoading()) {
          <div class="py-12 text-center">
            <div class="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-medium text-ink-secondary">Memuat data ulasan pelanggan...</p>
          </div>
        }

        <!-- State: Empty Reviews -->
        @else if (filteredReviews().length === 0) {
          <div class="py-12 text-center max-w-sm mx-auto">
            <div class="w-12 h-12 rounded-full bg-surface-container-high text-ink-secondary mx-auto mb-3 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">rate_review</span>
            </div>
            <h3 class="text-base font-bold text-ink-primary mb-1">
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
          <div class="divide-y divide-outline-variant/60">
            @for (rev of filteredReviews(); track rev.id) {
              <div class="py-4.5 first:pt-0 last:pb-0 space-y-2.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold text-ink-primary">
                      {{ rev.client_name }}
                    </span>
                    @if (rev.is_anonymous) {
                      <span class="text-[10px] bg-surface-container text-ink-secondary px-2 py-0.5 rounded-full font-mono">
                        Publik Disamarkan
                      </span>
                    }
                    <span class="text-xs text-ink-disabled font-mono">
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
                    <span class="text-xs text-ink-disabled font-mono whitespace-nowrap">
                      {{ formatDate(rev.created_at) }}
                    </span>
                  </div>
                </div>

                <p class="text-xs sm:text-sm text-ink-primary leading-relaxed whitespace-pre-line bg-surface-container-low/50 p-3 rounded-xl border border-outline-variant/40">
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

