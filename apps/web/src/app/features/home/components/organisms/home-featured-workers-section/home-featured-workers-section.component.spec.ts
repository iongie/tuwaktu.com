import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    expect(component.workers().length).toBe(2);
    expect(component.isLoading()).toBe(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Budi Santoso');
    expect(el.textContent).toContain('Siti Aminah');
    expect(el.textContent).toContain('TOTAL 2 PEKERJA AKTIF');
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

    component.resetFilters();
    fixture.detectChanges();
    expect(component.filteredWorkers().length).toBe(2);
  });

  it('harus menampilkan pesan empty state saat tidak ada pekerja yang cocok dengan filter', () => {
    component.setCategoryFilter('Elektronik');
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('[data-testid="workers-empty-state"]');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Belum Ada Teknisi Ditemukan');
  });

  it('harus menampilkan error state saat API menghasilkan kegagalan', () => {
    mockHomeApiService.fetchPublicWorkers.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    component.loadWorkers();
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('Terjadi kendala saat memuat data teknisi');
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Gagal memuat katalog pekerja mandiri dari server');
  });
});
