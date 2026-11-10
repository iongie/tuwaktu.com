import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminAnalyticsStore } from '../../../services/admin-analytics.store';
import { AdminCityDistributionCardComponent } from '../../organisms/admin-city-distribution-card/admin-city-distribution-card.component';

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminCityDistributionCardComponent,
  ],
  templateUrl: './admin-analytics-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnalyticsPageComponent implements OnInit {
  readonly store = inject(AdminAnalyticsStore);

  readonly timeRanges = [
    { label: '7 Hari Terakhir', days: 7 },
    { label: '30 Hari Terakhir', days: 30 },
    { label: 'Semua Waktu', days: 0 },
  ];

  readonly lastSyncTime = signal<string>('14:42 WIB');

  readonly dateRangeLabel = computed<string>(() => {
    const days = this.store.selectedDays();
    if (days === 7) return '7 Hari Terakhir';
    if (days === 30) return '1 Okt 2024 - 31 Okt 2024';
    return 'Sepanjang Waktu';
  });

  readonly handoffConversionRate = computed<string>(() => {
    const views = this.store.totalProfileViews();
    const clicks = this.store.totalWhatsAppClicks();
    if (views <= 0) return '0.0%';
    return ((clicks / views) * 100).toFixed(1) + '%';
  });

  readonly totalBookingsCount = computed<number>(() => {
    const breakdown = this.store.bookingStatusBreakdown();
    const sum = Object.values(breakdown).reduce((acc, curr) => acc + (curr || 0), 0);
    return sum || this.store.totalBookings() || 0;
  });

  ngOnInit(): void {
    this.updateSyncTime();
    this.store.loadSummary(30);
  }

  onSelectRange(days: number): void {
    this.store.setDaysRange(days);
    this.updateSyncTime();
  }

  refreshData(): void {
    this.updateSyncTime();
    this.store.loadSummary();
  }

  private updateSyncTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.lastSyncTime.set(`Sinkron: ${hours}:${minutes} WIB`);
  }

  getInitials(name: string): string {
    const trimmed = (name || '').trim();
    if (!trimmed) return 'TW';
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }

  getWorkerConversionRate(clicks: number, views: number): string {
    if (!views || views <= 0) return '0.0%';
    return ((clicks / views) * 100).toFixed(1) + '%';
  }

  getWorkerConversionPercentage(clicks: number, views: number): number {
    if (!views || views <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((clicks / views) * 100)));
  }

  getStatusCount(status: string): number {
    const breakdown = this.store.bookingStatusBreakdown();
    return breakdown[status] || 0;
  }

  getStatusPercentage(status: string): string {
    const total = this.totalBookingsCount();
    if (total <= 0) return '0%';
    const count = this.getStatusCount(status);
    return ((count / total) * 100).toFixed(1) + '%';
  }

  getStatusWidth(status: string): number {
    const total = this.totalBookingsCount();
    if (total <= 0) return 0;
    const count = this.getStatusCount(status);
    return Math.min(100, Math.max(0, Math.round((count / total) * 100)));
  }

  exportData(): void {
    const data = [
      ['Metrik', 'Nilai'],
      ['Total Klik WhatsApp', this.store.totalWhatsAppClicks()],
      ['Total Reservasi Booking', this.store.totalBookings()],
      ['Total Kunjungan Profil', this.store.totalProfileViews()],
      ['Total Pencarian Beranda', this.store.totalSearches()],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + data.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analitik-tuwaktu-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
