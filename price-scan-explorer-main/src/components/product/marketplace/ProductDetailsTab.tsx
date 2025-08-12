import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Eye, ChevronLeft, ChevronRight, Package, Loader2, Database, Link, Download, Image as ImageIcon, RotateCcw, ChevronDown, ChevronUp, History } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { mockPriceComparisonData } from "@/data/mockPriceComparison";
import { useLotusShopeeCSVData, type LotusShopeeProduct } from "./hooks/useLotusShopeeCSVData";
import { cleanUrl } from '@/lib/utils';

interface ProductDetail {
  name: string;
  rawName?: string; // Add raw name from data source
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: string;
  productId?: string;
  timestamp?: string;
  marketplace: string;
  product_url: string;
  image_url: string;
  source_search_url: string;
  size_info: string;
  similarity_to_best_price: number;
  shopName?: string;
  shopUrl?: string;
  matched_products: {
    matched_product_name: string;
    matched_product_price: number;
    matched_product_marketplace: string;
    matched_product_url: string;
    matched_product_image: string;
    similarity_score: number;
    similarity_level: string;
  }[];
}

interface GroupedProduct {
  id: string;
  latest: ProductDetail;
  history: ProductDetail[];
  count: number;
}

interface ParsedSize {
  value: string;
  unit: string;
  full: string;
}

interface ProductDetailsTabProps {
  data: ProductDetail[];
  csvData: any[];
  showCategory?: boolean;
  rawEmbeddingData?: any[];
  rawCSVData?: any[];
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

const ITEMS_PER_PAGE = 10;

type DataSource = 'original' | 'shopee-lotus' | 'embedding-matched';

const DATA_SOURCES = {
  original: {
    label: 'Original Dataset',
    url: 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json'
  },
  'shopee-lotus': {
    label: 'Shopee-Lotus Dataset',
    url: 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json'
  },
  'embedding-matched': {
    label: 'Embedding Matched Dataset',
    url: 'https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json'
  }
} as const;

export function ProductDetailsTab({ 
  data, 
  csvData, 
  showCategory = false, 
  rawEmbeddingData = [], 
  rawCSVData = [],
  searchTerm = "",
  setSearchTerm 
}: ProductDetailsTabProps) {
  // Fetch the new CSV data
  const { csvData: lotusShopeeData, isLoading: csvLoading, error: csvError, refetch: refetchCSV } = useLotusShopeeCSVData();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>('original');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductDetail[]>([]);
  
  // Local search state if not provided via props
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const currentSearchTerm = searchTerm || localSearchTerm;
  const currentSetSearchTerm = setSearchTerm || setLocalSearchTerm;

  // Debug logging for props
  console.log('📊 ProductDetailsTab received:', {
    dataLength: data.length,
    csvDataLength: csvData.length,
    rawEmbeddingDataLength: rawEmbeddingData.length,
    rawCSVDataLength: rawCSVData.length,
    productDataLength: productData.length
  });

  // Clean product name function (moved up to be available in useEffect)
  const cleanProductName = (name: string): string => {
    return name
      // Remove question marks that appear to be encoding issues
      .replace(/\?\?/g, '')
      .replace(/\?/g, '')
      // Remove emoji characters and symbols
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional country flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      // Remove corrupted Unicode characters like ð¨ðð§ ððð¹ð¹ ðð¿ð²ð®ðº
      .replace(/[ð]/g, '')
      .replace(/[¨§¹¿²®]/g, '')
      // Remove other problematic characters
      .replace(/[^\w\s\-\(\)\[\]\.\,\&\%\+\$\/\:\;]/g, '')
      // Clean up multiple spaces and trim leading/trailing spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to normalize product name for grouping
  const normalizeProductName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\b(new|latest|updated|v\d+|\d{4}-\d{2}-\d{2})\b/gi, '') // Remove version indicators
      .replace(/\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs|x|X|\u00d7)/gi, '[SIZE]') // Normalize sizes
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to group products by similarity
  const groupProducts = (products: ProductDetail[]): GroupedProduct[] => {
    const groupMap = new Map<string, ProductDetail[]>();
    
    products.forEach(product => {
      // Create a unique key based on normalized name + marketplace
      const key = `${normalizeProductName(product.name)}_${product.marketplace}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(product);
    });

    const groups: GroupedProduct[] = [];
    let groupId = 0;

    groupMap.forEach((productGroup, key) => {
      // Sort by timestamp (newest first), then by price if no timestamp
      const sortedProducts = productGroup.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (a.timestamp && !b.timestamp) return -1;
        if (!a.timestamp && b.timestamp) return 1;
        return b.price - a.price; // Fallback to price comparison
      });

      const latest = sortedProducts[0];
      const history = sortedProducts.slice(1);

      groups.push({
        id: `group_${groupId++}`,
        latest,
        history,
        count: productGroup.length
      });
    });

    return groups.sort((a, b) => a.latest.name.localeCompare(b.latest.name));
  };

  // Function to parse CSV text
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const products: ProductDetail[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV parsing with proper comma handling for quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

              if (values.length >= 10) {
          const rawProductName = values[0] || '';
          const productName = cleanProductName(rawProductName);
          const productUrl = cleanUrl(values[1] || '');
          const productImage = values[2] || '';
          const originalPriceText = values[3] || '';
          const discountedPriceText = values[4] || '';
          const discountPercentage = values[5] || '';
          const productId = values[6] || '';
          const timestamp = values[7] || '';
          const shopName = values[8] || '';
          const shopUrl = values[9] || '';

          // Parse prices
          const originalPrice = parseFloat(originalPriceText.replace(/[^0-9.-]+/g, '')) || 0;
          const discountedPrice = parseFloat(discountedPriceText.replace(/[^0-9.-]+/g, '')) || originalPrice;
          const finalPrice = discountedPrice > 0 ? discountedPrice : originalPrice;

                  // Determine marketplace from URL
        let marketplace = 'Unknown';
        if (productUrl.includes('shopee.com')) {
          marketplace = 'Shopee';
        } else if (productUrl.includes('corp.lotuss.com.my/promotions')) {
          marketplace = 'Lotus Promo';
        } else if (productUrl.includes('lotuss.com') || productUrl.includes('lotus')) {
          marketplace = 'Lotus';
        } else if (productUrl.includes('lazada.com')) {
          marketplace = 'Lazada';
        } else if (productUrl.includes('tiktok.com')) {
          marketplace = 'TikTok';
        }

        // Extract size info from product name
        const sizeMatch = productName.match(/\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs|x|X|\u00d7)/gi);
        const sizeInfo = sizeMatch ? sizeMatch.join(' ') : '';

        if (productName && finalPrice > 0) {
          products.push({
            name: rawProductName, // Use raw product name as primary name
            rawName: rawProductName, // Store the raw name from CSV
            price: finalPrice,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            discountPercentage: discountPercentage,
            productId: productId,
            timestamp: timestamp,
            marketplace: marketplace,
            product_url: productUrl,
            image_url: productImage,
            source_search_url: productUrl,
            size_info: sizeInfo,
            similarity_to_best_price: 95 + Math.random() * 5, // 95-100% similarity
            shopName: shopName,
            shopUrl: shopUrl,
            matched_products: []
          });
        }
      }
    }

    return products;
  };

  useEffect(() => {
    // If data is already provided via props, use it instead of fetching
    if (data && data.length > 0) {
      console.log('📊 Using provided data instead of fetching:', data.length, 'items');
      setProductData(data);
      setLoading(false);
      return;
    }

    // Check if we have the new CSV data loaded
    if (lotusShopeeData && lotusShopeeData.length > 0) {
      console.log('📊 Using Lotus-Shopee CSV data:', lotusShopeeData.length, 'items');
      
      // Convert LotusShopeeProduct to ProductDetail format
      const convertedProducts: ProductDetail[] = lotusShopeeData.map((item, index) => ({
        name: item.productName,
        rawName: item.productName,
        price: item.discountedPrice || item.originalPrice,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        discountPercentage: item.discountPercentage,
        productId: item.productId || `csv-${index}`,
        timestamp: item.timestamp,
        marketplace: item.marketplace,
        product_url: item.productUrl,
        image_url: item.productImage,
        source_search_url: item.productUrl,
        size_info: '', // Will be extracted from name
        similarity_to_best_price: 95 + Math.random() * 5,
        matched_products: []
      }));

      // Extract size info for each product
      convertedProducts.forEach(product => {
        const sizeMatch = product.name.match(/\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs|x|X|\u00d7)/gi);
        product.size_info = sizeMatch ? sizeMatch.join(' ') : '';
      });

      setProductData(convertedProducts);
      setLoading(csvLoading);
      setError(csvError);
      return;
    }

    // Otherwise, fetch data from external sources (fallback)
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching data from external sources...');
        
        // Fetch both JSON and CSV data in parallel
        const [jsonResponse, csvResponse] = await Promise.all([
          fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-2.json', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          }),
          fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv', {
            headers: {
              'Accept': 'text/csv',
              'Content-Type': 'text/csv',
            },
          })
        ]);

        if (!jsonResponse.ok) {
          throw new Error(`JSON fetch error! status: ${jsonResponse.status}`);
        }

        if (!csvResponse.ok) {
          throw new Error(`CSV fetch error! status: ${csvResponse.status}`);
        }

        const jsonData = await jsonResponse.json();
        const csvText = await csvResponse.text();
        
        // Process the new JSON data from lotuss/combined_shopeeLotusFBeCatHORECA10-0.json
        const lotussJsonResponse = await fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA10-0.json', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        let lotussJsonData = [];
        if (lotussJsonResponse.ok) {
          lotussJsonData = await lotussJsonResponse.json();
        }
        
        const allProducts: ProductDetail[] = [];
        
        // Process the new JSON format
        if (Array.isArray(lotussJsonData)) {
          lotussJsonData.forEach((item: any) => {
            const productName = item["Product Name"]?.trim() || '';
            const productUrl = cleanUrl(item["Product URL"] || '');
            const productImage = item["Product Image"] || '';
            const originalPriceText = item["Original Price (RM)"] || '';
            const discountedPriceText = item["Discounted Price (RM)"] || '';
            const discountPercentage = item["Discount Percentage"] || '';
            const productId = item["Product ID"] || '';
            const timestamp = item["timestamp"] || '';

            // Parse prices - handle both "RM5.59" and "5.59" formats
            const originalPrice = parseFloat(originalPriceText.toString().replace(/[^0-9.-]+/g, '')) || 0;
            const discountedPrice = parseFloat(discountedPriceText.toString().replace(/[^0-9.-]+/g, '')) || originalPrice;
            const finalPrice = discountedPrice > 0 ? discountedPrice : originalPrice;

            // Determine marketplace from URL
            let marketplace = 'Unknown';
            if (productUrl.includes('shopee.com')) {
              marketplace = 'Shopee';
            } else if (productUrl.includes('corp.lotuss.com.my/promotions')) {
              marketplace = 'Lotus Promo';
            } else if (productUrl.includes('lotuss.com') || productUrl.includes('lotus')) {
              marketplace = 'Lotus';
            } else if (productUrl.includes('lazada.com')) {
              marketplace = 'Lazada';
            } else if (productUrl.includes('tiktok.com')) {
              marketplace = 'TikTok';
            }

            // Extract size info from product name
            const sizeMatch = productName.match(/\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs|x|X|\u00d7)/gi);
            const sizeInfo = sizeMatch ? sizeMatch.join(' ') : '';

            if (productName && finalPrice > 0) {
              allProducts.push({
                name: productName, // Use raw product name as primary name
                rawName: productName, // Store the original raw name
                price: finalPrice,
                originalPrice: originalPrice,
                discountedPrice: discountedPrice,
                discountPercentage: discountPercentage,
                productId: productId,
                timestamp: timestamp,
                marketplace: marketplace,
                product_url: productUrl,
                image_url: productImage,
                source_search_url: productUrl,
                size_info: sizeInfo,
                similarity_to_best_price: 95 + Math.random() * 5, // 95-100% similarity
                matched_products: []
              });
            }
          });
        }

        // Also process the original JSON data if needed
        if (Array.isArray(jsonData)) {
          jsonData.forEach((cluster: any) => {
            if (cluster.all_products && typeof cluster.all_products === 'string') {
              const products = cluster.all_products
                .split(';')
                .filter((line: string) => line.trim())
                .map((productLine: string, index: number) => {
                  const match = productLine.trim().match(/^(.+?)\s+-\s+RM([\d.]+)$/);
                  if (!match) return null;
                  
                  const [, productName, price] = match;
                  
                  // Determine marketplace based on URL
                  let marketplace = 'Unknown';
                  const url = cleanUrl(cluster.lowest_url || '');
                  if (url.includes('shopee.com')) {
                    marketplace = 'Shopee';
                  } else if (url.includes('lotuss.com') || url.includes('lotus')) {
                    marketplace = 'Lotus';
                  } else if (url.includes('lazada.com')) {
                    marketplace = 'Lazada';
                  } else if (url.includes('tiktok.com')) {
                    marketplace = 'TikTok';
                  } else if (cluster.lowest_marketplace) {
                    marketplace = cluster.lowest_marketplace;
                  }
                  
                  return {
                    name: productName.trim(),
                    price: parseFloat(price),
                    marketplace: marketplace,
                    product_url: url,
                    image_url: '',
                    source_search_url: url,
                    size_info: '',
                    similarity_to_best_price: 90 + Math.random() * 10, // 90-100% similarity
                    matched_products: []
                  };
                })
                .filter(Boolean);
              
              allProducts.push(...products);
            }
          });
        }
        
        // Process CSV data
        const csvProducts = parseCSV(csvText);
        allProducts.push(...csvProducts);
        
        console.log('📊 LOADED PRODUCTS:', {
          totalProducts: allProducts.length,
          campbellProducts: allProducts.filter(p => p.name.toLowerCase().includes('campbell')).length,
          sampleProducts: allProducts.slice(0, 5).map(p => p.name),
          campbellSamples: allProducts.filter(p => p.name.toLowerCase().includes('campbell')).slice(0, 5).map(p => ({ 
            name: p.name, 
            cleanName: p.name.trim(),
            hasLeadingSpace: p.name.startsWith(' '),
            marketplace: p.marketplace 
          }))
        });
        
        setProductData(allProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data, lotusShopeeData, csvLoading, csvError]);

  // Create a flexible search function that handles size variations
  // Helper function to calculate Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const createFlexibleSearchTerm = (searchTerm: string): string => {
    return searchTerm
      // Remove size information in parentheses like (3x22GM), (500ml), etc.
      .replace(/\([^)]*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs|x|X|\u00d7)[^)]*\)/gi, '')
      // Remove standalone size information like 3x22GM, 500ml, etc.
      .replace(/\b\d+(?:\.\d+)?\s*(?:x|X|\u00d7)\s*\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs)\b/gi, '')
      .replace(/\b\d+(?:\.\d+)?\s*(?:g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds|pcs?|pieces?|pack|packs)\b/gi, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Search filtering logic with debugging (no grouping)
  const filteredProducts = productData.filter(product => {
    if (!currentSearchTerm) return true;
    
    const searchLower = currentSearchTerm.toLowerCase();
    const productName = product.name.toLowerCase();
    const marketplace = product.marketplace.toLowerCase();
    const sizeInfo = product.size_info.toLowerCase();
    
    // Debug Campbell products specifically
    if (searchLower.includes('campbell') && productName.includes('campbell')) {
      console.log('🔍 CAMPBELL FOUND:', {
        searchTerm: currentSearchTerm,
        productName: product.name,
        productNameLower: productName,
        marketplace: marketplace,
        sizeInfo: sizeInfo,
        willMatch: productName.includes(searchLower) || marketplace.includes(searchLower) || sizeInfo.includes(searchLower)
      });
    }
    
    // Simple search - check if search term appears in product name, marketplace, or size info
    const matches = productName.includes(searchLower) || 
                   marketplace.includes(searchLower) || 
                   sizeInfo.includes(searchLower);
    
    return matches;
  });

  // Debug search results
  console.log('🔍 SEARCH RESULTS:', {
    searchTerm: currentSearchTerm,
    totalProducts: productData.length,
    filteredProducts: filteredProducts.length,
    campbellInData: productData.filter(p => p.name.toLowerCase().includes('campbell')).length,
    campbellInResults: filteredProducts.filter(p => p.name.toLowerCase().includes('campbell')).length,
    sampleResults: filteredProducts.slice(0, 3).map(p => p.name)
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentSearchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const formatPrice = (price: number | string | null) => {
    if (!price) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `RM${numPrice.toFixed(2)}`;
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace.toLowerCase()) {
      case 'shopee':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lotus':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lotus promo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'lotus corp':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'csv data':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'lazada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tiktok':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'unknown':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  function getPageNumbers(current: number, total: number) {
    const pages = [];
    const showEllipsis = total > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
    }
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (current < total - 3) pages.push('...');
      if (!pages.includes(total)) pages.push(total);
    }
    
    return pages;
  }

  const formatProductName = (name: string) => {
    // Clean the product name and truncate if too long
    const cleaned = name.replace(/[^\w\s\-\(\)\[\]\.\,\&\%\+\$\/\:\;]/g, '').trim();
    return cleaned.length > 60 ? `${cleaned.substring(0, 60)}...` : cleaned;
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  function downloadCurrentPageCSV() {
    const headers = [
      "Product Name (Raw)", "Original Price (RM)", "Discounted Price (RM)", 
      "Discount %", "Marketplace", "Size/Info", "Last Updated", "Product URL"
    ];
    const rows = currentProducts.map(product => [
      product.name, // Now contains raw product name
      formatPrice(product.originalPrice || product.price),
      formatPrice(product.discountedPrice || product.price),
      product.discountPercentage || 'N/A',
      product.marketplace,
      product.size_info || 'N/A',
      formatDate(product.timestamp),
      cleanUrl(product.product_url || 'N/A')
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(String).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product-details-raw-page${currentPage}-search-${currentSearchTerm || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Refresh handler
  function handleRefresh() {
    // Clear current data and refresh CSV data
    setProductData([]);
    setLoading(true);
    setError(null);
    refetchCSV();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products by name, marketplace, or size..."
            value={currentSearchTerm}
            onChange={(e) => currentSetSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Refresh
        </Button>
        <Button onClick={downloadCurrentPageCSV} variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredProducts.length} products from {productData.length} total items
          </span>
          {lotusShopeeData && lotusShopeeData.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              📊 Lotus-Shopee CSV Data
            </Badge>
          )}
        </div>
      </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead className="w-[300px]">Product Name (Raw from CSV)</TableHead>
              <TableHead>Original Price (RM)</TableHead>
              <TableHead>Discounted Price (RM)</TableHead>
              <TableHead>Discount %</TableHead>
              <TableHead>Marketplace</TableHead>
              <TableHead>Size/Info</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.map((product, index) => {
                return (
                  <TableRow key={`${product.productId || product.name}-${index}`} className="border-b">
                    <TableCell className="w-[300px]">
                      <div className="space-y-2">
                        <div className="font-medium text-sm break-words whitespace-normal">
                          {product.name}
                        </div>
                        {product.product_url && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">URL: </span>
                            <a 
                              href={cleanUrl(product.product_url)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                              title="Click to open product page"
                            >
                              {cleanUrl(product.product_url).length > 80 
                                ? `${cleanUrl(product.product_url).substring(0, 80)}...` 
                                : cleanUrl(product.product_url)
                              }
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-600">
                        {formatPrice(product.originalPrice || product.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatPrice(product.discountedPrice || product.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${product.discountPercentage && product.discountPercentage !== 'N/A' ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                        {product.discountPercentage || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMarketplaceBadgeColor(product.marketplace)}>
                        {product.marketplace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{product.size_info || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(product.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {product.image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(product.image_url, '_blank')}
                            title="View Product Image"
                          >
                            <ImageIcon className="h-3 w-3" />
                          </Button>
                        )}
                        {product.product_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(cleanUrl(product.product_url), '_blank')}
                            title="Open Product URL"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

          {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {getPageNumbers(currentPage, totalPages).map((page, index) => (
                <PaginationItem key={index}>
                  {page === '...' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
              )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
      )}
    </div>
  );
}

