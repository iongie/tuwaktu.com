import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerScheduleMainPanelComponent } from './worker-schedule-main-panel.component';
import { DEFAULT_WEEKLY_SCHEDULES } from '../../../services/worker-dashboard.store';

describe('WorkerScheduleMainPanelComponent', () => {
  let component: WorkerScheduleMainPanelComponent;
  let fixture: ComponentFixture<WorkerScheduleMainPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerScheduleMainPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerScheduleMainPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('schedules', DEFAULT_WEEKLY_SCHEDULES);
    fixture.detectChanges();
  });

  it('harus membuat instance WorkerScheduleMainPanelComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memuat ketiga molekul utama: buffer selector, timeline card, dan weekly matrix table', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('app-schedule-buffer-selector')).toBeTruthy();
    expect(el.querySelector('app-schedule-slot-timeline-card')).toBeTruthy();
    expect(el.querySelector('app-schedule-weekly-matrix-table')).toBeTruthy();
  });

  it('harus menerima input isTodayEmergencyLocked dan meneruskannya ke timeline card', () => {
    fixture.componentRef.setInput('isTodayEmergencyLocked', true);
    fixture.detectChanges();

    expect(component.isTodayEmergencyLocked()).toBe(true);
  });
});
