import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AuthService } from '../../auth/services/auth.service';
import {
  AdminCategoriesApiResponse,
  AdminCategory,
  AdminCategoryApiResponse,
  CreateAdminCategoryPayload,
  UpdateAdminCategoryPayload,
} from '../models/admin-category.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryApiService {
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

  fetchCategories(): Observable<AdminCategoriesApiResponse> {
    return this.httpClient.get<AdminCategoriesApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/categories`,
      { headers: this.authHeaders, withCredentials: true }
    );
  }

  fetchCategory(id: string): Observable<AdminCategoryApiResponse> {
    const sanitizedId = encodeURIComponent(id.trim());
    return this.httpClient.get<AdminCategoryApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/categories/${sanitizedId}`,
      { headers: this.authHeaders, withCredentials: true }
    );
  }

  createCategory(payload: CreateAdminCategoryPayload): Observable<AdminCategoryApiResponse> {
    return this.httpClient.post<AdminCategoryApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/categories`,
      payload,
      { headers: this.authHeaders, withCredentials: true }
    );
  }

  updateCategory(
    id: string,
    payload: UpdateAdminCategoryPayload
  ): Observable<AdminCategoryApiResponse> {
    const sanitizedId = encodeURIComponent(id.trim());
    return this.httpClient.put<AdminCategoryApiResponse>(
      `${this.normalizedBaseUrl}/api/v1/admin/categories/${sanitizedId}`,
      payload,
      { headers: this.authHeaders, withCredentials: true }
    );
  }

  deleteCategory(id: string): Observable<{ success: boolean; message: string }> {
    const sanitizedId = encodeURIComponent(id.trim());
    return this.httpClient.delete<{ success: boolean; message: string }>(
      `${this.normalizedBaseUrl}/api/v1/admin/categories/${sanitizedId}`,
      { headers: this.authHeaders, withCredentials: true }
    );
  }
}
