import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AdminAnalyticsApiService } from './admin-analytics-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AdminAnalyticsApiResponse } from '../models/admin-analytics.model';

describe('AdminAnalyticsApiService', () => {
  let service: AdminAnalyticsApiService;
  let mockHttpClient: { get: jest.Mock };

  const mockResponse: AdminAnalyticsApiResponse = {
    success: true,
    message: 'Ringkasan data analitik admin berhasil dimuat',
    data: {
      total_whatsapp_clicks: 12,
      total_bookings: 8,
      total_profile_views: 45,
      total_searches: 20,
      top_workers: [],
      top_searches: [],
      booking_status_breakdown: { CONFIRMED: 5, PENDING_WA: 3 },
      days_range: 30,
    },
    error: null,
  };

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        AdminAnalyticsApiService,
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(AdminAnalyticsApiService);
  });

  it('harus membuat instance service', () => {
    expect(service).toBeTruthy();
  });

  it('harus memanggil endpoint summary dan mengembalikan data yang valid', (done) => {
    service.fetchSummary(7).subscribe((data) => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/admin/analytics/summary?days=7',
        { withCredentials: true }
      );
      expect(data).toEqual(mockResponse.data);
      done();
    });
  });

  it('harus mengembalikan null jika terjadi error jaringan', (done) => {
    mockHttpClient.get.mockReturnValue(throwError(() => new Error('Network error')));

    service.fetchSummary(30).subscribe((data) => {
      expect(data).toBeNull();
      done();
    });
  });
});

