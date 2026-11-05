import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkerDashboardRatesComponent } from './worker-dashboard-rates.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { WorkerDashboardApiService } from '../../../services/worker-dashboard-api.service';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

describe('WorkerDashboardRatesComponent', () => {
  let component: WorkerDashboardRatesComponent;
  let fixture: ComponentFixture<WorkerDashboardRatesComponent>;
  let store: WorkerDashboardStore;
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
        })
      ),
      createWorkerService: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Layanan baru berhasil ditambahkan ke katalog',
          data: {
            id: 'custom-1',
            worker_id: 'worker-uuid-1',
            name: 'Pembersihan Kaca Jendela',
            price: 85000,
            duration_minutes: 60,
            is_active: true,
          },
        })
      ),
      updateWorkerService: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Paket layanan berhasil diperbarui',
          data: {
            id: 'custom-1',
            worker_id: 'worker-uuid-1',
            name: 'Pembersihan Kaca Jendela',
            price: 95000,
            duration_minutes: 60,
            is_active: true,
          },
        })
      ),
      deleteWorkerService: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'Paket layanan berhasil dinonaktifkan dari katalog',
          data: null,
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerDashboardRatesComponent],
      providers: [
        {
          provide: WorkerDashboardApiService,
          useValue: mockApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardRatesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkerDashboardStore);
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

    expect(mockApiService.updateWorkerRates).toHaveBeenCalledWith('worker-uuid-1', {
      base_price: 90000,
      rate_type: 'UNIT',
    });
  });

  it('harus merender judul halaman Katalog & Model Tarif Mandiri sesuai Stitch', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Katalog & Model Tarif Mandiri');
    expect(el.textContent).toContain('Arsitektur Pendapatan • 0% Potongan Platform');
    expect(el.textContent).toContain('Simulasi Pendapatan');
    expect(el.textContent).toContain('+ Tambah Layanan Baru');
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

  it('harus membuka modal tambah layanan baru', () => {
    expect(component.isEditModalOpen()).toBe(false);
    component.openAddNewServiceModal();
    expect(component.isEditModalOpen()).toBe(true);
    expect(component.selectedServiceToEdit()).toBeNull();
  });

  it('harus menyimpan layanan baru dan menutup modal edit', () => {
    store.workerRecordId.set('worker-uuid-1');
    const newService: WorkerServiceCatalogItem = {
      id: 'custom-1',
      code: 'CUS-01',
      name: 'Pembersihan Kaca Jendela',
      description: 'Pembersihan kaca gedung dan rumah lantai dua',
      price: 85000,
      base_price: 85000,
      rate_type: 'HOURLY',
      duration_minutes: 60,
      status: 'ACTIVE',
      is_public: true,
    };

    component.openAddNewServiceModal();
    component.handleServiceSaved(newService);

    expect(component.isEditModalOpen()).toBe(false);
    expect(mockApiService.createWorkerService).toHaveBeenCalled();
    expect(store.workerServices().some((s) => s.name === 'Pembersihan Kaca Jendela')).toBe(true);
  });

  it('harus memperbarui layanan yang ada saat modal edit disimpan', () => {
    store.workerRecordId.set('worker-uuid-1');
    const existing = store.workerServices()[0];
    component.openEditServiceModal(existing);

    component.handleServiceSaved({
      ...existing,
      name: 'Deep Clean Detailing Updated',
      price: 70000,
    });

    expect(component.isEditModalOpen()).toBe(false);
    expect(mockApiService.updateWorkerService).toHaveBeenCalledWith(
      'worker-uuid-1',
      existing.id,
      expect.objectContaining({
        name: 'Deep Clean Detailing Updated',
        price: 70000,
      })
    );
  });

  it('harus menghapus layanan dan menutup modal saat handleServiceDeleted dipanggil', () => {
    store.workerRecordId.set('worker-uuid-1');
    const existing = store.workerServices()[0];
    component.openEditServiceModal(existing);

    component.handleServiceDeleted(existing.id);

    expect(component.isEditModalOpen()).toBe(false);
    expect(mockApiService.deleteWorkerService).toHaveBeenCalledWith('worker-uuid-1', existing.id);
    expect(store.workerServices().some((s) => s.id === existing.id)).toBe(false);
  });
});
