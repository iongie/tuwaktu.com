import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryServicesDispatchCardComponent } from './summary-services-dispatch-card.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';

describe('SummaryServicesDispatchCardComponent', () => {
  let fixture: ComponentFixture<SummaryServicesDispatchCardComponent>;
  let component: SummaryServicesDispatchCardComponent;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryServicesDispatchCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryServicesDispatchCardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryServicesDispatchCardComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender daftar layanan aktif dan harganya dari store', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Layanan & Integrasi');
    const firstService = store.workerServices()[0];
    if (firstService) {
      expect(el.textContent).toContain(firstService.name);
      expect(el.textContent).toContain(`Rp ${firstService.price.toLocaleString('id-ID')}`);
    }
  });

  it('harus merender nomor jalur WhatsApp Dispatch yang aktif', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('WhatsApp Dispatch Channel');
    expect(el.textContent).toContain(store.workerWhatsAppNumber() || '+62 812-8899-2211');
    expect(el.textContent).toContain('Aktif');
  });
});
