import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { TechnicianProfileHeaderComponent } from './technician-profile-header.component';
import { PublicTechnicianProfile } from '../../../models/worker-catalog.model';

describe('TechnicianProfileHeaderComponent', () => {
  let component: TechnicianProfileHeaderComponent;
  let componentRef: ComponentRef<TechnicianProfileHeaderComponent>;
  let fixture: ComponentFixture<TechnicianProfileHeaderComponent>;

  const baseWorker: PublicTechnicianProfile = {
    id: 'worker-header-1',
    slug: 'budi-santoso',
    name: 'Budi Santoso',
    bio: 'Teknisi AC dan kelistrikan berpengalaman',
    avatar_url: 'https://example.com/budi.jpg',
    rating: 4.9,
    review_count: 42,
    zone: 'Jakarta Selatan',
    base_price: 75000,
    rate_type: 'HOURLY',
    services: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianProfileHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianProfileHeaderComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('workerProfile', baseWorker);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen header profil teknisi', () => {
    expect(component).toBeTruthy();
  });

  it('harus memformat tarif per jam secara dinamis ketika rate_type adalah HOURLY', () => {
    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: 75000,
      rate_type: 'HOURLY',
    });
    fixture.detectChanges();

    const formatted = component.formattedRate();
    expect(formatted).not.toBeNull();
    expect(formatted).toContain('75.000');
    expect(formatted).toContain('/ Jam');

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.textContent).toContain('75.000');
    expect(nativeElement.textContent).toContain('/ Jam');
  });

  it('harus memformat tarif per sesi secara dinamis ketika rate_type adalah UNIT', () => {
    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: 350000,
      rate_type: 'UNIT',
    });
    fixture.detectChanges();

    const formatted = component.formattedRate();
    expect(formatted).not.toBeNull();
    expect(formatted).toContain('350.000');
    expect(formatted).toContain('/ Sesi');

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.textContent).toContain('350.000');
    expect(nativeElement.textContent).toContain('/ Sesi');
  });

  it('harus membaca tarif dari layanan pertama jika base_price profil kosong', () => {
    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: 0,
      rate_type: '',
      services: [
        {
          id: 'srv-1',
          name: 'Cuci AC',
          description: 'Cuci AC standar',
          price: 80000,
          base_price: 80000,
          rate_type: 'UNIT',
          duration_minutes: 45,
        },
      ],
    });
    fixture.detectChanges();

    const formatted = component.formattedRate();
    expect(formatted).not.toBeNull();
    expect(formatted).toContain('80.000');
    expect(formatted).toContain('/ Sesi');
  });

  it('harus mengembalikan null untuk formattedRate jika tidak ada harga valid atau bernilai NaN', () => {
    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: 0,
      services: [],
    });
    fixture.detectChanges();

    expect(component.formattedRate()).toBeNull();

    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: NaN,
      services: [],
    });
    fixture.detectChanges();

    expect(component.formattedRate()).toBeNull();
  });

  it('harus mengenali rate_type huruf kecil (case-insensitive) seperti unit', () => {
    componentRef.setInput('workerProfile', {
      ...baseWorker,
      base_price: 250000,
      rate_type: 'unit',
    });
    fixture.detectChanges();

    const formatted = component.formattedRate();
    expect(formatted).not.toBeNull();
    expect(formatted).toContain('250.000');
    expect(formatted).toContain('/ Sesi');
  });
});
