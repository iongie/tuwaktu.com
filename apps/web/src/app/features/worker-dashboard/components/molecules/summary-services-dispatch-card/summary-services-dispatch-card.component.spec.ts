import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryServicesDispatchCardComponent } from './summary-services-dispatch-card.component';
import { provideRouter } from '@angular/router';

describe('SummaryServicesDispatchCardComponent', () => {
  let fixture: ComponentFixture<SummaryServicesDispatchCardComponent>;
  let component: SummaryServicesDispatchCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryServicesDispatchCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryServicesDispatchCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryServicesDispatchCardComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender daftar layanan aktif dan harganya', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Layanan & Integrasi');
    expect(el.textContent).toContain('Deep Cleaning Specialist');
    expect(el.textContent).toContain('Rp 90.000/jam');
    expect(el.textContent).toContain('General Cleaning Room');
    expect(el.textContent).toContain('Rp 80.000/jam');
  });

  it('harus merender nomor jalur WhatsApp Dispatch yang aktif', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('WhatsApp Dispatch Channel');
    expect(el.textContent).toContain('+62 812-8899-2211');
    expect(el.textContent).toContain('Aktif');
  });
});
