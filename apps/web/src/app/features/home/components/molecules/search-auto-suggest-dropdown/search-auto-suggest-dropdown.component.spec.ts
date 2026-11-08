import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchAutoSuggestDropdownComponent } from './search-auto-suggest-dropdown.component';
import { FeaturedWorker } from '../../../models/home.model';

describe('SearchAutoSuggestDropdownComponent', () => {
  let component: SearchAutoSuggestDropdownComponent;
  let fixture: ComponentFixture<SearchAutoSuggestDropdownComponent>;

  const mockWorkers: FeaturedWorker[] = [
    {
      id: 'worker-1',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      specialty: 'Teknisi AC Inverter',
      category: 'Servis AC',
      rating: 4.9,
      reviewCount: 30,
      basecampZone: 'Jakarta Selatan',
      startingPrice: 75000,
      priceUnit: 'unit',
      avatarUrl: 'https://example.com/budi.jpg',
      isVerified: true,
      specialtyTags: ['AC'],
      bufferMinutes: 60,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchAutoSuggestDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchAutoSuggestDropdownComponent);
    component = fixture.componentInstance;
  });

  it('tidak boleh merender dropdown jika isOpen false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('query', 'budi');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(el).toBeNull();
  });

  it('harus merender kelompok pekerja dan memancarkan selectWorker saat diklik', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('query', 'budi');
    fixture.componentRef.setInput('workerSuggestions', mockWorkers);
    fixture.componentRef.setInput('categorySuggestions', []);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Spesialis Terverifikasi');
    expect(el.textContent).toContain('Budi Santoso');

    const emitSpy = jest.spyOn(component.selectWorker, 'emit');
    const workerButton = el.querySelector('button');
    expect(workerButton).toBeTruthy();
    workerButton?.click();

    expect(emitSpy).toHaveBeenCalledWith(mockWorkers[0]);
  });

  it('harus merender kelompok kategori dan memancarkan selectCategory saat diklik', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('query', 'ac');
    fixture.componentRef.setInput('workerSuggestions', []);
    fixture.componentRef.setInput('categorySuggestions', ['Servis AC', 'Instalasi AC']);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Kategori & Layanan');
    expect(el.textContent).toContain('Servis AC');

    const emitSpy = jest.spyOn(component.selectCategory, 'emit');
    const categoryButton = el.querySelector('button');
    categoryButton?.click();

    expect(emitSpy).toHaveBeenCalledWith('Servis AC');
  });

  it('harus menampilkan pesan informatif jika tidak ada saran yang cocok', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('query', 'xyz123');
    fixture.componentRef.setInput('workerSuggestions', []);
    fixture.componentRef.setInput('categorySuggestions', []);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tekan Enter atau klik \'Temukan Pekerja\' untuk mencari "xyz123"');
  });
});

