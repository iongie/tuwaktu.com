import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingSuccessModalComponent } from './booking-success-modal.component';
import { ServiceBookingConfirmation } from '../../../models/service-booking.model';

describe('BookingSuccessModalComponent', () => {
  let component: BookingSuccessModalComponent;
  let fixture: ComponentFixture<BookingSuccessModalComponent>;

  const mockConfirmation: ServiceBookingConfirmation = {
    booking_id: 'bkg-123',
    booking_code: 'BK-7B2A91F0',
    worker_id: 'worker-456',
    worker_name: 'Budi Santoso',
    worker_whatsapp: '6281234567890',
    service_id: 'svc-789',
    service_name: 'Servis AC Standar',
    client_name: 'Ahmad Fauzi',
    location: 'Jl. Sudirman No. 10, Jakarta Pusat',
    zone: 'Jakarta Pusat',
    booking_date: '2026-11-10T10:00:00Z',
    total_price: 150000,
    transport_fee: 15000,
    status: 'PENDING_WA',
    created_at: '2026-11-08T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingSuccessModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSuccessModalComponent);
    component = fixture.componentInstance;
  });

  it('harus berhasil diinisialisasi', () => {
    expect(component).toBeTruthy();
  });

  it('tidak menampilkan dialog jika confirmation bernilai null', () => {
    fixture.componentRef.setInput('confirmation', null);
    fixture.componentRef.setInput('whatsappUrl', '');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('menampilkan rincian pemesanan saat confirmation diberikan', () => {
    fixture.componentRef.setInput('confirmation', mockConfirmation);
    fixture.componentRef.setInput('whatsappUrl', 'https://wa.me/6281234567890?text=Halo');
    fixture.detectChanges();

    const bookingCode = fixture.nativeElement.querySelector('#modalBookingCode');
    const serviceName = fixture.nativeElement.querySelector('#modalServiceName');
    const workerName = fixture.nativeElement.querySelector('#modalWorkerName');
    const clientName = fixture.nativeElement.querySelector('#modalClientName');
    const totalPrice = fixture.nativeElement.querySelector('#modalTotalPrice');

    expect(bookingCode?.textContent).toContain('BK-7B2A91F0');
    expect(serviceName?.textContent).toContain('Servis AC Standar');
    expect(workerName?.textContent).toContain('Budi Santoso');
    expect(clientName?.textContent).toContain('Ahmad Fauzi');
    expect(totalPrice?.textContent).toContain('150.000');
  });

  it('memancarkan event proceedToWhatsApp saat tombol WhatsApp diklik', () => {
    fixture.componentRef.setInput('confirmation', mockConfirmation);
    fixture.componentRef.setInput('whatsappUrl', 'https://wa.me/6281234567890?text=Halo');
    fixture.detectChanges();

    let proceedEmitted = false;
    component.proceedToWhatsApp.subscribe(() => {
      proceedEmitted = true;
    });

    const btnWhatsApp = fixture.nativeElement.querySelector('#btnProceedToWhatsApp');
    btnWhatsApp?.click();

    expect(proceedEmitted).toBe(true);
  });

  it('memancarkan event close saat tombol tutup dialog diklik', () => {
    fixture.componentRef.setInput('confirmation', mockConfirmation);
    fixture.componentRef.setInput('whatsappUrl', 'https://wa.me/6281234567890?text=Halo');
    fixture.detectChanges();

    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    const btnClose = fixture.nativeElement.querySelector('#btnCloseModal');
    btnClose?.click();

    expect(closeEmitted).toBe(true);
  });

  it('memancarkan event close saat area backdrop diklik', () => {
    fixture.componentRef.setInput('confirmation', mockConfirmation);
    fixture.componentRef.setInput('whatsappUrl', 'https://wa.me/6281234567890?text=Halo');
    fixture.detectChanges();

    let closeEmitted = false;
    component.close.subscribe(() => {
      closeEmitted = true;
    });

    const backdrop = fixture.nativeElement.querySelector('[role="dialog"]');
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeEmitted).toBe(true);
  });
});

