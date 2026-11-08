import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoryFilterBarComponent } from './admin-category-filter-bar.component';

describe('AdminCategoryFilterBarComponent', () => {
  let component: AdminCategoryFilterBarComponent;
  let fixture: ComponentFixture<AdminCategoryFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoryFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoryFilterBarComponent);
    component = fixture.componentInstance;
  });

  it('merender jumlah total, aktif, dan nonaktif dengan benar', () => {
    fixture.componentRef.setInput('totalCount', 10);
    fixture.componentRef.setInput('activeCount', 7);
    fixture.componentRef.setInput('inactiveCount', 3);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="filter-all-btn"]')?.textContent).toContain('Semua (10)');
    expect(compiled.querySelector('[data-testid="filter-active-btn"]')?.textContent).toContain('Aktif (7)');
    expect(compiled.querySelector('[data-testid="filter-inactive-btn"]')?.textContent).toContain('Nonaktif (3)');
  });

  it('memancarkan event searchChange saat pengguna mengetik', () => {
    const searchSpy = jest.fn();
    component.searchChange.subscribe(searchSpy);

    const input = fixture.nativeElement.querySelector(
      '[data-testid="search-category-input"]'
    ) as HTMLInputElement;

    input.value = 'AC';
    input.dispatchEvent(new Event('input'));

    expect(searchSpy).toHaveBeenCalledWith('AC');
  });

  it('memancarkan event filterChange saat tombol filter diklik', () => {
    const filterSpy = jest.fn();
    component.filterChange.subscribe(filterSpy);

    const activeBtn = fixture.nativeElement.querySelector(
      '[data-testid="filter-active-btn"]'
    ) as HTMLButtonElement;
    activeBtn.click();

    expect(filterSpy).toHaveBeenCalledWith('ACTIVE');
  });

  it('membersihkan pencarian saat tombol close diklik', () => {
    fixture.componentRef.setInput('searchQuery', 'pompa');
    fixture.detectChanges();

    const searchSpy = jest.fn();
    component.searchChange.subscribe(searchSpy);

    const clearBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Bersihkan pencarian"]'
    ) as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    expect(searchSpy).toHaveBeenCalledWith('');
  });
});
