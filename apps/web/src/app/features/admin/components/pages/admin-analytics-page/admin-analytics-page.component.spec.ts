import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminAnalyticsPageComponent } from './admin-analytics-page.component';
import { AdminAnalyticsStore } from '../../../services/admin-analytics.store';
import { AdminAnalyticsApiService } from '../../../services/admin-analytics-api.service';
import { AdminAnalyticsSummary } from '../../../models/admin-analytics.model';

describe('AdminAnalyticsPageComponent', () => {
  let component: AdminAnalyticsPageComponent;
  let fixture: ComponentFixture<AdminAnalyticsPageComponent>;
  let mockApiService: { fetchSummary: jest.Mock };

  const mockSummary: AdminAnalyticsSummary = {
    total_whatsapp_clicks: 34,
    total_bookings: 18,
    total_profile_views: 150,
    total_searches: 60,
    top_workers: [
      {
        worker_id: 'w-1',
        worker_slug: 'budi-santoso',
        worker_name: 'Budi Santoso',
        zone: 'Jakarta Selatan',
        whatsapp_clicks: 20,
        profile_views: 80,
      },
    ],
    top_searches: [
      { query: 'AC Inverter', location: 'Jakarta Selatan', count: 25 },
    ],
    top_cities: [
      {
        city: 'Jakarta Selatan',
        total_activity: 120,
        profile_views: 70,
        searches: 35,
        whatsapp_clicks: 15,
        percentage: 60.0,
      },
    ],
    booking_status_breakdown: { CONFIRMED: 12, PENDING_WA: 6 },
    days_range: 30,
  };

  beforeEach(async () => {
    mockApiService = {
      fetchSummary: jest.fn().mockReturnValue(of(mockSummary)),
    };

    await TestBed.configureTestingModule({
      imports: [AdminAnalyticsPageComponent],
      providers: [
        provideRouter([]),
        AdminAnalyticsStore,
        { provide: AdminAnalyticsApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen halaman analitik admin', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender kartu KPI utama dan data ringkasan analitik', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Analitik & Metrik Konversi Platform');
    expect(el.textContent).toContain('Klik WhatsApp Mitra');
    expect(el.textContent).toContain('Total Reservasi Booking');
    expect(el.textContent).toContain('Kunjungan Profil Mitra');
    expect(el.textContent).toContain('Pencarian di Beranda');

    // Cek angka KPI
    expect(el.textContent).toContain('34');
    expect(el.textContent).toContain('18');
    expect(el.textContent).toContain('150');
    expect(el.textContent).toContain('60');

    // Cek Top Mitra
    expect(el.textContent).toContain('Budi Santoso');

    // Cek Tren Pencarian
    expect(el.textContent).toContain('AC Inverter');
    expect(el.textContent).toContain('Wilayah: Jakarta Selatan');

    // Cek Organisme Distribusi Wilayah Kota
    const cityCard = el.querySelector('app-admin-city-distribution-card');
    expect(cityCard).toBeTruthy();
    expect(cityCard?.textContent).toContain('Sebaran Aktivitas Berdasarkan Wilayah');
    expect(cityCard?.textContent).toContain('Jakarta Selatan');
    expect(cityCard?.textContent).toContain('60%');
  });

  it('harus memanggil setDaysRange saat filter rentang hari dipilih', () => {
    const setRangeSpy = jest.spyOn(component.store, 'setDaysRange');

    component.onSelectRange(7);

    expect(setRangeSpy).toHaveBeenCalledWith(7);
  });

  it('harus memuat ulang data saat tombol refresh diklik', () => {
    const loadSpy = jest.spyOn(component.store, 'loadSummary');

    component.refreshData();

    expect(loadSpy).toHaveBeenCalled();
  });
});
