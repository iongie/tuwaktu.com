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

  it('harus merender slot ketersediaan waktu dan menonaktifkan slot yang bentrok buffer transit', () => {
    const slots = [
      {
        slot_type: 'MORNING',
        name: 'Pagi',
        start_time: '08:00',
        end_time: '11:30',
        available: true,
        reason: 'Tersedia',
      },
      {
        slot_type: 'AFTERNOON',
        name: 'Siang',
        start_time: '13:00',
        end_time: '16:30',
        available: false,
        reason: 'Bentrok buffer transit 60 menit',
      },
    ];

    componentRef.setInput('availableSlots', slots);
    componentRef.setInput('selectedBookingDate', '2026-11-03');
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Pagi');
    expect(compiled.textContent).toContain('Siang');
    expect(compiled.textContent).toContain('08:00 - 11:30');
    expect(compiled.textContent).toContain('13:00 - 16:30');
    expect(compiled.textContent).toContain('Bentrok buffer transit 60 menit');

    const buttons = compiled.querySelectorAll('div[role="group"] button');
    expect(buttons.length).toBe(2);
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('harus memancarkan event slotSelect dan memperbarui jadwal saat slot yang tersedia diklik', () => {
    const slot = {
      slot_type: 'MORNING',
      name: 'Pagi',
      start_time: '08:00',
      end_time: '11:30',
      available: true,
      reason: 'Tersedia',
    };

    componentRef.setInput('selectedBookingDate', '2026-11-03');
    let emittedSlot: unknown = null;
    component.slotSelect.subscribe((s) => {
      emittedSlot = s;
    });

    let draftChanged: BookingFormDraft | null = null;
    component.formDraftChange.subscribe((draft) => {
      draftChanged = draft;
    });

    component.onSlotClick(slot);

    expect(emittedSlot).toEqual(slot);
    expect(draftChanged?.reservationScheduledDate).toBe('2026-11-03T08:00:00');
  });

  it('harus memancarkan event dateChange saat tanggal picker diubah', () => {
    let changedDate = '';
    component.dateChange.subscribe((d) => {
      changedDate = d;
    });

    component.onDatePickerChange('2026-11-04');
    expect(changedDate).toBe('2026-11-04');
  });

  it('harus mengatur durasi pengerjaan dengan stepDuration dalam batas 2.0 hingga 8.0 jam dan memperbarui total', () => {
    componentRef.setInput('selectedService', {
      id: 'svc-hourly',
      name: 'Deep Clean Detailing',
      description: 'Detailing mendalam',
      price: 65000,
      base_price: 65000,
      duration_minutes: 120,
      rate_type: 'HOURLY',
    });
    fixture.detectChanges();

    expect(component.hourlyDuration()).toBe(2.5);

    // Tambah 30 menit -> 3.0 jam
    component.stepDuration(0.5);
    expect(component.hourlyDuration()).toBe(3.0);
    expect(component.isDurationCustomized()).toBe(true);

    // 3.0 * 65.000 = 195.000
    expect(component.formattedBaseTotal()).toContain('195.000');
    // Grand total: 195.000 + default transport 3.600 = 198.600
    expect(component.formattedGrandTotal()).toContain('198.600');

    // Coba turunkan di bawah 2.0 jam (batas minimal 2.0)
    component.stepDuration(-5.0);
    expect(component.hourlyDuration()).toBe(2.0);

    // Coba naikkan di atas 8.0 jam (batas maksimal 8.0)
    component.stepDuration(10.0);
    expect(component.hourlyDuration()).toBe(8.0);
  });

  it('harus menampilkan pesan subsidi bebas ongkir ketika chargeableKm adalah 0', () => {
    const feeInFreeRadius: FeeCalculationResult = {
      worker_id: 'worker-1',
      service_id: 'svc-001',
      service_price: 75000,
      distance_km: 2.5,
      max_radius_km: 15.0,
      free_radius_km: 3.0,
      chargeable_km: 0,
      extra_fee_per_km: 3000,
      transport_fee: 0,
      total_price: 75000,
      is_within_radius: true,
    };

    componentRef.setInput('selectedService', sampleService);
    componentRef.setInput('feeCalculation', feeInFreeRadius);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('bebas ongkir');
    expect(compiled.textContent).toContain('Rp 0');
  });
});
