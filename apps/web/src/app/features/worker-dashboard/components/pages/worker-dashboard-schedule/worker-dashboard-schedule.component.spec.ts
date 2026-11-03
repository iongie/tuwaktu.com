import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardScheduleComponent } from './worker-dashboard-schedule.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardScheduleComponent', () => {
  let component: WorkerDashboardScheduleComponent;
  let fixture: ComponentFixture<WorkerDashboardScheduleComponent>;
  let store: WorkerDashboardStore;
  let mockApiService: {
    updateWorkerSchedules: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerSchedules: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Jadwal berhasil disimpan',
          data: [],
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardScheduleComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardScheduleComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen kalender kerja', () => {
    expect(component).toBeTruthy();
  });

  it('harus memanggil submitScheduleUpdate saat tombol submit jadwal ditekan', () => {
    store.workerRecordId.set('worker-uuid-1');
    store.workerSchedules.set(store.createDefaultWeeklySchedule());

    component.submitSchedule();

    expect(mockApiService.updateWorkerSchedules).toHaveBeenCalledWith(
      'worker-uuid-1',
      expect.any(Array)
    );
  });
});

