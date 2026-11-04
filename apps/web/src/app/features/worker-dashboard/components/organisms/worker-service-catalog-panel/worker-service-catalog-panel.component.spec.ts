import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerServiceCatalogPanelComponent } from './worker-service-catalog-panel.component';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

describe('WorkerServiceCatalogPanelComponent', () => {
  let fixture: ComponentFixture<WorkerServiceCatalogPanelComponent>;
  let component: WorkerServiceCatalogPanelComponent;

  const mockServices: WorkerServiceCatalogItem[] = [
    {
      id: 'srv-1',
      code: 'DCL-01',
      name: 'Deep Clean Detailing',
      description: 'Pembersihan kerak kamar mandi',
      price: 65000,
      base_price: 65000,
      rate_type: 'HOURLY',
      duration_minutes: 120,
      min_hours: 2.0,
      equipment_label: 'Polisher & Vac',
      equipment_badge: 'Alat Berat',
      equipment_icon: 'verified',
      image_url: 'https://example.com/photo.jpg',
      tags: ['Bahan Ramah Lingkungan'],
      status: 'ACTIVE',
      is_public: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerServiceCatalogPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerServiceCatalogPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('services', mockServices);
    fixture.componentRef.setInput('activeTab', 'ACTIVE');
    fixture.detectChanges();
  });

  it('harus membuat instance panel katalog layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender kartu layanan yang diberikan', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Deep Clean Detailing');
  });

  it('harus menampilkan pesan kosong saat services bernilai array kosong', () => {
    fixture.componentRef.setInput('services', []);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Tidak ada layanan dalam tab Semua Layanan Aktif');
  });
});
