import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HomeDisciplinesSectionComponent } from './home-disciplines-section.component';
import { HomeApiService } from '../../../services/home-api.service';
import { DisciplineCategory } from '../../../models/home.model';

describe('HomeDisciplinesSectionComponent', () => {
  let component: HomeDisciplinesSectionComponent;
  let fixture: ComponentFixture<HomeDisciplinesSectionComponent>;

  const mockCategories: DisciplineCategory[] = [
    {
      id: 'cat-test',
      slug: 'servis-ac',
      title: 'Servis AC Handal',
      description: 'Layanan AC terpercaya',
      icon: 'ac_unit',
      startingPrice: 80000,
      priceUnit: 'unit',
      availabilityTag: 'Tersedia di Katalog',
      highlightTag: 'Favorit',
    },
  ];

  beforeEach(async () => {
    const mockHomeApi = {
      fetchPublicCategories: jest.fn().mockReturnValue(of(mockCategories)),
    };

    await TestBed.configureTestingModule({
      imports: [HomeDisciplinesSectionComponent],
      providers: [
        { provide: HomeApiService, useValue: mockHomeApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeDisciplinesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('memuat data kategori dari HomeApiService pada ngOnInit', () => {
    expect(component.categories().length).toBe(1);
    expect(component.categories()[0].title).toBe('Servis AC Handal');
  });

  it('memancarkan event selectCategory saat kartu kategori dipilih', () => {
    const emitSpy = jest.fn();
    component.selectCategory.subscribe(emitSpy);

    component.onCategorySelected('servis-ac');
    expect(emitSpy).toHaveBeenCalledWith('servis-ac');
  });

  it('menampilkan status kosong jika API mengembalikan array kosong', () => {
    component.categories.set([]);
    component.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="categories-empty-state"]')).toBeTruthy();
  });
});
