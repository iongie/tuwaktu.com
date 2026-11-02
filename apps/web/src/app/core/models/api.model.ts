export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
}

export interface PublicWorkerProfile {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatar_url: string;
  rating: number;
  review_count: number;
  zone: string;
  services: PublicService[];
}

export interface CreateBookingRequest {
  worker_id?: string;
  worker_slug?: string;
  service_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location?: string;
  zone?: string;
  booking_date?: string;
  notes?: string;
}

export interface PublicBookingResponse {
  booking_code: string;
  worker_id: string;
  worker_name: string;
  service_id: string;
  service_name: string;
  client_name: string;
  location: string;
  zone: string;
  booking_date: string;
  notes?: string;
  total_price: number;
  status: string;
  created_at: string;
}
