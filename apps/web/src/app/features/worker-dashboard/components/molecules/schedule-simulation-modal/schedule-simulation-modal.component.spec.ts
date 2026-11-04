import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleSimulationModalComponent } from './schedule-simulation-modal.component';

describe('ScheduleSimulationModalComponent', () => {
  let component: ScheduleSimulationModalComponent;
  let fixture: ComponentFixture<ScheduleSimulationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleSimulationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleSimulationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleSimulationModalComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan dismissModal saat tombol tutup diklik', () => {
    const emitSpy = jest.spyOn(component.dismissModal, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('button');

    closeBtn.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
