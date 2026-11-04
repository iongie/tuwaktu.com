import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummarySlotTimelineItemComponent } from './summary-slot-timeline-item.component';

describe('SummarySlotTimelineItemComponent', () => {
  let fixture: ComponentFixture<SummarySlotTimelineItemComponent>;
  let component: SummarySlotTimelineItemComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummarySlotTimelineItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummarySlotTimelineItemComponent);
    component = fixture.componentInstance;
  });

  it('harus merender item transit buffer dengan benar', () => {
    component.item = {
      id: 'buf-1',
      type: 'buffer',
      timeRange: '11:30 - 13:00',
      title: 'TRANSIT BUFFER • 90 MENIT',
      description: 'Otomatis Terkunci & Sterilisasi Alat',
      actionType: 'none',
    };
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TRANSIT BUFFER • 90 MENIT');
    expect(el.textContent).toContain('Otomatis Terkunci & Sterilisasi Alat');
    expect(el.textContent).toContain('11:30 - 13:00');
  });

  it('harus merender slot reguler dan tautan Chat Klien', () => {
    component.item = {
      id: 'slot-1',
      type: 'slot',
      timeRange: '08:30 - 11:30',
      title: 'Bu Ratna K.',
      service: 'Deep Clean (3 Jam)',
      location: 'Tebet Barat VII No. 12 (1.8 km dari Basecamp)',
      payment: 'Rp 280.000 • Diterima via Tunai/QRIS',
      statusBadge: 'SELESAI',
      statusVariant: 'completed',
      chatUrl: 'https://wa.me/6281288992211',
      actionType: 'chat',
    };
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bu Ratna K.');
    expect(el.textContent).toContain('Deep Clean (3 Jam)');
    expect(el.textContent).toContain('SELESAI');
    expect(el.textContent).toContain('Chat Klien');
  });

  it('harus memancarkan event lockSlot saat tombol kunci ditekan', () => {
    const emitSpy = jest.spyOn(component.lockSlot, 'emit');
    component.item = {
      id: 'slot-3',
      type: 'slot',
      timeRange: '17:00 - 20:00',
      title: 'Slot Sore Terbuka',
      description: 'Jendela kerja: 17:00 - 20:00 (Maks 3.0 Jam Durasi)',
      statusBadge: 'SIAP DIPESAN',
      statusVariant: 'available',
      actionType: 'lock',
      isLocked: false,
    };
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    button.click();
    expect(emitSpy).toHaveBeenCalledWith(component.item);
  });
});
