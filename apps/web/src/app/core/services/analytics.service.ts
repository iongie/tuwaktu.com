import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { API_BASE_URL } from '../../../environments/environment.model';

export interface TelemetryEventPayload {
  event_name: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly httpClient = inject(HttpClient, { optional: true });
  private readonly configuredBaseUrl = inject(API_BASE_URL, { optional: true });

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  trackEvent(
    eventName: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.httpClient || !eventName) {
      return;
    }

    const payload: TelemetryEventPayload = {
      event_name: eventName,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    };

    this.httpClient
      .post(`${this.normalizedBaseUrl}/api/v1/public/telemetry/events`, payload)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  trackWhatsAppClick(workerSlug: string, source = 'worker_profile'): void {
    this.trackEvent('whatsapp_click', 'worker', workerSlug, {
      source,
      timestamp: new Date().toISOString(),
    });
  }

  trackProfileView(workerSlug: string): void {
    this.trackEvent('page_view_worker', 'worker', workerSlug, {
      timestamp: new Date().toISOString(),
    });
  }

  trackSearch(query: string, location: string): void {
    const q = query.trim();
    const loc = location.trim();
    if (!q && !loc) return;

    this.trackEvent('search_performed', 'search', '', {
      query: q,
      location: loc,
      timestamp: new Date().toISOString(),
    });
  }

  trackBookingCreated(bookingCode: string, workerSlug?: string): void {
    this.trackEvent('booking_created', 'booking', bookingCode, {
      worker_slug: workerSlug || '',
      timestamp: new Date().toISOString(),
    });
  }
}

