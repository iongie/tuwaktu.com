import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from '../../../../environments/environment.model';
import {
  DisciplineCategory,
  FeaturedWorker,
  PublicCategoriesApiResponse,
  PublicWorkerProfile,
  PublicWorkersApiResponse,
} from '../models/home.model';

@Injectable({
  providedIn: 'root',
})
export class HomeApiService {
  private readonly httpClient: HttpClient | null = (() => {
    try {
      return inject(HttpClient, { optional: true });
    } catch {
      return null;
    }
  })();
  private readonly configuredBaseUrl: string | null = (() => {
    try {
      return inject(API_BASE_URL, { optional: true });
    } catch {
      return null;
    }
  })();

  private get normalizedBaseUrl(): string {
    return (this.configuredBaseUrl || 'http://localhost:3000').replace(/\/+$/, '');
  }

  fetchPublicCategories(): Observable<DisciplineCategory[]> {
    if (!this.httpClient) {
      return of([]);
    }

    return this.httpClient
      .get<PublicCategoriesApiResponse>(`${this.normalizedBaseUrl}/api/v1/public/categories`)
      .pipe(
        map((response) => {
          if (!response || !response.success || !Array.isArray(response.data)) {
            return [];
          }
          return response.data.map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title || item.name,
            description: item.description,
            icon: item.icon || 'build',
            startingPrice: Number(item.starting_price) || 0,
            priceUnit: item.price_unit || 'kunjungan',
            availabilityTag: item.availability_tag || 'Tersedia di Katalog',
            specialistCount: item.specialist_count,
            highlightTag: item.highlight_tag || '',
          }));
        }),
        catchError(() => of([]))
      );
  }

  fetchPublicWorkers(): Observable<FeaturedWorker[]> {
    if (!this.httpClient) {
      return of([]);
    }

    return this.httpClient
      .get<PublicWorkersApiResponse>(`${this.normalizedBaseUrl}/api/v1/public/workers`)
      .pipe(
        map((response) => {
          if (!response || !response.success || !Array.isArray(response.data)) {
            return [];
          }
          return response.data.map((profile) => this.mapProfileToFeaturedWorker(profile));
        }),
        catchError(() => of([]))
      );
  }

  private mapProfileToFeaturedWorker(profile: PublicWorkerProfile): FeaturedWorker {
    const primaryService =
      profile.services && profile.services.length > 0 ? profile.services[0] : null;

    let specialty = 'Spesialis Mandiri Terverifikasi';
    if (primaryService && primaryService.name) {
      specialty = primaryService.name;
    } else if (profile.bio && profile.bio.trim()) {
      specialty = profile.bio.trim();
    }

    let category = 'Teknisi';
    const lowerBio = (profile.bio + ' ' + (primaryService?.name || '')).toLowerCase();
    if (lowerBio.includes('ac') || lowerBio.includes('pendingin')) {
      category = 'Servis AC';
    } else if (lowerBio.includes('clean') || lowerBio.includes('sanitasi') || lowerBio.includes('bersih')) {
      category = 'Sanitasi';
    } else if (lowerBio.includes('listrik') || lowerBio.includes('panel') || lowerBio.includes('kabel')) {
      category = 'Kelistrikan';
    } else if (lowerBio.includes('elektronik') || lowerBio.includes('audio') || lowerBio.includes('tv')) {
      category = 'Elektronik';
    }

    const startingPrice =
      profile.base_price > 0 ? profile.base_price : (primaryService?.price || 0);
    const priceUnit = profile.rate_type === 'UNIT' ? 'unit' : 'jam';

    const specialtyTags: string[] = [];
    if (profile.services && profile.services.length > 0) {
      for (const srv of profile.services) {
        if (srv.name && !specialtyTags.includes(srv.name)) {
          specialtyTags.push(srv.name);
        }
        if (specialtyTags.length >= 3) break;
      }
    }
    if (specialtyTags.length === 0 && profile.zone) {
      specialtyTags.push(profile.zone);
    }

    return {
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      specialty,
      category,
      rating: profile.rating > 0 ? profile.rating : 0,
      reviewCount: profile.review_count || 0,
      basecampZone: profile.zone || 'Jabodetabek',
      startingPrice,
      priceUnit,
      avatarUrl: profile.avatar_url || '',
      isVerified: Boolean(profile.rating > 0 || profile.review_count > 0 || (profile.services && profile.services.length > 0)),
      specialtyTags,
      bufferMinutes: 60,
    };
  }
}

