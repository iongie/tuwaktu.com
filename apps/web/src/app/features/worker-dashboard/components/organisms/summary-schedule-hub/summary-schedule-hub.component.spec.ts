import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryScheduleHubComponent } from './summary-schedule-hub.component';

describe('SummaryScheduleHubComponent', () => {
  let fixture: ComponentFixture<SummaryScheduleHubComponent>;
  let component: SummaryScheduleHubComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryScheduleHubComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryScheduleHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryScheduleHubComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender judul, tanggal hari ini secara dinamis, dan badge slot', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Jadwal & Status Slot Hari Ini');
    expect(el.textContent).toContain(component.todayFormattedDate());
    expect(el.textContent).toContain('0/3 Slot Terisi');
  });

  it('harus merender seluruh 5 entri timeline operasional (slot pagi, buffer 1, slot siang, buffer 2, slot sore)', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Slot Pagi Terbuka');
    expect(el.textContent).toContain('TRANSIT BUFFER • 90 MENIT');
    expect(el.textContent).toContain('Slot Siang Terbuka');
    expect(el.textContent).toContain('Slot Sore Terbuka');
  });

  it('harus dapat mengubah status kunci slot sore saat handleLockToggle dipanggil', () => {
    const slot3 = component.timelineItems().find((i) => i.id === 'slot-3');
    expect(slot3?.isLocked).toBe(false);

    if (slot3) {
      component.handleLockToggle(slot3);
    }
    fixture.detectChanges();

    const updatedSlot3 = component.timelineItems().find((i) => i.id === 'slot-3');
    expect(updatedSlot3?.isLocked).toBe(true);
    expect(updatedSlot3?.statusBadge).toBe('TERKUNCI MANDIRI');
  });
});
