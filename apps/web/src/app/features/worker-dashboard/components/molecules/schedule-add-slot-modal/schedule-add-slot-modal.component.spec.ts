import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleAddSlotModalComponent } from './schedule-add-slot-modal.component';

describe('ScheduleAddSlotModalComponent', () => {
  let component: ScheduleAddSlotModalComponent;
  let fixture: ComponentFixture<ScheduleAddSlotModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleAddSlotModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleAddSlotModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleAddSlotModalComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan slotSaved dan dismissModal saat form disubmit', () => {
    const saveSpy = jest.spyOn(component.slotSaved, 'emit');
    const dismissSpy = jest.spyOn(component.dismissModal, 'emit');

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith({
      date: 'Besok (25 Okt)',
      start: '20:00',
      end: '22:30',
    });
    expect(dismissSpy).toHaveBeenCalled();
  });
});
