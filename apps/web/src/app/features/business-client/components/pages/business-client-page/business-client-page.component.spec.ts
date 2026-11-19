import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BusinessClientPageComponent } from './business-client-page.component';
import { BusinessInquiryApiService } from '../../../services/business-inquiry-api.service';
import { BusinessInquiryStore } from '../../../services/business-inquiry.store';
import { AuthService } from '../../../../auth/services/auth.service';

describe('BusinessClientPageComponent', () => {
  let fixture: ComponentFixture<BusinessClientPageComponent>;
  let store: BusinessInquiryStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessClientPageComponent],
      providers: [
        provideRouter([]),
        AuthService,
        {
          provide: BusinessInquiryApiService,
          useValue: {
            submitBusinessInquiry: jest.fn().mockReturnValue(of({ success: false, message: '' })),
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(BusinessInquiryStore);
    store.resetForNewInquiry();
    fixture = TestBed.createComponent(BusinessClientPageComponent);
    fixture.detectChanges();
  });

  it('harus merender penawaran 2 paket properti dan formulir pengajuan', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Perawatan Rutin Properti & Kantor Tanpa Repot.');
    expect(text).toContain('Paket Rutin Properti');
    expect(text).toContain('Paket Multi-Lokasi & Kantor');
    expect(text).toContain('Formulir Pengajuan Properti');
    expect(fixture.nativeElement.querySelector('[data-testid="select-plan-RUTIN_PROPERTI"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="select-plan-MULTI_LOKASI"]')).toBeTruthy();
  });

  it('harus mengubah estimasi biaya bulanan saat paket Multi-Lokasi dipilih', () => {
    const multiBtn = fixture.nativeElement.querySelector(
      '[data-testid="select-plan-MULTI_LOKASI"]',
    ) as HTMLButtonElement;
    multiBtn.click();
    fixture.detectChanges();

    expect(store.selectedPlanTier()).toBe('MULTI_LOKASI');
    expect(store.unitCount()).toBe(30);
    const feeText = fixture.nativeElement.querySelector('[data-testid="estimated-monthly-fee"]')?.textContent;
    expect(feeText).toContain('1.050.000');
  });

  it('harus menampilkan kartu tanda terima setelah createdReceipt terisi', () => {
    store.createdReceipt.set({
      inquiry: {
        id: 'id-1',
        inquiry_code: 'B2B-20261120-FF10',
        business_name: 'Kos Harmoni',
        property_type: 'KOS',
        contact_name: 'Ibu Ani',
        contact_whatsapp: '6281234567890',
        contact_email: '',
        city_zone: 'Depok',
        property_address: 'Jl. Margonda No. 12',
        plan_tier: 'RUTIN_PROPERTI',
        service_focus: 'Servis & Cuci AC Rutin',
        unit_count: 10,
        visit_frequency: 'BULANAN',
        notes: '',
        estimated_monthly_fee: 400000,
        status: 'NEW',
        payment_status: 'UNPAID',
        payment_reference: '',
        admin_notes: '',
        created_at: '2026-11-20T00:00:00Z',
        updated_at: '2026-11-20T00:00:00Z',
      },
      admin_whatsapp_number: '6285290040210',
      whatsapp_share_url: 'https://wa.me/6285290040210?text=B2B',
      whatsapp_web_url: 'https://web.whatsapp.com/send?phone=6285290040210&text=B2B',
      whatsapp_message: 'B2B',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="b2b-receipt-card"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="receipt-inquiry-code"]')?.textContent).toContain('B2B-20261120-FF10');
  });
});

