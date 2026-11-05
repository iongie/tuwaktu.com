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
      `${this.normalizedBaseUrl}/api/v1/public/workers/${sanitizedSlug}`
    );
  }

  updateWorkerProfile(
    workerId: string,
    payload: WorkerProfileUpdatePayload
  ): Observable<WorkerProfileApiResponse> {
    const sanitizedId = encodeURIComponent(workerId.trim());
    return this.httpClient.put<WorkerProfileApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/workers/${sanitizedId}/profile`,
      payload
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
      }
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
      }
    );
  }

  fetchWorkerSchedules(workerIdOrSlug: string): Observable<WorkerSchedulesApiResponse> {
    const sanitizedId = encodeURIComponent(workerIdOrSlug.trim());
    return this.httpClient.get<WorkerSchedulesApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/worker/schedules?worker_id=${sanitizedId}`
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
      }
    );
  }
}

