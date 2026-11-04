import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogisticsManifestoCardComponent } from './logistics-manifesto-card.component';

describe('LogisticsManifestoCardComponent', () => {
  let component: LogisticsManifestoCardComponent;
  let fixture: ComponentFixture<LogisticsManifestoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticsManifestoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticsManifestoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen manifesto logistik', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender batasan radius maksimal dalam narasi manifesto', () => {
    fixture.componentRef.setInput('maxRadiusKm', 7.5);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('7.5 km');
    expect(compiled.textContent).toContain('Proteksi Stamina & Akurasi Waktu');
    expect(compiled.textContent).toContain('DOKTRIN KERJA MANDIRI');
    expect(compiled.textContent).toContain('Nol Debat Ongkir');
    expect(compiled.textContent).toContain('Tiba Tepat Waktu');
  });
});
