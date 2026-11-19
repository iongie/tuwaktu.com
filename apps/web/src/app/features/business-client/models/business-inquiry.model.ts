export type BusinessPropertyType =
  | 'KOS'
  | 'KANTOR'
  | 'RUKO_KAFE'
  | 'APARTEMEN'
  | 'LAINNYA';

export type BusinessPlanTier = 'RUTIN_PROPERTI' | 'MULTI_LOKASI';

export type BusinessVisitFrequency =
  | 'MINGGUAN'
  | 'BULANAN'
  | 'DWI_BULANAN'
  | 'TRIBULANAN';

export type BusinessInquiryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'PROPOSAL_SENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REJECTED';

export type BusinessPaymentStatus =
  | 'UNPAID'
  | 'WAITING_CONFIRMATION'
  | 'PAID'
  | 'OVERDUE';

export interface BusinessPlanOption {
  readonly tier: BusinessPlanTier;
  readonly name: string;
  readonly audienceLabel: string;
  readonly summary: string;
  readonly baseMonthlyFee: number;
  readonly perUnitFee: number;
  readonly scopeItems: readonly string[];
}

export interface SelectableOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
}

export interface CreateBusinessInquiryPayload {
  readonly business_name: string;
  readonly property_type: BusinessPropertyType;
  readonly contact_name: string;
  readonly contact_whatsapp: string;
  readonly contact_email: string;
  readonly city_zone: string;
  readonly property_address: string;
  readonly plan_tier: BusinessPlanTier;
  readonly service_focus: string;
  readonly unit_count: number;
  readonly visit_frequency: BusinessVisitFrequency;
  readonly preferred_start_date: string;
  readonly notes: string;
  readonly altcha_payload: string;
}

export interface BusinessInquiryRecord {
  readonly id: string;
  readonly inquiry_code: string;
  readonly business_name: string;
  readonly property_type: BusinessPropertyType;
  readonly contact_name: string;
  readonly contact_whatsapp: string;
  readonly contact_email: string;
  readonly city_zone: string;
  readonly property_address: string;
  readonly plan_tier: BusinessPlanTier;
  readonly service_focus: string;
  readonly unit_count: number;
  readonly visit_frequency: BusinessVisitFrequency;
  readonly preferred_start_date?: string;
  readonly notes: string;
  readonly estimated_monthly_fee: number;
  readonly agreed_monthly_fee?: number;
  readonly status: BusinessInquiryStatus;
  readonly payment_status: BusinessPaymentStatus;
  readonly payment_reference: string;
  readonly paid_at?: string;
  readonly admin_notes: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreatedBusinessInquiryReceipt {
  readonly inquiry: BusinessInquiryRecord;
  readonly admin_whatsapp_number: string;
  readonly whatsapp_share_url: string;
  readonly whatsapp_web_url: string;
  readonly whatsapp_message: string;
}

export interface CreateBusinessInquiryApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: CreatedBusinessInquiryReceipt;
  readonly error?: unknown;
}

export const BUSINESS_PLAN_OPTIONS: readonly BusinessPlanOption[] = [
  {
    tier: 'RUTIN_PROPERTI',
    name: 'Paket Rutin Properti',
    audienceLabel: 'Kos, Ruko & Kafe (1 - 25 Unit)',
    summary:
      'Cocok untuk satu lokasi usaha yang butuh jadwal servis berkala tanpa harus mencari teknisi baru setiap bulan.',
    baseMonthlyFee: 150000,
    perUnitFee: 25000,
    scopeItems: [
      'Penjadwalan kunjungan teknisi sesuai siklus yang Anda pilih',
      'Catatan riwayat perawatan per unit atau ruangan',
      'Rekap tagihan bulanan rapi untuk keperluan pembukuan',
      'Koordinasi penggantian jadwal lewat Admin jika ada kendala',
    ],
  },
  {
    tier: 'MULTI_LOKASI',
    name: 'Paket Multi-Lokasi & Kantor',
    audienceLabel: 'Kantor & Properti (> 25 Unit / Multi-Cabang)',
    summary:
      'Dirancang untuk pengelola gedung atau kantor dengan banyak unit AC, instalasi listrik, dan kebutuhan sanitasi berkala.',
    baseMonthlyFee: 450000,
    perUnitFee: 20000,
    scopeItems: [
      'Cakupan multi-lantai atau beberapa cabang dalam satu penagihan',
      'Rekap laporan kondisi unit dan invoice bulanan terpadu',
      'Prioritas penjadwalan saat ada kebutuhan perbaikan tambahan',
      'Pendampingan survei awal lokasi sebelum kontrak berjalan',
    ],
  },
] as const;

export const BUSINESS_PROPERTY_TYPES: readonly SelectableOption<BusinessPropertyType>[] =
  [
    { value: 'KOS', label: 'Rumah Kos' },
    { value: 'KANTOR', label: 'Kantor' },
    { value: 'RUKO_KAFE', label: 'Ruko / Kafe' },
    { value: 'APARTEMEN', label: 'Apartemen / Penginapan' },
    { value: 'LAINNYA', label: 'Properti Lainnya' },
  ] as const;

export const BUSINESS_VISIT_FREQUENCIES: readonly SelectableOption<BusinessVisitFrequency>[] =
  [
    { value: 'MINGGUAN', label: 'Mingguan', hint: 'Faktor 2x / bulan' },
    { value: 'BULANAN', label: 'Sebulan Sekali', hint: 'Standar rutin' },
    { value: 'DWI_BULANAN', label: '2 Bulan Sekali', hint: 'Hemat berkala' },
    { value: 'TRIBULANAN', label: '3 Bulan Sekali', hint: 'Perawatan kuartalan' },
  ] as const;

export const BUSINESS_SERVICE_FOCUS_OPTIONS: readonly string[] = [
  'Servis & Cuci AC Rutin',
  'Sanitasi & Deep Cleaning Area Kerja',
  'Pengecekan Kelistrikan & Lampu',
  'Kombinasi AC, Listrik & Kebersihan',
] as const;

export function calculateBusinessMonthlyEstimate(
  planTier: BusinessPlanTier,
  unitCount: number,
  visitFrequency: BusinessVisitFrequency,
): number {
  const safeCount = Number.isFinite(unitCount) && unitCount > 0 ? Math.floor(unitCount) : 1;
  const base = planTier === 'MULTI_LOKASI' ? 450000 : 150000;
  const perUnit = planTier === 'MULTI_LOKASI' ? 20000 : 25000;

  let multiplier = 1.0;
  switch (visitFrequency) {
    case 'MINGGUAN':
      multiplier = 2.0;
      break;
    case 'BULANAN':
      multiplier = 1.0;
      break;
    case 'DWI_BULANAN':
      multiplier = 0.65;
      break;
    case 'TRIBULANAN':
      multiplier = 0.5;
      break;
  }

  const raw = (base + safeCount * perUnit) * multiplier;
  return Math.round(raw / 1000) * 1000;
}

export function formatRupiahIdr(value: number): string {
  const safeVal = Number.isFinite(value) ? Math.round(value) : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeVal);
}

