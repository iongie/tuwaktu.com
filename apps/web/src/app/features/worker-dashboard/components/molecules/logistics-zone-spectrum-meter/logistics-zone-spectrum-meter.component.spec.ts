import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogisticsZoneSpectrumMeterComponent } from './logistics-zone-spectrum-meter.component';

describe('LogisticsZoneSpectrumMeterComponent', () => {
  let component: LogisticsZoneSpectrumMeterComponent;
  let fixture: ComponentFixture<LogisticsZoneSpectrumMeterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticsZoneSpectrumMeterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticsZoneSpectrumMeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen spectrum meter', () => {
    expect(component).toBeTruthy();
  });

  it('harus menghitung proporsi meter bar sesuai batasan radius', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.componentRef.setInput('extraFeePerKm', 3000);
    fixture.detectChanges();

    expect(component.pctFree()).toBeGreaterThan(0);
    expect(component.pctPaid()).toBeGreaterThan(0);
    expect(component.pctReject()).toBeGreaterThan(0);
    expect(component.pctFree() + component.pctPaid() + component.pctReject()).toBe(100);
  });

  it('harus merender teks zona dan tarif secara akurat', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.componentRef.setInput('extraFeePerKm', 3000);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Zona 1 (0.0 - 3.0 Km)');
    expect(compiled.textContent).toContain('Zona 2 (3.0 - 5.0 Km)');
    expect(compiled.textContent).toContain('Zona 3 (> 5.0 Km)');
    expect(compiled.textContent).toContain('Rp 0');
    expect(compiled.textContent).toContain('+Rp 3.000/km');
    expect(compiled.textContent).toContain('Ditolak Otomatis');
  });
});
