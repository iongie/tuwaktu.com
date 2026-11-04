import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryLogisticsServicesHubComponent } from './summary-logistics-services-hub.component';
import { provideRouter } from '@angular/router';

describe('SummaryLogisticsServicesHubComponent', () => {
  let fixture: ComponentFixture<SummaryLogisticsServicesHubComponent>;
  let component: SummaryLogisticsServicesHubComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryLogisticsServicesHubComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryLogisticsServicesHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryLogisticsServicesHubComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender kartu logistik basecamp dan kartu layanan dispatch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Logistik Basecamp');
    expect(el.textContent).toContain('Layanan & Integrasi');
    expect(el.textContent).toContain('WhatsApp Dispatch Channel');
  });
});
