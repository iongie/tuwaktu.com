import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleAddSlotModalComponent } from './schedule-add-slot-modal.component';

describe('ScheduleAddSlotModalComponent', () => {
  let component: ScheduleAddSlotModalComponent;
  let fixture: ComponentFixture<ScheduleAddSlotModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleAddSlotModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleAddSlotModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleAddSlotModalComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('TIDAK boleh memiliki input teks bebas apapun di dalam formulir modal (Anti-Hack)', () => {
    const el: HTMLElement = fixture.nativeElement;
    const textInputs = el.querySelectorAll('input[type="text"]');
    expect(textInputs.length).toBe(0);
  });

  it('harus merender 7 kartu pilihan tanggal dalam kalender mini visual mingguan', () => {
    const el: HTMLElement = fixture.nativeElement;
    const dateButtons = el.querySelectorAll('[role="radiogroup"][aria-label="Pilihan Tanggal Slot"] button');
    expect(dateButtons.length).toBe(7);
  });

  it('harus merender 5 tombol segmented jam mulai dan 4 tombol durasi', () => {
    const el: HTMLElement = fixture.nativeElement;
    const startTimeButtons = el.querySelectorAll('[role="radiogroup"][aria-label="Pilihan Jam Mulai"] button');
    expect(startTimeButtons.length).toBe(5);

    const durationButtons = el.querySelectorAll('[role="radiogroup"][aria-label="Pilihan Durasi"] button');
    expect(durationButtons.length).toBe(4);
  });

  it('harus mengkalkulasi jam selesai dan buffer stamina secara otomatis saat jam mulai dan durasi dipilih', () => {
    // Set Jam Mulai ke 19:30
    component.selectedStartTime.set('19:30');
    // Set Durasi ke 1.5 Jam (90 menit)
    component.selectedDuration.set({ label: '1.5 Jam', minutes: 90 });
    fixture.detectChanges();

    expect(component.calculatedEndTime()).toBe('21:00');
    expect(component.calculatedBufferEndTime()).toBe('22:30');

    const summaryCard: HTMLElement = fixture.nativeElement.querySelector('[data-testid="slot-summary-card"]');
    expect(summaryCard.textContent).toContain('19:30 - 21:00 WIB');
    expect(summaryCard.textContent).toContain('22:30 WIB');
  });

  it('harus memancarkan slotSaved dengan data terverifikasi dan dismissModal saat disubmit', () => {
    const saveSpy = jest.spyOn(component.slotSaved, 'emit');
    const dismissSpy = jest.spyOn(component.dismissModal, 'emit');

    // Pilih jam mulai 20:30 dan durasi 2 Jam
    component.selectedStartTime.set('20:30');
    component.selectedDuration.set({ label: '2 Jam', minutes: 120 });
    fixture.detectChanges();

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        start: '20:30',
        end: '22:30',
        durationMinutes: 120,
      })
    );
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('harus memancarkan dismissModal saat tombol Tutup diklik', () => {
    const dismissSpy = jest.spyOn(component.dismissModal, 'emit');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Tutup Tambah Slot"]');
    expect(closeBtn).toBeTruthy();

    closeBtn.click();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
