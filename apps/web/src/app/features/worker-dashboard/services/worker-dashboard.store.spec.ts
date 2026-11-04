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

  afterEach(() => {
    store.clearOtpTimer();
    localStorage.clear();
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

  it('harus memformat nomor WhatsApp tampilan dengan awalan negara +62', () => {
    store.workerWhatsAppNumber.set('6281288992211');
    expect(store.displayFormattedWhatsAppNumber()).toBe('+62 812-8899-2211');

    store.workerWhatsAppNumber.set('');
    expect(store.displayFormattedWhatsAppNumber()).toBe('+62 812-8899-2211');
  });

  it('harus merender pratinjau pesan WhatsApp dinamis sesuai variabel dan switch', () => {
    store.resetWhatsAppTemplateToDefault();
    store.insertTokenIntoWhatsAppTemplate('{{NAMA_KLIEN}}');
    const rendered = store.renderedWhatsAppMessagePreview();

    expect(rendered).toContain('Bima Satria');
    expect(rendered).toContain('Deep Clean Detailing (2.5 Jam)');
    expect(rendered).toContain('https://maps.google.com/?q=-6.2297,106.8093');
    expect(rendered).toContain('Rp 166.100');

    // Matikan gmaps dan rincian ongkos
    store.toggleGmapsOption();
    store.toggleBreakdownOption();
    const renderedWithoutGmaps = store.renderedWhatsAppMessagePreview();

    expect(renderedWithoutGmaps).not.toContain('https://maps.google.com');
    expect(renderedWithoutGmaps).toContain('Rp 166.100 Nett');
  });

  it('harus menyisipkan token ke dalam template WhatsApp pada posisi kursor', () => {
    store.setWhatsAppTemplate('Pesanan: ');
    store.insertTokenIntoWhatsAppTemplate('{{LAYANAN}}', 9);

    expect(store.whatsappMessageTemplate()).toBe('Pesanan: {{LAYANAN}}');
  });

  it('harus menghasilkan deep link wa.me yang valid', () => {
    store.workerWhatsAppNumber.set('6281288992211');
    const link = store.generatedWhatsAppDeepLink();

    expect(link.startsWith('https://wa.me/6281288992211?text=')).toBe(true);
  });

  it('harus menjalankan simulasi OTP dengan timeout otomatis', () => {
    jest.useFakeTimers();
    store.triggerOtpTest();
    expect(store.otpFeedbackMessage()).toBe('Kode Dikirim ✓');

    jest.advanceTimersByTime(3000);
    expect(store.otpFeedbackMessage()).toBeNull();
    jest.useRealTimers();
  });

  it('harus menormalisasi format nomor telepon Indonesia 08... menjadi 628... pada deep link', () => {
    store.workerWhatsAppNumber.set('081288992211');
    const link = store.generatedWhatsAppDeepLink();
    expect(link.startsWith('https://wa.me/6281288992211?text=')).toBe(true);

    store.workerWhatsAppNumber.set('81288992211');
    expect(store.generatedWhatsAppDeepLink().startsWith('https://wa.me/6281288992211?text=')).toBe(true);
  });

  it('harus menormalisasi format nomor saat saveEditedWhatsAppNumber dipanggil', () => {
    store.startEditingWhatsAppNumber();
    store.editWhatsAppNumberInput.set('081234567890');
    store.saveEditedWhatsAppNumber();

    expect(store.workerWhatsAppNumber()).toBe('6281234567890');
  });

  it('harus menyimpan dan memuat konfigurasi WhatsApp ke localStorage', () => {
    store.workerSlugIdentifier.set('sarah-cleaning');
    store.setWhatsAppTemplate('Format template tersimpan khusus');
    store.includeGmapsLocation.set(false);
    store.saveWhatsAppSettingsToStorage();

    // Reset ke state default
    store.whatsappMessageTemplate.set('Default');
    store.includeGmapsLocation.set(true);

    const loaded = store.loadWhatsAppSettingsFromStorage('sarah-cleaning');
    expect(loaded).toBe(true);
    expect(store.whatsappMessageTemplate()).toBe('Format template tersimpan khusus');
    expect(store.includeGmapsLocation()).toBe(false);
  });

  it('harus mempersonalisasi template default saat memuat profil pekerja', () => {
    store.populateWorkerProfileState('uuid-123', {
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      zone: 'Jakarta Selatan',
      whatsapp_number: '6281234567890',
    });

    expect(store.whatsappMessageTemplate()).toContain('Halo Kak Budi Santoso!');
    expect(store.whatsappMessageTemplate()).toContain('Kak Budi');
  });

  it('harus mengelola tab filter katalog dan visibilitas layanan', () => {
    expect(store.servicesActiveTab()).toBe('ACTIVE');
    expect(store.activeServicesCount()).toBeGreaterThan(0);

    store.setRatesActiveTab('DRAFT');
    expect(store.servicesActiveTab()).toBe('DRAFT');
    expect(store.filteredServices().length).toBe(store.draftServicesCount());

    store.setRatesActiveTab('ACTIVE');
    const firstService = store.filteredServices()[0];
    const initialVisibility = firstService.is_public;

    store.toggleServiceVisibility(firstService.id);
    const updated = store.workerServices().find((s) => s.id === firstService.id);
    expect(updated?.is_public).toBe(!initialVisibility);
  });

  it('harus memperbarui dan menambah layanan katalog baru', () => {
    const firstService = store.workerServices()[0];
    store.updateServiceCatalogItem(firstService.id, {
      price: 85000,
      name: 'Deep Clean Premium',
    });

    const updated = store.workerServices().find((s) => s.id === firstService.id);
    expect(updated?.price).toBe(85000);
    expect(updated?.name).toBe('Deep Clean Premium');

    const initialLength = store.workerServices().length;
    store.addNewCatalogService({
      code: 'TEST-99',
      name: 'Layanan Tambahan',
      description: 'Deskripsi tes',
      price: 99000,
      rate_type: 'UNIT',
      duration_minutes: 60,
      status: 'ACTIVE',
      is_public: true,
    });

    expect(store.workerServices().length).toBe(initialLength + 1);
    expect(store.workerServices()[0].name).toBe('Layanan Tambahan');
  });

  it('harus mengontrol status toggle sidebar mobile', () => {
    expect(store.isMobileSidebarOpen()).toBe(false);
    store.toggleMobileSidebar();
    expect(store.isMobileSidebarOpen()).toBe(true);
    store.closeMobileSidebar();
    expect(store.isMobileSidebarOpen()).toBe(false);
  });

  it('harus memperbarui lastRatesSyncTimestamp saat ada mutasi layanan atau submit lokal', () => {
    store.workerRecordId.set('');
    store.workerBasePrice.set(75000);
    store.setRateType('HOURLY');
    store.submitRatesUpdate();

    expect(store.ratesFeedbackSuccess()).toBe('Pengaturan katalog tarif pekerja berhasil diperbarui!');
    expect(store.lastRatesSyncTimestamp()).toContain('WIB');
  });
});


