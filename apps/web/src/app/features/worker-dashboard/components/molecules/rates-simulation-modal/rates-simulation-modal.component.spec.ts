import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesSimulationModalComponent } from './rates-simulation-modal.component';

describe('RatesSimulationModalComponent', () => {
  let fixture: ComponentFixture<RatesSimulationModalComponent>;
  let component: RatesSimulationModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesSimulationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesSimulationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance modal simulasi pendapatan', () => {
    expect(component).toBeTruthy();
  });

  it('harus menghitung perbandingan pendapatan 0% potongan Tuwaktu vs komisi platform lain', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Simulasi Pendapatan Mandiri');
    expect(el.textContent).toContain('TUWAKTU (0% POTONGAN)');
    expect(el.textContent).toContain('PLATFORM LAIN (-25%)');
  });

  it('harus memancarkan dismissModal saat tombol Tutup Simulasi diklik', () => {
    let closed = false;
    component.dismissModal.subscribe(() => {
      closed = true;
    });

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button.bg-primary');
    closeBtn.click();

    expect(closed).toBe(true);
  });

  it('harus menangani nilai input non-standar atau negatif tanpa menghasilkan NaN', () => {
    component.weeklyHours.set(-10);
    component.hourlyRate.set(-50000);
    fixture.detectChanges();

    expect(component.monthlyTuwaktuEarnings()).toBe(0);
    expect(component.formattedTuwaktuMonthly()).toContain('0');
  });
});
