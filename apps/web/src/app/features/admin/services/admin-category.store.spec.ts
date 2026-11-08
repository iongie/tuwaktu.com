import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminCategoryStore } from './admin-category.store';
import { AdminCategoryApiService } from './admin-category-api.service';
import { AdminCategory } from '../models/admin-category.model';

describe('AdminCategoryStore', () => {
  let store: AdminCategoryStore;
  let mockApiService: jest.Mocked<AdminCategoryApiService>;

  const sampleCategories: AdminCategory[] = [
    {
      id: 'cat-1',
      slug: 'ac-pendingin',
      name: 'Servis & Pasang AC',
      description: 'Perawatan pendingin ruangan',
      icon: 'ac_unit',
      starting_price: 75000,
      price_unit: 'unit',
      availability_tag: 'Tersedia di Katalog',
      highlight_tag: 'Populer',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'cat-2',
      slug: 'sanitasi-cleaning',
      name: 'Sanitasi & Deep Clean',
      description: 'Pembersihan kasur dan sofa',
      icon: 'cleaning_services',
      starting_price: 65000,
      price_unit: 'jam',
      availability_tag: 'Tersedia di Katalog',
      highlight_tag: 'Higienis',
      is_active: false,
      sort_order: 2,
    },
  ];

  beforeEach(() => {
    mockApiService = {
      fetchCategories: jest.fn().mockReturnValue(of({ success: true, message: 'OK', data: sampleCategories })),
      fetchCategory: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    } as unknown as jest.Mocked<AdminCategoryApiService>;

    TestBed.configureTestingModule({
      providers: [
        AdminCategoryStore,
        { provide: AdminCategoryApiService, useValue: mockApiService },
      ],
    });

    store = TestBed.inject(AdminCategoryStore);
  });

  it('memuat data kategori dan menghitung metrik dengan benar', () => {
    store.loadCategories();

    expect(store.categories().length).toBe(2);
    expect(store.totalCount()).toBe(2);
    expect(store.activeCount()).toBe(1);
    expect(store.inactiveCount()).toBe(1);
    expect(store.isLoading()).toBe(false);
  });

  it('menangani error saat loadCategories gagal', () => {
    mockApiService.fetchCategories.mockReturnValue(
      throwError(() => ({ error: { message: 'Koneksi gagal' } }))
    );

    store.loadCategories();

    expect(store.categories().length).toBe(0);
    expect(store.errorMessage()).toBe('Koneksi gagal');
    expect(store.isLoading()).toBe(false);
  });

  it('memfilter kategori berdasarkan status filter ACTIVE atau INACTIVE', () => {
    store.loadCategories();

    store.setStatusFilter('ACTIVE');
    expect(store.filteredCategories().length).toBe(1);
    expect(store.filteredCategories()[0].id).toBe('cat-1');

    store.setStatusFilter('INACTIVE');
    expect(store.filteredCategories().length).toBe(1);
    expect(store.filteredCategories()[0].id).toBe('cat-2');

    store.setStatusFilter('ALL');
    expect(store.filteredCategories().length).toBe(2);
  });

  it('menambahkan kategori baru via saveCategory saat create mode', () => {
    store.loadCategories();
    const newCat: AdminCategory = {
      id: 'cat-3',
      slug: 'instalasi-listrik',
      name: 'Instalasi Listrik',
      description: 'Tracing MCB',
      icon: 'bolt',
      starting_price: 80000,
      price_unit: 'kunjungan',
      availability_tag: 'Tersedia di Katalog',
      highlight_tag: '',
      is_active: true,
      sort_order: 3,
    };

    mockApiService.createCategory.mockReturnValue(
      of({ success: true, message: 'Kategori baru berhasil ditambahkan', data: newCat })
    );

    store.openCreateModal();
    store.saveCategory({
      name: newCat.name,
      description: newCat.description,
      icon: newCat.icon,
      starting_price: newCat.starting_price,
      price_unit: newCat.price_unit,
    });

    expect(store.categories().length).toBe(3);
    expect(store.categories()[0].id).toBe('cat-3');
    expect(store.isModalOpen()).toBe(false);
  });

  it('mengubah status kategori via toggleStatus secara optimistik', () => {
    store.loadCategories();
    const target = sampleCategories[0]; // is_active = true

    mockApiService.updateCategory.mockReturnValue(
      of({ success: true, message: 'Updated', data: { ...target, is_active: false } })
    );

    store.toggleStatus(target);

    const updated = store.categories().find((c) => c.id === target.id);
    expect(updated?.is_active).toBe(false);
  });

  it('menghapus kategori via deleteCategory', () => {
    store.loadCategories();
    const target = sampleCategories[0];

    mockApiService.deleteCategory.mockReturnValue(
      of({ success: true, message: 'Dihapus' })
    );

    store.deleteCategory(target);

    expect(store.categories().length).toBe(1);
    expect(store.categories().find((c) => c.id === target.id)).toBeUndefined();
  });
});
