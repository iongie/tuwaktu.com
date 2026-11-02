import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { WorkerDashboardProfileComponent } from './worker-dashboard-profile.component';
import { WorkerDashboardApiService } from '../../services/worker-dashboard-api.service';
import { PublicTechnicianProfile } from '../../../worker-booking/models/worker-catalog.model';

describe('WorkerDashboardProfileComponent', () => {
  let component: WorkerDashboardProfileComponent;
  let fixture: ComponentFixture<WorkerDashboardProfileComponent>;
  let mockApiService: {
    fetchWorkerProfile: jest.Mock;
    updateWorkerProfile: jest.Mock;
    updateWorkerRates: jest.Mock;
    updateWorkerLocationSettings: jest.Mock;
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

  beforeEach(async () => {
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
            { day_of_week: 1, day_name: 'Senin', is_active: true, slot_morning: true, slot_afternoon: true, slot_evening: false },
          ],
        })
      ),
      updateWorkerSchedules: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Konfigurasi jadwal kerja mingguan berhasil disimpan!',
          data: [
            { day_of_week: 1, day_name: 'Senin', is_active: true, slot_morning: true, slot_afternoon: false, slot_evening: true },
          ],
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen dengan formulir awal kosong tanpa data palsu', () => {
    expect(component).toBeTruthy();
    expect(component.workerFullName()).toBe('');
    expect(component.workerBioDescription()).toBe('');
    expect(component.workerAvatarUrl()).toBe('');
    expect(component.workerProfessionZone()).toBe('');
    expect(component.workerSlugIdentifier()).toBe('');
  });

  it('harus memvalidasi field nama pekerja dan menampilkan error jika kosong', () => {
    component.workerFullName.set('   ');
    const isValid = component.validateProfileInput();

    expect(isValid).toBe(false);
    expect(component.inputValidationErrors()['name']).toBe(
      'Nama lengkap pekerja wajib diisi.'
    );
  });

  it('harus menghapus pesan validasi ketika clearInputValidationError dipanggil', () => {
    component.inputValidationErrors.set({ name: 'Nama lengkap pekerja wajib diisi.' });
    component.clearInputValidationError('name');

    expect(component.inputValidationErrors()['name']).toBeUndefined();
  });

  it('harus memuat profil pekerja dan memperbarui state signal yang sesuai', () => {
    component.loadExistingWorkerProfile('budi-santoso');

    expect(mockApiService.fetchWorkerProfile).toHaveBeenCalledWith('budi-santoso');
    expect(component.workerRecordId()).toBe('worker-uuid-123');
    expect(component.workerSlugIdentifier()).toBe('budi-santoso');
    expect(component.workerFullName()).toBe('Budi Santoso');
    expect(component.workerProfessionZone()).toBe('Jakarta Selatan');
    expect(component.workerBioDescription()).toBe('Teknisi AC Berpengalaman');
    expect(component.workerAvatarUrl()).toBe('https://example.com/budi.jpg');
    expect(component.workerBasePrice()).toBe(75000);
    expect(component.workerRateType()).toBe('HOURLY');
    expect(component.publicProfileRelativeUrl()).toBe('/budi-santoso');
  });

  it('harus menampilkan pesan error jika pemuatan profil pekerja gagal', () => {
    mockApiService.fetchWorkerProfile.mockReturnValueOnce(
      throwError(() => new Error('Network error'))
    );

    component.loadExistingWorkerProfile('non-existent');

    expect(component.profileFeedbackError()).toContain('Gagal memuat profil pekerja');
    expect(component.isProfileLoading()).toBe(false);
  });

  it('harus menyalin tautan publik ke clipboard dan menampilkan visual feedback', async () => {
    component.workerSlugIdentifier.set('budi-santoso');

    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await component.copyPublicProfileLink();

    expect(writeTextMock).toHaveBeenCalled();
    expect(component.clipboardFeedbackMessage()).toBe('Tautan berhasil disalin!');
  });

  it('harus berhasil submit update profil pekerja saat input valid', () => {
    component.populateWorkerProfileState('worker-uuid-123', {
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      zone: 'Jakarta Barat',
      bio: 'Spesialis Kulkas',
      avatar_url: 'https://example.com/new.jpg',
    });

    component.submitProfileUpdate();

    expect(mockApiService.updateWorkerProfile).toHaveBeenCalledWith(
      'worker-uuid-123',
      expect.objectContaining({
        name: 'Budi Santoso',
        zone: 'Jakarta Barat',
      })
    );
    expect(component.profileFeedbackSuccess()).toBe(
      'Profil pekerja berhasil diperbarui!'
    );
    expect(component.isProfileSubmitting()).toBe(false);
  });

  it('harus menampilkan pesan error saat API update profil mengembalikan error', () => {
    mockApiService.updateWorkerProfile.mockReturnValueOnce(
      throwError(() => new Error('Server error'))
    );

    component.populateWorkerProfileState('worker-uuid-123', {
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      zone: 'Jakarta Selatan',
    });

    component.submitProfileUpdate();

    expect(component.profileFeedbackError()).toContain(
      'Gagal menyimpan perubahan profil pekerja'
    );
    expect(component.isProfileSubmitting()).toBe(false);
  });

  it('harus menolak submit jika ID pekerja belum tersedia', () => {
    component.workerFullName.set('Budi Santoso');
    component.workerRecordId.set('');

    component.submitProfileUpdate();

    expect(mockApiService.updateWorkerProfile).not.toHaveBeenCalled();
    expect(component.profileFeedbackError()).toContain('ID pekerja belum tersedia');
  });

  it('harus memuat profil saat loadProfileByLookupInput dipanggil dengan input slug valid', () => {
    component.workerLookupSlugInput.set('siti-aminah');
    component.loadProfileByLookupInput();

    expect(mockApiService.fetchWorkerProfile).toHaveBeenCalledWith('siti-aminah');
  });

  it('harus memuat profil saat selectPresetSlug dipanggil', () => {
    component.selectPresetSlug('siti-aminah');

    expect(component.workerLookupSlugInput()).toBe('siti-aminah');
    expect(mockApiService.fetchWorkerProfile).toHaveBeenCalledWith('siti-aminah');
  });

  it('harus mereset pemilihan pekerja saat resetWorkerSelection dipanggil', () => {
    component.populateWorkerProfileState('w-id', {
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      zone: 'Jakarta',
    });

    component.resetWorkerSelection();

    expect(component.workerRecordId()).toBe('');
    expect(component.workerSlugIdentifier()).toBe('');
    expect(component.workerFullName()).toBe('');
    expect(component.workerBasePrice()).toBeNull();
    expect(component.workerRateType()).toBe('HOURLY');
  });

  it('harus memvalidasi field tarif dasar dan menampilkan error jika kosong atau <= 0', () => {
    component.workerBasePrice.set(null);
    let isValid = component.validateRatesInput();
    expect(isValid).toBe(false);
    expect(component.ratesValidationErrors()['base_price']).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0.'
    );

    component.workerBasePrice.set(0);
    isValid = component.validateRatesInput();
    expect(isValid).toBe(false);
    expect(component.ratesValidationErrors()['base_price']).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0.'
    );

    component.workerBasePrice.set(-10000);
    isValid = component.validateRatesInput();
    expect(isValid).toBe(false);
    expect(component.ratesValidationErrors()['base_price']).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0.'
    );

    component.workerBasePrice.set(NaN);
    isValid = component.validateRatesInput();
    expect(isValid).toBe(false);
    expect(component.ratesValidationErrors()['base_price']).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0.'
    );

    component.workerBasePrice.set(75000);
    isValid = component.validateRatesInput();
    expect(isValid).toBe(true);
    expect(component.ratesValidationErrors()['base_price']).toBeUndefined();
  });

  it('harus memproses perubahan input tarif pada onBasePriceChange secara aman', () => {
    component.onBasePriceChange('85000');
    expect(component.workerBasePrice()).toBe(85000);

    component.onBasePriceChange('');
    expect(component.workerBasePrice()).toBeNull();

    component.onBasePriceChange('bukan-angka');
    expect(component.workerBasePrice()).toBeNull();
  });

  it('harus menghapus pesan validasi tarif ketika clearRatesValidationError dipanggil', () => {
    component.ratesValidationErrors.set({
      base_price: 'Nominal tarif dasar harus lebih besar dari Rp 0.',
    });
    component.clearRatesValidationError('base_price');
    expect(component.ratesValidationErrors()['base_price']).toBeUndefined();
  });

  it('harus mengubah skema tipe tarif saat setRateType dipanggil', () => {
    expect(component.workerRateType()).toBe('HOURLY');
    component.setRateType('UNIT');
    expect(component.workerRateType()).toBe('UNIT');
    component.setRateType('HOURLY');
    expect(component.workerRateType()).toBe('HOURLY');
  });

  it('harus berhasil submit update tarif pekerja saat input valid', () => {
    component.workerRecordId.set('worker-uuid-123');
    component.workerBasePrice.set(90000);
    component.workerRateType.set('UNIT');

    component.submitRatesUpdate();

    expect(mockApiService.updateWorkerRates).toHaveBeenCalledWith(
      'worker-uuid-123',
      {
        base_price: 90000,
        rate_type: 'UNIT',
      }
    );
    expect(component.ratesFeedbackSuccess()).toBe(
      'Pengaturan tarif pekerja berhasil diperbarui!'
    );
    expect(component.isRatesSubmitting()).toBe(false);
  });

  it('harus menampilkan pesan error saat API update tarif mengembalikan error', () => {
    mockApiService.updateWorkerRates.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Nominal tarif dasar harus lebih besar dari Rp 0' } }))
    );

    component.workerRecordId.set('worker-uuid-123');
    component.workerBasePrice.set(50000);
    component.workerRateType.set('HOURLY');

    component.submitRatesUpdate();

    expect(component.ratesFeedbackError()).toBe(
      'Nominal tarif dasar harus lebih besar dari Rp 0'
    );
    expect(component.isRatesSubmitting()).toBe(false);
  });

  it('harus menolak submit tarif jika ID pekerja belum tersedia', () => {
    component.workerRecordId.set('');
    component.workerBasePrice.set(75000);

    component.submitRatesUpdate();

    expect(mockApiService.updateWorkerRates).not.toHaveBeenCalled();
    expect(component.ratesFeedbackError()).toContain('ID pekerja belum tersedia');
  });

  it('harus menghitung formattedBasePricePreview dengan format Rupiah yang tepat', () => {
    component.workerBasePrice.set(null);
    expect(component.formattedBasePricePreview()).toBeNull();

    component.workerBasePrice.set(75000);
    component.workerRateType.set('HOURLY');
    expect(component.formattedBasePricePreview()).toContain('75.000');
    expect(component.formattedBasePricePreview()).toContain('/ Jam');

    component.workerBasePrice.set(350000);
    component.workerRateType.set('UNIT');
    expect(component.formattedBasePricePreview()).toContain('350.000');
    expect(component.formattedBasePricePreview()).toContain('/ Sesi');
  });

  it('harus menampilkan pesan error saat clipboard gagal menyalin', async () => {
    component.workerSlugIdentifier.set('budi-santoso');

    const failingWriteText = jest.fn().mockRejectedValue(new Error('Permission denied'));
    Object.assign(navigator, {
      clipboard: {
        writeText: failingWriteText,
      },
    });

    await component.copyPublicProfileLink();

    expect(component.clipboardFeedbackMessage()).toBe('Gagal menyalin tautan');
  });

  it('harus memvalidasi field lokasi dan menampilkan pesan error jika koordinat belum diisi', () => {
    component.workerLat.set(null);
    component.workerLng.set(null);

    const isValid = component.validateLocationSettingsInput();
    expect(isValid).toBe(false);
    expect(component.locationValidationErrors()['coordinates']).toBe(
      'Titik koordinat (latitude & longitude) rumah atau pangkalan kerja wajib ditentukan.'
    );
  });

  it('harus memvalidasi radius maksimal dan batas bebas ongkir secara logis', () => {
    component.workerLat.set(-6.2443);
    component.workerLng.set(106.7997);
    component.workerMaxRadiusKm.set(0);

    let isValid = component.validateLocationSettingsInput();
    expect(isValid).toBe(false);
    expect(component.locationValidationErrors()['max_radius_km']).toBe(
      'Batas radius maksimal harus lebih besar dari 0 km.'
    );

    component.workerMaxRadiusKm.set(10);
    component.workerFreeRadiusKm.set(15);
    isValid = component.validateLocationSettingsInput();
    expect(isValid).toBe(false);
    expect(component.locationValidationErrors()['free_radius_km']).toBe(
      'Radius bebas ongkir tidak boleh melebihi batas radius jangkauan maksimal.'
    );

    component.workerFreeRadiusKm.set(3);
    isValid = component.validateLocationSettingsInput();
    expect(isValid).toBe(true);
  });

  it('harus memproses perubahan koordinat melalui onWorkerCoordinatesChanged', () => {
    component.locationValidationErrors.set({ coordinates: 'Error' });
    component.onWorkerCoordinatesChanged({ lat: -6.2088, lng: 106.8456 });

    expect(component.workerLat()).toBe(-6.2088);
    expect(component.workerLng()).toBe(106.8456);
    expect(component.locationValidationErrors()['coordinates']).toBeUndefined();
  });

  it('harus berhasil submit update lokasi pekerja saat form valid', () => {
    component.workerRecordId.set('worker-uuid-123');
    component.workerLat.set(-6.2443);
    component.workerLng.set(106.7997);
    component.workerMaxRadiusKm.set(15);
    component.workerFreeRadiusKm.set(4);
    component.workerExtraFeePerKm.set(4000);

    component.submitLocationSettingsUpdate();

    expect(mockApiService.updateWorkerLocationSettings).toHaveBeenCalledWith(
      'worker-uuid-123',
      {
        lat: -6.2443,
        lng: 106.7997,
        max_radius_km: 15,
        free_radius_km: 4,
        extra_fee_per_km: 4000,
      }
    );
    expect(component.locationFeedbackSuccess()).toContain('Pengaturan lokasi');
    expect(component.isLocationSubmitting()).toBe(false);
  });

  it('harus menolak submit lokasi jika ID pekerja belum tersedia', () => {
    component.workerRecordId.set('');
    component.workerLat.set(-6.2443);
    component.workerLng.set(106.7997);

    component.submitLocationSettingsUpdate();

    expect(mockApiService.updateWorkerLocationSettings).not.toHaveBeenCalled();
    expect(component.locationFeedbackError()).toContain('ID pekerja belum tersedia');
  });

  it('harus memuat jadwal pekerja dan menyusun dengan Senin di awal', () => {
    component.loadWorkerSchedules('worker-uuid-123');

    expect(mockApiService.fetchWorkerSchedules).toHaveBeenCalledWith('worker-uuid-123');
    const schedules = component.workerSchedules();
    expect(schedules.length).toBe(7);
    expect(schedules[0].day_name).toBe('Senin');
    expect(schedules[0].day_of_week).toBe(1);
    expect(schedules[6].day_name).toBe('Minggu');
    expect(schedules[6].day_of_week).toBe(0);
  });

  it('harus mengubah status aktif hari kerja saat toggleScheduleDayActive dipanggil', () => {
    component.workerSchedules.set(component.createDefaultWeeklySchedule());
    const initialMondayActive = component.workerSchedules()[0].is_active;

    component.toggleScheduleDayActive(1);
    expect(component.workerSchedules()[0].is_active).toBe(!initialMondayActive);

    component.toggleScheduleDayActive(1);
    expect(component.workerSchedules()[0].is_active).toBe(initialMondayActive);
  });

  it('harus mengubah ketersediaan blok slot saat toggleScheduleSlot dipanggil', () => {
    component.workerSchedules.set(component.createDefaultWeeklySchedule());
    const initialMorning = component.workerSchedules()[0].slot_morning;

    component.toggleScheduleSlot(1, 'slot_morning');
    expect(component.workerSchedules()[0].slot_morning).toBe(!initialMorning);
  });

  it('harus berhasil submit konfigurasi jadwal saat form valid', () => {
    component.workerRecordId.set('worker-uuid-123');
    const dummySchedules = component.createDefaultWeeklySchedule();
    component.workerSchedules.set(dummySchedules);

    component.submitScheduleUpdate();

    expect(mockApiService.updateWorkerSchedules).toHaveBeenCalledWith(
      'worker-uuid-123',
      dummySchedules
    );
    expect(component.scheduleFeedbackSuccess()).toContain('Konfigurasi jadwal');
    expect(component.isScheduleSubmitting()).toBe(false);
  });

  it('harus menolak submit jadwal jika ID pekerja belum tersedia', () => {
    component.workerRecordId.set('');
    component.submitScheduleUpdate();

    expect(mockApiService.updateWorkerSchedules).not.toHaveBeenCalled();
    expect(component.scheduleFeedbackError()).toContain('ID pekerja belum tersedia');
  });
});

