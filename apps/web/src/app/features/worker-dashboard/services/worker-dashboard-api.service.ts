import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  WorkerProfileApiResponse,
  WorkerProfileUpdatePayload,
} from '../models/worker-profile.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerDashboardApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
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
}
