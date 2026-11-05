import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeSimulatorSectionComponent } from './home-simulator-section.component';

describe('HomeSimulatorSectionComponent', () => {
  let component: HomeSimulatorSectionComponent;
  let fixture: ComponentFixture<HomeSimulatorSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSimulatorSectionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSimulatorSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen dengan omzet awal default 8.000.000', () => {
    expect(component).toBeTruthy();
    expect(component.omzetInput()).toBe(8000000);
    expect(component.formattedOmzet()).toContain('8.000.000');
  });

  it('harus menghitung potongan komisi 25% aplikasi konvensional secara reaktif', () => {
    // 25% dari 8.000.000 = 2.000.000
    expect(component.gigAppCommission()).toBe(2000000);
    expect(component.monthlySavings()).toBe(2000000);
    expect(component.annualSavings()).toBe(24000000);

    const el: HTMLElement = fixture.nativeElement;
    const gigCommissionEl = el.querySelector('#gigCommissionDisplay');
    expect(gigCommissionEl?.textContent).toContain('2.000.000');

    const monthlySavingsEl = el.querySelector('#monthlySavingsDisplay');
    expect(monthlySavingsEl?.textContent).toContain('2.000.000');
  });

  it('harus memperbarui perhitungan saat nilai slider omzet diubah', () => {
    component.onOmzetChange(12000000);
    fixture.detectChanges();

    expect(component.omzetInput()).toBe(12000000);
    // 25% dari 12.000.000 = 3.000.000
    expect(component.gigAppCommission()).toBe(3000000);
    expect(component.annualSavings()).toBe(36000000);

    expect(component.formattedMonthlySavings()).toContain('3.000.000');
    expect(component.formattedAnnualSavings()).toContain('36.000.000');
  });

  it('harus menyertakan tombol daftar gratis 0% yang mengarah ke /register', () => {
    const registerBtn: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[routerLink="/register"]'
    );
    expect(registerBtn).toBeTruthy();
    expect(registerBtn.textContent).toContain('Daftar Sebagai Pekerja Mandiri');
  });
});
