import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminB2BInquiryStore } from './admin-b2b-inquiry.store';
import { AdminB2BInquiryApiService } from './admin-b2b-inquiry-api.service';
import { AdminB2BInquiryItem } from '../models/admin-b2b-inquiry.model';

const SAMPLE_INQUIRY: AdminB2BInquiryItem = {
  id: 'b2b-1',
  inquiry_code: 'B2B-20261120-0011',
  business_name: 'Kos Melati Kemang',
  property_type: 'KOS',
  contact_name: 'Ibu Ratna',
  contact_whatsapp: '6281288992211',
  contact_email: 'ratna@kosmelati.id',
  city_zone: 'Jakarta Selatan',
  property_address: 'Jl. Kemang Timur No. 18',
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
};

describe('AdminB2BInquiryStore', () => {
  let store: AdminB2BInquiryStore;
  let mockApiService: {
    fetchInquiries: jest.Mock;
    updateInquiry: jest.Mock;
  };

  beforeEach(() => {
    mockApiService = {
      fetchInquiries: jest.fn().mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: {
            items: [SAMPLE_INQUIRY],
            stats: {
              total_count: 1,
              pending_follow_up_count: 1,
              active_contract_count: 0,
              paid_monthly_revenue: 0,
            },
          },
        }),
      ),
      updateInquiry: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AdminB2BInquiryStore,
        { provide: AdminB2BInquiryApiService, useValue: mockApiService },
      ],
    });

    store = TestBed.inject(AdminB2BInquiryStore);
  });

  it('harus memuat daftar pengajuan dan statistik riil dari API', () => {
    store.loadInquiries();

    expect(mockApiService.fetchInquiries).toHaveBeenCalledTimes(1);
    expect(store.inquiries().length).toBe(1);
    expect(store.stats().total_count).toBe(1);
    expect(store.stats().pending_follow_up_count).toBe(1);
  });

  it('harus memperbarui pengajuan, menutup modal, dan memuat ulang daftar', () => {
    mockApiService.updateInquiry.mockReturnValue(
      of({
        success: true,
        message: 'Diperbarui',
        data: {
          ...SAMPLE_INQUIRY,
          status: 'ACTIVE',
          payment_status: 'PAID',
          agreed_monthly_fee: 500000,
        },
      }),
    );

    store.openManageModal(SAMPLE_INQUIRY);
    expect(store.isModalOpen()).toBe(true);

    store.saveInquiryUpdate('b2b-1', {
      status: 'ACTIVE',
      payment_status: 'PAID',
      agreed_monthly_fee: 500000,
    });

    expect(mockApiService.updateInquiry).toHaveBeenCalledWith('b2b-1', {
      status: 'ACTIVE',
      payment_status: 'PAID',
      agreed_monthly_fee: 500000,
    });
    expect(store.isModalOpen()).toBe(false);
    expect(store.feedbackMessage()).toContain('B2B-20261120-0011');
  });

  it('harus menampilkan error saat API gagal', () => {
    mockApiService.fetchInquiries.mockReturnValue(
      throwError(() => ({ error: { message: 'Sesi berakhir' } })),
    );

    store.loadInquiries();

    expect(store.errorMessage()).toBe('Sesi berakhir');
    expect(store.isLoading()).toBe(false);
  });
});

