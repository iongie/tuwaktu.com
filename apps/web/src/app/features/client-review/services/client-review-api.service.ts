import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { ReviewInvitationDetail, ReviewRecord, SubmitReviewPayload } from '../models/client-review.model';

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
  readonly error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ClientReviewApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configuredBaseUrl = inject(API_BASE_URL);

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  fetchReviewInvitation(bookingCode: string, token: string): Observable<ApiResponse<ReviewInvitationDetail>> {
    const sanitizedCode = encodeURIComponent(bookingCode.trim());
    const params = new HttpParams().set('token', token.trim());
    return this.httpClient.get<ApiResponse<ReviewInvitationDetail>>(
      `${this.normalizedBaseUrl}/api/public/review-invitations/${sanitizedCode}`,
      { params }
    );
  }

  submitClientReview(payload: SubmitReviewPayload): Observable<ApiResponse<ReviewRecord>> {
    return this.httpClient.post<ApiResponse<ReviewRecord>>(
      `${this.normalizedBaseUrl}/api/public/reviews`,
      payload
    );
  }
}

