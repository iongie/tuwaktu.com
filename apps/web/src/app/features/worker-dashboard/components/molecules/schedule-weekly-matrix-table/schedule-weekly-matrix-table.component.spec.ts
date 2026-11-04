import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleWeeklyMatrixTableComponent } from './schedule-weekly-matrix-table.component';
import { DEFAULT_WEEKLY_SCHEDULES } from '../../../services/worker-dashboard.store';

describe('ScheduleWeeklyMatrixTableComponent', () => {
  let component: ScheduleWeeklyMatrixTableComponent;
  let fixture: ComponentFixture<ScheduleWeeklyMatrixTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleWeeklyMatrixTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleWeeklyMatrixTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('schedules', DEFAULT_WEEKLY_SCHEDULES);
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleWeeklyMatrixTableComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender seluruh 7 hari kerja dalam matriks mingguan', () => {
    const dayRows = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(dayRows.length).toBe(7);
  });

  it('harus memancarkan toggleDay saat checkbox hari diklik', () => {
    const emitSpy = jest.spyOn(component.toggleDay, 'emit');
    const firstCheckbox = fixture.nativeElement.querySelector('input[type="checkbox"]');

    firstCheckbox.dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalledWith(1); // Senin
  });

  it('harus memancarkan leadTimeChange saat dropdown lead time diubah', () => {
    const emitSpy = jest.spyOn(component.leadTimeChange, 'emit');
    const select = fixture.nativeElement.querySelector('select');

    select.value = '6';
    select.dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalledWith(6);
  });
});
