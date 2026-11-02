import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { WorkerBookingPageComponent } from './worker-booking-page.component';
import { WorkerBookingStore } from '../../services/worker-booking.store';
import { WorkerBookingApiService } from '../../services/worker-booking-api.service';
import { APP_ENVIRONMENT } from '../../../../../environments/environment.model';
import { environment } from '../../../../../environments/environment';

describe('WorkerBookingPageComponent', () => {
  let component: WorkerBookingPageComponent;
  let fixture: ComponentFixture<WorkerBookingPageComponent>;
  let mockApiService: {
    fetchPublicTechnicianProfile: jest.Mock;
    submitServiceBookingReservation: jest.Mock;
  };
  let titleService: Title;
  let metaService: Meta;

  const mockTechnicianData = {
    id: 'tech-1',
    slug: 'budi-santoso',
    name: 'Budi Santoso',
    bio: 'Teknisi AC Berpengalaman',
    avatar_url: 'https://example.com/budi.jpg',
    rating: 4.9,
    review_count: 24,
    zone: 'Jakarta Selatan',
    services: [
      {
        id: 'srv-1',
        name: 'Cuci AC Standar',
        description: 'Pembersihan AC menyeluruh',
        price: 75000,
        duration_minutes: 45,
      },
    ],
  };

  beforeEach(async () => {
    mockApiService = {
      fetchPublicTechnicianProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: mockTechnicianData,
        })
      ),
      submitServiceBookingReservation: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Sukses',
          data: {
            booking_code: 'TWK-12345',
            worker_id: 'tech-1',
            worker_name: 'Budi Santoso',
            service_id: 'srv-1',
            service_name: 'Cuci AC Standar',
            client_name: 'Joko Santoso',
            location: 'Pondok Indah',
            zone: 'Jakarta Selatan',
            booking_date: new Date().toISOString(),
            total_price: 75000,
            status: 'PENDING_WA',
            worker_whatsapp: '6281234567890',
            created_at: new Date().toISOString(),
          },
        })
      ),
      calculateBookingFee: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Kalkulasi berhasil',
          data: {
            worker_id: 'tech-1',
            service_id: 'srv-1',
            service_price: 75000,
            distance_km: 5.0,
            max_radius_km: 15.0,
            free_radius_km: 3.0,
            chargeable_km: 2.0,
            extra_fee_per_km: 3000,
            transport_fee: 6000,
            total_price: 81000,
            is_within_radius: true,
          },
        })
      ),
      fetchAvailableSlots: jest.fn().mockReturnValue(
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
      ),
    };

  await TestBed.configureTestingModule({
    imports: [WorkerBookingPageComponent],
    providers: [
      provideRouter([
        { path: '', component: WorkerBookingPageComponent },
        { path: ':slug', component: WorkerBookingPageComponent },
      ]),
      WorkerBookingStore,
      Title,
      Meta,
      {
        provide: WorkerBookingApiService,
        useValue: mockApiService,
      },
      {
        provide: APP_ENVIRONMENT,
        useValue: environment,
      },
    ],
  }).compileComponents();

  titleService = TestBed.inject(Title);
  metaService = TestBed.inject(Meta);
  fixture = TestBed.createComponent(WorkerBookingPageComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});

it('harus membuat instance komponen dan memuat profil awal', () => {
  expect(component).toBeTruthy();
  expect(mockApiService.fetchPublicTechnicianProfile).toHaveBeenCalledWith(
    'budi-santoso'
  );
});

it('harus memformat mata uang rupiah secara tepat', () => {
  const formatted = component.formatCurrencyRupiah(75000);
  expect(formatted).toContain('75.000');
});

it('harus memvalidasi field nama klien dan menampilkan error jika kosong', () => {
  component.clientFullName = '';
  const isValid = component.validateBookingForm();
  expect(isValid).toBe(false);
  expect(component.clientValidationErrors()['client_name']).toBe(
    'Nama lengkap klien wajib diisi.'
  );
});

it('harus memvalidasi tanggal booking jika diisi di masa lalu', () => {
  component.clientFullName = 'Ahmad Dahlan';
  component.reservationScheduledDate = '2020-01-01T10:00';
  const isValid = component.validateBookingForm();
  expect(isValid).toBe(false);
  expect(component.clientValidationErrors()['booking_date']).toBe(
    'Waktu kedatangan harus di masa depan.'
  );
});

it('harus mengupdate judul dokumen dan OpenGraph meta tags saat profil pekerja dimuat', () => {
  component.updateSeoOpenGraphTags(mockTechnicianData);

  expect(titleService.getTitle()).toBe('Pesan Layanan dari Budi Santoso - Tuwaktu');
  const ogTitle = metaService.getTag("property='og:title'");
  expect(ogTitle?.content).toBe('Pesan Layanan dari Budi Santoso - Tuwaktu');

  const ogImage = metaService.getTag("property='og:image'");
  expect(ogImage?.content).toBe('https://example.com/budi.jpg');

  const ogUrl = metaService.getTag("property='og:url'");
  expect(ogUrl?.content).toBe('/budi-santoso');

  const ogImageAlt = metaService.getTag("property='og:image:alt'");
  expect(ogImageAlt?.content).toBe('Foto profil Budi Santoso');
});

it('harus menavigasikan router saat quickSelectTechnician dieksekusi', () => {
  const router = TestBed.inject(Router);
  const navigateSpy = jest.spyOn(router, 'navigate');

  component.quickSelectTechnician('siti-aminah');

  expect(navigateSpy).toHaveBeenCalledWith(['/', 'siti-aminah']);
  expect(mockApiService.fetchPublicTechnicianProfile).toHaveBeenCalledWith(
    'siti-aminah'
  );
});

it('harus memvalidasi dan menolak submit reservasi jika lokasi di luar radius jangkauan', () => {
  component.clientFullName = 'Bambang';
  component.serviceLocationAddress = 'Jl. Thamrin No. 5';
  component.reservationScheduledDate = '2030-01-01T10:00';

  component.store.feeCalculationError.set('Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja.');

  const isValid = component.validateBookingForm();
  expect(isValid).toBe(false);
  expect(component.clientValidationErrors()['service']).toContain('di luar batas jangkauan');
});

it('harus berhasil submit reservasi ketika form valid dan menyusun URL WhatsApp', () => {
  const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

  component.clientFullName = 'Bambang';
  component.serviceLocationAddress = 'Jl. Thamrin No. 5';
  component.reservationScheduledDate = '2030-01-01T10:00';

  component.submitBookingOrder();
  expect(mockApiService.submitServiceBookingReservation).toHaveBeenCalled();

  const generatedUrl = component.whatsappRedirectUrl();
  expect(generatedUrl.startsWith('https://wa.me/6281234567890?text=')).toBe(true);
  expect(generatedUrl).toContain('TWK-12345');
  expect(windowOpenSpy).toHaveBeenCalledWith(generatedUrl, '_blank');

  component.dismissConfirmedReservation();
  expect(component.whatsappRedirectUrl()).toBe('');
  expect(component.store.confirmedReservation()).toBeNull();

  windowOpenSpy.mockRestore();
});
});
