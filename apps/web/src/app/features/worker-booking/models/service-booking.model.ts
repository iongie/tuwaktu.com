export interface CreateServiceBookingPayload {
  worker_id?: string;
  worker_slug?: string;
  service_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location: string;
  zone?: string;
  client_lat?: number;
  client_lng?: number;
  booking_date?: string;
  notes?: string;
}

export interface ServiceBookingConfirmation {
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
  transport_fee?: number;
  status: string;
  created_at: string;
}

export interface ServiceBookingApiResponse {
  success: boolean;
  message: string;
  data: ServiceBookingConfirmation;
  error: unknown;
}

export interface CalculateFeeRequestPayload {
  worker_id?: string;
  worker_slug?: string;
  service_id: string;
  client_lat: number;
  client_lng: number;
}

export interface FeeCalculationResult {
  distance_km: number;
  max_radius_km: number;
  free_radius_km: number;
  service_price: number;
  extra_fee_per_km: number;
  transport_fee: number;
  total_price: number;
  is_within_radius: boolean;
}

export interface FeeCalculationApiResponse {
  success: boolean;
  message: string;
  data: FeeCalculationResult;
  error: unknown;
}

export interface AvailableTimeSlot {
  slot_type: 'MORNING' | 'AFTERNOON' | 'EVENING' | string;
  name: string;
  start_time: string;
  end_time: string;
  available: boolean;
  reason: string;
}

export interface AvailableSlotsData {
  worker_id: string;
  worker_slug: string;
  worker_name: string;
  date: string;
  day_of_week: number;
  day_name: string;
  is_working_day: boolean;
  slots: AvailableTimeSlot[];
}

export interface AvailableSlotsApiResponse {
  success: boolean;
  message: string;
  data: AvailableSlotsData;
  error?: unknown;
}


