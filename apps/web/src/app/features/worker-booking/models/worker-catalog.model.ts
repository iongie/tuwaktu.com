export interface PublicServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  rate_type?: 'HOURLY' | 'UNIT' | string;
  duration_minutes: number;
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
  services: PublicServiceCatalogItem[];
}

export interface TechnicianProfileApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error: unknown;
}

