import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoriesTableComponent } from './admin-categories-table.component';
import { AdminCategory } from '../../../models/admin-category.model';

describe('AdminCategoriesTableComponent', () => {
  let component: AdminCategoriesTableComponent;
  let fixture: ComponentFixture<AdminCategoriesTableComponent>;

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
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesTableComponent);
    component = fixture.componentInstance;
  });

  it('merender empty state saat data kategori kosong', () => {
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="empty-categories-state"]')).toBeTruthy();
  });

  it('merender baris tabel saat data kategori tersedia', () => {
    fixture.componentRef.setInput('categories', mockCategories);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Servis & Pasang AC');
    expect(compiled.textContent).toContain('/ac-pendingin');
  });

  it('memancarkan event editCategory saat tombol edit diklik', () => {
    fixture.componentRef.setInput('categories', mockCategories);
    fixture.detectChanges();

    const editSpy = jest.fn();
    component.editCategory.subscribe(editSpy);

    const editBtn = fixture.nativeElement.querySelector(
      '[data-testid="edit-category-btn"]'
    ) as HTMLButtonElement;
    editBtn.click();

    expect(editSpy).toHaveBeenCalledWith(mockCategories[0]);
  });
});
