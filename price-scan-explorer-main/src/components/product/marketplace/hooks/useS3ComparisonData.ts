import { useState, useEffect, useCallback } from 'react';

export interface S3ComparisonData {
  product_1: string;
  product_1_price: number;
  product_1_marketplace: string;
  product_1_url?: string;
  product_2: string;
  product_2_price: number;
  product_2_marketplace: string;
  product_2_url?: string;
  similarity_score: number;
  similarity_level: string;
  price_difference: number;
  cross_marketplace_match: boolean;
  cheaper_product: string;
  cheaper_marketplace: string;
  cheaper_price: number;
  expensive_price: number;
  savings_percentage: number;
}

interface S3DataStructure {
  summary: {
    total_clusters: number;
    total_products: number;
    total_match_pairs: number;
    [key: string]: any;
  };
  clusters: {
    cluster_id: number;
    match_pairs: S3ComparisonData[];
    [key: string]: any;
  }[];
}

// Cache for S3 data
let cachedS3Data: S3ComparisonData[] = [];
let cachedLastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useS3ComparisonData() {
  const [s3Data, setS3Data] = useState<S3ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractMatchPairs = useCallback((jsonData: S3DataStructure): S3ComparisonData[] => {
    if (!jsonData.clusters || !Array.isArray(jsonData.clusters)) return [];

    return jsonData.clusters.flatMap(cluster => 
      cluster.match_pairs && Array.isArray(cluster.match_pairs) 
        ? cluster.match_pairs 
        : []
    );
  }, []);

  const fetchS3Data = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && cachedS3Data.length > 0 && (now - cachedLastFetchTime) < CACHE_DURATION) {
        setS3Data(cachedS3Data);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json${forceRefresh ? `?_t=${now}` : ''}`
      );
        
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
        
      const jsonData: S3DataStructure = await response.json();
      const allMatchPairs = extractMatchPairs(jsonData);
        
      // Update cache
      cachedS3Data = allMatchPairs;
      cachedLastFetchTime = now;
        
      setS3Data(allMatchPairs);
    } catch (err) {
      console.error('Error fetching S3 data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [extractMatchPairs]);

  useEffect(() => {
    fetchS3Data();
  }, [fetchS3Data]);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    cachedS3Data = [];
    cachedLastFetchTime = 0;
    fetchS3Data(true);
  }, [fetchS3Data]);

  return { s3Data, isLoading, error, refetch };
}
