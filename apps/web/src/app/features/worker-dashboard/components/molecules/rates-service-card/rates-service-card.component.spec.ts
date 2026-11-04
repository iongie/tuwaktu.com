import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesServiceCardComponent } from './rates-service-card.component';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

describe('RatesServiceCardComponent', () => {
  let fixture: ComponentFixture<RatesServiceCardComponent>;
  let component: RatesServiceCardComponent;

  const sampleService: WorkerServiceCatalogItem = {
    id: 'test-1',
    code: 'DCL-01',
    name: 'Deep Clean Detailing',
    description: 'Pembersihan kerak kamar mandi membandel',
    price: 65000,
    base_price: 65000,
    rate_type: 'HOURLY',
    duration_minutes: 120,
    min_hours: 2.0,
    equipment_label: 'Polisher & Vac Industri',
    equipment_badge: 'Alat Berat Industri Siap Pakai',
    equipment_icon: 'verified',
    image_url: 'https://example.com/photo.jpg',
    tags: ['Bahan Ramah Lingkungan', 'Mesin Polisher'],
    status: 'ACTIVE',
    is_public: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesServiceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesServiceCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('service', sampleService);
    fixture.detectChanges();
  });

  it('harus membuat instance kartu layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus merender nama layanan dan tarif dengan format rupiah', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Deep Clean Detailing');
    expect(el.textContent).toContain('DCL-01');
    expect(el.textContent).toContain('100% Milik Anda');
    expect(el.textContent).toContain('Tampilkan di Profil Publik');
  });

  it('harus memancarkan toggleVisibility saat checkbox switch diklik', () => {
    let toggledId = '';
    component.toggleVisibility.subscribe((id) => {
      toggledId = id;
    });

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();

    expect(toggledId).toBe('test-1');
  });

  it('harus memancarkan editService saat tombol edit diklik', () => {
    let editedItem: WorkerServiceCatalogItem | null = null;
    component.editService.subscribe((item) => {
      editedItem = item;
    });

    const editBtn: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[1];
    editBtn.click();

    expect(editedItem).toEqual(sampleService);
  });
});
