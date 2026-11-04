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

  it('harus merender judul, tanggal hari ini, dan badge 2/3 Slot Terisi', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Jadwal & Status Slot Hari Ini');
    expect(el.textContent).toContain('Kamis, 24 Oktober 2024 • Otomatis Terkunci Buffer');
    expect(el.textContent).toContain('2/3 Slot Terisi');
  });

  it('harus merender seluruh 5 entri timeline (slot 1, buffer 1, slot 2, buffer 2, slot 3)', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Bu Ratna K.');
    expect(el.textContent).toContain('TRANSIT BUFFER • 90 MENIT');
    expect(el.textContent).toContain('Pak Dimas Arya');
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
