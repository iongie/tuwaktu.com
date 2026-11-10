import { PublicTechnicianProfile } from '../../worker-booking/models/worker-catalog.model';

export interface WorkerProfileUpdatePayload {
  name: string;
  bio: string;
  avatar_url: string;
  zone: string;
  phone_number?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  worker_id?: string;
}

export interface WorkerProfileApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error?: unknown;
}

export interface WorkerRateUpdatePayload {
  worker_id?: string;
  base_price: number;
  rate_type: 'HOURLY' | 'UNIT';
}

export interface WorkerRatesApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error?: unknown;
}

export interface WorkerLocationSettingsUpdatePayload {
  worker_id?: string;
  lat: number;
  lng: number;
  max_radius_km: number;
  free_radius_km: number;
  extra_fee_per_km: number;
}

export interface WorkerLocationSettingsApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error?: unknown;
}

export interface WorkerScheduleItem {
  day_of_week: number;
  day_name?: string;
  is_active: boolean;
  slot_morning: boolean;
  slot_afternoon: boolean;
  slot_evening: boolean;
}

export interface WorkerSchedulesApiResponse {
  success: boolean;
  message: string;
  data: WorkerScheduleItem[];
  error?: unknown;
}

export interface UpdateWorkerSchedulesPayload {
  worker_id?: string;
  schedules: WorkerScheduleItem[];
}

export interface WorkerDateOverrideItem {
  id?: string;
  worker_id: string;
  override_date: string; // YYYY-MM-DD
  is_holiday: boolean;
  is_slot1_locked: boolean;
  is_slot2_locked: boolean;
  is_slot3_locked: boolean;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkerDateOverridesApiResponse {
  success: boolean;
  message: string;
  data: WorkerDateOverrideItem[];
  error?: unknown;
}

export interface UpsertWorkerDateOverrideApiResponse {
  success: boolean;
  message: string;
  data: WorkerDateOverrideItem;
  error?: unknown;
}

export interface WorkerServiceCatalogItem {
  id: string;
  code: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  rate_type: 'HOURLY' | 'UNIT';
  duration_minutes: number;
  min_hours?: number;
  max_hours?: number;
  equipment_label?: string;
  equipment_badge?: string;
  equipment_icon?: string;
  image_url?: string;
  tags?: string[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  is_public: boolean;
}

export interface CreateWorkerServicePayload {
  worker_id?: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT';
  duration_minutes: number;
  is_active?: boolean;
}

export interface UpdateWorkerServicePayload {
  worker_id?: string;
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT';
  duration_minutes?: number;
  is_active?: boolean;
}

export interface WorkerServiceItemApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    worker_id: string;
    category_id?: string;
    name: string;
    description: string;
    price: number;
    base_price?: number;
    rate_type?: 'HOURLY' | 'UNIT';
    duration_minutes: number;
    is_active: boolean;
  };
  error: unknown;
}

export interface WorkerServiceDeleteApiResponse {
  success: boolean;
  message: string;
  data: null;
  error: unknown;
}

export type WorkerBookingStatus = 'PENDING_WA' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface WorkerBookingRecord {
  id: string;
  booking_code: string;
  worker_id: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  location: string;
  zone: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  total_price: number;
  status: WorkerBookingStatus;
  review_token?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
}

export interface WorkerBookingsApiResponse {
  success: boolean;
  message: string;
  data: WorkerBookingRecord[];
  error?: unknown;
}

export interface WorkerBookingUpdateApiResponse {
  success: boolean;
  message: string;
  data: WorkerBookingRecord;
  error?: unknown;
}

export interface WorkerDashboardReviewRecord {
  readonly id: string;
  readonly booking_code: string;
  readonly client_name: string;
  readonly is_anonymous: boolean;
  readonly rating: number;
  readonly comment: string;
  readonly service_name: string;
  readonly booking_date: string;
  readonly created_at: string;
}

export interface WorkerReviewsApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly reviews: WorkerDashboardReviewRecord[];
    readonly total: number;
  };
  readonly error?: unknown;
}



