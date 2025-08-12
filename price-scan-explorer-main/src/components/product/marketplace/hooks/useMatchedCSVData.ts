import { useState, useEffect, useCallback } from 'react';

export interface MatchedProduct {
  lotusProduct: string;
  lotusUrl: string;
  lotusPrice: number;
  originalPrice: number; // Add this line
  lotusPerUnit: string;
  lotusPerUnitPrice: string;
  lotusPerUnitCalculation: string;
  shopeeProduct: string;
  shopeeUrl: string;
  shopeePrice: number;
  shopeePerUnit: string;
  shopeePerUnitPrice: string;
  shopeePerUnitCalculation: string;
  shopeeShopName?: string;
  shopeeShopUrl?: string;
  matchScore: number;
  priceDifference: number;
  priceDifferencePercentage: number;
  timestamp: string;
  matchStatus: string;
  horecaPrice?: number;
  productImage?: string;
}

// Cache for matched CSV data
let cachedMatchedData: MatchedProduct[] = [];
let cachedLastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useMatchedCSVData() {
  const [matchedData, setMatchedData] = useState<MatchedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseTimestampToDate = (timestampStr: string): Date => {
    // Convert yyyy/mm/dd format to Date object for proper sorting
    try {
      if (!timestampStr || timestampStr === '') {
        return new Date();
      }
      
      // If it's already in yyyy/mm/dd format
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(timestampStr)) {
        const [year, month, day] = timestampStr.split('/').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      }
      
      // Try to parse as ISO string or other formats
      const date = new Date(timestampStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Fallback to current date
      return new Date();
    } catch {
      return new Date();
    }
  };

  const parseMatchedCSVData = (csvText: string): MatchedProduct[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const products: MatchedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line with proper handling of quoted fields
      const values = [];
        let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (!inQuotes) {
            inQuotes = true;
          } else if (j + 1 < line.length && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
      }
      values.push(current.trim());

      // Map values to headers
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      
      // Use header names for all fields
      const lotusProduct = row['Lotus Product'] || '';
      const lotusUrl = row['Lotus URL'] || '';
      // Try to get lotusPrice from header, or fallback to 4th column if HORECA flyer
      let lotusPrice = parseFloat(row['Lotus Price']?.replace('RM', '') || '0') || 0;
      const originalPrice = parseFloat(row['Original Price (RM)']?.replace('RM', '') || '0') || 0; // Add this line
      const horecaUrl = row['Product URL'] || '';
      // If HORECA flyer, get price from 'Lotus Price', 4th column, or 3rd column (first available numeric value)
      if (horecaUrl.includes('https://corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer')) {
        let priceCandidate = 0;
        if (row['Lotus Price'] && !isNaN(parseFloat(row['Lotus Price']))) {
          priceCandidate = parseFloat(row['Lotus Price']);
        } else if (values[3] && !isNaN(parseFloat(values[3]))) {
          priceCandidate = parseFloat(values[3]);
        } else if (values[2] && !isNaN(parseFloat(values[2]))) {
          priceCandidate = parseFloat(values[2]);
        }
        lotusPrice = priceCandidate;
        // horecaPrice is already initialized to 0, so no need to re-initialize here
      }
      const lotusPerUnit = row['Lotus Per Unit'] || '';
      const lotusPerUnitPrice = row['Lotus Per Unit Price'] || '';
      const lotusPerUnitCalculation = row['Lotus Per Unit Calculation'] || '';
      const lotusDiscountedPrice = row['Lotus Discounted Price'] || '';
      const lotusDiscountedPerUnitPrice = row['Lotus Discounted Per Unit Price'] || '';
      const shopeeProduct = row['Shopee Product'] || '';
      const shopeeUrl = row['Shopee URL'] || '';
      const shopeePrice = parseFloat(row['Shopee Price']?.replace('RM', '') || '0') || 0;
      const shopeePerUnit = row['Shopee Per Unit'] || '';
      const shopeePerUnitPrice = row['Shopee Per Unit Price'] || '';
      const shopeePerUnitCalculation = row['Shopee Per Unit Calculation'] || '';
      const shopeeDiscountedPrice = row['Shopee Discounted Price'] || '';
      const shopeeDiscountedPerUnitPrice = row['Shopee Discounted Per Unit Price'] || '';
      const shopeeShopName = row['Shopee Shop Name'] || '';
      const shopeeShopUrl = row['Shopee Shop URL'] || '';
      const matchScore = parseFloat(row['Match Score'] || '0') || 0;
      const timestamp = row['timestamp'] || new Date().toISOString();
      const matchStatus = row['Match Status'] || 'Unknown';
      let horecaPrice = 0;
      if (horecaUrl.includes('https://corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer')) {
        horecaPrice = lotusPrice;
        console.log('[HORECA DEBUG]', {
          lotusProduct,
          horecaUrl,
          lotusPrice,
          horecaPrice,
          values
        });
      }
      const productImage = row['Product Image'] || '';

      // Calculate price differences
      const priceDifference = lotusPrice - shopeePrice;
      const priceDifferencePercentage = lotusPrice > 0 ? (priceDifference / lotusPrice) * 100 : 0;

      // Include all products (matched and unmatched)
      if (lotusProduct || shopeeProduct) {
        products.push({
          lotusProduct,
          lotusUrl,
          lotusPrice,
          originalPrice, // Add this line
          lotusPerUnit,
          lotusPerUnitPrice,
          lotusPerUnitCalculation,
          shopeeProduct,
          shopeeUrl,
          shopeePrice,
          shopeePerUnit,
          shopeePerUnitPrice,
          shopeePerUnitCalculation,
          shopeeShopName,
          shopeeShopUrl,
          matchScore,
          priceDifference,
          priceDifferencePercentage,
          timestamp,
          matchStatus,
          horecaPrice,
          productImage
        });
      } else if (row['Product Name'] && horecaPrice > 0) {
        // HORECA-only product row
        products.push({
          lotusProduct: row['Product Name'],
          lotusUrl: '',
          lotusPrice: 0,
          originalPrice: 0, // Add this line
          lotusPerUnit: '',
          lotusPerUnitPrice: '',
          lotusPerUnitCalculation: '',
          shopeeProduct: '',
          shopeeUrl: '',
          shopeePrice: 0,
          shopeePerUnit: '',
          shopeePerUnitPrice: '',
          shopeePerUnitCalculation: '',
          shopeeShopName: '',
          shopeeShopUrl: '',
          matchScore: 0,
          priceDifference: 0,
          priceDifferencePercentage: 0,
          timestamp,
          matchStatus: 'HORECA Only',
          horecaPrice,
          productImage
        });
      }
    }
    // Sort by timestamp descending (latest to oldest), then by matchScore
    products.sort((a, b) => {
      const dateA = parseTimestampToDate(a.timestamp).getTime();
      const dateB = parseTimestampToDate(b.timestamp).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.matchScore - a.matchScore;
    });
    return products;
  };

  const fetchMatchedCSVData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && cachedMatchedData.length > 0 && (now - cachedLastFetchTime) < CACHE_DURATION) {
        setMatchedData(cachedMatchedData);
        setIsLoading(false);
        return;
      }

              const url = `https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv${forceRefresh ? `?_t=${now}` : ''}`;
      console.log('🔄 Fetching matched CSV data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
          'Cache-Control': 'no-cache'
        }
      });
        
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        
      const csvText = await response.text();
      const parsedData = parseMatchedCSVData(csvText);
      
      // Update cache
      cachedMatchedData = parsedData;
      cachedLastFetchTime = now;
        
      setMatchedData(parsedData);
    } catch (err) {
      console.error('Error fetching matched CSV data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch matched CSV data');
      setMatchedData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchedCSVData();
  }, [fetchMatchedCSVData]);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    cachedMatchedData = [];
    cachedLastFetchTime = 0;
    fetchMatchedCSVData(true);
  }, [fetchMatchedCSVData]);

  return { matchedData, isLoading, error, refetch };
} 