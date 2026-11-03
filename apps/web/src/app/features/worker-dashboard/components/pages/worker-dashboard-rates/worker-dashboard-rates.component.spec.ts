import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardRatesComponent } from './worker-dashboard-rates.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardRatesComponent', () => {
  let component: WorkerDashboardRatesComponent;
  let fixture: ComponentFixture<WorkerDashboardRatesComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    updateWorkerRates: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerRates: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Tarif berhasil disimpan',
          data: { base_price: 90000, rate_type: 'UNIT' },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardRatesComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardRatesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen tarif & layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus memanggil submitRatesUpdate pada store ketika form disubmit', () => {
    store.workerRecordId.set('worker-uuid-1');
    store.workerBasePrice.set(90000);
    store.setRateType('UNIT');

    component.submitRates();

    expect(mockApiService.updateWorkerRates).toHaveBeenCalledWith('worker-uuid-1', {
      base_price: 90000,
      rate_type: 'UNIT',
    });
  });
});

