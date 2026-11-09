import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCityDistributionCardComponent } from './admin-city-distribution-card.component';
import { AdminAnalyticsCityMetric } from '../../../models/admin-analytics.model';

describe('AdminCityDistributionCardComponent', () => {
  let component: AdminCityDistributionCardComponent;
  let fixture: ComponentFixture<AdminCityDistributionCardComponent>;

  const mockCities: AdminAnalyticsCityMetric[] = [
    {
      city: 'Jakarta Selatan',
      total_activity: 120,
      profile_views: 70,
      searches: 35,
      whatsapp_clicks: 15,
      percentage: 54.5,
    },
    {
      city: 'Surabaya',
      total_activity: 60,
      profile_views: 30,
      searches: 20,
      whatsapp_clicks: 10,
      percentage: 27.3,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCityDistributionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCityDistributionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen kartu distribusi kota', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan empty state saat data kota kosong', () => {
    fixture.componentRef.setInput('cities', []);
    fixture.detectChanges();

    const emptyEl = fixture.nativeElement.querySelector('[data-testid="city-empty-state"]');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('Belum Ada Data Wilayah');
  });

  it('harus merender daftar kota terpopuler, persentase, dan bilah progress bar saat data tersedia', () => {
    fixture.componentRef.setInput('cities', mockCities);
    fixture.detectChanges();

    const listEl = fixture.nativeElement.querySelector('[data-testid="city-list"]');
    expect(listEl).toBeTruthy();
    expect(listEl.textContent).toContain('Jakarta Selatan');
    expect(listEl.textContent).toContain('120');
    expect(listEl.textContent).toContain('54.5%');
    expect(listEl.textContent).toContain('Surabaya');
    expect(listEl.textContent).toContain('60');
    expect(listEl.textContent).toContain('27.3%');

    // Periksa progress bar
    const progressBars = fixture.nativeElement.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(2);
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('54.5');
  });
});

