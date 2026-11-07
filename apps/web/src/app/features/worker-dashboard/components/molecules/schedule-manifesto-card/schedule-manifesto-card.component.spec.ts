import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleManifestoCardComponent } from './schedule-manifesto-card.component';

describe('ScheduleManifestoCardComponent', () => {
  let component: ScheduleManifestoCardComponent;
  let fixture: ComponentFixture<ScheduleManifestoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleManifestoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleManifestoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleManifestoCardComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan prinsip penjadwalan mandiri pekerja', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('PRINSIP PENJADWALAN TUWAKTU');
    expect(textContent).toContain('Pengaturan Jam Kerja & Buffer Perjalanan');
    expect(textContent).toContain('Bukan Karyawan Algoritma');
  });
});
