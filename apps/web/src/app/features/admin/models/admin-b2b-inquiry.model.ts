import {
  BusinessInquiryRecord,
  BusinessInquiryStatus,
  BusinessPaymentStatus,
  BusinessPlanTier,
  BusinessPropertyType,
  BusinessVisitFrequency,
} from '../../business-client/models/business-inquiry.model';

export type AdminB2BInquiryItem = BusinessInquiryRecord;
export type AdminB2BInquiryStatus = BusinessInquiryStatus;
export type AdminB2BPaymentStatus = BusinessPaymentStatus;
export type AdminB2BPropertyType = BusinessPropertyType;
export type AdminB2BPlanTier = BusinessPlanTier;
export type AdminB2BVisitFrequency = BusinessVisitFrequency;

export interface AdminB2BInquirySummaryStats {
  readonly total_count: number;
  readonly pending_follow_up_count: number;
  readonly active_contract_count: number;
  readonly paid_monthly_revenue: number;
}

export interface AdminB2BInquiryListData {
  readonly items: readonly AdminB2BInquiryItem[];
  readonly stats: AdminB2BInquirySummaryStats;
}

export interface AdminB2BInquiryListApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: AdminB2BInquiryListData;
  readonly error?: unknown;
}

export interface AdminB2BInquiryDetailApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: AdminB2BInquiryItem;
  readonly error?: unknown;
}

export interface UpdateAdminB2BInquiryPayload {
  readonly status?: AdminB2BInquiryStatus;
  readonly payment_status?: AdminB2BPaymentStatus;
  readonly agreed_monthly_fee?: number | null;
  readonly payment_reference?: string;
  readonly admin_notes?: string;
}

export interface AdminB2BFilterParams {
  readonly status?: string;
  readonly payment_status?: string;
  readonly q?: string;
}

export const B2B_STATUS_LABELS: Record<AdminB2BInquiryStatus, string> = {
  NEW: 'Pengajuan Baru',
  CONTACTED: 'Sudah Dihubungi',
  PROPOSAL_SENT: 'Penawaran Dikirim',
  ACTIVE: 'Kontrak Aktif',
  PAUSED: 'Dijeda',
  REJECTED: 'Dibatalkan / Ditolak',
};

export const B2B_PAYMENT_STATUS_LABELS: Record<AdminB2BPaymentStatus, string> = {
  UNPAID: 'Belum Dibayar',
  WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
  PAID: 'Lunas',
  OVERDUE: 'Jatuh Tempo',
};

export const B2B_PROPERTY_TYPE_LABELS: Record<AdminB2BPropertyType, string> = {
  KOS: 'Rumah Kos',
  KANTOR: 'Kantor',
  RUKO_KAFE: 'Ruko / Kafe',
  APARTEMEN: 'Apartemen / Penginapan',
  LAINNYA: 'Properti Lainnya',
};

export const B2B_FREQUENCY_LABELS: Record<AdminB2BVisitFrequency, string> = {
  MINGGUAN: 'Mingguan',
  BULANAN: 'Sebulan Sekali',
  DWI_BULANAN: '2 Bulan Sekali',
  TRIBULANAN: '3 Bulan Sekali',
};

export function getB2BPlanLabel(tier: AdminB2BPlanTier): string {
  return tier === 'MULTI_LOKASI'
    ? 'Paket Multi-Lokasi & Kantor'
    : 'Paket Rutin Properti';
}

