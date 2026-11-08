import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoryStatusBadgeComponent } from './admin-category-status-badge.component';

describe('AdminCategoryStatusBadgeComponent', () => {
  let component: AdminCategoryStatusBadgeComponent;
  let fixture: ComponentFixture<AdminCategoryStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoryStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoryStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('menampilkan badge aktif saat isActive bernilai true', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="category-badge-active"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Aktif di Katalog');
  });

  it('menampilkan badge nonaktif saat isActive bernilai false', () => {
    fixture.componentRef.setInput('isActive', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="category-badge-inactive"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Nonaktif');
  });
});
