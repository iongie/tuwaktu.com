import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesPricingGuideComponent } from './rates-pricing-guide.component';

describe('RatesPricingGuideComponent', () => {
  let fixture: ComponentFixture<RatesPricingGuideComponent>;
  let component: RatesPricingGuideComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesPricingGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesPricingGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance panduan formula tarif', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender ketiga formula penetapan tarif', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Formula Menentukan Tarif');
    expect(el.textContent).toContain('1. Model Per Jam (Hourly)');
    expect(el.textContent).toContain('2. Model Sesi / Unit Flat');
    expect(el.textContent).toContain('3. Biaya Bahan Kimia & Peralatan');
  });
});
