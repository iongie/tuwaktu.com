import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HomeApiService } from './home-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { PublicWorkersApiResponse } from '../models/home.model';

describe('HomeApiService', () => {
  let service: HomeApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HomeApiService,
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:3000',
        },
      ],
    });

    service = TestBed.inject(HomeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('harus membuat instance HomeApiService', () => {
    expect(service).toBeTruthy();
  });

  it('harus memuat daftar pekerja publik dan memetakan model FeaturedWorker', (done) => {
    const mockApiResponse: PublicWorkersApiResponse = {
      success: true,
      message: 'Daftar pekerja publik berhasil diambil',
      data: [
        {
          id: 'worker-1',
          slug: 'budi-santoso',
          name: 'Budi Santoso',
          bio: 'Teknisi AC dan kelistrikan berpengalaman',
          avatar_url: 'https://example.com/budi.jpg',
          rating: 4.9,
          review_count: 42,
          zone: 'Jakarta Selatan',
          base_price: 75000,
          rate_type: 'HOURLY',
          max_radius_km: 15,
          free_radius_km: 3,
          extra_fee_per_km: 5000,
          services: [
            {
              id: 'srv-1',
              name: 'Cuci AC Standar',
              description: 'Pembersihan AC',
              price: 75000,
              rate_type: 'UNIT',
              duration_minutes: 45,
            },
          ],
        },
      ],
    };

    service.fetchPublicWorkers().subscribe((workers) => {
      expect(workers.length).toBe(1);
      const first = workers[0];
      expect(first.id).toBe('worker-1');
      expect(first.slug).toBe('budi-santoso');
      expect(first.name).toBe('Budi Santoso');
      expect(first.specialty).toBe('Cuci AC Standar');
      expect(first.category).toBe('Servis AC');
      expect(first.rating).toBe(4.9);
      expect(first.reviewCount).toBe(42);
      expect(first.basecampZone).toBe('Jakarta Selatan');
      expect(first.startingPrice).toBe(75000);
      expect(first.priceUnit).toBe('jam');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/public/workers');
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('harus mengembalikan array kosong saat request HTTP menghasilkan error', (done) => {
    service.fetchPublicWorkers().subscribe((workers) => {
      expect(workers).toEqual([]);
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/v1/public/workers');
    req.error(new ProgressEvent('Network error'));
  });
});

