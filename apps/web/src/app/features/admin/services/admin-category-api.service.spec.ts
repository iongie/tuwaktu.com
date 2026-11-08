import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminCategoryApiService } from './admin-category-api.service';
import { API_BASE_URL } from '../../../../environments/environment.model';
import { AuthService } from '../../auth/services/auth.service';
import { AdminCategory, CreateAdminCategoryPayload, UpdateAdminCategoryPayload } from '../models/admin-category.model';

describe('AdminCategoryApiService', () => {
  let service: AdminCategoryApiService;
  let httpTestingController: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminCategoryApiService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(AdminCategoryApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);

    authService.setSession({
      id: 'admin-1',
      name: 'Super Admin',
      slug: 'admin',
      role: 'ADMIN',
      token: 'mock-jwt-token-xyz',
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    authService.logout();
  });

  it('harus memanggil GET /api/v1/admin/categories dengan header Authorization', () => {
    const mockCategories: AdminCategory[] = [
      {
        id: 'cat-1',
        slug: 'ac-pendingin',
        name: 'Servis & Pasang AC',
        description: 'AC specialist',
        icon: 'ac_unit',
        starting_price: 75000,
        price_unit: 'unit',
        availability_tag: 'Tersedia di Katalog',
        highlight_tag: 'Populer',
        is_active: true,
        sort_order: 1,
      },
    ];

    service.fetchCategories().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockCategories);
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/categories');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-jwt-token-xyz');
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      success: true,
      message: 'Daftar seluruh kategori berhasil dimuat',
      data: mockCategories,
    });
  });

  it('harus memanggil POST /api/v1/admin/categories saat createCategory', () => {
    const payload: CreateAdminCategoryPayload = {
      name: 'Servis Komputer & Jaringan',
      description: 'Pembersihan virus dan instalasi kabel LAN',
      icon: 'computer',
      starting_price: 100000,
      price_unit: 'titik',
    };

    service.createCategory(payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.name).toBe('Servis Komputer & Jaringan');
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/categories');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      success: true,
      message: 'Kategori baru berhasil ditambahkan',
      data: {
        id: 'cat-new',
        slug: 'servis-komputer-jaringan',
        ...payload,
        availability_tag: 'Tersedia di Katalog',
        highlight_tag: '',
        is_active: true,
        sort_order: 0,
      },
    });
  });

  it('harus memanggil PUT /api/v1/admin/categories/:id saat updateCategory', () => {
    const payload: UpdateAdminCategoryPayload = {
      name: 'Servis AC Inverter Modern',
      starting_price: 85000,
    };

    service.updateCategory('cat-1', payload).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/categories/cat-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      success: true,
      message: 'Kategori berhasil diperbarui',
      data: { id: 'cat-1', ...payload },
    });
  });

  it('harus memanggil DELETE /api/v1/admin/categories/:id saat deleteCategory', () => {
    service.deleteCategory('cat-1').subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpTestingController.expectOne('http://localhost:3000/api/v1/admin/categories/cat-1');
    expect(req.request.method).toBe('DELETE');

    req.flush({
      success: true,
      message: 'Kategori berhasil dihapus',
    });
  });
});
