import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchedulePublicPreviewCardComponent } from './schedule-public-preview-card.component';

describe('SchedulePublicPreviewCardComponent', () => {
  let component: SchedulePublicPreviewCardComponent;
  let fixture: ComponentFixture<SchedulePublicPreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePublicPreviewCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePublicPreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SchedulePublicPreviewCardComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan openPublicSimulation saat tombol Cek Tautan diklik', () => {
    const emitSpy = jest.spyOn(component.openPublicSimulation, 'emit');
    const cekTautanBtn = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((b) => (b as HTMLElement).textContent?.includes('Cek Tautan')) as HTMLButtonElement;

    expect(cekTautanBtn).toBeTruthy();
    cekTautanBtn.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus menampilkan nama pekerja yang diberikan melalui input', () => {
    fixture.componentRef.setInput('workerName', 'Budi Santoso');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Budi Santoso');
  });

  it('harus memperbarui pratinjau slot 3 menjadi terkunci saat isSlot3Locked bernilai true', () => {
    fixture.componentRef.setInput('isSlot3Locked', true);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TERKUNCI');
    expect(el.textContent).toContain('Semua Slot Besok Penuh / Terkunci');
  });
});
