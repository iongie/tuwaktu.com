import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { WorkerDashboardSummaryComponent } from './worker-dashboard-summary.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WorkerDashboardSummaryComponent', () => {
  let component: WorkerDashboardSummaryComponent;
  let fixture: ComponentFixture<WorkerDashboardSummaryComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardSummaryComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
        {
          provide: WorkerDashboardApiService,
          useValue: {
            fetchWorkerProfile: jest.fn().mockReturnValue(of({ success: true })),
            updateWorkerProfile: jest.fn().mockReturnValue(of({ success: true })),
            updateWorkerRates: jest.fn().mockReturnValue(of({ success: true })),
            updateWorkerLocationSettings: jest.fn().mockReturnValue(of({ success: true })),
            fetchWorkerSchedules: jest.fn().mockReturnValue(of({ success: true, data: [] })),
            updateWorkerSchedules: jest.fn().mockReturnValue(of({ success: true, data: [] })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardSummaryComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance halaman ringkasan', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender seluruh organisme utama dasbor persis Stitch', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-worker-dashboard-hero-banner')).toBeTruthy();
    expect(el.querySelector('app-summary-schedule-hub')).toBeTruthy();
    expect(el.querySelector('app-summary-logistics-services-hub')).toBeTruthy();
    expect(el.querySelector('app-summary-recent-transactions-table')).toBeTruthy();
    expect(el.textContent).toContain('Prinsip Kedaulatan Mitra Tuwaktu');
  });

  it('harus memanggil fetchWorkerProfile saat loadProfileByLookupInput dipanggil', () => {
    const apiService = TestBed.inject(WorkerDashboardApiService);
    store.workerLookupSlugInput.set('budi-santoso');
    component.loadProfileByLookupInput();

    expect(apiService.fetchWorkerProfile).toHaveBeenCalledWith('budi-santoso');
  });
});
