import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { WorkerDashboardRatesComponent } from './worker-dashboard-rates.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';

describe('WorkerDashboardRatesComponent', () => {
  let component: WorkerDashboardRatesComponent;
  let fixture: ComponentFixture<WorkerDashboardRatesComponent>;
  let store: WorkerDashboardStore;
  let router: Router;
  let mockApiService: {
    updateWorkerRates: jest.Mock;
    createWorkerService: jest.Mock;
    updateWorkerService: jest.Mock;
    deleteWorkerService: jest.Mock;
  };

  beforeEach(async () => {
    mockApiService = {
      updateWorkerRates: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Tarif berhasil disimpan',
          data: { base_price: 90000, rate_type: 'UNIT' },
        }),
      ),
      createWorkerService: jest.fn().mockReturnValue(of({ success: true })),
      updateWorkerService: jest.fn().mockReturnValue(of({ success: true })),
      deleteWorkerService: jest.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardRatesComponent],
      providers: [
        provideRouter([{ path: '**', component: WorkerDashboardRatesComponent }]),
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardRatesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen tarif & layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus memanggil submitRatesUpdate pada store ketika form disubmit', () => {
    store.workerRecordId.set('worker-uuid-1');
    store.workerBasePrice.set(90000);
    store.setRateType('UNIT');

    component.submitRates();

    expect(mockApiService.updateWorkerRates).toHaveBeenCalledWith(
      'worker-uuid-1',
      {
        base_price: 90000,
        rate_type: 'UNIT',
      },
    );
  });

  it('harus merender judul halaman Katalog & Model Tarif Mandiri sesuai Stitch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Katalog & Model Tarif Mandiri');
    expect(el.textContent).toContain(
      'Arsitektur Pendapatan • 0% Potongan Platform',
    );
    expect(el.textContent).toContain('Simulasi Pendapatan');
    expect(el.textContent).toContain('Tambah Layanan Baru');
    expect(el.textContent).toContain('Semua Layanan Aktif');
    expect(el.textContent).toContain('Model Hourly');
    expect(el.textContent).toContain('Model Unit Sesi');
    expect(el.textContent).toContain('Terverifikasi Bebas Komisi');
  });

  it('harus membuka dan menutup modal simulasi pendapatan', () => {
    expect(component.isSimulationModalOpen()).toBe(false);
    component.openSimulationModal();
    expect(component.isSimulationModalOpen()).toBe(true);
    component.closeSimulationModal();
    expect(component.isSimulationModalOpen()).toBe(false);
  });

  it('harus bernavigasi ke halaman tambah layanan saat tombol tambah diklik', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    component.openAddNewServiceModal();
    expect(navSpy).toHaveBeenCalledWith(['/dashboard/tarif-layanan/tambah']);
  });

  it('harus bernavigasi ke halaman edit layanan saat item layanan diklik untuk diedit', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const sampleItem = store.workerServices()[0];
    component.openEditServiceModal(sampleItem);
    expect(navSpy).toHaveBeenCalledWith(['/dashboard/tarif-layanan', sampleItem.id, 'edit']);
  });
});
