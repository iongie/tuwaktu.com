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

  it('harus merender empty state saat belum ada layanan aktif di store', () => {
    store.workerServices.set([]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Layanan & Integrasi');
    expect(el.textContent).toContain('Belum ada katalog layanan aktif');
  });

  it('harus merender daftar layanan aktif dan harganya dari store saat tersedia', () => {
    store.workerServices.set([
      {
        id: 'srv-1',
        name: 'Service AC Cuci',
        description: 'Pembersihan unit indoor dan outdoor',
        price: 75000,
        base_price: 75000,
        rate_type: 'HOURLY',
        status: 'ACTIVE',
      },
    ]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Service AC Cuci');
    expect(el.textContent).toContain('Rp 75.000/jam');
  });

  it('harus merender nomor jalur WhatsApp Dispatch yang aktif atau fallback dinamis', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('WhatsApp Dispatch Channel');
    expect(el.textContent).toContain('Nomor WhatsApp Belum Diatur');

    store.workerWhatsAppNumber.set('+62 811-2233-4455');
    fixture.detectChanges();
    expect(el.textContent).toContain('+62 811-2233-4455');
  });
});
