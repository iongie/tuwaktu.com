import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardBoostComponent } from './worker-dashboard-boost.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardBoostComponent', () => {
  let component: WorkerDashboardBoostComponent;
  let fixture: ComponentFixture<WorkerDashboardBoostComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: Partial<WorkerDashboardApiService>;

  beforeEach(async () => {
    mockApiService = {};

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardBoostComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardBoostComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen boost visibilitas', () => {
    expect(component).toBeTruthy();
    expect(component.boostPackages.length).toBe(3);
  });

  it('harus memilih paket akhir pekan (WEEKEND_72H) secara bawaan', () => {
    expect(component.selectedBoostPackage()).toBe('WEEKEND_72H');
    expect(component.activePackageDetails().name).toBe('Boost Akhir Pekan');
  });

  it('harus mengubah paket terpilih saat selectBoostPackage dipanggil', () => {
    component.selectBoostPackage('WEEKLY_7D');
    expect(component.selectedBoostPackage()).toBe('WEEKLY_7D');
    expect(component.activePackageDetails().name).toBe('Boost Mingguan');
  });

  it('harus memanggil store.activateBoost saat tombol aktivasi ditekan', () => {
    component.selectBoostPackage('FLASH_24H');
    component.activateBoost();

    expect(store.activeBoostPackage()).toBe('FLASH_24H');
    expect(store.isBoostActive()).toBe(true);
    expect(store.boostFeedbackSuccess()).toContain('Boost Kilat 24 Jam');
  });

  it('harus mengubah status radar saat toggleRadarBoost dipanggil', () => {
    expect(store.isBoostActive()).toBe(true);
    component.toggleRadarBoost();
    expect(store.isBoostActive()).toBe(false);
    component.toggleRadarBoost();
    expect(store.isBoostActive()).toBe(true);
  });
});

