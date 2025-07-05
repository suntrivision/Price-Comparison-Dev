import { useState, useEffect, useCallback } from "react";
import { PriceMatchProduct, CSVProduct } from "./types";

// Cache for the fetched data
let cachedEmbeddingData: any = null;
let cachedTransformedData: PriceMatchProduct[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function usePriceMatchData() {
  const [priceMatchData, setPriceMatchData] = useState<PriceMatchProduct[]>([]);
  const [csvData, setCsvData] = useState<CSVProduct[]>([]);
  const [embeddingMatchData, setEmbeddingMatchData] = useState<PriceMatchProduct[]>([]);
  const [rawEmbeddingData, setRawEmbeddingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transformEmbeddingData = useCallback((jsonData: any) => {
    if (!Array.isArray(jsonData)) return [];

    const now = new Date();
    const currentTimestamp = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const runNumber = Date.now();

    return jsonData.flatMap((cluster: any, clusterIndex: number) => {
      if (!cluster.all_products || typeof cluster.all_products !== 'string') return [];

      return cluster.all_products
        .split(';')
        .filter((line: string) => line.trim())
        .map((productLine: string, productIndex: number) => {
          const match = productLine.trim().match(/^(.+?)\s+-\s+RM([\d.]+)$/);
          if (!match) return null;

          const [, productName, price] = match;
          const productPrice = parseFloat(price);
          
          // Calculate similarity based on price difference from lowest price
          const lowestPrice = cluster.lowest_price || productPrice;
          const priceDifference = ((productPrice - lowestPrice) / lowestPrice) * 100;
          const similarity = Math.max(70, 100 - Math.abs(priceDifference));

          return {
            id: `embedding2-${cluster.cluster_id}-${productIndex}`,
            cluster_id: cluster.cluster_id + 20000, // Offset to avoid conflicts
            representative_name: cluster.representative_name || productName.trim(),
            name: productName.trim(),
            price: productPrice,
            marketplace: cluster.lowest_marketplace || 'Unknown',
            product_url: cluster.lowest_url || '',
            image_url: '',
            source_search_url: cluster.lowest_url || '',
            size_info: '',
            similarity_to_best_price: similarity,
            enhanced_with_image: false,
            lowest_price: cluster.lowest_price || productPrice,
            lowest_marketplace: cluster.lowest_marketplace || 'Unknown',
            lowest_url: cluster.lowest_url || '',
            category: `Embedding v2 Run#${runNumber} ${currentTimestamp}`,
            matched_products: cluster.all_products
              .split(';')
              .filter((line: string) => line.trim() && line !== productLine)
              .slice(0, 5) // Limit to first 5 matches
              .map((matchLine: string) => {
                const matchData = matchLine.trim().match(/^(.+?)\s+-\s+RM([\d.]+)$/);
                if (!matchData) return null;
                const [, matchName, matchPrice] = matchData;
                return {
                  name: matchName.trim(),
                  price: parseFloat(matchPrice),
                  marketplace: cluster.lowest_marketplace || 'Unknown',
                  similarity_score: Math.random() * 30 + 70 // Random similarity between 70-100
                };
              })
              .filter(Boolean)
          };
        })
        .filter(Boolean);
    });
  }, []);

  const fetchEmbeddingMatchData = useCallback(async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (cachedEmbeddingData && (now - lastFetchTime) < CACHE_DURATION) {
        setRawEmbeddingData(cachedEmbeddingData);
        setEmbeddingMatchData(cachedTransformedData);
        return;
      }

      const embeddingUrl = 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-2.json';
      const response = await fetch(embeddingUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const jsonData = await response.json();
      
      // Store raw data in cache
      cachedEmbeddingData = jsonData;
      lastFetchTime = now;

      // Transform and cache the data
      const transformedData = transformEmbeddingData(jsonData);
      cachedTransformedData = transformedData;

      setRawEmbeddingData(jsonData);
      setEmbeddingMatchData(transformedData);
    } catch (error) {
      console.error('Error fetching embedding match data:', error);
      setEmbeddingMatchData([]);
      setRawEmbeddingData(null);
    }
  }, [transformEmbeddingData]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create mock data for the original price match data
      const mockPriceMatchData: PriceMatchProduct[] = [
        {
          id: "original-1",
          cluster_id: "1",
          representative_name: "Sample Product 1",
          name: "Sample Product 1",
          price: 15.99,
          marketplace: "Shopee",
          product_url: "https://shopee.com.my/sample1",
          image_url: "",
          source_search_url: "",
          size_info: "",
          similarity_to_best_price: 100,
          enhanced_with_image: false,
          lowest_price: 15.99,
          lowest_marketplace: "Shopee",
          lowest_url: "https://shopee.com.my/sample1",
          category: "original"
        },
        {
          id: "original-2",
          cluster_id: "2",
          representative_name: "Sample Product 2",
          name: "Sample Product 2",
          price: 25.50,
          marketplace: "Lazada",
          product_url: "https://lazada.com.my/sample2",
          image_url: "",
          source_search_url: "",
          size_info: "",
          similarity_to_best_price: 95,
          enhanced_with_image: false,
          lowest_price: 25.50,
          lowest_marketplace: "Lazada",
          lowest_url: "https://lazada.com.my/sample2",
          category: "original"
        }
      ];

      setPriceMatchData(mockPriceMatchData);
      setCsvData([]); // Empty CSV data for now
      
      // Fetch embedding data in parallel
      await fetchEmbeddingMatchData();
    } catch (error) {
      console.error('Error fetching data:', error);
      setPriceMatchData([]);
      setCsvData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEmbeddingMatchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetchData = useCallback(() => {
    // Clear cache before refetching
    cachedEmbeddingData = null;
    cachedTransformedData = [];
    lastFetchTime = 0;
    fetchData();
  }, [fetchData]);

  return {
    priceMatchData,
    csvData,
    embeddingMatchData,
    rawEmbeddingData,
    isLoading,
    refetchData
  };
}
