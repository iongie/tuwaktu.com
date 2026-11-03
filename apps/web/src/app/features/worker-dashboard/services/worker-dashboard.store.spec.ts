import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WorkerDashboardStore } from './worker-dashboard.store';
import { WorkerDashboardApiService } from './worker-dashboard-api.service';
import { PublicTechnicianProfile } from '../../worker-booking/models/worker-catalog.model';

describe('WorkerDashboardStore', () => {
  let store: WorkerDashboardStore;
  let mockApiService: {
    fetchWorkerProfile: jest.Mock;
    updateWorkerProfile: jest.Mock;
    updateWorkerRates: jest.Mock;
    updateWorkerLocationSettings: jest.Mock;
    fetchWorkerSchedules: jest.Mock;
    updateWorkerSchedules: jest.Mock;
  };

  const sampleWorkerData: PublicTechnicianProfile = {
    id: 'worker-uuid-123',
    slug: 'budi-santoso',
    name: 'Budi Santoso',
    bio: 'Teknisi AC Berpengalaman',
    avatar_url: 'https://example.com/budi.jpg',
    rating: 4.9,
    review_count: 24,
    zone: 'Jakarta Selatan',
    base_price: 75000,
    rate_type: 'HOURLY',
    services: [],
  };

  beforeEach(() => {
    mockApiService = {
      fetchWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: sampleWorkerData,
        })
      ),
      updateWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Profil pekerja berhasil diperbarui',
          data: {
            ...sampleWorkerData,
            name: 'Budi Santoso Diperbarui',
          },
        })
      ),
      updateWorkerRates: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Pengaturan tarif pekerja berhasil diperbarui!',
          data: {
            ...sampleWorkerData,
            base_price: 90000,
            rate_type: 'UNIT',
          },
        })
      ),
      updateWorkerLocationSettings: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Pengaturan lokasi pekerja berhasil diperbarui!',
          data: {
            ...sampleWorkerData,
            lat: -6.2443,
            lng: 106.7997,
            max_radius_km: 15,
            free_radius_km: 4,
            extra_fee_per_km: 4000,
          },
        })
      ),
      fetchWorkerSchedules: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Daftar jadwal kerja berhasil diambil',
          data: [
            {
              day_of_week: 1,
              day_name: 'Senin',
              is_active: true,
              slot_morning: true,
              slot_afternoon: true,
              slot_evening: false,
            },
          ],
        })
      ),
      updateWorkerSchedules: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Konfigurasi jadwal kerja mingguan berhasil disimpan!',
          data: [
            {
              day_of_week: 1,
              day_name: 'Senin',
              is_active: true,
              slot_morning: true,
              slot_afternoon: false,
              slot_evening: true,
            },
          ],
        })
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkerDashboardStore,
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    });

    store = TestBed.inject(WorkerDashboardStore);
  });

  it('harus membuat instance store dengan nilai awal default yang bersih', () => {
    expect(store).toBeTruthy();
    expect(store.workerRecordId()).toBe('');
    expect(store.workerSlugIdentifier()).toBe('');
    expect(store.workerFullName()).toBe('');
    expect(store.hasActiveWorker()).toBe(false);
    expect(store.isStoreOnline()).toBe(true);
    expect(store.workerRateType()).toBe('HOURLY');
  });

  it('harus mengubah status online/offline saat toggleStoreStatus dipanggil', () => {
    expect(store.isStoreOnline()).toBe(true);
    store.toggleStoreStatus();
    expect(store.isStoreOnline()).toBe(false);
    store.toggleStoreStatus();
    expect(store.isStoreOnline()).toBe(true);
  });

  it('harus memuat profil pekerja dan memperbarui signals yang relevan', () => {
    store.loadExistingWorkerProfile('budi-santoso');

    expect(mockApiService.fetchWorkerProfile).toHaveBeenCalledWith('budi-santoso');
    expect(store.workerRecordId()).toBe('worker-uuid-123');
    expect(store.workerSlugIdentifier()).toBe('budi-santoso');
    expect(store.workerFullName()).toBe('Budi Santoso');
    expect(store.hasActiveWorker()).toBe(true);
    expect(store.publicProfileRelativeUrl()).toBe('/budi-santoso');
  });

  it('harus menangani error saat pemuatan profil gagal', () => {
    mockApiService.fetchWorkerProfile.mockReturnValueOnce(
      throwError(() => new Error('Koneksi terputus'))
    );

    store.loadExistingWorkerProfile('slug-gagal');

    expect(store.profileFeedbackError()).toContain('Gagal memuat profil pekerja');
    expect(store.isProfileLoading()).toBe(false);
  });

  it('harus memvalidasi nama pekerja dan format nomor WhatsApp', () => {
    store.workerFullName.set('   ');
    expect(store.validateProfileInput()).toBe(false);
    expect(store.inputValidationErrors()['name']).toBe('Nama lengkap pekerja wajib diisi.');

    store.workerFullName.set('Budi Santoso');
    store.workerWhatsAppNumber.set('081234567890');
    expect(store.validateProfileInput()).toBe(false);
    expect(store.inputValidationErrors()['whatsapp_number']).toContain('Gunakan format internasional');

    store.workerWhatsAppNumber.set('6281234567890');
    expect(store.validateProfileInput()).toBe(true);
  });

  it('harus berhasil submit update profil pekerja saat input valid', () => {
    store.populateWorkerProfileState('worker-uuid-123', {
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      zone: 'Jakarta Barat',
      whatsapp_number: '6281234567890',
    });

    store.submitProfileUpdate();

    expect(mockApiService.updateWorkerProfile).toHaveBeenCalledWith(
      'worker-uuid-123',
      expect.objectContaining({
        name: 'Budi Santoso',
        whatsapp_number: '6281234567890',
      })
    );
    expect(store.profileFeedbackSuccess()).toBe('Profil pekerja berhasil diperbarui!');
  });

  it('harus memvalidasi tarif dasar dan skema penagihan', () => {
    store.workerBasePrice.set(null);
    expect(store.validateRatesInput()).toBe(false);
    expect(store.ratesValidationErrors()['base_price']).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0.'
    );

    store.workerBasePrice.set(75000);
    store.setRateType('UNIT');
    expect(store.validateRatesInput()).toBe(true);
    expect(store.formattedBasePricePreview()).toContain('75.000');
    expect(store.formattedBasePricePreview()).toContain('/ Sesi');
  });

  it('harus memvalidasi koordinat lokasi dan batasan radius', () => {
    store.workerLat.set(null);
    store.workerLng.set(null);
    expect(store.validateLocationSettingsInput()).toBe(false);
    expect(store.locationValidationErrors()['coordinates']).toBe(
      'Titik koordinat (latitude & longitude) rumah atau pangkalan kerja wajib ditentukan.'
    );

    store.onWorkerCoordinatesChanged({ lat: -6.2, lng: 106.8 });
    store.workerMaxRadiusKm.set(10);
    store.workerFreeRadiusKm.set(15);
    expect(store.validateLocationSettingsInput()).toBe(false);
    expect(store.locationValidationErrors()['free_radius_km']).toBe(
      'Radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal.'
    );

    store.workerFreeRadiusKm.set(3);
    expect(store.validateLocationSettingsInput()).toBe(true);
  });

  it('harus memanipulasi slot jadwal kerja dengan benar', () => {
    store.workerSchedules.set(store.createDefaultWeeklySchedule());
    const initialMonday = store.workerSchedules()[0].is_active;

    store.toggleScheduleDayActive(1);
    expect(store.workerSchedules()[0].is_active).toBe(!initialMonday);

    const initialMorning = store.workerSchedules()[0].slot_morning;
    store.toggleScheduleSlot(1, 'slot_morning');
    expect(store.workerSchedules()[0].slot_morning).toBe(!initialMorning);
  });

  it('harus mereset semua state saat resetWorkerSelection dipanggil', () => {
    store.populateWorkerProfileState('uuid-1', {
      slug: 'budi',
      name: 'Budi',
      zone: 'Jkt',
    });
    store.resetWorkerSelection();

    expect(store.workerRecordId()).toBe('');
    expect(store.workerSlugIdentifier()).toBe('');
    expect(store.workerFullName()).toBe('');
    expect(store.hasActiveWorker()).toBe(false);
  });

  it('harus memilih paket kemitraan dan mengatur notifikasi sukses', () => {
    expect(store.currentPlanTier()).toBe('PRO');
    store.selectPlanTier('STARTER');
    expect(store.currentPlanTier()).toBe('STARTER');
    expect(store.planFeedbackSuccess()).toContain('Paket Starter');
  });

  it('harus mengaktifkan paket boost visibilitas dan mengubah status radar', () => {
    store.activateBoost('FLASH_24H');
    expect(store.activeBoostPackage()).toBe('FLASH_24H');
    expect(store.isBoostActive()).toBe(true);
    expect(store.boostFeedbackSuccess()).toContain('Boost Kilat 24 Jam');

    store.toggleBoostStatus();
    expect(store.isBoostActive()).toBe(false);
    expect(store.boostFeedbackSuccess()).toContain('dinonaktifkan sementara');
  });
});

