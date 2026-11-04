import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogisticsSimulatorTerminalComponent } from './logistics-simulator-terminal.component';

describe('LogisticsSimulatorTerminalComponent', () => {
  let component: LogisticsSimulatorTerminalComponent;
  let fixture: ComponentFixture<LogisticsSimulatorTerminalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticsSimulatorTerminalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticsSimulatorTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen simulator terminal', () => {
    expect(component).toBeTruthy();
  });

  it('harus menghitung biaya bebas ongkir pada zona gratis (<= 3 km)', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.componentRef.setInput('extraFeePerKm', 3000);
    component.simulatedDistanceKm.set(2.0);
    fixture.detectChanges();

    expect(component.isFreeZone()).toBe(true);
    expect(component.isRejected()).toBe(false);
    expect(component.billableKm()).toBe(0);
    expect(component.extraFeeTotal()).toBe(0);
    expect(component.statusBadgeText()).toBe('BEBAS ONGKOS BENSIN');
  });

  it('harus menghitung surcharge dengan benar pada zona tambahan (antara free dan max)', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.componentRef.setInput('extraFeePerKm', 3000);
    component.simulatedDistanceKm.set(4.2);
    fixture.detectChanges();

    expect(component.isFreeZone()).toBe(false);
    expect(component.isRejected()).toBe(false);
    expect(component.billableKm()).toBe(1.2);
    expect(component.extraFeeTotal()).toBe(3600);
    expect(component.statusBadgeText()).toBe('DISETUJUI DENGAN SURCHARGE');
  });

  it('harus memblokir pesanan di luar batas maksimal (> max)', () => {
    fixture.componentRef.setInput('freeRadiusKm', 3.0);
    fixture.componentRef.setInput('maxRadiusKm', 5.0);
    fixture.componentRef.setInput('extraFeePerKm', 3000);
    component.simulatedDistanceKm.set(6.5);
    fixture.detectChanges();

    expect(component.isRejected()).toBe(true);
    expect(component.statusBadgeText()).toBe('PESANAN DITOLAK (LUAR RADIUS)');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ditolak Otomatis');
  });

  it('harus mengubah jarak simulasi saat preset dipilih', () => {
    component.onPresetChanged('1.8|Jl. Tebet Barat Dalam VI');
    expect(component.simulatedDistanceKm()).toBe(1.8);
    expect(component.simulatedAddress()).toBe('Jl. Tebet Barat Dalam VI');
  });
});
