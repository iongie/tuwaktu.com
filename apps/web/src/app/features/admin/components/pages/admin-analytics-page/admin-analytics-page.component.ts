import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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

  ngOnInit(): void {
    this.store.loadSummary(30);
  }

  onSelectRange(days: number): void {
    this.store.setDaysRange(days);
  }

  refreshData(): void {
    this.store.loadSummary();
  }
}
