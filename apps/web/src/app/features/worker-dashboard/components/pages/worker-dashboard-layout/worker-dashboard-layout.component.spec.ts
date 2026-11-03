import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { WorkerDashboardLayoutComponent } from './worker-dashboard-layout.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardLayoutComponent', () => {
  let component: WorkerDashboardLayoutComponent;
  let fixture: ComponentFixture<WorkerDashboardLayoutComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    fetchWorkerProfile: jest.Mock;
    updateWorkerProfile: jest.Mock;
    updateWorkerRates: jest.Mock;
    updateWorkerLocationSettings: jest.Mock;
    fetchWorkerSchedules: jest.Mock;
    updateWorkerSchedules: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      fetchWorkerProfile: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: {
            id: 'worker-1',
            slug: 'budi-santoso',
            name: 'Budi Santoso',
            zone: 'Jakarta Selatan',
            rating: 5,
            review_count: 10,
            base_price: 80000,
            rate_type: 'HOURLY',
            services: [],
          },
        }),
      ),
      updateWorkerProfile: jest.fn().mockReturnValue(of({ success: true })),
      updateWorkerRates: jest.fn().mockReturnValue(of({ success: true })),
      updateWorkerLocationSettings: jest
        .fn()
        .mockReturnValue(of({ success: true })),
      fetchWorkerSchedules: jest
        .fn()
        .mockReturnValue(of({ success: true, data: [] })),
      updateWorkerSchedules: jest
        .fn()
        .mockReturnValue(of({ success: true, data: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardLayoutComponent],
      providers: [
        provideRouter([]),
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardLayoutComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance layout dasbor dengan 7 item navigasi', () => {
    expect(component).toBeTruthy();
    expect(component.navMenuItems.length).toBe(7);
    expect(component.navMenuItems.map((item) => item.icon)).toEqual([
      'space_dashboard',
      'payments',
      'near_me',
      'calendar_month',
      'chat',
      'workspace_premium',
      'bolt',
    ]);
  });

  it('harus memanggil loadProfileByLookupInput saat pengguna submit slug', () => {
    store.workerLookupSlugInput.set('budi-santoso');
    component.loadProfileByLookupInput();

    expect(mockApiService.fetchWorkerProfile).toHaveBeenCalledWith(
      'budi-santoso',
    );
  });

  it('harus mereset pemilihan pekerja saat resetWorkerSelection dipanggil', () => {
    store.workerFullName.set('Budi Santoso');
    component.resetWorkerSelection();

    expect(store.workerFullName()).toBe('');
  });
});
