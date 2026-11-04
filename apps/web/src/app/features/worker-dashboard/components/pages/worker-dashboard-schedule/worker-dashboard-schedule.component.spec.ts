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
    expect(component.isSaveScheduleSuccess()).toBe(true);
  });

  it('harus mengubah emergency lock saat toggleEmergencyLock dipanggil', () => {
    expect(store.isTodayEmergencyLocked()).toBe(false);

    component.toggleEmergencyLock();
    expect(store.isTodayEmergencyLocked()).toBe(true);
    expect(store.scheduleFeedbackSuccess()).toContain('Semua slot untuk hari ini telah ditutup sementara');

    component.toggleEmergencyLock();
    expect(store.isTodayEmergencyLocked()).toBe(false);
    expect(store.scheduleFeedbackSuccess()).toContain('Slot hari ini dibuka kembali');
  });

  it('harus membuka modal simulasi kalender publik', () => {
    expect(component.isSimulationModalOpen()).toBe(false);

    component.openSimulationModal();
    expect(component.isSimulationModalOpen()).toBe(true);
  });

  it('harus membuka modal tambah slot tambahan', () => {
    expect(component.isAddSlotModalOpen()).toBe(false);

    component.openAddSlotModal();
    expect(component.isAddSlotModalOpen()).toBe(true);
  });

  it('harus membuka modal rincian pesanan saat openOrderDetailsModal dipanggil', () => {
    expect(component.selectedOrderIdForModal()).toBeNull();

    component.openOrderDetailsModal('order-dimas');
    expect(component.selectedOrderIdForModal()).toBe('order-dimas');
  });

  it('harus mengubah ketersediaan hari saat toggleDay dipanggil', () => {
    const monday = store.workerSchedules().find((s) => s.day_of_week === 1);
    expect(monday?.is_active).toBe(true);

    component.toggleDay(1);
    const updatedMonday = store.workerSchedules().find((s) => s.day_of_week === 1);
    expect(updatedMonday?.is_active).toBe(false);
  });

  it('harus memiliki id emergencyLockBtn pada tombol penguncian darurat', () => {
    const emergencyBtn = fixture.nativeElement.querySelector('#emergencyLockBtn');
    expect(emergencyBtn).toBeTruthy();
  });

  it('harus menampilkan estimasi transit aman secara dinamis berdasarkan store.transitBufferMinutes', () => {
    store.transitBufferMinutes.set(120);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('120 Menit / Trip');
  });

  it('harus menampilkan pesan feedback sukses saat handleSlotSaved dipanggil', () => {
    component.handleSlotSaved({
      date: 'Besok (25 Okt)',
      start: '20:00',
      end: '22:30',
    });

    expect(store.scheduleFeedbackSuccess()).toContain('Slot tambahan untuk Besok (25 Okt)');
  });
});
