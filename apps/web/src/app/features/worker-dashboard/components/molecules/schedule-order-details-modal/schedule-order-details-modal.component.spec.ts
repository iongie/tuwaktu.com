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

  it('harus menampilkan data order dinamis jika orderData di-pass sebagai input', () => {
    fixture.componentRef.setInput('orderData', {
      id: 'ord-cust-99',
      clientName: 'Siti Rahmawati',
      serviceName: 'Pembersihan AC 1 PK',
      executionTime: '10:00 - 12:00 WIB (2 Jam)',
      clientLocation: 'Kuningan Barat No. 12 (3.1 km)',
      slotBadge: 'SLOT 01 • TERKONFIRMASI',
      departureEstimate: '09:40 WIB',
      statusText: 'Dikonfirmasi Mitra',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Siti Rahmawati');
    expect(fixture.nativeElement.textContent).toContain('Pembersihan AC 1 PK');
    expect(fixture.nativeElement.textContent).toContain('Kuningan Barat No. 12 (3.1 km)');
    expect(fixture.nativeElement.textContent).toContain('09:40 WIB');
  });

  it('harus memancarkan dismissModal saat tombol tutup diklik', () => {
    const emitSpy = jest.spyOn(component.dismissModal, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('button');

    closeBtn.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
