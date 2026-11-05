import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { TechnicianProfileApiResponse } from '../models/worker-catalog.model';
import {
  CreateServiceBookingPayload,
  ServiceBookingApiResponse,
  CalculateFeeRequestPayload,
  FeeCalculationApiResponse,
  AvailableSlotsApiResponse,
} from '../models/service-booking.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerBookingApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
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
      `${this.normalizedBaseUrl}/api/v1/booking/create`,
      bookingPayload
    );
  }

  calculateBookingFee(
    payload: CalculateFeeRequestPayload
  ): Observable<FeeCalculationApiResponse> {
    return this.httpClient.post<FeeCalculationApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/booking/calculate-fee`,
      payload
    );
  }

  fetchAvailableSlots(
    workerSlug: string,
    date: string,
    serviceId?: string
  ): Observable<AvailableSlotsApiResponse> {
    const sanitizedSlug = encodeURIComponent(workerSlug.trim().toLowerCase());
    let url = `${this.normalizedBaseUrl}/api/v1/public/workers/${sanitizedSlug}/available-slots?date=${encodeURIComponent(date.trim())}`;
    if (serviceId && serviceId.trim()) {
      url += `&service_id=${encodeURIComponent(serviceId.trim())}`;
    }
    return this.httpClient.get<AvailableSlotsApiResponse>(url);
  }
}
