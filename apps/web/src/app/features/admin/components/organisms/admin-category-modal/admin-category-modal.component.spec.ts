import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoryModalComponent } from './admin-category-modal.component';

describe('AdminCategoryModalComponent', () => {
  let component: AdminCategoryModalComponent;
  let fixture: ComponentFixture<AdminCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoryModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategoryModalComponent);
    component = fixture.componentInstance;
  });

  it('tidak merender modal saat isOpen bernilai false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
  });

  it('merender modal dan form saat isOpen bernilai true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="dialog"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="category-name-input"]')).toBeTruthy();
  });

  it('memancarkan event save saat form valid disubmit', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const saveSpy = jest.fn();
    component.save.subscribe(saveSpy);

    component.formName.set('Servis Elektronik Audio');
    component.formStartingPrice.set(120000);
    fixture.detectChanges();

    component.handleSubmit();
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Servis Elektronik Audio',
        starting_price: 120000,
        icon: 'build',
        price_unit: 'kunjungan',
      })
    );
  });

  it('memancarkan event close saat tombol tutup atau batal diklik', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeSpy = jest.fn();
    component.close.subscribe(closeSpy);

    component.handleClose();
    expect(closeSpy).toHaveBeenCalled();
  });
});
