import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  CreateBusinessInquiryApiResponse,
  CreateBusinessInquiryPayload,
} from '../models/business-inquiry.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessInquiryApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  submitBusinessInquiry(
    payload: CreateBusinessInquiryPayload,
  ): Observable<CreateBusinessInquiryApiResponse> {
    return this.httpClient.post<CreateBusinessInquiryApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/public/b2b-inquiries`,
      payload,
    );
  }
}

