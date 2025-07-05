export interface Product {
  id: string;
  run_number?: number;
  timestamp: string;
  store?: string;
  category?: string;
  name: string;
  sale_price?: string;
  original_price?: string;
  image?: string;
  source_url?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  last_modified_by?: string;
  last_modified_at?: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount: number;
}
