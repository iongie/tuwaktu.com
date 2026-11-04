import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminWorkerFilterBarComponent } from './admin-worker-filter-bar.component';

describe('AdminWorkerFilterBarComponent', () => {
  let component: AdminWorkerFilterBarComponent;
  let fixture: ComponentFixture<AdminWorkerFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkerFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminWorkerFilterBarComponent);
    component = fixture.componentInstance;
  });

  it('harus memancarkan searchChange saat pengguna mengetik', () => {
    const searchSpy = jest.spyOn(component.searchChange, 'emit');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#adminWorkerSearchInput');
    input.value = 'budi';
    input.dispatchEvent(new Event('input'));

    expect(searchSpy).toHaveBeenCalledWith('budi');
  });

  it('harus memancarkan filterChange saat tombol filter diklik', () => {
    const filterSpy = jest.spyOn(component.filterChange, 'emit');
    fixture.detectChanges();

    const activeBtn = fixture.nativeElement.querySelector('[data-testid="filter-active-btn"]');
    activeBtn.click();

    expect(filterSpy).toHaveBeenCalledWith('ACTIVE');

    const suspendedBtn = fixture.nativeElement.querySelector('[data-testid="filter-suspended-btn"]');
    suspendedBtn.click();

    expect(filterSpy).toHaveBeenCalledWith('SUSPENDED');
  });
});

