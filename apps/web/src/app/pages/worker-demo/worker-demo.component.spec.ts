import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WorkerDemoComponent } from './worker-demo.component';
import { WorkerService } from '../../core/services/worker.service';
import { APP_ENVIRONMENT } from '../../../environments/environment.model';
import {
  ApiResponse,
  PublicBookingResponse,
  PublicWorkerProfile,
} from '../../core/models/api.model';

describe('WorkerDemoComponent', () => {
  let component: WorkerDemoComponent;
  let fixture: ComponentFixture<WorkerDemoComponent>;
  let mockWorkerService: {
    getWorkerProfile: jest.Mock;
    createBooking: jest.Mock;
  };

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
      {
        id: 's-2',
        name: 'Tambah Freon R32',
        description: 'Pengisian freon',
        price: 150000,
        duration_minutes: 60,
      },
    ],
  };

  const mockEnvironment = {
    production: false,
    environmentName: 'development' as const,
    apiBaseUrl: 'http://localhost:8080',
    appTitle: 'Tuwaktu Test',
    enableDebugTools: true,
  };

  beforeEach(async () => {
    mockWorkerService = {
      getWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Data profil pekerja berhasil diambil',
          data: mockProfile,
          error: null,
        } as ApiResponse<PublicWorkerProfile>)
      ),
      createBooking: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDemoComponent],
      providers: [
        { provide: WorkerService, useValue: mockWorkerService },
        { provide: APP_ENVIRONMENT, useValue: mockEnvironment },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load worker profile on init', () => {
    expect(component).toBeTruthy();
    expect(mockWorkerService.getWorkerProfile).toHaveBeenCalledWith(
      'budi-santoso'
    );
    expect(component.worker()?.name).toBe('Budi Santoso');
    expect(component.selectedService()?.name).toBe('Cuci AC Standar');
  });

  it('should switch selected service', () => {
    const service2 = mockProfile.services[1];
    component.selectService(service2);
    expect(component.selectedService()?.id).toBe('s-2');
  });

  it('should handle worker not found error', () => {
    mockWorkerService.getWorkerProfile.mockReturnValueOnce(
      throwError(() => ({
        status: 404,
        error: { message: 'Pekerja tidak ditemukan' },
      }))
    );

    component.searchSlug.set('unknown-worker');
    component.loadWorker();

    expect(component.worker()).toBeNull();
    expect(component.workerError()).toBe('Pekerja tidak ditemukan');
  });

  it('should validate required client name on booking submission', () => {
    component.clientName = '';
    component.submitBooking();
    expect(component.bookingError()).toBe('Nama klien (client_name) wajib diisi');
    expect(mockWorkerService.createBooking).not.toHaveBeenCalled();
  });

  it('should successfully submit booking when valid', () => {
    const mockCreatedBooking: PublicBookingResponse = {
      booking_code: 'BK-20261102-999',
      worker_id: 'w-1',
      worker_name: 'Budi Santoso',
      service_id: 's-1',
      service_name: 'Cuci AC Standar',
      client_name: 'Ahmad Fauzi',
      location: 'Jl. Fatmawati No. 5',
      zone: 'Jakarta Selatan',
      booking_date: '2026-11-03T10:00:00Z',
      total_price: 75000,
      status: 'PENDING',
      created_at: '2026-11-02T10:00:00Z',
    };

    mockWorkerService.createBooking.mockReturnValueOnce(
      of({
        success: true,
        message: 'Pesanan booking berhasil dibuat',
        data: mockCreatedBooking,
        error: null,
      } as ApiResponse<PublicBookingResponse>)
    );

    component.clientName = 'Ahmad Fauzi';
    component.clientLocation = 'Jl. Fatmawati No. 5';
    component.clientZone = 'Jakarta Selatan';
    component.submitBooking();

    expect(mockWorkerService.createBooking).toHaveBeenCalled();
    expect(component.bookingSuccess()?.booking_code).toBe('BK-20261102-999');
    expect(component.bookingError()).toBeNull();
  });

  it('should handle network error (status 0) on worker profile load', () => {
    mockWorkerService.getWorkerProfile.mockReturnValueOnce(
      throwError(() => ({
        status: 0,
        message: 'Http failure response: 0 Unknown Error',
      }))
    );

    component.searchSlug.set('unknown-worker');
    component.loadWorker();

    expect(component.worker()).toBeNull();
    expect(component.workerError()).toBe(
      'Gagal menghubungi server API. Pastikan backend aktif.'
    );
  });

  it('should handle network error (status 0) on booking submit', () => {
    mockWorkerService.createBooking.mockReturnValueOnce(
      throwError(() => ({
        status: 0,
        message: 'Http failure response: 0 Unknown Error',
      }))
    );

    component.clientName = 'Ahmad Fauzi';
    component.clientLocation = 'Jl. Fatmawati No. 5';
    component.clientZone = 'Jakarta Selatan';
    component.submitBooking();

    expect(component.bookingError()).toBe(
      'Gagal menghubungi server API. Pastikan backend aktif.'
    );
    expect(component.bookingSuccess()).toBeNull();
  });
});
