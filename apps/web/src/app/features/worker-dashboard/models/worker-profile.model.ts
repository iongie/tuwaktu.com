import { PublicTechnicianProfile } from '../../worker-booking/models/worker-catalog.model';

export interface WorkerProfileUpdatePayload {
  name: string;
  bio: string;
  avatar_url: string;
  zone: string;
  phone_number?: string;
  email?: string;
  address?: string;
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
