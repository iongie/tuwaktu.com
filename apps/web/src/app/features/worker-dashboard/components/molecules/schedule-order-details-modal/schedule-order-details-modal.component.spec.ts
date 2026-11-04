import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleOrderDetailsModalComponent } from './schedule-order-details-modal.component';

describe('ScheduleOrderDetailsModalComponent', () => {
  let component: ScheduleOrderDetailsModalComponent;
  let fixture: ComponentFixture<ScheduleOrderDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleOrderDetailsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleOrderDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleOrderDetailsModalComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan rincian order Bu Ratna secara default', () => {
    expect(fixture.nativeElement.textContent).toContain('Bu Ratna K.');
    expect(fixture.nativeElement.textContent).toContain('Deep Clean Detailing');
  });

  it('harus menampilkan rincian order Pak Dimas Arya jika orderId adalah order-dimas', () => {
    fixture.componentRef.setInput('orderId', 'order-dimas');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pak Dimas Arya');
    expect(fixture.nativeElement.textContent).toContain('General Clean Living Room');
  });

  it('harus memancarkan dismissModal saat tombol tutup diklik', () => {
    const emitSpy = jest.spyOn(component.dismissModal, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('button');

    closeBtn.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
