import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkerBookingApiService } from './worker-booking-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { CreateServiceBookingPayload } from '../models/service-booking.model';

describe('WorkerBookingApiService', () => {
  let service: WorkerBookingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerBookingApiService,
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:8080///',
        },
      ],
    });
    service = TestBed.inject(WorkerBookingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('harus membersihkan trailing slash dari base URL saat mengambil profil teknisi', () => {
    service.fetchPublicTechnicianProfile('budi-santoso').subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8080/api/public/workers/budi-santoso'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'Sukses', data: {} });
  });

  it('harus memposting payload pemesanan dengan url yang ternormalisasi', () => {
    const payload: CreateServiceBookingPayload = {
      service_id: 'srv-1',
      client_name: 'Pak Joko',
      location: 'Jakarta',
    };

    service.submitServiceBookingReservation(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/public/bookings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: 'Sukses dibuat', data: {} });
  });
});
