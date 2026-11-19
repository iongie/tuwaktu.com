import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AuthService } from '../../auth/services/auth.service';
import {
  AdminB2BFilterParams,
  AdminB2BInquiryDetailApiResponse,
  AdminB2BInquiryListApiResponse,
  UpdateAdminB2BInquiryPayload,
} from '../models/admin-b2b-inquiry.model';

@Injectable({
  providedIn: 'root',
})
export class AdminB2BInquiryApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
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

  fetchInquiries(
    filters?: AdminB2BFilterParams,
  ): Observable<AdminB2BInquiryListApiResponse> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters?.payment_status && filters.payment_status !== 'ALL') {
      params = params.set('payment_status', filters.payment_status);
    }
    if (filters?.q && filters.q.trim()) {
      params = params.set('q', filters.q.trim());
    }

    return this.httpClient.get<AdminB2BInquiryListApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/b2b-inquiries`,
      { headers: this.authHeaders, params, withCredentials: true },
    );
  }

  updateInquiry(
    id: string,
    payload: UpdateAdminB2BInquiryPayload,
  ): Observable<AdminB2BInquiryDetailApiResponse> {
    const sanitizedId = encodeURIComponent(id.trim());
    return this.httpClient.patch<AdminB2BInquiryDetailApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/b2b-inquiries/${sanitizedId}`,
      payload,
      { headers: this.authHeaders, withCredentials: true },
    );
  }
}

