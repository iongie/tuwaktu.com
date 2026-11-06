import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummarySlotTrackBarComponent } from './summary-slot-track-bar.component';

describe('SummarySlotTrackBarComponent', () => {
  let fixture: ComponentFixture<SummarySlotTrackBarComponent>;
  let component: SummarySlotTrackBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummarySlotTrackBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummarySlotTrackBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat komponen track bar', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender bar multi-segment dan teks legenda', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Distribusi Waktu Kerja Harian');
    expect(el.textContent).toContain('08:30 Pagi (Buka)');
    expect(el.textContent).toContain('Buffer 90m');
    expect(el.textContent).toContain('13:00 Siang (Buka)');
    expect(el.textContent).toContain('17:00 Sore (Buka)');
  });
});
