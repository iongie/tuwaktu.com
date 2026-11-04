import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesFilterTabsComponent } from './rates-filter-tabs.component';

describe('RatesFilterTabsComponent', () => {
  let fixture: ComponentFixture<RatesFilterTabsComponent>;
  let component: RatesFilterTabsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesFilterTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesFilterTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus membuat instance komponen filter tabs', () => {
    expect(component).toBeTruthy();
  });

  it('harus memancarkan tabChange saat tab Draf diklik', () => {
    let emittedTab = '';
    component.tabChange.subscribe((tab) => {
      emittedTab = tab;
    });

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();

    expect(emittedTab).toBe('DRAFT');
  });
});
