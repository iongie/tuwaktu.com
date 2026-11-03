import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ServiceCatalogCardComponent } from './service-catalog-card.component';
import { PublicServiceCatalogItem } from '../../../models/worker-catalog.model';

describe('ServiceCatalogCardComponent', () => {
  let component: ServiceCatalogCardComponent;
  let componentRef: ComponentRef<ServiceCatalogCardComponent>;
  let fixture: ComponentFixture<ServiceCatalogCardComponent>;

  const mockServiceItem: PublicServiceCatalogItem = {
    id: 'svc-card-1',
    name: 'Deep Clean Detailing',
    description: 'Pembersihan kerak kamar mandi dan dapur intensif',
    price: 65000,
    duration_minutes: 120,
    rate_type: 'HOURLY',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCatalogCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCatalogCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('serviceItem', mockServiceItem);
    componentRef.setInput('isSelected', false);
    componentRef.setInput('formattedPrice', 'Rp 65.000 / jam');
    fixture.detectChanges();
  });

  it('harus membuat instance komponen kartu katalog layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender nama, deskripsi, dan harga layanan secara tepat', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Deep Clean Detailing');
    expect(compiled.textContent).toContain('Pembersihan kerak kamar mandi');
    expect(compiled.textContent).toContain('Rp 65.000 / jam');
    expect(compiled.textContent).toContain('STANDAR');
  });

  it('harus menampilkan badge PILIHAN TERPILIH dan styling aktif ketika isSelected bernilai true', () => {
    componentRef.setInput('isSelected', true);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('PILIHAN TERPILIH');
    expect(compiled.querySelector('.ring-voltage-orange')).not.toBeNull();
  });

  it('harus memancarkan event selectService saat kartu diklik', () => {
    let emittedService: PublicServiceCatalogItem | null = null;
    component.selectService.subscribe((item) => {
      emittedService = item;
    });

    const cardEl: HTMLElement | null = fixture.nativeElement.querySelector('[role="button"]');
    expect(cardEl).not.toBeNull();
    cardEl?.click();

    expect(emittedService).toEqual(mockServiceItem);
  });

  it('harus memancarkan event selectService saat tombol Enter ditekan', () => {
    let emittedService: PublicServiceCatalogItem | null = null;
    component.selectService.subscribe((item) => {
      emittedService = item;
    });

    const cardEl: HTMLElement | null = fixture.nativeElement.querySelector('[role="button"]');
    expect(cardEl).not.toBeNull();
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    cardEl?.dispatchEvent(event);

    expect(emittedService).toEqual(mockServiceItem);
  });
});
