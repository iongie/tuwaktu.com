import { computed, inject, Injectable, signal } from '@angular/core';
import { AdminAnalyticsApiService } from './admin-analytics-api.service';
import { AdminAnalyticsSummary } from '../models/admin-analytics.model';

@Injectable({
  providedIn: 'root',
})
export class AdminAnalyticsStore {
  private readonly apiService = inject(AdminAnalyticsApiService);

  readonly summary = signal<AdminAnalyticsSummary | null>(null);
  readonly selectedDays = signal<number>(30);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly totalWhatsAppClicks = computed(
    () => this.summary()?.total_whatsapp_clicks ?? 0
  );
  readonly totalBookings = computed(
    () => this.summary()?.total_bookings ?? 0
  );
  readonly totalProfileViews = computed(
    () => this.summary()?.total_profile_views ?? 0
  );
  readonly totalSearches = computed(
    () => this.summary()?.total_searches ?? 0
  );
  readonly topWorkers = computed(
    () => this.summary()?.top_workers ?? []
  );
  readonly topSearches = computed(
    () => this.summary()?.top_searches ?? []
  );
  readonly bookingStatusBreakdown = computed(
    () => this.summary()?.booking_status_breakdown ?? {}
  );

  loadSummary(days?: number): void {
    const targetDays = days !== undefined ? days : this.selectedDays();
    this.selectedDays.set(targetDays);
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiService.fetchSummary(targetDays).subscribe({
      next: (data) => {
        if (data) {
          this.summary.set(data);
        } else {
          this.errorMessage.set('Gagal memuat data analitik dari server.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Terjadi kendala jaringan saat memuat data analitik.');
        this.isLoading.set(false);
      },
    });
  }

  setDaysRange(days: number): void {
    if (this.selectedDays() !== days) {
      this.loadSummary(days);
    }
  }
}

