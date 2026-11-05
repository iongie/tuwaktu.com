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
