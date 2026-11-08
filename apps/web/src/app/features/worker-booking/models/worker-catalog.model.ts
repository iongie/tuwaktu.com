export interface PublicServiceCatalogItem {
  id: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT' | string;
  duration_minutes: number;
  image_url?: string;
}

export interface PublicTechnicianProfile {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatar_url: string;
  rating: number;
  review_count: number;
  zone: string;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT' | string;
  lat?: number;
  lng?: number;
  max_radius_km?: number;
  free_radius_km?: number;
  extra_fee_per_km?: number;
  whatsapp_number?: string;
  services: PublicServiceCatalogItem[];
}

export interface TechnicianProfileApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error: unknown;
}

export interface PublicReviewItem {
  readonly id: string;
  readonly client_display_name: string;
  readonly rating: number;
  readonly comment: string;
  readonly service_name: string;
  readonly created_at: string;
}

export interface PublicReviewsApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: {
    readonly reviews: PublicReviewItem[];
    readonly total: number;
  };
  readonly error: unknown;
}

