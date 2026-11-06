export interface AdminWorkerListItem {
  readonly account_id: string;
  readonly worker_id: string;
  readonly slug: string;
  readonly name: string;
  readonly bio: string;
  readonly zone: string;
  readonly base_price: number;
  readonly rate_type: 'HOURLY' | 'UNIT' | string;
  readonly avatar_url: string;
  readonly rating: number;
  readonly review_count: number;
  readonly phone_number: string;
  readonly whatsapp_number: string;
  readonly email: string;
  readonly role: 'ADMIN' | 'WORKER' | string;
  readonly account_status: 'ACTIVE' | 'SUSPENDED' | string;
  readonly must_change_password: boolean;
  readonly created_at: string;
}

export interface AdminCreateWorkerPayload {
  name: string;
  bio?: string;
  zone?: string;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT' | string;
  lat?: number;
  lng?: number;
  max_radius_km?: number;
  free_radius_km?: number;
  extra_fee_per_km?: number;
  phone_number?: string;
  whatsapp_number: string;
  email: string;
  address?: string;
  temporary_password?: string;
}

export interface AdminWorkerCreatedResponse {
  account: {
    id: string;
    email: string;
    phone_number: string;
    role: string;
    account_status: string;
    must_change_password: boolean;
  };
  worker: {
    id: string;
    slug: string;
    name: string;
    zone: string;
  };
  temporary_password: string;
  invitation_text: string;
}

export interface AdminUpdateWorkerStatusPayload {
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminStats {
  readonly total_workers: number;
  readonly active_workers: number;
  readonly suspended_workers: number;
  readonly total_bookings: number;
}

export type AdminWorkerFilterStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED';

