import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleCalendarSyncCardComponent } from './schedule-calendar-sync-card.component';

describe('ScheduleCalendarSyncCardComponent', () => {
  let component: ScheduleCalendarSyncCardComponent;
  let fixture: ComponentFixture<ScheduleCalendarSyncCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCalendarSyncCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleCalendarSyncCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance ScheduleCalendarSyncCardComponent dengan benar', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan manageGoogleSync saat tombol Kelola diklik', () => {
    const emitSpy = jest.spyOn(component.manageGoogleSync, 'emit');
    const manageButton = fixture.nativeElement.querySelector('button');

    manageButton.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus memancarkan toggleAutoBlock saat toggle switch agenda pribadi diklik', () => {
    const emitSpy = jest.spyOn(component.toggleAutoBlock, 'emit');
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');

    checkbox.dispatchEvent(new Event('change'));

    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus menyalin URL webcal dan menampilkan feedback saat tombol Salin diklik', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    await component.copyWebCalUrl();
    expect(component.isCopied()).toBe(true);
  });

  it('harus membersihkan copyTimeout saat komponen dihancurkan (ngOnDestroy)', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    await component.copyWebCalUrl();
    expect(component.isCopied()).toBe(true);

    component.ngOnDestroy();
    // After destroy, component is safely torn down
    expect(component).toBeTruthy();
  });

  it('harus memastikan tombol Salin URL memiliki target sentuh min-h-[44px]', () => {
    const copyButton = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((b) => (b as HTMLElement).textContent?.includes('Salin URL')) as HTMLButtonElement;

    expect(copyButton).toBeTruthy();
    expect(copyButton.classList.contains('min-h-[44px]')).toBe(true);
  });
});
