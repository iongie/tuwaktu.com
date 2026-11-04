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

export interface WorkerServiceCatalogItem {
  id: string;
  code: string;
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


