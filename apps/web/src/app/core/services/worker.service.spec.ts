import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkerService } from './worker.service';
import { API_BASE_URL } from '../../../environments/environment.model';
import {
  ApiResponse,
  CreateBookingRequest,
  PublicBookingResponse,
  PublicWorkerProfile,
} from '../models/api.model';

describe('WorkerService', () => {
  let service: WorkerService;
  let httpTesting: HttpTestingController;
  const testBaseUrl = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: testBaseUrl,
        },
      ],
    });

    service = TestBed.inject(WorkerService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch worker public profile by slug', () => {
    const mockProfile: PublicWorkerProfile = {
      id: 'w-1',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      bio: 'Teknisi AC handal',
      avatar_url: 'https://img.test/budi.jpg',
      rating: 4.9,
      review_count: 25,
      zone: 'Jakarta Selatan',
      services: [
        {
          id: 's-1',
          name: 'Cuci AC Standar',
          description: 'Pembersihan AC',
          price: 75000,
          duration_minutes: 45,
        },
      ],
    };

    const mockResponse: ApiResponse<PublicWorkerProfile> = {
      success: true,
      message: 'Data profil pekerja berhasil diambil',
      data: mockProfile,
      error: null,
    };

    service.getWorkerProfile('budi-santoso').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.name).toBe('Budi Santoso');
      expect(res.data.services.length).toBe(1);
    });

    const req = httpTesting.expectOne(
      `${testBaseUrl}/api/public/workers/budi-santoso`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create booking via POST', () => {
    const bookingPayload: CreateBookingRequest = {
      worker_id: 'w-1',
      service_id: 's-1',
      client_name: 'Dewi Lestari',
      client_phone: '0812345678',
      location: 'Jl. Sudirman No. 1',
      zone: 'Jakarta Selatan',
      notes: 'Datang pagi',
    };

    const mockBookingResponse: ApiResponse<PublicBookingResponse> = {
      success: true,
      message: 'Pesanan booking berhasil dibuat',
      data: {
        booking_code: 'BK-20261102-001',
        worker_id: 'w-1',
        worker_name: 'Budi Santoso',
        service_id: 's-1',
        service_name: 'Cuci AC Standar',
        client_name: 'Dewi Lestari',
        location: 'Jl. Sudirman No. 1',
        zone: 'Jakarta Selatan',
        booking_date: '2026-11-03T10:00:00Z',
        total_price: 75000,
        status: 'PENDING',
        created_at: '2026-11-02T10:00:00Z',
      },
      error: null,
    };

    service.createBooking(bookingPayload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.booking_code).toBe('BK-20261102-001');
      expect(res.data.total_price).toBe(75000);
    });

    const req = httpTesting.expectOne(`${testBaseUrl}/api/public/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(bookingPayload);
    req.flush(mockBookingResponse);
  });

  it('should trim trailing slash from apiBaseUrl', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WorkerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:8080///',
        },
      ],
    });

    const customService = TestBed.inject(WorkerService);
    const customHttpTesting = TestBed.inject(HttpTestingController);

    customService.getWorkerProfile('test-slug').subscribe();

    const req = customHttpTesting.expectOne(
      'http://localhost:8080/api/public/workers/test-slug'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'ok', data: null });
    customHttpTesting.verify();
  });
});
