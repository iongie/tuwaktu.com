import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminAnalyticsStore } from './admin-analytics.store';
import { AdminAnalyticsApiService } from './admin-analytics-api.service';
import { AdminAnalyticsSummary } from '../models/admin-analytics.model';

describe('AdminAnalyticsStore', () => {
  let store: AdminAnalyticsStore;
  let mockApiService: { fetchSummary: jest.Mock };

  const mockSummary: AdminAnalyticsSummary = {
    total_whatsapp_clicks: 25,
    total_bookings: 10,
    total_profile_views: 120,
    total_searches: 45,
    top_workers: [
      {
        worker_id: 'w-1',
        worker_slug: 'budi-santoso',
        worker_name: 'Budi Santoso',
        zone: 'Jakarta Selatan',
        whatsapp_clicks: 15,
        profile_views: 60,
      },
    ],
    top_searches: [
      { query: 'ac', location: 'jakarta', count: 18 },
    ],
    booking_status_breakdown: { CONFIRMED: 6, PENDING_WA: 4 },
    days_range: 30,
  };

  beforeEach(() => {
    mockApiService = {
      fetchSummary: jest.fn().mockReturnValue(of(mockSummary)),
    };

    TestBed.configureTestingModule({
      providers: [
        AdminAnalyticsStore,
        { provide: AdminAnalyticsApiService, useValue: mockApiService },
      ],
    });

    store = TestBed.inject(AdminAnalyticsStore);
  });

  it('harus membuat instance store dengan nilai default', () => {
    expect(store).toBeTruthy();
    expect(store.selectedDays()).toBe(30);
    expect(store.isLoading()).toBe(false);
    expect(store.totalWhatsAppClicks()).toBe(0);
  });

  it('harus memuat data summary dan menghitung computed signals secara tepat', () => {
    store.loadSummary(30);

    expect(mockApiService.fetchSummary).toHaveBeenCalledWith(30);
    expect(store.isLoading()).toBe(false);
    expect(store.totalWhatsAppClicks()).toBe(25);
    expect(store.totalBookings()).toBe(10);
    expect(store.totalProfileViews()).toBe(120);
    expect(store.totalSearches()).toBe(45);
    expect(store.topWorkers().length).toBe(1);
    expect(store.topSearches().length).toBe(1);
  });

  it('harus mengubah rentang hari dan memuat ulang data saat setDaysRange dipanggil', () => {
    store.setDaysRange(7);

    expect(store.selectedDays()).toBe(7);
    expect(mockApiService.fetchSummary).toHaveBeenCalledWith(7);
  });
});

