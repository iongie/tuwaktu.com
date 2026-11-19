import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BusinessInquiryStore } from './business-inquiry.store';
import { BusinessInquiryApiService } from './business-inquiry-api.service';
import { calculateBusinessMonthlyEstimate } from '../models/business-inquiry.model';

describe('BusinessInquiryStore', () => {
  let store: BusinessInquiryStore;
  let mockApiService: {
    submitBusinessInquiry: jest.Mock;
  };

  beforeEach(() => {
    mockApiService = {
      submitBusinessInquiry: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        BusinessInquiryStore,
        { provide: BusinessInquiryApiService, useValue: mockApiService },
      ],
    });

    store = TestBed.inject(BusinessInquiryStore);
  });

  it('harus menghitung estimasi biaya bulanan sesuai paket, unit, dan frekuensi', () => {
    expect(calculateBusinessMonthlyEstimate('RUTIN_PROPERTI', 10, 'BULANAN')).toBe(400000);
    expect(calculateBusinessMonthlyEstimate('MULTI_LOKASI', 30, 'MINGGUAN')).toBe(2100000);

    store.selectPlanTier('RUTIN_PROPERTI');
    store.setUnitCount(12);
    store.visitFrequency.set('BULANAN');
    expect(store.estimatedMonthlyFee()).toBe(450000);
  });

  it('harus memvalidasi field wajib dan menolak submit jika form belum lengkap', () => {
    store.submitInquiry();

    expect(store.hasValidationErrors()).toBe(true);
    expect(store.validationErrors()['business_name']).toContain('wajib diisi');
    expect(store.validationErrors()['altcha_payload']).toContain('captcha');
    expect(mockApiService.submitBusinessInquiry).not.toHaveBeenCalled();
  });

  it('harus mengirim pengajuan valid dan menyimpan tanda terima respon API', () => {
    mockApiService.submitBusinessInquiry.mockReturnValue(
      of({
        success: true,
        message: 'Pengajuan paket klien bisnis berhasil dikirim',
        data: {
          inquiry: {
            id: 'inq-uuid-1',
            inquiry_code: 'B2B-20261120-A1B2',
            business_name: 'Kos Melati Kemang',
            property_type: 'KOS',
            contact_name: 'Ibu Ratna',
            contact_whatsapp: '6281288992211',
            contact_email: '',
            city_zone: 'Jakarta Selatan',
            property_address: 'Jl. Kemang Timur No. 18, Jakarta Selatan',
            plan_tier: 'RUTIN_PROPERTI',
            service_focus: 'Servis & Cuci AC Rutin',
            unit_count: 12,
            visit_frequency: 'BULANAN',
            notes: '',
            estimated_monthly_fee: 450000,
            status: 'NEW',
            payment_status: 'UNPAID',
            payment_reference: '',
            admin_notes: '',
            created_at: '2026-11-20T00:00:00Z',
            updated_at: '2026-11-20T00:00:00Z',
          },
          admin_whatsapp_number: '6285290040210',
          whatsapp_share_url: 'https://wa.me/6285290040210?text=Halo',
          whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6285290040210&text=Halo',
          whatsapp_message: 'Halo',
        },
      }),
    );

    store.businessName.set('Kos Melati Kemang');
    store.contactName.set('Ibu Ratna');
    store.contactWhatsApp.set('081288992211');
    store.cityZone.set('Jakarta Selatan');
    store.propertyAddress.set('Jl. Kemang Timur No. 18, Jakarta Selatan');
    store.setUnitCount(12);
    store.altchaPayload.set('valid-altcha');

    store.submitInquiry();

    expect(mockApiService.submitBusinessInquiry).toHaveBeenCalledTimes(1);
    expect(store.createdReceipt()?.inquiry.inquiry_code).toBe('B2B-20261120-A1B2');
    expect(store.submissionError()).toBeNull();
  });

  it('harus mereset captcha dan menampilkan pesan error saat API gagal', () => {
    mockApiService.submitBusinessInquiry.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    store.businessName.set('Kantor Maju');
    store.contactName.set('Bapak Budi');
    store.contactWhatsApp.set('081234567890');
    store.cityZone.set('Jakarta Pusat');
    store.propertyAddress.set('Jl. Thamrin No. 20, Jakarta Pusat');
    store.altchaPayload.set('valid-altcha');

    store.submitInquiry();

    expect(store.submissionError()).toContain('Terjadi kendala saat mengirim pengajuan');
    expect(store.altchaPayload()).toBeNull();
    expect(store.altchaResetTick()).toBe(1);
  });
});

