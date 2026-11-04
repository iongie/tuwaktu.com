import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AuthService } from '../../auth/services/auth.service';
import {
  AdminCreateWorkerPayload,
  AdminUpdateWorkerStatusPayload,
  AdminWorkerCreatedResponse,
  AdminWorkerListItem,
} from '../models/admin-worker.model';

export interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AdminWorkerApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
  }

  private get authHeaders(): HttpHeaders {
    const token = this.authService.currentUser()?.token;
    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
    }
    return new HttpHeaders();
  }

  fetchWorkers(): Observable<AdminApiResponse<AdminWorkerListItem[]>> {
    return this.httpClient.get<AdminApiResponse<AdminWorkerListItem[]>>(
      `${this.normalizedBaseUrl}/api/v1/admin/workers`,
      { headers: this.authHeaders }
    );
  }

  createWorker(
    payload: AdminCreateWorkerPayload
  ): Observable<AdminApiResponse<AdminWorkerCreatedResponse>> {
    return this.httpClient.post<AdminApiResponse<AdminWorkerCreatedResponse>>(
      `${this.normalizedBaseUrl}/api/v1/admin/workers`,
      payload,
      { headers: this.authHeaders }
    );
  }

  updateWorkerStatus(
    workerId: string,
    status: 'ACTIVE' | 'SUSPENDED'
  ): Observable<AdminApiResponse<{ worker_id: string; status: string }>> {
    const sanitizedId = encodeURIComponent(workerId.trim());
    const payload: AdminUpdateWorkerStatusPayload = { status };
    return this.httpClient.patch<AdminApiResponse<{ worker_id: string; status: string }>>(
      `${this.normalizedBaseUrl}/api/v1/admin/workers/${sanitizedId}/status`,
      payload,
      { headers: this.authHeaders }
    );
  }
}

