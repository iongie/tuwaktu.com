import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardHeroBannerComponent } from './worker-dashboard-hero-banner.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardHeroBannerComponent', () => {
  let fixture: ComponentFixture<WorkerDashboardHeroBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardHeroBannerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardHeroBannerComponent);
    fixture.detectChanges();
  });

  it('harus merender kartu metrik telemetri otoritas bento dan switch status', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bulan Berjalan');
    expect(el.textContent).toContain('Pendapatan Mandiri');
    expect(el.textContent).toContain('Efisiensi Kerja');
    expect(el.textContent).toContain('Reputasi Klien');
  });
});

