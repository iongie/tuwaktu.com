import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { HomeHeroSectionComponent } from './home-hero-section.component';
import { HomeApiService } from '../../../services/home-api.service';
import { FeaturedWorker } from '../../../models/home.model';

describe('HomeHeroSectionComponent', () => {
  let component: HomeHeroSectionComponent;
  let fixture: ComponentFixture<HomeHeroSectionComponent>;
  let router: Router;
  let mockHomeApiService: { fetchPublicWorkers: jest.Mock };

  const mockWorkers: FeaturedWorker[] = [
    {
      id: 'worker-1',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      specialty: 'Teknisi AC Inverter',
      category: 'Servis AC',
      rating: 4.9,
      reviewCount: 42,
      basecampZone: 'Jakarta Selatan',
      startingPrice: 75000,
      priceUnit: 'unit',
      avatarUrl: 'https://example.com/budi.jpg',
      isVerified: true,
      specialtyTags: ['AC', 'Freon'],
      bufferMinutes: 60,
    },
    {
      id: 'worker-2',
      slug: 'sarah-cleaning',
      name: 'Sarah Melinda',
      specialty: 'Sanitasi Deep Clean',
      category: 'Sanitasi',
      rating: 4.8,
      reviewCount: 30,
      basecampZone: 'Tangerang Selatan',
      startingPrice: 120000,
      priceUnit: 'jam',
      avatarUrl: 'https://example.com/sarah.jpg',
      isVerified: true,
      specialtyTags: ['Deep Clean'],
      bufferMinutes: 60,
    },
  ];

  beforeEach(async () => {
    mockHomeApiService = {
      fetchPublicWorkers: jest.fn().mockReturnValue(of(mockWorkers)),
    };

    await TestBed.configureTestingModule({
      imports: [HomeHeroSectionComponent],
      providers: [
        provideRouter([]),
        { provide: HomeApiService, useValue: mockHomeApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeroSectionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen hero beranda dengan telemetri', () => {
    expect(component).toBeTruthy();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Protokol Kedaulatan Pekerja Mandiri • 0% Komisi');
    expect(el.textContent).toContain('Cari Spesialis Terverifikasi.');
  });

  it('harus merender 4 pilar kepercayaan Tuwaktu', () => {
    expect(component.trustPillars.length).toBe(4);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('0% Potongan Komisi');
    expect(el.textContent).toContain('100% WhatsApp Langsung');
    expect(el.textContent).toContain('Buffer Transit Otomatis');
    expect(el.textContent).toContain('Kredensial Terverifikasi');
  });

  it('harus membangun daftar availableZones secara dinamis dari data pekerja', () => {
    expect(component.availableZones()).toContain('Semua Wilayah');
    expect(component.availableZones()).toContain('Jakarta Selatan');
    expect(component.availableZones()).toContain('Tangerang Selatan');
  });

  it('harus memfilter saran pekerja saat query keahlian/nama diketik', () => {
    component.onSpecialtyQueryChange('Budi');
    expect(component.isSuggestOpen()).toBe(true);
    expect(component.filteredWorkerSuggestions().length).toBe(1);
    expect(component.filteredWorkerSuggestions()[0].slug).toBe('budi-santoso');
  });

  it('harus menavigasi langsung ke slug profil pekerja saat saran profil diklik', () => {
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onSelectWorker(mockWorkers[0]);

    expect(component.isSuggestOpen()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith(['/budi-santoso']);
  });

  it('harus memancarkan searchTrigger dengan specialty dan location saat form disubmit', () => {
    const emitSpy = jest.spyOn(component.searchTrigger, 'emit');

    component.specialtyQuery.set('Service AC');
    component.locationQuery.set('Jakarta Selatan');
    component.handleSearchSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      specialty: 'Service AC',
      location: 'Jakarta Selatan',
    });
  });

  it('harus mengirim location kosong jika pilihan wilayah adalah "Semua Wilayah"', () => {
    const emitSpy = jest.spyOn(component.searchTrigger, 'emit');

    component.specialtyQuery.set('Kelistrikan');
    component.locationQuery.set('Semua Wilayah');
    component.handleSearchSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      specialty: 'Kelistrikan',
      location: '',
    });
  });

  it('harus memperbarui specialtyQuery dan submit saat filter chip diklik', () => {
    const submitSpy = jest.spyOn(component, 'handleSearchSubmit');

    component.applyFilterChip('ac');

    expect(component.specialtyQuery()).toBe('ac');
    expect(submitSpy).toHaveBeenCalled();
  });
});
