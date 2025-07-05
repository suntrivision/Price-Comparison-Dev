import { useState, useEffect, useCallback } from 'react';

export interface EmbeddingCluster {
  cluster_id: number;
  representative_name: string;
  lowest_price: number;
  lowest_marketplace: string;
  lowest_url: string;
  all_products: string;
  [key: string]: any;
}

// Cache for embedding cluster data
let cachedEmbeddingData: EmbeddingCluster[] = [];
let cachedLastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useEmbeddingClusterData(version: 'v2' | 'v3' = 'v3') {
  const [embeddingData, setEmbeddingData] = useState<EmbeddingCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbeddingData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && cachedEmbeddingData.length > 0 && (now - cachedLastFetchTime) < CACHE_DURATION) {
        setEmbeddingData(cachedEmbeddingData);
        setIsLoading(false);
        return;
      }

      const baseUrl = version === 'v2' 
        ? 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-2.json'
        : 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-3.json';
      const url = `${baseUrl}${forceRefresh ? `?_t=${now}` : ''}`;
      console.log(`🔄 Fetching embedding matched price comparison-${version} data from:`, url);
      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
        
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
        
      const jsonData: EmbeddingCluster[] = await response.json();
      
      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid data format: expected array of clusters');
      }
      
      console.log('✅ Embedding cluster data received:', jsonData.length, 'clusters');
      console.log('📋 Sample cluster:', jsonData[0]);
      console.log('🔍 First cluster all_products:', jsonData[0]?.all_products?.substring(0, 200) + '...');
      
      // Check if your specific product is in the data
      const searchProduct = 'INDOMIE MI GORENG ASLI 80GX5';
      const foundCluster = jsonData.find(cluster => 
        cluster.all_products && cluster.all_products.includes(searchProduct)
      );
      console.log(`🎯 Found cluster with "${searchProduct}":`, foundCluster ? 'YES' : 'NO');
      if (foundCluster) {
        console.log('🎯 Cluster containing INDOMIE:', foundCluster);
      }
      
      // Update cache
      cachedEmbeddingData = jsonData;
      cachedLastFetchTime = now;
        
      setEmbeddingData(jsonData);
    } catch (err) {
      console.error('Error fetching embedding cluster data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setEmbeddingData([]);
    } finally {
      setIsLoading(false);
    }
  }, [version]);

  useEffect(() => {
    fetchEmbeddingData();
  }, [fetchEmbeddingData]);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    cachedEmbeddingData = [];
    cachedLastFetchTime = 0;
    fetchEmbeddingData(true);
  }, [fetchEmbeddingData]);

  return { embeddingData, isLoading, error, refetch };
} 