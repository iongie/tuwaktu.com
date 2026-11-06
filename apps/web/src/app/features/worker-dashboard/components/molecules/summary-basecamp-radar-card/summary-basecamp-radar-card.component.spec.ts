import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryBasecampRadarCardComponent } from './summary-basecamp-radar-card.component';
import { provideRouter } from '@angular/router';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SummaryBasecampRadarCardComponent', () => {
  let fixture: ComponentFixture<SummaryBasecampRadarCardComponent>;
  let component: SummaryBasecampRadarCardComponent;
  let store: WorkerDashboardStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryBasecampRadarCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkerDashboardStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryBasecampRadarCardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    fixture.detectChanges();
  });

  it('harus membuat instance SummaryBasecampRadarCardComponent', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender header Logistik Basecamp dan titik pusat radar secara dinamis', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Logistik Basecamp');
    expect(el.textContent).toContain('TITIK PUSAT: TEBET TIMUR');
  });

  it('harus merender parameter radius bebas biaya dan batas jangkauan dari store', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tebet Timur Dalam Raya No. 18');
    expect(el.textContent).toContain('0.0 - 3.0 Km (Rp 0)');
    expect(el.textContent).toContain('5.0 Km');
    expect(el.textContent).toContain('+Rp 3.000 / Km');
  });

  it('harus memperbarui tampilan alamat dan titik pusat saat data store berubah', () => {
    store.workerBasecampAddress.set('Jl. Sudirman No. 10, Jakarta Pusat');
    store.workerFreeRadiusKm.set(4.0);
    store.workerMaxRadiusKm.set(8.0);
    store.workerExtraFeePerKm.set(5000);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('TITIK PUSAT: SUDIRMAN NO. 10');
    expect(el.textContent).toContain('Jl. Sudirman No. 10, Jakarta Pusat');
    expect(el.textContent).toContain('0.0 - 4.0 Km (Rp 0)');
    expect(el.textContent).toContain('8.0 Km');
    expect(el.textContent).toContain('+Rp 5.000 / Km');
  });
});
