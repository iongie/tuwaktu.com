import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { WorkerDashboardSummaryComponent } from './worker-dashboard-summary.component';
import { WorkerDashboardStore } from '../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../services/worker-dashboard-api.service';

describe('WorkerDashboardSummaryComponent', () => {
  let component: WorkerDashboardSummaryComponent;
  let fixture: ComponentFixture<WorkerDashboardSummaryComponent>;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardSummaryComponent],
      providers: [
        provideRouter([]),
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

  it('harus merender status terkonfigurasi saat tarif telah diisi', () => {
    store.workerBasePrice.set(75000);
    store.workerRateType.set('HOURLY');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('75.000');
  });
});

