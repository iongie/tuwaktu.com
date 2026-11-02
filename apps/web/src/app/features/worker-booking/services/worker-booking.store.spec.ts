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
    calculateBookingFee: jest.Mock;
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
      calculateBookingFee: jest.fn(),
      fetchAvailableSlots: jest.fn(),
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

  it('harus memanggil API calculateBookingFee ketika setClientCoordinates dipanggil', () => {
    mockApiService.fetchPublicTechnicianProfile.mockReturnValue(
      of({ success: true, message: 'OK', data: sampleProfile })
    );
    mockApiService.calculateBookingFee.mockReturnValue(
      of({
        success: true,
        message: 'Kalkulasi berhasil',
        data: {
          worker_id: 'tech-1',
          service_id: 'srv-1',
          service_price: 75000,
          distance_km: 6.0,
          max_radius_km: 15.0,
          free_radius_km: 3.0,
          chargeable_km: 3.0,
          extra_fee_per_km: 3000,
          transport_fee: 9000,
          total_price: 84000,
          is_within_radius: true,
        },
      })
    );

    store.loadTechnicianProfile('budi-santoso');
    store.setClientCoordinates({ lat: -6.2443, lng: 106.7997 });

    expect(mockApiService.calculateBookingFee).toHaveBeenCalledWith({
      worker_id: 'tech-1',
      worker_slug: 'budi-santoso',
      service_id: 'srv-1',
      client_lat: -6.2443,
      client_lng: 106.7997,
    });
    expect(store.totalServiceEstimate()).toBe(84000);
    expect(store.transportFeeEstimate()).toBe(9000);
    expect(store.distanceKmEstimate()).toBe(6.0);
    expect(store.isOutOfRadius()).toBe(false);
  });

  it('harus mengenali kondisi di luar jangkauan ketika API calculateBookingFee gagal dengan error out of radius', () => {
    mockApiService.fetchPublicTechnicianProfile.mockReturnValue(
      of({ success: true, message: 'OK', data: sampleProfile })
    );
    mockApiService.calculateBookingFee.mockReturnValue(
      throwError(() => ({
        status: 422,
        error: {
          message:
            'Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja (jarak: 22.5 km, maks: 15.0 km)',
        },
      }))
    );

    store.loadTechnicianProfile('budi-santoso');
    store.setClientCoordinates({ lat: -6.4000, lng: 106.9000 });

    expect(store.isOutOfRadius()).toBe(true);
    expect(store.feeCalculationError()).toContain('Di luar jangkauan');
    expect(store.feeCalculation()).toBeNull();
  });

  it('harus memuat slot ketersediaan teknisi untuk tanggal tertentu', () => {
    mockApiService.fetchPublicTechnicianProfile.mockReturnValue(
      of({ success: true, message: 'OK', data: sampleProfile })
    );
    mockApiService.fetchAvailableSlots.mockReturnValue(
      of({
        success: true,
        message: 'Daftar slot ketersediaan berhasil diambil',
        data: {
          worker_id: 'tech-1',
          worker_slug: 'budi-santoso',
          worker_name: 'Budi Santoso',
          date: '2026-11-03',
          day_of_week: 2,
          day_name: 'Selasa',
          is_working_day: true,
          slots: [
            {
              slot_type: 'MORNING',
              name: 'Pagi',
              start_time: '08:00',
              end_time: '11:30',
              available: true,
              reason: 'Tersedia',
            },
            {
              slot_type: 'AFTERNOON',
              name: 'Siang',
              start_time: '13:00',
              end_time: '16:30',
              available: false,
              reason: 'Bentrok buffer transit 60 menit',
            },
          ],
        },
      })
    );

    store.loadTechnicianProfile('budi-santoso');
    store.loadAvailableSlots('2026-11-03');

    expect(mockApiService.fetchAvailableSlots).toHaveBeenCalledWith(
      'budi-santoso',
      '2026-11-03',
      'srv-1'
    );
    expect(store.availableSlots().length).toBe(2);
    expect(store.availableSlots()[0].available).toBe(true);
    expect(store.availableSlots()[1].available).toBe(false);
    expect(store.isSelectedDateWorkingDay()).toBe(true);
  });

  it('harus memilih slot yang tersedia dan menolak slot yang tidak tersedia', () => {
    const slotAvailable = {
      slot_type: 'MORNING',
      name: 'Pagi',
      start_time: '08:00',
      end_time: '11:30',
      available: true,
      reason: 'Tersedia',
    };
    const slotUnavailable = {
      slot_type: 'AFTERNOON',
      name: 'Siang',
      start_time: '13:00',
      end_time: '16:30',
      available: false,
      reason: 'Bentrok buffer transit 60 menit',
    };

    store.selectTimeSlot(slotUnavailable);
    expect(store.selectedTimeSlot()).toBeNull();

    store.selectTimeSlot(slotAvailable);
    expect(store.selectedTimeSlot()).toEqual(slotAvailable);
  });
});

