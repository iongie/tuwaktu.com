import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminB2BInquiriesPageComponent } from './admin-b2b-inquiries-page.component';
import { AdminB2BInquiryApiService } from '../../../services/admin-b2b-inquiry-api.service';

describe('AdminB2BInquiriesPageComponent', () => {
  let fixture: ComponentFixture<AdminB2BInquiriesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminB2BInquiriesPageComponent],
      providers: [
        {
          provide: AdminB2BInquiryApiService,
          useValue: {
            fetchInquiries: jest.fn().mockReturnValue(
              of({
                success: true,
                message: 'OK',
                data: {
                  items: [
                    {
                      id: 'b2b-1',
                      inquiry_code: 'B2B-20261120-0011',
                      business_name: 'Kos Melati Kemang',
                      property_type: 'KOS',
                      contact_name: 'Ibu Ratna',
                      contact_whatsapp: '6281288992211',
                      contact_email: '',
                      city_zone: 'Jakarta Selatan',
                      property_address: 'Jl. Kemang Timur No. 18',
                      plan_tier: 'RUTIN_PROPERTI',
                      service_focus: 'Servis & Cuci AC Rutin',
                      unit_count: 12,
                      visit_frequency: 'BULANAN',
                      notes: '',
                      estimated_monthly_fee: 450000,
                      agreed_monthly_fee: 500000,
                      status: 'ACTIVE',
                      payment_status: 'PAID',
                      payment_reference: 'BCA-001',
                      admin_notes: '',
                      created_at: '2026-11-20T00:00:00Z',
                      updated_at: '2026-11-20T00:00:00Z',
                    },
                  ],
                  stats: {
                    total_count: 1,
                    pending_follow_up_count: 0,
                    active_contract_count: 1,
                    paid_monthly_revenue: 500000,
                  },
                },
              }),
            ),
            updateInquiry: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminB2BInquiriesPageComponent);
    fixture.detectChanges();
  });

  it('harus merender statistik riil dan daftar pengajuan klien bisnis', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Pengajuan Perawatan Properti & Kantor');
    expect(el.querySelector('[data-testid="b2b-stat-total"]')?.textContent?.trim()).toBe('1');
    expect(el.querySelector('[data-testid="b2b-stat-active"]')?.textContent?.trim()).toBe('1');
    expect(el.textContent).toContain('Kos Melati Kemang');
    expect(el.textContent).toContain('B2B-20261120-0011');
  });
});

