export interface PublicWorkerServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  rate_type: string;
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
  base_price: number;
  rate_type: string;
  lat?: number;
  lng?: number;
  max_radius_km: number;
  free_radius_km: number;
  extra_fee_per_km: number;
  whatsapp_number?: string;
  services: PublicWorkerServiceItem[];
}

export interface PublicWorkersApiResponse {
  success: boolean;
  message: string;
  data: PublicWorkerProfile[];
  error?: string | null;
}

export interface FeaturedWorker {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  category: string;
  rating: number;
  reviewCount: number;
  basecampZone: string;
  startingPrice: number;
  priceUnit: string;
  avatarUrl: string;
  isVerified: boolean;
  specialtyTags: string[];
  bufferMinutes: number;
}

export interface DisciplineCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  startingPrice: number;
  priceUnit: string;
  specialistCount: number;
  highlightTag: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface CommunityTestimonial {
  id: string;
  authorName: string;
  role: string;
  location: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  verifiedBadge: string;
}

export interface TrustPillar {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
}

export interface ComparisonPoint {
  id: string;
  feature: string;
  tuwaktuProtocol: string;
  gigPlatform: string;
  advantageDescription: string;
}
