export interface CreateServiceBookingPayload {
  worker_id?: string;
  worker_slug?: string;
  service_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  location: string;
  zone?: string;
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
  status: string;
  created_at: string;
}

export interface ServiceBookingApiResponse {
  success: boolean;
  message: string;
  data: ServiceBookingConfirmation;
  error: unknown;
}

