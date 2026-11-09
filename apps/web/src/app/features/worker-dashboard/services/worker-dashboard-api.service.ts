import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  WorkerProfileApiResponse,
  WorkerProfileUpdatePayload,
  WorkerRateUpdatePayload,
  WorkerRatesApiResponse,
  WorkerLocationSettingsUpdatePayload,
  WorkerLocationSettingsApiResponse,
  WorkerScheduleItem,
  WorkerSchedulesApiResponse,
  CreateWorkerServicePayload,
  UpdateWorkerServicePayload,
  WorkerServiceItemApiResponse,
  WorkerServiceDeleteApiResponse,
  WorkerBookingStatus,
  WorkerBookingsApiResponse,
  WorkerBookingUpdateApiResponse,
  WorkerReviewsApiResponse,
} from '../models/worker-profile.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerDashboardApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  fetchWorkerProfile(workerSlug: string): Observable<WorkerProfileApiResponse> {
    const sanitizedSlug = encodeURIComponent(workerSlug.trim().toLowerCase());
    return this.httpClient.get<WorkerProfileApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/public/workers/${sanitizedSlug}`,
      { withCredentials: true }
    );
  }

  updateWorkerProfile(
    workerId: string,
    payload: WorkerProfileUpdatePayload
  ): Observable<WorkerProfileApiResponse> {
    const sanitizedId = encodeURIComponent(workerId.trim());
    return this.httpClient.put<WorkerProfileApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedId}/profile`,
      payload,
      { withCredentials: true }
    );
  }

  uploadAvatar(
    workerId: string,
    file: File
  ): Observable<{ success: boolean; message: string; data?: { avatar_url: string; raw_filename: string }; error?: string | null }> {
    const sanitizedId = encodeURIComponent(workerId.trim());
    const formData = new FormData();
    formData.append('avatar', file, file.name || 'avatar.webp');
    return this.httpClient.post<{ success: boolean; message: string; data?: { avatar_url: string; raw_filename: string }; error?: string | null }>(
      `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedId}/avatar`,
      formData,
      { withCredentials: true }
    );
  }

  updateWorkerRates(
    workerId: string,
    payload: WorkerRateUpdatePayload
  ): Observable<WorkerRatesApiResponse> {
    return this.httpClient.put<WorkerRatesApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/rates`,
      {
        worker_id: workerId.trim(),
        ...payload,
      },
      { withCredentials: true }
    );
  }

  updateWorkerLocationSettings(
    workerId: string,
    payload: WorkerLocationSettingsUpdatePayload
  ): Observable<WorkerLocationSettingsApiResponse> {
    return this.httpClient.put<WorkerLocationSettingsApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/location-settings`,
      {
        worker_id: workerId.trim(),
        ...payload,
      },
      { withCredentials: true }
    );
  }

  fetchWorkerSchedules(workerIdOrSlug: string): Observable<WorkerSchedulesApiResponse> {
    const sanitizedId = encodeURIComponent(workerIdOrSlug.trim());
    return this.httpClient.get<WorkerSchedulesApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/schedules?worker_id=${sanitizedId}`,
      { withCredentials: true }
    );
  }

  updateWorkerSchedules(
    workerId: string,
    schedules: WorkerScheduleItem[]
  ): Observable<WorkerSchedulesApiResponse> {
    return this.httpClient.put<WorkerSchedulesApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/schedules`,
      {
        worker_id: workerId.trim(),
        schedules,
      },
      { withCredentials: true }
    );
  }

  createWorkerService(
    workerId: string,
    payload: CreateWorkerServicePayload
  ): Observable<WorkerServiceItemApiResponse> {
    const trimmedWorkerId = workerId?.trim();
    return this.httpClient.post<WorkerServiceItemApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/services`,
      {
        worker_id: trimmedWorkerId || undefined,
        ...payload,
      },
      { withCredentials: true }
    );
  }

  updateWorkerService(
    workerId: string,
    serviceId: string,
    payload: UpdateWorkerServicePayload
  ): Observable<WorkerServiceItemApiResponse> {
    const sanitizedServiceId = encodeURIComponent(serviceId.trim());
    const trimmedWorkerId = workerId?.trim();
    return this.httpClient.put<WorkerServiceItemApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/services/${sanitizedServiceId}`,
      {
        worker_id: trimmedWorkerId || undefined,
        ...payload,
      },
      { withCredentials: true }
    );
  }

  deleteWorkerService(
    workerId: string,
    serviceId: string
  ): Observable<WorkerServiceDeleteApiResponse> {
    const sanitizedServiceId = encodeURIComponent(serviceId.trim());
    const trimmedWorkerId = workerId?.trim();
    const queryString = trimmedWorkerId
      ? `?worker_id=${encodeURIComponent(trimmedWorkerId)}`
      : '';
    return this.httpClient.delete<WorkerServiceDeleteApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/services/${sanitizedServiceId}${queryString}`,
      { withCredentials: true }
    );
  }

  fetchWorkerBookings(
    workerIdOrSlug: string,
    limit = 20
  ): Observable<WorkerBookingsApiResponse> {
    const sanitizedId = encodeURIComponent(workerIdOrSlug.trim());
    return this.httpClient.get<WorkerBookingsApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/bookings?worker_id=${sanitizedId}&limit=${limit}`,
      { withCredentials: true }
    );
  }

  updateBookingStatus(
    workerId: string,
    bookingId: string,
    status: WorkerBookingStatus
  ): Observable<WorkerBookingUpdateApiResponse> {
    const sanitizedBookingId = encodeURIComponent(bookingId.trim());
    return this.httpClient.patch<WorkerBookingUpdateApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/bookings/${sanitizedBookingId}/status`,
      {
        worker_id: workerId.trim(),
        status,
      },
      { withCredentials: true }
    );
  }

  fetchWorkerReviews(
    workerIdOrSlug: string,
    limit = 20,
    offset = 0
  ): Observable<WorkerReviewsApiResponse> {
    const sanitizedId = encodeURIComponent(workerIdOrSlug.trim());
    return this.httpClient.get<WorkerReviewsApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/reviews?worker_id=${sanitizedId}&limit=${limit}&offset=${offset}`,
      { withCredentials: true }
    );
  }
}

