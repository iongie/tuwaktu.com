import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { TechnicianSearchBarComponent } from './technician-search-bar.component';

describe('TechnicianSearchBarComponent', () => {
  let component: TechnicianSearchBarComponent;
  let componentRef: ComponentRef<TechnicianSearchBarComponent>;
  let fixture: ComponentFixture<TechnicianSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianSearchBarComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('slugQuery', 'budi-santoso');
    fixture.detectChanges();
  });

  it('harus membuat instance komponen bilah pencarian teknisi', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender nilai slug awal pada input', () => {
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl.value).toBe('budi-santoso');
  });

  it('harus memancarkan event slugQueryChange saat nilai input berubah', () => {
    let changedValue = '';
    component.slugQueryChange.subscribe((val) => {
      changedValue = val;
    });

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputEl.value = 'sarah-melinda';
    inputEl.dispatchEvent(new Event('input'));

    expect(changedValue).toBe('sarah-melinda');
  });

  it('harus memancarkan event triggerSearch saat tombol Cari Mitra diklik', () => {
    let triggered = false;
    component.triggerSearch.subscribe(() => {
      triggered = true;
    });

    const buttonEl: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    buttonEl.click();

    expect(triggered).toBe(true);
  });

  it('harus memancarkan event triggerSearch saat menekan tombol Enter pada input', () => {
    let triggered = false;
    component.triggerSearch.subscribe(() => {
      triggered = true;
    });

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    inputEl.dispatchEvent(enterEvent);

    expect(triggered).toBe(true);
  });
});
