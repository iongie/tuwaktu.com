import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleSlotTimelineCardComponent } from './schedule-slot-timeline-card.component';

describe('ScheduleSlotTimelineCardComponent', () => {
  let component: ScheduleSlotTimelineCardComponent;
  let fixture: ComponentFixture<ScheduleSlotTimelineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleSlotTimelineCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleSlotTimelineCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleSlotTimelineCardComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan segmentChange saat tab filter tanggal diklik', () => {
    const emitSpy = jest.spyOn(component.segmentChange, 'emit');
    const segmentButtons = fixture.nativeElement.querySelectorAll('button');

    // Button 0 is 'Hari Ini'
    segmentButtons[0].click();

    expect(emitSpy).toHaveBeenCalledWith('Hari Ini');
  });

  it('harus memancarkan viewOrderDetails saat tombol rincian order ditekan', () => {
    const emitSpy = jest.spyOn(component.viewOrderDetails, 'emit');
    fixture.componentRef.setInput('bookings', [
      {
        id: 'bk-1',
        slotNumber: '01',
        clientName: 'Bu Ratna K.',
        serviceName: 'Deep Clean Detailing',
        timeRange: '08:30 - 11:30 WIB',
        durationText: 'Durasi 3 Jam',
        clientLocation: 'Tebet Barat Dalam VII (6.2 km)',
        statusText: 'Dipesan via WhatsApp Terverifikasi',
        statusBadge: 'TERKONFIRMASI / SIAP JALAN',
        orderId: 'order-ratna',
      },
    ]);
    fixture.detectChanges();

    const orderDetailButtons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).filter((btn) => (btn as HTMLElement).textContent?.includes('Rincian Order')) as HTMLButtonElement[];

    expect(orderDetailButtons.length).toBeGreaterThan(0);
    orderDetailButtons[0].click();

    expect(emitSpy).toHaveBeenCalledWith('order-ratna');
  });

  it('harus memancarkan toggleSlotLock saat tombol kunci slot ditekan', () => {
    const emitSpy = jest.spyOn(component.toggleSlotLock, 'emit');
    const lockButton = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((btn) => (btn as HTMLElement).textContent?.includes('Kunci Slot Ini')) as HTMLButtonElement;

    expect(lockButton).toBeTruthy();
    lockButton.click();

    expect(emitSpy).toHaveBeenCalledWith('slot-03');
  });

  it('harus memancarkan addCustomSlot saat tombol tambah slot khusus ditekan', () => {
    const emitSpy = jest.spyOn(component.addCustomSlot, 'emit');
    const addSlotButton = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((btn) => (btn as HTMLElement).textContent?.includes('Tambah Slot Khusus')) as HTMLButtonElement;

    expect(addSlotButton).toBeTruthy();
    addSlotButton.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus menampilkan kartu hari istirahat mandiri saat segmen Minggu (Libur) aktif', () => {
    fixture.componentRef.setInput('selectedSegment', 'Minggu (Libur)');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Hari Istirahat Mandiri Terjadwal');
    expect(el.textContent).toContain('Kapasitas Slot Minggu:');
    expect(el.textContent).toContain('0% Kapasitas • Tidak Menerima Pemesanan Publik');
  });

  it('harus menampilkan peringatan darurat saat segmen Hari Ini aktif dengan status emergency lock', () => {
    fixture.componentRef.setInput('selectedSegment', 'Hari Ini');
    fixture.componentRef.setInput('isTodayEmergencyLocked', true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Status Darurat Aktif: Semua Slot Hari Ini Terkunci');
    expect(el.textContent).toContain('Terkunci Sementara (Darurat)');
  });

  it('harus menampilkan durasi buffer transit sesuai input bufferMinutes', () => {
    fixture.componentRef.setInput('bufferMinutes', 60);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('11:30 - 13:00 WIB (60 Menit)');
    expect(el.textContent).toContain('16:00 - 17:30 WIB (60 Menit)');
  });

  it('harus memastikan seluruh tombol filter segmen tanggal memiliki target sentuh min-h-[44px]', () => {
    const segmentButtons = fixture.nativeElement.querySelectorAll('button');
    const dateButtons = Array.from(segmentButtons).slice(0, 4) as HTMLButtonElement[];

    for (const btn of dateButtons) {
      expect(btn.classList.contains('min-h-[44px]')).toBe(true);
    }
  });
});
