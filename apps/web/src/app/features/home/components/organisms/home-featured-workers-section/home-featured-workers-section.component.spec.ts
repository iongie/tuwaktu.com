import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeFeaturedWorkersSectionComponent } from './home-featured-workers-section.component';
import { HomeApiService } from '../../../services/home-api.service';
import { FeaturedWorker } from '../../../models/home.model';

describe('HomeFeaturedWorkersSectionComponent', () => {
  let component: HomeFeaturedWorkersSectionComponent;
  let fixture: ComponentFixture<HomeFeaturedWorkersSectionComponent>;
  let mockHomeApiService: { fetchPublicWorkers: jest.Mock };

  const mockWorkers: FeaturedWorker[] = [
    {
      id: 'worker-budi',
      slug: 'budi-santoso',
      name: 'Budi Santoso',
      specialty: 'Cuci AC Inverter',
      category: 'Servis AC',
      rating: 4.9,
      reviewCount: 42,
      basecampZone: 'Jakarta Selatan',
      startingPrice: 75000,
      priceUnit: 'unit',
      avatarUrl: 'https://example.com/budi.jpg',
      isVerified: true,
      specialtyTags: ['Cuci AC Inverter', 'Isi Freon'],
      bufferMinutes: 60,
    },
    {
      id: 'worker-siti',
      slug: 'siti-aminah',
      name: 'Siti Aminah',
      specialty: 'Daily Cleaning',
      category: 'Sanitasi',
      rating: 4.8,
      reviewCount: 35,
      basecampZone: 'Tangerang Selatan',
      startingPrice: 120000,
      priceUnit: 'jam',
      avatarUrl: 'https://example.com/siti.jpg',
      isVerified: true,
      specialtyTags: ['Deep Clean', 'Sterilisasi'],
      bufferMinutes: 60,
    },
    {
      id: 'worker-hendra',
      slug: 'hendra-listrik',
      name: 'Hendra Saputra',
      specialty: 'Instalasi Panel MCB',
      category: 'Kelistrikan',
      rating: 5.0,
      reviewCount: 50,
      basecampZone: 'Jakarta Barat',
      startingPrice: 90000,
      priceUnit: 'jam',
      avatarUrl: 'https://example.com/hendra.jpg',
      isVerified: true,
      specialtyTags: ['Panel Listrik', 'Korsleting'],
      bufferMinutes: 60,
    },
  ];

  beforeEach(async () => {
    mockHomeApiService = {
      fetchPublicWorkers: jest.fn().mockReturnValue(of(mockWorkers)),
    };

    await TestBed.configureTestingModule({
      imports: [HomeFeaturedWorkersSectionComponent],
      providers: [
        provideRouter([]),
        { provide: HomeApiService, useValue: mockHomeApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeFeaturedWorkersSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('harus memanggil fetchPublicWorkers dan merender kartu pekerja riil dari API', () => {
    expect(mockHomeApiService.fetchPublicWorkers).toHaveBeenCalled();
    expect(component.workers().length).toBe(3);
    expect(component.isLoading()).toBe(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Budi Santoso');
    expect(el.textContent).toContain('Siti Aminah');
    expect(el.textContent).toContain('Hendra Saputra');
    expect(el.textContent).toContain('TOTAL 3 PEKERJA AKTIF');
  });

  it('harus memfilter pekerja berdasarkan kategori saat tombol filter chip diklik', () => {
    component.setCategoryFilter('Servis AC');
    fixture.detectChanges();

    expect(component.filteredWorkers().length).toBe(1);
    expect(component.filteredWorkers()[0].slug).toBe('budi-santoso');

    component.setCategoryFilter('Sanitasi');
    fixture.detectChanges();
    expect(component.filteredWorkers().length).toBe(1);
    expect(component.filteredWorkers()[0].slug).toBe('siti-aminah');

    component.clearCategoryFilter();
    fixture.detectChanges();
    expect(component.filteredWorkers().length).toBe(3);
  });

  it('harus memfilter berdasarkan wilayah operasional secara independen', () => {
    fixture.componentRef.setInput('searchLocation', 'Jakarta Barat');
    fixture.detectChanges();

    expect(component.filteredWorkers().length).toBe(1);
    expect(component.filteredWorkers()[0].slug).toBe('hendra-listrik');
  });

  it('harus memfilter berdasarkan keahlian atau nama pekerja', () => {
    fixture.componentRef.setInput('searchSpecialty', 'Budi');
    fixture.detectChanges();

    expect(component.filteredWorkers().length).toBe(1);
    expect(component.filteredWorkers()[0].slug).toBe('budi-santoso');
  });

  it('harus menampilkan bilah filter aktif jika ada filter yang diterapkan', () => {
    fixture.componentRef.setInput('searchSpecialty', 'AC');
    fixture.componentRef.setInput('searchLocation', 'Jakarta Selatan');
    fixture.detectChanges();

    const activeBar = fixture.nativeElement.querySelector('[data-testid="active-filter-bar"]');
    expect(activeBar).toBeTruthy();
    expect(activeBar.textContent).toContain('Keahlian/Nama: "AC"');
    expect(activeBar.textContent).toContain('Wilayah: "Jakarta Selatan"');
  });

  it('harus mereset semua filter dan memancarkan resetAllFilters saat tombol Reset Semua diklik', () => {
    const emitSpy = jest.spyOn(component.resetAllFilters, 'emit');

    component.activeSpecialtyFilter.set('AC');
    component.activeLocationFilter.set('Jakarta');
    component.activeCategory.set('Servis AC');

    component.resetAllFiltersAction();
    fixture.detectChanges();

    expect(component.activeSpecialtyFilter()).toBe('');
    expect(component.activeLocationFilter()).toBe('');
    expect(component.activeCategory()).toBe('Semua');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('harus menampilkan empty state dan rekomendasi teknisi alternatif saat tidak ada hasil', () => {
    fixture.componentRef.setInput('searchSpecialty', 'KeahlianTidakAda123');
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-testid="workers-empty-state"]');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Belum Ada Teknisi Ditemukan');

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Rekomendasi Spesialis Terverifikasi Siaga Lainnya');
    // Hendra Saputra rating tertinggi (5.0) harus muncul di rekomendasi
    expect(el.textContent).toContain('Hendra Saputra');
  });
});
