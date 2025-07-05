
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { extractMarketplaceFromUrl } from '@/lib/marketplaceUtils';

interface ApiProduct {
  uid: string;
  timestamp: string;
  name: string;
  original_price: string;
  sale_price: string;
  discount: string;
  image: string;
  run_number: number;
}

interface ApiResponse {
  products: ApiProduct[];
}

interface ScreenScrapeProduct {
  "Product Name": string;
  "Product URL": string;
  "Product Image": string;
  "Original Price (RM)": string;
  "Discounted Price (RM)": string;
  "Discount Percentage": string;
}

export function useApiProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch from main API
      const response = await fetch('https://44ovjwmvob2myyox3sunjf4xyi0xtsua.lambda-url.ap-southeast-1.on.aws/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Transform API data to match our Product interface
      const transformedProducts: Product[] = data.products.map((apiProduct) => ({
        id: `Lotus-${apiProduct.uid}`,
        timestamp: apiProduct.timestamp,
        source_url: null,
        name: apiProduct.name,
        sale_price: apiProduct.sale_price,
        original_price: apiProduct.original_price,
        image: apiProduct.image,
        category: 'general',
        store: 'Lotus\'s',
        run_number: apiProduct.run_number
      }));

      let allProducts = [...transformedProducts];

      // Try to fetch Screen Scrape data directly from S3 bucket
      try {
        const screenScrapeUrl = 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/Thunderbit+-+e074e434-54db-45d1-80bd-0ec187fb2f2e.json';
        
        console.log('Fetching Screen Scrape data directly from S3:', screenScrapeUrl);
        const screenScrapeResponse = await fetch(screenScrapeUrl);
        
        console.log('Screen Scrape response status:', screenScrapeResponse.status);
        console.log('Screen Scrape response headers:', screenScrapeResponse.headers);
        
        if (screenScrapeResponse.ok) {
          const screenScrapeData: ScreenScrapeProduct[] = await screenScrapeResponse.json();
          console.log('Screen Scrape data received:', screenScrapeData.length, 'products');
          
          // Transform Screen Scrape data to match our Product interface
          const screenScrapeProducts: Product[] = screenScrapeData.map((product, index) => {
            // Parse image array if it's a string
            let imageUrl = '';
            try {
              const imageArray = JSON.parse(product["Product Image"]);
              imageUrl = Array.isArray(imageArray) && imageArray.length > 0 ? imageArray[0] : '';
            } catch {
              imageUrl = product["Product Image"] || '';
            }

            // Extract marketplace from URL and create ID with marketplace prefix
            const marketplace = extractMarketplaceFromUrl(product["Product URL"]);
            const productId = `${marketplace}-screen-scrape-${index}`;

            return {
              id: productId,
              timestamp: new Date().toISOString(),
              source_url: product["Product URL"] || null,
              name: product["Product Name"],
              sale_price: product["Discounted Price (RM)"],
              original_price: product["Original Price (RM)"] || null,
              image: imageUrl,
              category: 'general',
              store: 'Screen Scrape',
              run_number: 999
            };
          });

          allProducts = [...transformedProducts, ...screenScrapeProducts];
          console.log(`Successfully processed ${screenScrapeProducts.length} Screen Scrape products`);
        } else {
          console.error('Screen Scrape API responded with error:', screenScrapeResponse.status, screenScrapeResponse.statusText);
          const responseText = await screenScrapeResponse.text();
          console.error('Response body:', responseText);
          
          // Add a placeholder Screen Scrape product to ensure run #999 appears in dropdown
          allProducts = [...transformedProducts, {
            id: 'Unknown-screen-scrape-placeholder',
            timestamp: new Date().toISOString(),
            source_url: null,
            name: 'Screen Scrape - No data available',
            sale_price: 'N/A',
            original_price: null,
            image: '',
            category: 'general',
            store: 'Screen Scrape',
            run_number: 999
          }];
        }
      } catch (screenScrapeError) {
        console.error('Error fetching Screen Scrape data:', screenScrapeError);
        // Add a placeholder Screen Scrape product to ensure run #999 appears in dropdown
        allProducts = [...transformedProducts, {
          id: 'Unknown-screen-scrape-placeholder',
          timestamp: new Date().toISOString(),
          source_url: null,
          name: 'Screen Scrape - Connection failed',
          sale_price: 'N/A',
          original_price: null,
          image: '',
          category: 'general',
          store: 'Screen Scrape',
          run_number: 999
        }];
      }

      console.log('Final products array:', allProducts.length, 'total products');
      setProducts(allProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch };
}
