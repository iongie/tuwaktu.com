import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardLogisticsComponent } from './worker-dashboard-logistics.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardLogisticsComponent', () => {
  let component: WorkerDashboardLogisticsComponent;
  let fixture: ComponentFixture<WorkerDashboardLogisticsComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    updateWorkerLocationSettings: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerLocationSettings: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Pengaturan lokasi berhasil disimpan',
          data: {
            lat: -6.2443,
            lng: 106.7997,
            max_radius_km: 15,
            free_radius_km: 4,
            extra_fee_per_km: 4000,
          },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardLogisticsComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardLogisticsComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen logistik & radius', () => {
    expect(component).toBeTruthy();
  });

  it('harus memanggil submitLocationSettingsUpdate saat form disubmit', () => {
    store.workerRecordId.set('worker-uuid-1');
    store.onWorkerCoordinatesChanged({ lat: -6.2443, lng: 106.7997 });
    store.workerMaxRadiusKm.set(15);
    store.workerFreeRadiusKm.set(4);
    store.workerExtraFeePerKm.set(4000);

    component.submitLocation();

    expect(mockApiService.updateWorkerLocationSettings).toHaveBeenCalledWith(
      'worker-uuid-1',
      {
        lat: -6.2443,
        lng: 106.7997,
        max_radius_km: 15,
        free_radius_km: 4,
        extra_fee_per_km: 4000,
      }
    );
  });

  it('harus merender judul halaman dan badge mode transportasi', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Logistik, Basecamp & Radius Jangkauan');
    expect(compiled.textContent).toContain('Mode Transportasi');
    expect(compiled.textContent).toContain('Roda Dua (Motoris Mandiri)');
  });

  it('harus memperbarui sinyal store saat onCoordinatesChanged dipanggil', () => {
    component.onCoordinatesChanged({ lat: -6.1754, lng: 106.8272 });
    expect(store.workerLat()).toBe(-6.1754);
    expect(store.workerLng()).toBe(106.8272);
  });

  it('harus memperbarui sinyal store saat onMaxRadiusChange, onFreeRadiusChange, dan onExtraFeeChange dipanggil', () => {
    component.onMaxRadiusChange(12);
    expect(store.workerMaxRadiusKm()).toBe(12);

    component.onFreeRadiusChange(4.5);
    expect(store.workerFreeRadiusKm()).toBe(4.5);

    component.onExtraFeeChange(4500);
    expect(store.workerExtraFeePerKm()).toBe(4500);
  });

  it('harus mengatur ulang parameter logistik saat resetToDefault dipanggil', () => {
    store.workerMaxRadiusKm.set(20);
    store.workerFreeRadiusKm.set(8);
    store.workerExtraFeePerKm.set(7000);

    component.resetToDefault();

    expect(store.workerMaxRadiusKm()).toBe(5.0);
    expect(store.workerFreeRadiusKm()).toBe(3.0);
    expect(store.workerExtraFeePerKm()).toBe(3000);
    expect(store.workerLat()).toBe(-6.234129);
    expect(store.workerLng()).toBe(106.852901);
  });
});
