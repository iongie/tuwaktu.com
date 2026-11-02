import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import {
  BookingFormDraft,
  ServiceBookingFormComponent,
} from './service-booking-form.component';
import { PublicServiceCatalogItem } from '../../../models/worker-catalog.model';
import { FeeCalculationResult } from '../../../models/service-booking.model';

describe('ServiceBookingFormComponent', () => {
  let component: ServiceBookingFormComponent;
  let componentRef: ComponentRef<ServiceBookingFormComponent>;
  let fixture: ComponentFixture<ServiceBookingFormComponent>;

  const initialDraft: BookingFormDraft = {
    clientFullName: 'Ahmad Dahlan',
    clientContactPhone: '081234567890',
    clientEmailAddress: 'ahmad@example.com',
    serviceLocationAddress: 'Jl. Sudirman No. 10',
    serviceOperationalZone: 'Jakarta Selatan',
    reservationScheduledDate: '2026-11-05T10:00',
    additionalClientNotes: 'Mohon bawa tangga lipat',
  };

  const sampleService: PublicServiceCatalogItem = {
    id: 'svc-001',
    name: 'Servis AC Standar',
    description: 'Pembersihan evaporator dan blower unit',
    price: 75000,
    duration_minutes: 60,
  };

  const sampleFee: FeeCalculationResult = {
    worker_id: 'worker-1',
    service_id: 'svc-001',
    service_price: 75000,
    distance_km: 7.5,
    max_radius_km: 15.0,
    free_radius_km: 3.0,
    chargeable_km: 4.5,
    extra_fee_per_km: 3000,
    transport_fee: 15000,
    total_price: 90000,
    is_within_radius: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceBookingFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceBookingFormComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('formDraft', initialDraft);
    componentRef.setInput('hasActiveProfile', true);
    fixture.detectChanges();
  });

  it('harus membuat instance komponen formulir booking', () => {
    expect(component).toBeTruthy();
  });

  it('harus menampilkan nama dan tarif layanan terpilih', () => {
    componentRef.setInput('selectedService', sampleService);
    componentRef.setInput('formattedServicePrice', 'Rp 75.000');
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Servis AC Standar');
    expect(compiled.textContent).toContain('Rp 75.000');
  });

  it('harus menampilkan rincian ongkos jalan ketika feeCalculation tersedia', () => {
    componentRef.setInput('selectedService', sampleService);
    componentRef.setInput('formattedServicePrice', 'Rp 75.000');
    componentRef.setInput('feeCalculation', sampleFee);
    componentRef.setInput('formattedTotalEstimate', 'Rp 90.000');
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Rincian Pembayaran');
    expect(compiled.textContent).toContain('7.5 km');
    expect(compiled.textContent).toContain('3 km');
    expect(compiled.textContent).toContain('15.000');
    expect(compiled.textContent).toContain('Rp 90.000');
  });

  it('harus menampilkan peringatan di luar jangkauan dan menonaktifkan tombol pemesanan saat isOutOfRadius true', () => {
    componentRef.setInput('isOutOfRadius', true);
    componentRef.setInput(
      'feeCalculationError',
      'Di luar jangkauan: Lokasi pemesanan melebihi batas jangkauan layanan pekerja.'
    );
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Di Luar Jangkauan Layanan');

    const submitBtn: HTMLButtonElement | null = compiled.querySelector('button[type="submit"]');
    expect(submitBtn).not.toBeNull();
    expect(submitBtn?.disabled).toBe(true);
    expect(submitBtn?.textContent).toContain('Di Luar Jangkauan');
  });

  it('harus memancarkan event clientCoordinatesChange saat koordinat diubah', () => {
    let selectedCoords: { lat: number; lng: number } | null = null;
    component.clientCoordinatesChange.subscribe((coords) => {
      selectedCoords = coords;
    });

    component.clientCoordinatesChange.emit({ lat: -6.2443, lng: 106.7997 });
    expect(selectedCoords).toEqual({ lat: -6.2443, lng: 106.7997 });
  });

  it('harus memancarkan event submitForm saat formulir disubmit', () => {
    let submitted = false;
    component.submitForm.subscribe(() => {
      submitted = true;
    });

    const form: HTMLFormElement | null = fixture.nativeElement.querySelector('form');
    expect(form).not.toBeNull();
    form?.dispatchEvent(new Event('submit'));

    expect(submitted).toBe(true);
  });
});
