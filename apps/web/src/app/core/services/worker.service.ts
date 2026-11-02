import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../environments/environment.model';
import {
  ApiResponse,
  CreateBookingRequest,
  PublicBookingResponse,
  PublicWorkerProfile,
} from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class WorkerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = (inject(API_BASE_URL, { optional: true }) || 'http://localhost:8080').replace(/\/+$/, '');

  getWorkerProfile(slug: string): Observable<ApiResponse<PublicWorkerProfile>> {
    return this.http.get<ApiResponse<PublicWorkerProfile>>(
      `${this.baseUrl}/api/public/workers/${encodeURIComponent(slug)}`
    );
  }

  createBooking(
    payload: CreateBookingRequest
  ): Observable<ApiResponse<PublicBookingResponse>> {
    return this.http.post<ApiResponse<PublicBookingResponse>>(
      `${this.baseUrl}/api/public/bookings`,
      payload
    );
  }
}
