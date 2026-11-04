import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleBufferSelectorComponent } from './schedule-buffer-selector.component';

describe('ScheduleBufferSelectorComponent', () => {
  let component: ScheduleBufferSelectorComponent;
  let fixture: ComponentFixture<ScheduleBufferSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleBufferSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleBufferSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleBufferSelectorComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan bufferMinutesChange saat opsi durasi dipilih', () => {
    const emitSpy = jest.spyOn(component.bufferMinutesChange, 'emit');
    const radioInputs = fixture.nativeElement.querySelectorAll('input[type="radio"]');

    expect(radioInputs.length).toBe(3);
    radioInputs[0].dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalledWith(60);
  });

  it('harus memancarkan togglePeakHour saat switch jam sibuk diubah', () => {
    const emitSpy = jest.spyOn(component.togglePeakHour, 'emit');
    const checkboxInputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');

    expect(checkboxInputs.length).toBe(2);
    checkboxInputs[0].dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus memancarkan toggleLunchBreak saat switch jeda makan siang diubah', () => {
    const emitSpy = jest.spyOn(component.toggleLunchBreak, 'emit');
    const checkboxInputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');

    checkboxInputs[1].dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalled();
  });
});
