import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardPlanComponent } from './worker-dashboard-plan.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardPlanComponent', () => {
  let component: WorkerDashboardPlanComponent;
  let fixture: ComponentFixture<WorkerDashboardPlanComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: Partial<WorkerDashboardApiService>;

  beforeEach(async () => {
    mockApiService = {};

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardPlanComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardPlanComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen paket langganan', () => {
    expect(component).toBeTruthy();
    expect(component.planTiers.length).toBe(3);
  });

  it('harus menampilkan paket Mandiri Pro sebagai paket aktif secara bawaan', () => {
    expect(store.currentPlanTier()).toBe('PRO');
  });

  it('harus memperbarui paket saat selectPlanTier dipanggil', () => {
    component.selectPlanTier('FLEET');
    expect(store.currentPlanTier()).toBe('FLEET');
    expect(store.planFeedbackSuccess()).toContain('Paket Bengkel & Tim');
  });
});

