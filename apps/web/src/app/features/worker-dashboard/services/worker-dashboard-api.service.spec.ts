import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WorkerDashboardApiService } from './worker-dashboard-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { WorkerProfileUpdatePayload } from '../models/worker-profile.model';

describe('WorkerDashboardApiService', () => {
  let service: WorkerDashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardApiService,
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:3000///',
        },
      ],
    });
    service = TestBed.inject(WorkerDashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('harus memanggil endpoint GET profil pekerja v1 dengan url ternormalisasi', () => {
    service.fetchWorkerProfile('budi-santoso').subscribe();

    const req = httpMock.expectOne(
      'http://localhost:3000/api/v1/public/workers/budi-santoso'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'Sukses', data: {} });
  });

  it('harus memanggil endpoint PUT update profil pekerja v1 dengan payload yang sesuai', () => {
    const payload: WorkerProfileUpdatePayload = {
      name: 'Budi Santoso',
      bio: 'Teknisi AC',
      avatar_url: 'https://example.com/avatar.jpg',
      zone: 'Jakarta Selatan',
    };

    service.updateWorkerProfile('worker-uuid-1', payload).subscribe();

    const req = httpMock.expectOne(
      'http://localhost:3000/api/v1/workers/worker-uuid-1/profile'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: 'Profil pekerja berhasil diperbarui', data: {} });
  });

  it('harus memanggil endpoint PUT update tarif pekerja v1 dengan payload yang sesuai', () => {
    service
      .updateWorkerRates('worker-uuid-1', {
        base_price: 85000,
        rate_type: 'HOURLY',
      })
      .subscribe();

    const req = httpMock.expectOne(
      'http://localhost:3000/api/v1/worker/rates'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      worker_id: 'worker-uuid-1',
      base_price: 85000,
      rate_type: 'HOURLY',
    });
    req.flush({
      success: true,
      message: 'Pengaturan tarif pekerja berhasil diperbarui',
      data: {},
    });
  });

  it('harus memanggil endpoint GET jadwal pekerja v1 dengan worker_id', () => {
    service.fetchWorkerSchedules('worker-uuid-1').subscribe();

    const req = httpMock.expectOne(
      'http://localhost:3000/api/v1/worker/schedules?worker_id=worker-uuid-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, message: 'Daftar jadwal kerja berhasil diambil', data: [] });
  });

  it('harus memanggil endpoint PUT jadwal pekerja v1 dengan payload schedules', () => {
    const schedules = [
      {
        day_of_week: 1,
        day_name: 'Senin',
        is_active: true,
        slot_morning: true,
        slot_afternoon: false,
        slot_evening: true,
      },
    ];

    service.updateWorkerSchedules('worker-uuid-1', schedules).subscribe();

    const req = httpMock.expectOne(
      'http://localhost:3000/api/v1/worker/schedules'
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      worker_id: 'worker-uuid-1',
      schedules,
    });
    req.flush({
      success: true,
      message: 'Konfigurasi jadwal kerja berhasil disimpan',
      data: schedules,
    });
  });
});

