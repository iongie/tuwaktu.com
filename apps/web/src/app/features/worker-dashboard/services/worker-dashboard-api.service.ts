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
    const sanitizedId = encodeURIComponent(workerId.trim());
    const endpoint = sanitizedId
      ? `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedId}/services`
      : `${this.normalizedBaseUrl}/api/v1/worker/services`;
    return this.httpClient.post<WorkerServiceItemApiResponse>(
      endpoint,
      payload,
      { withCredentials: true }
    );
  }

  updateWorkerService(
    workerId: string,
    serviceId: string,
    payload: UpdateWorkerServicePayload
  ): Observable<WorkerServiceItemApiResponse> {
    const sanitizedWorkerId = encodeURIComponent(workerId.trim());
    const sanitizedServiceId = encodeURIComponent(serviceId.trim());
    const endpoint = sanitizedWorkerId
      ? `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedWorkerId}/services/${sanitizedServiceId}`
      : `${this.normalizedBaseUrl}/api/v1/worker/services/${sanitizedServiceId}`;
    return this.httpClient.put<WorkerServiceItemApiResponse>(
      endpoint,
      payload,
      { withCredentials: true }
    );
  }

  deleteWorkerService(
    workerId: string,
    serviceId: string
  ): Observable<WorkerServiceDeleteApiResponse> {
    const sanitizedWorkerId = encodeURIComponent(workerId.trim());
    const sanitizedServiceId = encodeURIComponent(serviceId.trim());
    const endpoint = sanitizedWorkerId
      ? `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedWorkerId}/services/${sanitizedServiceId}`
      : `${this.normalizedBaseUrl}/api/v1/worker/services/${sanitizedServiceId}`;
    return this.httpClient.delete<WorkerServiceDeleteApiResponse>(
      endpoint,
      { withCredentials: true }
    );
  }
}

