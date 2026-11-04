import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesManifestoCardComponent } from './rates-manifesto-card.component';

describe('RatesManifestoCardComponent', () => {
  let fixture: ComponentFixture<RatesManifestoCardComponent>;
  let component: RatesManifestoCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesManifestoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesManifestoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance manifesto card', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender teks prinsip kedaulatan 100% milik Anda', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('PRINSIP TUWAKTU');
    expect(el.textContent).toContain('100% Tarif Milik Anda. Nol Potongan Komisi.');
    expect(el.textContent).toContain('Transparansi Finansial Mutlak');
  });
});
