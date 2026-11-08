import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminCategoriesPageComponent } from './admin-categories-page.component';
import { AdminCategoryStore } from '../../../services/admin-category.store';
import { AuthService } from '../../../../auth/services/auth.service';
import { AdminCategory } from '../../../models/admin-category.model';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('AdminCategoriesPageComponent', () => {
  let component: AdminCategoriesPageComponent;
  let fixture: ComponentFixture<AdminCategoriesPageComponent>;
  let mockStore: Partial<AdminCategoryStore>;

  const mockCategories: AdminCategory[] = [
    {
      id: 'cat-1',
      slug: 'ac-pendingin',
      name: 'Servis & Pasang AC',
      description: 'Pembersihan filter dan freon AC.',
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
      description: 'Pembersihan menyeluruh kamar tidur.',
      icon: 'cleaning_services',
      starting_price: 65000,
      price_unit: 'jam',
      availability_tag: 'Tersedia di Katalog',
      highlight_tag: 'Higienis',
      is_active: false,
      sort_order: 2,
    },
  ];

  beforeEach(async () => {
    mockStore = {
      categories: signal(mockCategories),
      filteredCategories: signal(mockCategories),
      isLoading: signal(false),
      errorMessage: signal(null),
      feedbackMessage: signal(null),
      searchQuery: signal(''),
      statusFilter: signal('ALL'),
      isModalOpen: signal(false),
      editingCategory: signal(null),
      isSubmitting: signal(false),
      totalCount: signal(2),
      activeCount: signal(1),
      inactiveCount: signal(1),
      loadCategories: jest.fn(),
      openCreateModal: jest.fn(),
      openEditModal: jest.fn(),
      closeModal: jest.fn(),
      saveCategory: jest.fn(),
      toggleStatus: jest.fn(),
      deleteCategory: jest.fn(),
      setSearchQuery: jest.fn(),
      setStatusFilter: jest.fn(),
      clearError: jest.fn(),
      clearFeedback: jest.fn(),
    } as unknown as AdminCategoryStore;

    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPageComponent],
      providers: [
        { provide: AdminCategoryStore, useValue: mockStore },
        AuthService,
        provideRouter([{ path: 'login', component: DummyLoginComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('memanggil store.loadCategories saat inisialisasi', () => {
    expect(mockStore.loadCategories).toHaveBeenCalled();
  });

  it('menampilkan metrik ringkasan kartu dengan benar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const totalEl = compiled.querySelector('[data-testid="metric-total-categories"]');
    const activeEl = compiled.querySelector('[data-testid="metric-active-categories"]');
    const inactiveEl = compiled.querySelector('[data-testid="metric-inactive-categories"]');

    expect(totalEl?.textContent?.trim()).toBe('2');
    expect(activeEl?.textContent?.trim()).toBe('1');
    expect(inactiveEl?.textContent?.trim()).toBe('1');
  });

  it('membuka modal tambah kategori saat tombol diklik', () => {
    const addBtn = fixture.nativeElement.querySelector(
      '[data-testid="add-category-btn"]'
    ) as HTMLButtonElement;
    addBtn.click();

    expect(mockStore.openCreateModal).toHaveBeenCalled();
  });

  it('memanggil handleEditCategory saat event edit dipicu', () => {
    component.handleEditCategory(mockCategories[0]);
    expect(mockStore.openEditModal).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('memanggil handleToggleStatus saat event status dipicu', () => {
    component.handleToggleStatus(mockCategories[0]);
    expect(mockStore.toggleStatus).toHaveBeenCalledWith(mockCategories[0]);
  });
});
