import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeCategoryCardComponent } from './home-category-card.component';
import { DisciplineCategory } from '../../../models/home.model';

describe('HomeCategoryCardComponent', () => {
  let component: HomeCategoryCardComponent;
  let fixture: ComponentFixture<HomeCategoryCardComponent>;

  const mockCategory: DisciplineCategory = {
    id: 'cat-ac',
    slug: 'ac-pendingin',
    title: 'Servis & Pasang AC',
    description: 'Pembersihan filter dan isi freon.',
    icon: 'ac_unit',
    startingPrice: 75000,
    priceUnit: 'unit',
    specialistCount: 24,
    highlightTag: 'Populer',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeCategoryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeCategoryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('category', mockCategory);
    fixture.detectChanges();
  });

  it('harus merender judul, deskripsi, ikon, dan tag kategori', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Servis & Pasang AC');
    expect(el.textContent).toContain('Pembersihan filter dan isi freon.');
    expect(el.textContent).toContain('Populer');
    expect(el.textContent).toContain('24 Spesialis Siaga');
  });

  it('harus memformat tarif awal secara tepat dalam rupiah', () => {
    expect(component.formattedStartingPrice()).toContain('75.000');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('75.000 / unit');
  });

  it('harus memancarkan selectCategory dengan slug saat kartu diklik', () => {
    const emitSpy = jest.fn();
    component.selectCategory.subscribe(emitSpy);

    const article: HTMLElement = fixture.nativeElement.querySelector('article');
    article.click();

    expect(emitSpy).toHaveBeenCalledWith('ac-pendingin');
  });

  it('harus memancarkan selectCategory saat tombol enter ditekan pada kartu', () => {
    const emitSpy = jest.fn();
    component.selectCategory.subscribe(emitSpy);

    const article: HTMLElement = fixture.nativeElement.querySelector('article');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    article.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledWith('ac-pendingin');
  });
});
