import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { TechnicianProfileApiResponse } from '../models/worker-catalog.model';
import {
  CreateServiceBookingPayload,
  ServiceBookingApiResponse,
} from '../models/service-booking.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerBookingApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
  }

  fetchPublicTechnicianProfile(technicianSlug: string): Observable<TechnicianProfileApiResponse> {
    const sanitizedSlug = encodeURIComponent(technicianSlug.trim().toLowerCase());
    return this.httpClient.get<TechnicianProfileApiResponse>(
      `${this.normalizedBaseUrl}/api/public/workers/${sanitizedSlug}`
    );
  }

  submitServiceBookingReservation(
    bookingPayload: CreateServiceBookingPayload
  ): Observable<ServiceBookingApiResponse> {
    return this.httpClient.post<ServiceBookingApiResponse>(
      `${this.normalizedBaseUrl}/api/public/bookings`,
      bookingPayload
    );
  }
}
