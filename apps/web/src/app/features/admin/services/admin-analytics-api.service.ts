import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  AdminAnalyticsApiResponse,
  AdminAnalyticsSummary,
} from '../models/admin-analytics.model';

@Injectable({
  providedIn: 'root',
})
export class AdminAnalyticsApiService {
  private readonly httpClient = inject(HttpClient, { optional: true });
  private readonly configuredBaseUrl = inject(API_BASE_URL, { optional: true });

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  fetchSummary(days = 30): Observable<AdminAnalyticsSummary | null> {
    if (!this.httpClient) {
      return of(null);
    }

    return this.httpClient
      .get<AdminAnalyticsApiResponse>(
        `${this.normalizedBaseUrl}/api/v1/admin/analytics/summary?days=${days}`,
        { withCredentials: true }
      )
      .pipe(
        map((res) => {
          if (!res || !res.success || !res.data) {
            return null;
          }
          return res.data;
        }),
        catchError(() => of(null))
      );
  }
}

