import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeWorkerCardComponent } from './home-worker-card.component';
import { FeaturedWorker } from '../../../models/home.model';

describe('HomeWorkerCardComponent', () => {
  let component: HomeWorkerCardComponent;
  let fixture: ComponentFixture<HomeWorkerCardComponent>;

  const mockWorker: FeaturedWorker = {
    id: 'worker-1',
    slug: 'sarah-cleaning',
    name: 'Sarah Melinda',
    specialty: 'Spesialis Sanitasi & Deep Clean',
    category: 'Sanitasi',
    rating: 4.9,
    reviewCount: 48,
    basecampZone: 'Tebet, Jakarta Selatan',
    startingPrice: 65000,
    priceUnit: 'jam',
    avatarUrl: 'https://example.com/sarah.jpg',
    isVerified: true,
    specialtyTags: ['Deep Clean', 'Sterilisasi Kasur', 'Bebas Tungau'],
    bufferMinutes: 60,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeWorkerCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeWorkerCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('worker', mockWorker);
    fixture.detectChanges();
  });

  it('harus merender informasi nama, spesialisasi, dan pangkalan pekerja', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Sarah Melinda');
    expect(el.textContent).toContain('Spesialis Sanitasi & Deep Clean');
    expect(el.textContent).toContain('Tebet, Jakarta Selatan');
    expect(el.textContent).toContain('Buffer 60m');
  });

  it('harus menampilkan tarif awal yang terformat dalam rupiah', () => {
    expect(component.formattedStartingPrice()).toContain('65.000');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('65.000');
    expect(el.textContent).toContain('/ jam');
  });

  it('harus menyertakan tautan navigasi ke profil slug pekerja dengan label yang tepat', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/sarah-cleaning');
    expect(link.textContent).toContain('Lihat Jadwal & Pesan');
  });

  it('harus menampilkan inisial yang tepat jika avatar tidak ada', () => {
    fixture.componentRef.setInput('worker', {
      ...mockWorker,
      avatarUrl: '',
    });
    fixture.detectChanges();

    expect(component.initials()).toBe('SM');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('SM');
  });
});
