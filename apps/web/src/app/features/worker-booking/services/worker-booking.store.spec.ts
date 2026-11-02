import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WorkerBookingStore } from './worker-booking.store';
import { WorkerBookingApiService } from './worker-booking-api.service';
import { PublicTechnicianProfile } from '../models/worker-catalog.model';
import { ServiceBookingConfirmation } from '../models/service-booking.model';

describe('WorkerBookingStore', () => {
  let store: WorkerBookingStore;
  let mockApiService: {
    fetchPublicTechnicianProfile: jest.Mock;
    submitServiceBookingReservation: jest.Mock;
  };

  const sampleProfile: PublicTechnicianProfile = {
    id: 'tech-1',
    slug: 'budi-santoso',
    name: 'Budi Santoso',
    bio: 'Teknisi AC',
    avatar_url: 'https://example.com/photo.jpg',
    rating: 4.9,
    review_count: 20,
    zone: 'Jakarta Selatan',
    services: [
      {
        id: 'srv-1',
        name: 'Cuci AC Standar',
        description: 'Unit indoor & outdoor',
        price: 75000,
        duration_minutes: 45,
      },
    ],
  };

  beforeEach(() => {
    mockApiService = {
      fetchPublicTechnicianProfile: jest.fn(),
      submitServiceBookingReservation: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkerBookingStore,
        {
          provide: WorkerBookingApiService,
          useValue: mockApiService,
        },
      ],
    });

    store = TestBed.inject(WorkerBookingStore);
  });

  it('harus memuat profil teknisi dan memilih layanan pertama secara default', () => {
    mockApiService.fetchPublicTechnicianProfile.mockReturnValue(
      of({ success: true, message: 'OK', data: sampleProfile })
    );

    store.loadTechnicianProfile('budi-santoso');

    expect(store.activeTechnicianProfile()).toEqual(sampleProfile);
    expect(store.selectedCatalogService()).toEqual(sampleProfile.services[0]);
    expect(store.totalServiceEstimate()).toBe(75000);
    expect(store.hasActiveProfile()).toBe(true);
    expect(store.isProfileLoading()).toBe(false);
  });

  it('harus menangani status error 0 dengan pesan ramah berbahasa Indonesia', () => {
    mockApiService.fetchPublicTechnicianProfile.mockReturnValue(
      throwError(() => ({ status: 0 }))
    );

    store.loadTechnicianProfile('budi-santoso');

    expect(store.isProfileLoading()).toBe(false);
    expect(store.profileErrorMessage()).toBe(
      'Gagal menghubungi server API. Pastikan backend aktif.'
    );
  });

  it('harus memproses submit reservasi dengan callback sukses', () => {
    const confirmation: ServiceBookingConfirmation = {
      booking_code: 'TW-20261102-123456',
      worker_id: 'tech-1',
      worker_name: 'Budi Santoso',
      service_id: 'srv-1',
      service_name: 'Cuci AC Standar',
      client_name: 'Pak Joko',
      location: 'Jakarta',
      zone: 'Jakarta Selatan',
      booking_date: '2026-11-03T10:00:00Z',
      total_price: 75000,
      status: 'PENDING',
      created_at: '2026-11-02T11:00:00Z',
    };

    mockApiService.submitServiceBookingReservation.mockReturnValue(
      of({ success: true, message: 'OK', data: confirmation })
    );

    const callbackSpy = jest.fn();
    store.submitReservation(
      { service_id: 'srv-1', client_name: 'Pak Joko', location: 'Jakarta' },
      callbackSpy
    );

    expect(store.isReservationSubmitting()).toBe(false);
    expect(store.confirmedReservation()).toEqual(confirmation);
    expect(callbackSpy).toHaveBeenCalledWith(confirmation);
  });
});

