export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  starting_price: number;
  price_unit: string;
  availability_tag: string;
  highlight_tag: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAdminCategoryPayload {
  name: string;
  slug?: string;
  description: string;
  icon: string;
  starting_price: number;
  price_unit: string;
  availability_tag?: string;
  highlight_tag?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateAdminCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  starting_price?: number;
  price_unit?: string;
  availability_tag?: string;
  highlight_tag?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface AdminCategoriesApiResponse {
  success: boolean;
  message: string;
  data: AdminCategory[];
  error?: string | null;
}

export interface AdminCategoryApiResponse {
  success: boolean;
  message: string;
  data: AdminCategory;
  error?: string | null;
}
