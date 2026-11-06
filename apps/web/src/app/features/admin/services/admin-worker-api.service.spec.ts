import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminWorkerApiService } from './admin-worker-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AuthService } from '../../auth/services/auth.service';
import { AdminCreateWorkerPayload, AdminWorkerListItem } from '../models/admin-worker.model';

describe('AdminWorkerApiService', () => {
  let service: AdminWorkerApiService;
  let httpTestingController: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminWorkerApiService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(AdminWorkerApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);

    authService.setSession({
      id: 'admin-1',
      name: 'Super Admin',
      slug: 'admin',
      role: 'ADMIN',
      token: 'mock-jwt-token-xyz',
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    authService.logout();
  });

  it('harus memanggil GET /api/v1/admin/workers dengan header Authorization', () => {
    const mockWorkers: AdminWorkerListItem[] = [
      {
        account_id: 'acc-1',
        worker_id: 'wrk-1',
        slug: 'budi-santoso',
        name: 'Budi Santoso',
        bio: 'Teknisi AC',
        zone: 'Jakarta Selatan',
        base_price: 75000,
        rate_type: 'HOURLY',
        avatar_url: '',
        rating: 4.9,
        review_count: 10,
        phone_number: '6281234567890',
        whatsapp_number: '6281234567890',
        email: 'budi@tuwaktu.com',
        role: 'WORKER',
        account_status: 'ACTIVE',
        must_change_password: false,
        created_at: new Date().toISOString(),
      },
    ];

    service.fetchWorkers().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].slug).toBe('budi-santoso');
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/workers');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-xyz');

    req.flush({
      success: true,
      message: 'Daftar seluruh mitra berhasil dimuat',
      data: mockWorkers,
    });
  });

  it('harus memanggil POST /api/v1/admin/workers untuk onboarding mitra baru', () => {
    const payload: AdminCreateWorkerPayload = {
      name: 'Hendro Wijaya',
      email: 'hendro@tuwaktu.com',
      whatsapp_number: '6281311223344',
    };

    service.createWorker(payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.worker.name).toBe('Hendro Wijaya');
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/workers');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-xyz');
    expect(req.request.body).toEqual(payload);

    req.flush({
      success: true,
      message: 'Akun mitra baru berhasil didaftarkan',
      data: {
        account: {
          id: 'acc-hendro',
          email: 'hendro@tuwaktu.com',
          phone_number: '6281311223344',
          role: 'WORKER',
          account_status: 'ACTIVE',
          must_change_password: true,
        },
        worker: {
          id: 'wrk-hendro',
          slug: 'hendro-wijaya',
          name: 'Hendro Wijaya',
          zone: 'Jakarta Selatan',
        },
        temporary_password: 'PasswordHendro123!',
        invitation_text: 'Undangan Bergabung Hendro',
      },
    });
  });

  it('harus memanggil PATCH /api/v1/admin/workers/:id/status untuk mengubah status mitra', () => {
    service.updateWorkerStatus('wrk-1', 'SUSPENDED').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('SUSPENDED');
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/workers/wrk-1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-xyz');
    expect(req.request.body).toEqual({ status: 'SUSPENDED' });

    req.flush({
      success: true,
      message: 'Status mitra berhasil diperbarui',
      data: { worker_id: 'wrk-1', status: 'SUSPENDED' },
    });
  });

  it('harus memanggil GET /api/v1/admin/stats untuk memuat metrik statistik platform', () => {
    const mockStats = {
      total_workers: 5,
      active_workers: 4,
      suspended_workers: 1,
      total_bookings: 12,
    };

    service.fetchStats().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockStats);
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/stats');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-xyz');
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      success: true,
      message: 'Statistik panel admin berhasil dimuat',
      data: mockStats,
    });
  });
});

