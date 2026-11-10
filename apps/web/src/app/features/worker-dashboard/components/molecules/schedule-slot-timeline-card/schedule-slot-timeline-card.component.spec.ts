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

  it('harus merender kalender grid bulanan dengan nama bulan dan navigasi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Kalender Kerja & Ketersediaan Slot');
    expect(component.calendarDays().length).toBeGreaterThanOrEqual(28);

    const prevMonthBtn = el.querySelector('button[aria-label="Bulan Sebelumnya"]') as HTMLButtonElement;
    const nextMonthBtn = el.querySelector('button[aria-label="Bulan Berikutnya"]') as HTMLButtonElement;
    expect(prevMonthBtn).toBeTruthy();
    expect(nextMonthBtn).toBeTruthy();
  });

  it('harus dapat bernavigasi ke bulan sebelumnya dan bulan berikutnya', () => {
    const initialMonth = component.calendarViewDate().getMonth();

    component.nextMonth();
    expect(component.calendarViewDate().getMonth()).toBe((initialMonth + 1) % 12);

    component.previousMonth();
    expect(component.calendarViewDate().getMonth()).toBe(initialMonth);

    component.goToToday();
    const today = new Date();
    expect(component.calendarViewDate().getMonth()).toBe(today.getMonth());
  });

  it('harus memancarkan toggleHoliday saat tombol Tandai Libur Tanggal Ini ditekan', () => {
    const holidaySpy = jest.spyOn(component.toggleHoliday, 'emit');
    const toggleBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toggle-date-holiday-btn"]');
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    expect(holidaySpy).toHaveBeenCalledWith(component.selectedIsoDate());
  });

  it('harus menampilkan status hari libur saat tanggal ada di input specialHolidays', () => {
    const currentIso = component.selectedIsoDate();
    fixture.componentRef.setInput('specialHolidays', [currentIso]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Hari Libur Terjadwal');
    expect(el.textContent).toContain('Buka Operasional Tanggal Ini');
  });

  it('harus menyediakan tombol kunci mandiri untuk Slot 1, Slot 2, dan Slot 3', () => {
    const lockSpy = jest.spyOn(component.toggleSlotLock, 'emit');

    const slot1Btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toggle-slot-1-btn"]');
    const slot2Btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toggle-slot-2-btn"]');
    const slot3Btn: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="toggle-slot-3-btn"]');

    expect(slot1Btn).toBeTruthy();
    expect(slot2Btn).toBeTruthy();
    expect(slot3Btn).toBeTruthy();

    slot1Btn.click();
    expect(lockSpy).toHaveBeenCalledWith('slot-01');

    slot2Btn.click();
    expect(lockSpy).toHaveBeenCalledWith('slot-02');

    slot3Btn.click();
    expect(lockSpy).toHaveBeenCalledWith('slot-03');
  });

  it('harus menampilkan status ditutup sementara saat isSlot1Locked bernilai true', () => {
    fixture.componentRef.setInput('isSlot1Locked', true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Slot Pagi Ditutup dari Pemesanan Publik');
    expect(el.textContent).toContain('1 dari 3 Slot Terkunci');
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
      fixture.nativeElement.querySelectorAll('button'),
    ).filter((btn) => (btn as HTMLElement).textContent?.includes('Rincian Order')) as HTMLButtonElement[];

    expect(orderDetailButtons.length).toBeGreaterThan(0);
    orderDetailButtons[0].click();

    expect(emitSpy).toHaveBeenCalledWith('order-ratna');
  });

  it('harus memancarkan addCustomSlot saat tombol tambah slot khusus ditekan', () => {
    const emitSpy = jest.spyOn(component.addCustomSlot, 'emit');
    const addSlotButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((btn) => (btn as HTMLElement).textContent?.includes('Tambah Slot Khusus')) as HTMLButtonElement;

    expect(addSlotButton).toBeTruthy();
    addSlotButton.click();

    expect(emitSpy).toHaveBeenCalled();
  });
});
