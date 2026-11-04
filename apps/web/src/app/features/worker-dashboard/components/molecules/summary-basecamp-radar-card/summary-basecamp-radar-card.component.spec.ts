import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryBasecampRadarCardComponent } from './summary-basecamp-radar-card.component';
import { provideRouter } from '@angular/router';

describe('SummaryBasecampRadarCardComponent', () => {
  let fixture: ComponentFixture<SummaryBasecampRadarCardComponent>;
  let component: SummaryBasecampRadarCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryBasecampRadarCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryBasecampRadarCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryBasecampRadarCardComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender header Logistik Basecamp dan titik pusat radar Tebet Timur', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Logistik Basecamp');
    expect(el.textContent).toContain('TITIK PUSAT: TEBET TIMUR');
  });

  it('harus merender parameter radius bebas biaya dan batas jangkauan', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tebet Timur Dalam Raya No. 18');
    expect(el.textContent).toContain('0.0 - 3.0 Km (Rp 0)');
    expect(el.textContent).toContain('5.0 Km');
    expect(el.textContent).toContain('+Rp 3.000 / Km');
  });
});
