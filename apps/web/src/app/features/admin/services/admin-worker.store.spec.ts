import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminWorkerStore } from './admin-worker.store';
import { AdminWorkerApiService } from './admin-worker-api.service';
import {
  AdminCreateWorkerPayload,
  AdminWorkerCreatedResponse,
  AdminWorkerListItem,
} from '../models/admin-worker.model';

describe('AdminWorkerStore', () => {
  let store: AdminWorkerStore;
  let mockApiService: jest.Mocked<AdminWorkerApiService>;

  const sampleWorkers: AdminWorkerListItem[] = [
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
    {
      account_id: 'acc-2',
      worker_id: 'wrk-2',
      slug: 'siti-aminah',
      name: 'Siti Aminah',
      bio: 'Deep Cleaning',
      zone: 'Tangerang Selatan',
      base_price: 120000,
      rate_type: 'UNIT',
      avatar_url: '',
      rating: 4.8,
      review_count: 5,
      phone_number: '6281987654321',
      whatsapp_number: '6281987654321',
      email: 'siti@tuwaktu.com',
      role: 'WORKER',
      account_status: 'SUSPENDED',
      must_change_password: false,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    mockApiService = {
      fetchWorkers: jest.fn().mockReturnValue(of({ success: true, message: 'OK', data: sampleWorkers })),
      createWorker: jest.fn(),
      updateWorkerStatus: jest.fn(),
    } as unknown as jest.Mocked<AdminWorkerApiService>;

    TestBed.configureTestingModule({
      providers: [
        AdminWorkerStore,
        { provide: AdminWorkerApiService, useValue: mockApiService },
      ],
    });

    store = TestBed.inject(AdminWorkerStore);
  });

  it('harus memuat daftar pekerja dan menghitung metrik metrik aktif/ditangguhkan', () => {
    store.loadWorkers();

    expect(mockApiService.fetchWorkers).toHaveBeenCalled();
    expect(store.workers().length).toBe(2);
    expect(store.totalWorkersCount()).toBe(2);
    expect(store.activeWorkersCount()).toBe(1);
    expect(store.suspendedWorkersCount()).toBe(1);
    expect(store.isLoading()).toBe(false);
  });

  it('harus memfilter daftar pekerja berdasarkan query pencarian dan status', () => {
    store.loadWorkers();

    // Filter nama "Budi"
    store.setSearchQuery('budi');
    expect(store.filteredWorkers().length).toBe(1);
    expect(store.filteredWorkers()[0].name).toBe('Budi Santoso');

    // Filter status SUSPENDED
    store.setSearchQuery('');
    store.setStatusFilter('SUSPENDED');
    expect(store.filteredWorkers().length).toBe(1);
    expect(store.filteredWorkers()[0].name).toBe('Siti Aminah');

    // Filter status ACTIVE
    store.setStatusFilter('ACTIVE');
    expect(store.filteredWorkers().length).toBe(1);
    expect(store.filteredWorkers()[0].name).toBe('Budi Santoso');
  });

  it('harus menangani kegagalan loadWorkers dengan menyimpan errorMessage', () => {
    mockApiService.fetchWorkers.mockReturnValue(
      throwError(() => ({ error: { message: 'Koneksi database bermasalah' } }))
    );

    store.loadWorkers();

    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBe('Koneksi database bermasalah');
  });

  it('harus berhasil submit onboarding dan menambahkan data newlyCreatedWorker', () => {
    const payload: AdminCreateWorkerPayload = {
      name: 'Hendro Wijaya',
      email: 'hendro@tuwaktu.com',
      whatsapp_number: '6281311223344',
    };

    const mockResponse: AdminWorkerCreatedResponse = {
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
        zone: 'Jakarta Barat',
      },
      temporary_password: 'Password123!',
      invitation_text: 'Undangan Bergabung Hendro',
    };

    mockApiService.createWorker.mockReturnValue(
      of({ success: true, message: 'Berhasil', data: mockResponse })
    );

    store.submitOnboarding(payload);

    expect(store.isOnboardingSubmitting()).toBe(false);
    expect(store.newlyCreatedWorker()).toEqual(mockResponse);
    expect(store.feedbackMessage()).toContain('Hendro Wijaya');
  });

  it('harus melakukan toggle status mitra dan memperbarui state lokal secara reaktif', () => {
    store.loadWorkers();

    mockApiService.updateWorkerStatus.mockReturnValue(
      of({ success: true, message: 'OK', data: { worker_id: 'wrk-1', status: 'SUSPENDED' } })
    );

    const targetWorker = store.workers()[0]; // Budi (ACTIVE)
    store.toggleWorkerStatus(targetWorker);

    expect(mockApiService.updateWorkerStatus).toHaveBeenCalledWith('wrk-1', 'SUSPENDED');
    const updatedBudi = store.workers().find((w) => w.account_id === 'acc-1');
    expect(updatedBudi?.account_status).toBe('SUSPENDED');
    expect(store.feedbackMessage()).toContain('ditangguhkan');
  });

  it('harus memetakan error status 401, 403, dan 0 dengan pesan Bahasa Indonesia yang deskriptif', () => {
    // Status 401 (Unauthorized / Session expired)
    mockApiService.fetchWorkers.mockReturnValue(
      throwError(() => ({ status: 401 }))
    );
    store.loadWorkers();
    expect(store.errorMessage()).toBe('Sesi login telah berakhir atau otentikasi tidak valid. Silakan login kembali.');

    // clearError() membersihkan pesan error
    store.clearError();
    expect(store.errorMessage()).toBeNull();

    // Status 403 (Forbidden / Access denied)
    mockApiService.fetchWorkers.mockReturnValue(
      throwError(() => ({ status: 403 }))
    );
    store.loadWorkers();
    expect(store.errorMessage()).toBe('Akses ditolak. Akun Anda tidak memiliki hak akses administrator.');

    // Status 0 (Network / Backend connection failure)
    mockApiService.fetchWorkers.mockReturnValue(
      throwError(() => ({ status: 0 }))
    );
    store.loadWorkers();
    expect(store.errorMessage()).toBe('Tidak dapat terhubung ke server backend. Periksa koneksi jaringan Anda.');
  });
});

