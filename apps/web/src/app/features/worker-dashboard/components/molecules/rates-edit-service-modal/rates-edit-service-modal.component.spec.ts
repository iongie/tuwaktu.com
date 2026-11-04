import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatesEditServiceModalComponent } from './rates-edit-service-modal.component';
import { WorkerServiceCatalogItem } from '../../../models/worker-profile.model';

describe('RatesEditServiceModalComponent', () => {
  let fixture: ComponentFixture<RatesEditServiceModalComponent>;
  let component: RatesEditServiceModalComponent;

  const sampleService: WorkerServiceCatalogItem = {
    id: 'test-1',
    code: 'DCL-01',
    name: 'Deep Clean Detailing',
    description: 'Pembersihan kerak kamar mandi',
    price: 65000,
    base_price: 65000,
    rate_type: 'HOURLY',
    duration_minutes: 120,
    min_hours: 2.0,
    equipment_label: 'Polisher & Vac Industri',
    equipment_badge: 'Alat Berat Industri Siap Pakai',
    equipment_icon: 'verified',
    image_url: 'https://example.com/photo.jpg',
    tags: ['Bahan Kimia Ramah Lingkungan'],
    status: 'ACTIVE',
    is_public: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatesEditServiceModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatesEditServiceModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('serviceItem', sampleService);
    fixture.detectChanges();
  });

  it('harus membuat instance modal edit layanan', () => {
    expect(component).toBeTruthy();
  });

  it('harus mengisi field form sesuai data existing layanan', () => {
    expect(component.serviceName()).toBe('Deep Clean Detailing');
    expect(component.servicePrice()).toBe(65000);
    expect(component.rateType()).toBe('HOURLY');
  });

  it('harus memancarkan event save saat form valid disubmit', () => {
    let savedData: WorkerServiceCatalogItem | null = null;
    component.save.subscribe((data) => {
      savedData = data;
    });

    component.servicePrice.set(80000);
    component.submitForm();

    expect(savedData).toBeTruthy();
    expect(savedData?.price).toBe(80000);
  });

  it('harus menolak submit form dan menampilkan pesan error jika harga bernilai 0 atau negatif', () => {
    let savedData: WorkerServiceCatalogItem | null = null;
    component.save.subscribe((data) => {
      savedData = data;
    });

    component.servicePrice.set(0);
    component.submitForm();

    expect(savedData).toBeNull();
    expect(component.validationErrors()['price']).toBe('Nominal tarif harus lebih besar dari Rp 0.');

    component.servicePrice.set(-5000);
    component.submitForm();

    expect(savedData).toBeNull();
    expect(component.validationErrors()['price']).toBe('Nominal tarif harus lebih besar dari Rp 0.');
  });

  it('harus menolak submit jika nama layanan kosong atau durasi jam <= 0', () => {
    let savedData: WorkerServiceCatalogItem | null = null;
    component.save.subscribe((data) => {
      savedData = data;
    });

    component.serviceName.set('   ');
    component.serviceHours.set(0);
    component.submitForm();

    expect(savedData).toBeNull();
    expect(component.validationErrors()['name']).toBe('Nama layanan wajib diisi.');
    expect(component.validationErrors()['hours']).toBe('Durasi alokasi jam harus lebih besar dari 0.');
  });
});
