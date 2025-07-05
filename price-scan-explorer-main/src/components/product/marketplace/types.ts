
export interface PriceMatchProduct {
  id?: string;
  cluster_id?: string | number;
  representative_name: string;
  name: string;
  price: number;
  marketplace: string;
  product_url: string;
  image_url: string;
  source_search_url: string;
  size_info: string;
  similarity_to_best_price: number;
  enhanced_with_image: boolean;
  lowest_price?: number;
  lowest_marketplace?: string;
  lowest_url?: string;
  category?: string;
}

export interface CSVProduct {
  Product: string;
  Shopee_Price: string | number;
  Shopee_URL: string;
  Lazada_Price: string | number;
  Lazada_URL: string;
  Mydin_Price: string | number;
  Mydin_URL: string;
  Lotus_Price: string | number;
  Lotus_URL: string;
  Aeon_Price: string | number;
  Aeon_URL: string;
  Tiktok_Price: string | number;
  Tiktok_URL: string;
  Giant_Price: string | number;
  Giant_URL: string;
}

export type DatasetType = "original" | "embedding" | "matched" | "both";
