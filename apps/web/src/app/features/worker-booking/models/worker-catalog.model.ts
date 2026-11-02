export interface PublicServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
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
  services: PublicServiceCatalogItem[];
}

export interface TechnicianProfileApiResponse {
  success: boolean;
  message: string;
  data: PublicTechnicianProfile;
  error: unknown;
}

