import { useState, useEffect, useCallback } from 'react';
import { PriceMatchProduct } from '../types';

export interface LotusCSVProduct {
  'Product Name': string;
  'Product URL': string;
  'Product Image': string;
  'Original Price (RM)': string;
  'Discounted Price (RM)': string;
  'Discount Percentage': string;
  'Product ID': string;
  timestamp: string;
  'Product Id': string;
}

// Cache for CSV data
let cachedCSVData: PriceMatchProduct[] = [];
let cachedLastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useLotusCSVData() {
  const [csvEmbeddingData, setCsvEmbeddingData] = useState<PriceMatchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawCSVData, setRawCSVData] = useState<LotusCSVProduct[]>([]);

  const parseCSVLine = useCallback((line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }, []);

  const parseCSVData = useCallback((csvText: string): LotusCSVProduct[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = parseCSVLine(lines[0]);
    const products: LotusCSVProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const product: any = {};
        headers.forEach((header, index) => {
          product[header] = values[index] || '';
        });
        products.push(product);
      }
    }

    return products;
  }, [parseCSVLine]);

  const transformToEmbeddingData = useCallback((csvProducts: LotusCSVProduct[]): PriceMatchProduct[] => {
    const now = new Date();
    const currentTimestamp = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return csvProducts
      .filter(product => product['Product Name'] && product['Product Name'].trim())
      .map((product, index) => {
        const originalPrice = parseFloat(product['Original Price (RM)']?.replace('RM', '') || '0');
        const discountedPrice = parseFloat(product['Discounted Price (RM)']?.replace('RM', '') || '0');
        const actualPrice = discountedPrice > 0 ? discountedPrice : originalPrice;
        
        // Calculate similarity based on discount percentage
        const discountPercentage = parseFloat(product['Discount Percentage']?.replace('%', '') || '0');
        const similarity = Math.max(70, 100 - Math.abs(discountPercentage));

        // Create clusters based on similar product names
        const clusterId = `lotus-${Math.floor(index / 10)}`; // Group every 10 products

        return {
          id: `lotus-csv-${product['Product ID'] || index}`,
          cluster_id: clusterId,
          representative_name: product['Product Name'],
          name: product['Product Name'],
          price: actualPrice,
          marketplace: 'Lotus',
          product_url: product['Product URL'] || '',
          image_url: product['Product Image'] || '',
          source_search_url: product['Product URL'] || '',
          size_info: '',
          similarity_to_best_price: similarity,
          enhanced_with_image: !!product['Product Image'],
          lowest_price: actualPrice,
          lowest_marketplace: 'Lotus',
          lowest_url: product['Product URL'] || '',
          category: `Lotus CSV ${currentTimestamp}`,
          matched_products: [] // Could be enhanced with matching logic
        };
      });
  }, []);

  const fetchCSVData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && cachedCSVData.length > 0 && (now - cachedLastFetchTime) < CACHE_DURATION) {
        setCsvEmbeddingData(cachedCSVData);
        setIsLoading(false);
        return;
      }

      const csvUrl = 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv';
      const response = await fetch(csvUrl + (forceRefresh ? `?_t=${now}` : ''));
        
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
        
      const csvText = await response.text();
      const parsedData = parseCSVData(csvText);
      const transformedData = transformToEmbeddingData(parsedData);
        
      // Update cache
      cachedCSVData = transformedData;
      cachedLastFetchTime = now;
        
      setRawCSVData(parsedData);
      setCsvEmbeddingData(transformedData);
    } catch (err) {
      console.error('Error fetching Lotus CSV data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSV data');
    } finally {
      setIsLoading(false);
    }
  }, [parseCSVData, transformToEmbeddingData]);

  useEffect(() => {
    fetchCSVData();
  }, [fetchCSVData]);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    cachedCSVData = [];
    cachedLastFetchTime = 0;
    fetchCSVData(true);
  }, [fetchCSVData]);

  return { 
    csvEmbeddingData, 
    rawCSVData, 
    isLoading, 
    error, 
    refetch 
  };
} 