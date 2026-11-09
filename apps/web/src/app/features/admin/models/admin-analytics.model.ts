export interface AnalyticsWorkerMetric {
  worker_id: string;
  worker_slug: string;
  worker_name: string;
  zone: string;
  whatsapp_clicks: number;
  profile_views: number;
}

export interface AnalyticsSearchMetric {
  query: string;
  location: string;
  count: number;
}

export interface AdminAnalyticsCityMetric {
  city: string;
  total_activity: number;
  profile_views: number;
  searches: number;
  whatsapp_clicks: number;
  percentage: number;
}

export interface AdminAnalyticsSummary {
  total_whatsapp_clicks: number;
  total_bookings: number;
  total_profile_views: number;
  total_searches: number;
  top_workers: AnalyticsWorkerMetric[];
  top_searches: AnalyticsSearchMetric[];
  top_cities: AdminAnalyticsCityMetric[];
  booking_status_breakdown: Record<string, number>;
  days_range: number;
}

export interface AdminAnalyticsApiResponse {
  success: boolean;
  message: string;
  data: AdminAnalyticsSummary;
  error?: string | null;
}

