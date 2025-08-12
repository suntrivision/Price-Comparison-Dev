import { useState, useEffect, useCallback } from 'react';

export interface LotusShopeeProduct {
  productName: string;
  productUrl: string;
  productImage: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: string;
  productId: string;
  timestamp: string;
  marketplace: string;
  shopName: string;
  shopUrl: string;
}

// Cache for CSV data
let cachedCSVData: LotusShopeeProduct[] = [];
let cachedLastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useLotusShopeeCSVData() {
  const [csvData, setCSVData] = useState<LotusShopeeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCSVData = (csvText: string): LotusShopeeProduct[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const products: LotusShopeeProduct[] = [];

    console.log('📊 CSV Headers:', headers);

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
            // Handle escaped quotes
            current += '"';
            j++; // Skip next quote
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

      // Debug: Log parsing for corp.lotuss.com.my lines
      if (line.includes('corp.lotuss.com.my')) {
        console.log('🔍 Parsing corp.lotuss line:', {
          lineNumber: i,
          rawLine: line.substring(0, 200),
          parsedValues: values.slice(0, 3),
          valuesCount: values.length
        });
      }

      if (values.length >= 10) {
        const productName = values[0]?.replace(/^"|"$/g, '') || '';
        const productUrl = values[1]?.replace(/^"|"$/g, '') || '';
        const productImage = values[2]?.replace(/^"|"$/g, '') || '';
        const originalPriceStr = values[3]?.replace(/^"|"$/g, '').replace('RM', '') || '0';
        const discountedPriceStr = values[4]?.replace(/^"|"$/g, '').replace('RM', '') || '0';
        const discountPercentage = values[5]?.replace(/^"|"$/g, '') || 'N/A';
        const productId = values[6]?.replace(/^"|"$/g, '') || '';
        const timestamp = values[7]?.replace(/^"|"$/g, '') || '';
        const shopName = values[8]?.replace(/^"|"$/g, '') || '';
        const shopUrl = values[9]?.replace(/^"|"$/g, '') || '';

        // Debug: Check for corp.lotuss.com.my pattern specifically
        if (productUrl.includes('corp.lotuss.com.my')) {
          console.log('🔍 FOUND CORP LOTUS URL:', {
            url: productUrl,
            urlLength: productUrl.length,
            hasPromotions: productUrl.includes('/promotions'),
            hasHorecaFlyer: productUrl.includes('horeca-flyer'),
            exactMatch: productUrl === 'https://corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer',
            product: productName?.substring(0, 50)
          });
        }
        
        // Debug: Check for the exact HORECA flyer URL
        if (productUrl && productUrl.includes('horeca-flyer')) {
          console.log('🍽️ FOUND HORECA FLYER URL:', {
            url: productUrl,
            product: productName?.substring(0, 50)
          });
        }

        const originalPrice = parseFloat(originalPriceStr) || 0;
        const discountedPrice = parseFloat(discountedPriceStr) || 0;

        // Determine marketplace from URL
        let marketplace = 'Unknown';
        
        // Debug: Log corp.lotuss.com.my URLs specifically
        if (productUrl && productUrl.includes('corp.lotuss.com.my')) {
          console.log('🔍 Processing corp.lotuss URL:', {
            url: productUrl,
            product: productName?.substring(0, 50),
            hasPromotions: productUrl.includes('/promotions')
          });
        }
        
        // Debug: Log URLs that result in "Unknown" marketplace
        if (productName && productName.toLowerCase().includes('indomie')) {
          console.log('🍜 Processing INDOMIE product:', {
            product: productName,
            url: productUrl,
            urlLength: productUrl?.length || 0,
            isEmpty: !productUrl || productUrl.trim() === '',
            conditions: {
              hasShopee: productUrl?.includes('shopee.com'),
              hasHorecaFlyer: productUrl?.includes('corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer'),
              hasCorpPromotions: productUrl?.includes('corp.lotuss.com.my/promotions'),
              hasCorpLotus: productUrl?.includes('corp.lotuss.com.my'),
              hasLotus: productUrl?.includes('lotuss.com') || productUrl?.includes('lotus')
            }
          });
        }
        
        if (productUrl.includes('shopee.com')) {
          marketplace = 'Shopee';
        } else if (productUrl.includes('corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer')) {
          marketplace = 'Lotus Promo';
          console.log('🎯 ✅ DETECTED LOTUS HORECA PROMO URL:', productUrl, 'for product:', productName);
        } else if (productUrl.includes('corp.lotuss.com.my/promotions')) {
          marketplace = 'Lotus Promo';
          console.log('🎯 ✅ DETECTED LOTUS PROMO URL:', productUrl, 'for product:', productName);
        } else if (productUrl.includes('corp.lotuss.com.my')) {
          marketplace = 'Lotus Corp';
          console.log('🏢 Detected Lotus Corp URL (not promo):', productUrl, 'for product:', productName?.substring(0, 50));
        } else if (productUrl.includes('lotuss.com') || productUrl.includes('lotus')) {
          marketplace = 'Lotus';
        }
        
        // Fallback: If no URL or empty URL, try to determine from context
        if (marketplace === 'Unknown' && (!productUrl || productUrl.trim() === '')) {
          // Since this is from Lotus-Shopee CSV, assume it's from one of these sources
          marketplace = 'CSV Data';
          console.log('📋 Product without URL assigned to CSV Data:', productName?.substring(0, 50));
        }

        // Debug: Log final marketplace assignment for INDOMIE products
        if (productName && productName.toLowerCase().includes('indomie')) {
          console.log('🍜 INDOMIE marketplace assigned:', {
            product: productName.substring(0, 50),
            marketplace: marketplace,
            url: productUrl || 'NO_URL'
          });
        }

        if (productName && (originalPrice > 0 || discountedPrice > 0)) {
          products.push({
            productName,
            productUrl,
            productImage,
            originalPrice,
            discountedPrice,
            discountPercentage,
            productId,
            timestamp,
            marketplace,
            shopName,
            shopUrl
          });
        }
      }
    }

    console.log('✅ Parsed CSV data:', products.length, 'products');
    console.log('📋 Sample product:', products[0]);
    
    // Log marketplace distribution
    const marketplaceCounts = products.reduce((acc, product) => {
      acc[product.marketplace] = (acc[product.marketplace] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🏪 Marketplace distribution:', marketplaceCounts);
    
    if (marketplaceCounts['Lotus Promo'] > 0) {
      console.log('🎉 Found', marketplaceCounts['Lotus Promo'], 'Lotus Promo products!');
      console.log('📋 Sample Lotus Promo products:', 
        products
          .filter(p => p.marketplace === 'Lotus Promo')
          .slice(0, 3)
          .map(p => ({ name: p.productName.substring(0, 50), url: p.productUrl }))
      );
    } else {
      console.log('❌ No Lotus Promo products found. Checking for corp.lotuss URLs...');
      const corpLotusProducts = products.filter(p => p.productUrl.includes('corp.lotuss.com.my'));
      console.log('🔍 Found', corpLotusProducts.length, 'corp.lotuss.com.my products with marketplaces:', 
        [...new Set(corpLotusProducts.map(p => p.marketplace))]
      );
    }
    
    return products;
  };

  const fetchCSVData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && cachedCSVData.length > 0 && (now - cachedLastFetchTime) < CACHE_DURATION) {
        setCSVData(cachedCSVData);
        setIsLoading(false);
        return;
      }

              const url = `https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv${forceRefresh ? `?_t=${now}` : ''}`;
      console.log('🔄 Fetching CSV data from:', url);
      
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
      const parsedData = parseCSVData(csvText);
      
      // Update cache
      cachedCSVData = parsedData;
      cachedLastFetchTime = now;
        
      setCSVData(parsedData);
    } catch (err) {
      console.error('Error fetching CSV data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSV data');
      setCSVData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSVData();
  }, [fetchCSVData]);

  const refetch = useCallback(() => {
    // Clear cache before refetching
    cachedCSVData = [];
    cachedLastFetchTime = 0;
    fetchCSVData(true);
  }, [fetchCSVData]);

  return { csvData, isLoading, error, refetch };
} 