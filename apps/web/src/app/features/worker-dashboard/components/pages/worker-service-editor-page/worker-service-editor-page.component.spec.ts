import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { WorkerServiceEditorPageComponent } from './worker-service-editor-page.component';
import { WorkerDashboardStore } from '../../../services/worker-dashboard.store';
import { HomeApiService } from '../../../../home/services/home-api.service';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

describe('WorkerServiceEditorPageComponent', () => {
  let component: WorkerServiceEditorPageComponent;
  let fixture: ComponentFixture<WorkerServiceEditorPageComponent>;
  let mockStore: {
    workerServices: ReturnType<typeof signal<WorkerServiceCatalogItem[]>>;
    addNewCatalogService: jest.Mock;
    updateServiceCatalogItem: jest.Mock;
    deleteServiceCatalogItem: jest.Mock;
  };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(async () => {
    mockStore = {
      workerServices: signal<WorkerServiceCatalogItem[]>([
        {
          id: 'srv-1',
          code: 'AC-01',
          name: 'Cuci AC Split Presisi',
          category_id: '11111111-1111-4111-8111-111111111111',
          description: 'Pembersihan evaporator dan pembersihan menyeluruh.',
          price: 85000,
          base_price: 85000,
          rate_type: 'HOURLY',
          duration_minutes: 60,
          status: 'ACTIVE',
          is_public: true,
        },
      ]),
      addNewCatalogService: jest.fn(),
      updateServiceCatalogItem: jest.fn(),
      deleteServiceCatalogItem: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [WorkerServiceEditorPageComponent],
      providers: [
        provideRouter([]),
        { provide: WorkerDashboardStore, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? null : null),
              },
            },
          },
        },
        {
          provide: HomeApiService,
          useValue: {
            fetchPublicCategories: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerServiceEditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance editor layanan pada mode tambah baru', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(false);
  });

  it('harus menolak simpan jika nama layanan kurang dari 3 karakter', () => {
    component.name.set('AC');
    expect(component.isFormValid()).toBe(false);

    component.handleSaveService();
    expect(mockStore.addNewCatalogService).not.toHaveBeenCalled();
    expect(component.formErrorMessage()).toContain('nama layanan');
  });

  it('harus memanggil addNewCatalogService dan bernavigasi balik saat form valid', () => {
    component.name.set('Instalasi Stop Kontak Baru');
    component.price.set(50000);
    component.durationMinutes.set(45);
    fixture.detectChanges();

    expect(component.isFormValid()).toBe(true);
    component.handleSaveService();

    expect(mockStore.addNewCatalogService).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Instalasi Stop Kontak Baru',
        price: 50000,
        duration_minutes: 45,
      })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/tarif-layanan']);
  });

  it('harus memuat data layanan eksisting pada mode edit', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest.spyOn(route.snapshot.paramMap, 'get').mockReturnValue('srv-1');

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.name()).toBe('Cuci AC Split Presisi');
    expect(component.price()).toBe(85000);
  });

  it('harus memanggil updateServiceCatalogItem saat edit disimpan', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest.spyOn(route.snapshot.paramMap, 'get').mockReturnValue('srv-1');
    component.ngOnInit();

    component.name.set('Cuci AC Split + Desinfeksi');
    component.handleSaveService();

    expect(mockStore.updateServiceCatalogItem).toHaveBeenCalledWith(
      'srv-1',
      expect.objectContaining({
        name: 'Cuci AC Split + Desinfeksi',
      })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/tarif-layanan']);
  });
});

