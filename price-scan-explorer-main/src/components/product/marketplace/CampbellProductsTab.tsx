import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RotateCcw, ImageIcon, ExternalLink, Eye, Soup } from "lucide-react";
import { cleanUrl } from '@/lib/utils';

interface ProductDetail {
  name: string;
  rawName: string; // Add raw name from CSV
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
}

interface CampbellProductsTabProps {
  onNavigateToProductDetails?: (productName: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

const ITEMS_PER_PAGE = 50;

export function CampbellProductsTab({ onNavigateToProductDetails, searchTerm: propSearchTerm, setSearchTerm: propSetSearchTerm }: CampbellProductsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<ProductDetail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  
  // Use prop search term if provided, otherwise use local state
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm;
  const setSearchTerm = propSetSearchTerm || setLocalSearchTerm;
  const [selectedCollection, setSelectedCollection] = useState<string>("all");

  // Clean product name function with proper spacing
  const cleanProductName = (name: string): string => {
    // Debug: log original name
    console.log('🔍 Original name:', JSON.stringify(name));
    
    // Step 1: Remove only problematic characters while preserving spaces
    let cleaned = name
      // Remove emoji characters
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove specific corrupted Unicode sequences
      .replace(/[ð¨ðð§ ððð¹ð¹ ðð¿ð²ð®ðº]/g, '')
      // Remove question marks (encoding issues)
      .replace(/\?\?+/g, '')
      // Remove only truly unwanted characters, keep spaces and basic punctuation
      .replace(/[^\w\s\-\(\)\[\]\.\,\&\%\+\$\/\:\;\'\"]/g, '');
    
    console.log('🧹 After cleaning unwanted chars:', JSON.stringify(cleaned));
    
    // Step 2: Always apply intelligent spacing for concatenated words
    // Check for patterns that indicate concatenated words
    const hasConcatenatedWords = /[A-Z]{2,}[A-Z][A-Z]|[a-z][A-Z]/.test(cleaned);
    console.log('🔗 Has concatenated patterns:', hasConcatenatedWords);
    
    // Apply spacing rules to handle concatenated text
    cleaned = cleaned
      // Add space between lowercase and uppercase letters (camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Add space between letter sequences and numbers
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-z])/g, '$1 $2')
      // Handle concatenated uppercase words (e.g., CAMPBELLCREAM -> CAMPBELL CREAM)
      .replace(/([A-Z])([A-Z][A-Z]+)([A-Z][A-Z]+)/g, (match, first, middle, last) => {
        // Split long sequences of uppercase letters into likely words
        const words = [];
        let current = first;
        
        // Common word patterns for Campbell products
        const commonWords = ['CAMPBELL', 'CREAM', 'SOUP', 'MUSHROOM', 'CHICKEN', 'TOMATO', 'VEGETABLE', 'BEEF', 'NOODLE'];
        
        let remaining = middle + last;
        for (const word of commonWords) {
          if (remaining.startsWith(word)) {
            if (current) words.push(current);
            words.push(word);
            current = '';
            remaining = remaining.substring(word.length);
            break;
          }
        }
        
        if (current) words.push(current);
        if (remaining) words.push(remaining);
        
        return words.join(' ');
      })
      // Add space between sequences of uppercase letters
      .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
      // Add space after common abbreviations
      .replace(/(\b(?:ML|MG|GM|G|KG|L|OZ|LB)\b)([A-Z])/gi, '$1 $2')
      // Handle specific Campbell patterns
      .replace(/CAMPBELL([A-Z]+)/g, (match, rest) => {
        // Split remaining letters into likely words
        const words = ['CAMPBELL'];
        let remaining = rest;
        
        const patterns = ['CREAM', 'SOUP', 'MUSHROOM', 'CHICKEN', 'TOMATO', 'VEGETABLE', 'BEEF', 'NOODLE', 'BROTH'];
        for (const pattern of patterns) {
          if (remaining.includes(pattern)) {
            const index = remaining.indexOf(pattern);
            if (index > 0) {
              words.push(remaining.substring(0, index));
            }
            words.push(pattern);
            remaining = remaining.substring(index + pattern.length);
          }
        }
        if (remaining) words.push(remaining);
        
        return words.filter(w => w.length > 0).join(' ');
      });
    
    console.log('➕ After adding intelligent spacing:', JSON.stringify(cleaned));
    
    // Step 3: Clean up spacing and add space before parentheses if needed
    cleaned = cleaned
      .replace(/(\w)\(/g, '$1 (')  // Space before parentheses
      .replace(/\s+/g, ' ')        // Multiple spaces to single space
      .trim();                     // Remove leading/trailing spaces
    
    console.log('✨ Final cleaned name:', JSON.stringify(cleaned));
    
    return cleaned;
  };

  // Fetch products from the CSV source
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching data from CSV source...');
        const response = await fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA8-0.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('📄 Fetched CSV data, length:', csvText.length, 'characters');
        
        // Parse CSV data
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        console.log('📋 CSV Headers:', headers);
        
        // Transform CSV rows to product objects
        const transformedProducts: ProductDetail[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          // Split CSV line, handling quoted values
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
          values.push(current.trim()); // Add the last value
          
          if (values.length < headers.length) continue; // Skip incomplete rows
          
          // Create object from CSV row
          const item: any = {};
          headers.forEach((header, index) => {
            item[header] = values[index] || '';
          });
          
          const originalName = item["Product Name"] || "";
          const productName = cleanProductName(originalName);
          const productUrl = cleanUrl(item["Product URL"] || "");
          
          const originalPriceStr = item["Original Price (RM)"] || "";
          const discountedPriceStr = item["Discounted Price (RM)"] || "";
          
          // Parse prices - handle both "RM5.59" and "5.59" formats
          const parsePrice = (priceStr: string): number => {
            if (!priceStr) return 0;
            const cleanStr = priceStr.toString().replace(/[^\d.]/g, '');
            return parseFloat(cleanStr) || 0;
          };
          
          const originalPrice = parsePrice(originalPriceStr);
          const discountedPrice = parsePrice(discountedPriceStr);
          
          // Determine marketplace from URL with enhanced detection
          let marketplace = "Unknown";
          
          console.log(`🔍 FULL URL: ${productUrl}`);
          console.log(`🔍 URL Length: ${productUrl.length}`);
          console.log(`🔍 Contains 'shopee.com': ${productUrl.includes('shopee.com')}`);
          console.log(`🔍 Contains 'lotuss.com.my': ${productUrl.includes('lotuss.com.my')}`);
          console.log(`🔍 Contains 'lotus': ${productUrl.includes('lotus')}`);
          
          if (productUrl.includes('shopee.com')) {
            marketplace = "Shopee";
            console.log(`✅ Shopee detected`);
          } else if (productUrl.includes('lazada.com')) {
            marketplace = "Lazada";
            console.log(`✅ Lazada detected`);
          } else if (productUrl.includes('corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer')) {
            marketplace = "Lotus Promo";
            console.log(`✅ HORECA Flyer detected: ${productUrl}`);
          } else if (productUrl.includes('corp.lotuss.com.my/promotions')) {
            marketplace = "Lotus Promo";
            console.log(`✅ Corp Promotions detected: ${productUrl}`);
          } else if (productUrl.includes('corp.lotuss.com.my')) {
            marketplace = "Lotus Corp";
            console.log(`✅ Corp Lotus detected: ${productUrl}`);
          } else if (productUrl.includes('lotuss.com.my') || productUrl.includes('lotus')) {
            marketplace = "Lotus";
            console.log(`✅ Regular Lotus detected`);
          } else {
            console.log(`❌ No marketplace pattern matched for: ${productUrl}`);
          }
          
          console.log(`🏷️ Final marketplace: ${marketplace}`);
          
          // Extract size information from product name
          const sizeMatch = productName.match(/\(([^)]+)\)$/);
          const sizeInfo = sizeMatch ? sizeMatch[1] : "";
          
          transformedProducts.push({
            name: productName,
            rawName: originalName, // Store the raw name from CSV
            price: discountedPrice || originalPrice,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            discountPercentage: item["Discount Percentage"] || "N/A",
            productId: item["Product ID"] || `product-${i}`,
            timestamp: item["timestamp"],
            marketplace: marketplace,
            product_url: productUrl,
            image_url: item["Product Image"] || "",
            source_search_url: productUrl,
            size_info: sizeInfo,
            similarity_to_best_price: 100
          });
        }
        
        console.log('✅ Transformed products from CSV:', transformedProducts.length);
        
        // Count Campbell products for debugging
        const campbellCount = transformedProducts.filter(product => 
          product.name.toLowerCase().includes('campbell')
        ).length;
        console.log('🍲 Campbell products found:', campbellCount);
        
        setAllProducts(transformedProducts);
        
      } catch (err) {
        console.error('❌ Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search term and collection
  const filteredProducts = useMemo(() => {
    let products = allProducts;
    
    // Filter by collection first
    if (selectedCollection !== "all") {
      const collectionLower = selectedCollection.toLowerCase();
      products = products.filter(product => 
        product.rawName.toLowerCase().includes(collectionLower) ||
        product.name.toLowerCase().includes(collectionLower)
      );
    }
    
    // Then filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      console.log(`🔍 Searching for: "${searchTerm}" (${searchTerm.length} characters)`);
      
      const matchedProducts = products.filter(product => {
        const rawNameMatch = product.rawName.toLowerCase().includes(searchLower);
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const marketplaceMatch = product.marketplace.toLowerCase().includes(searchLower);
        const sizeMatch = product.size_info.toLowerCase().includes(searchLower);
        
        const hasMatch = rawNameMatch || nameMatch || marketplaceMatch || sizeMatch;
        
        // Log first few matches for debugging
        if (hasMatch && products.indexOf(product) < 3) {
          console.log(`✅ Match found:`, {
            rawName: product.rawName,
            cleanName: product.name,
            rawNameMatch,
            nameMatch,
            searchTerm: searchTerm
          });
        }
        
        return hasMatch;
      });
      
      console.log(`📊 Search results: ${matchedProducts.length} matches out of ${products.length} products`);
      products = matchedProducts;
    }
    
    return products;
  }, [allProducts, searchTerm, selectedCollection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCollection]);

  const formatPrice = (price: number | string | null) => {
    if (!price) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `RM${numPrice.toFixed(2)}`;
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace.toLowerCase()) {
      case 'shopee':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lotus promo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'lotus corp':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'lotus':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lazada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'csv data':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'unknown':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      return 'N/A';
    }
  };

  const downloadCSV = () => {
    const headers = [
      "Product Name (Raw)", "Product ID", "Original Price (RM)", "Discounted Price (RM)", 
      "Current Price (RM)", "Discount %", "Marketplace", "Size/Info", "Last Updated", 
      "Product URL", "Image URL"
    ];
    const rows = filteredProducts.map(product => [
      product.rawName, // Use raw name from CSV
      product.productId || 'N/A',
      formatPrice(product.originalPrice || product.price),
      formatPrice(product.discountedPrice || product.price),
      formatPrice(product.price),
      product.discountPercentage || 'N/A',
      product.marketplace,
      product.size_info || 'N/A',
      formatDate(product.timestamp),
      cleanUrl(product.product_url || 'N/A'),
      product.image_url || 'N/A'
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(String).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCollection}-products-raw-${searchTerm || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading products from CSV source...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-destructive">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={handleRefresh} className="mt-4" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Soup className="h-5 w-5" />
            Product Collection Database (CSV Source)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete product database from CSV source - {filteredProducts.length} items displayed
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            {/* Collection Filter and Search */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Collection:</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Products</option>
                  <option value="campbell">Campbell Products</option>
                  <option value="maggi">Maggi Products</option>
                  <option value="nestle">Nestle Products</option>
                  <option value="knorr">Knorr Products</option>
                  <option value="indomie">Indomie Products</option>
                  <option value="koka">Koka Products</option>
                  <option value="mama">Mama Products</option>
                </select>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products by name, marketplace, or size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={downloadCSV} variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <span>
                Showing {currentProducts.length} of {filteredProducts.length} products (Total: {allProducts.length})
              </span>
              <Badge variant="secondary" className="text-xs">
                {selectedCollection === "all" ? "All Collections" : `${selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} Collection`}
              </Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
            </div>
            <div className="text-xs">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
                <div className="text-xs text-muted-foreground">Filtered Products</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredProducts.filter(p => p.marketplace.toLowerCase() === 'shopee').length}
                </div>
                <div className="text-xs text-muted-foreground">Shopee</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredProducts.filter(p => p.marketplace.toLowerCase() === 'lotus').length}
                </div>
                <div className="text-xs text-muted-foreground">Lotus</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredProducts.filter(p => p.discountPercentage && p.discountPercentage !== 'N/A' && p.discountPercentage !== '').length}
                </div>
                <div className="text-xs text-muted-foreground">With Discounts</div>
              </div>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Product Name (Raw from CSV)</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Discounted Price</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Size/Info</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product, index) => (
                  <TableRow key={`${product.productId || product.name}-${index}`} className="border-b">
                    <TableCell className="w-[300px]">
                      <div className="space-y-2">
                        <div className="font-medium text-sm break-words whitespace-normal">
                          {product.rawName}
                        </div>
                        {product.product_url && (
                          <a 
                            href={cleanUrl(product.product_url)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline text-xs block"
                            title="Click to open product page"
                          >
                            {cleanUrl(product.product_url).length > 80 
                              ? `${cleanUrl(product.product_url).substring(0, 80)}...` 
                              : cleanUrl(product.product_url)
                            }
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-600">
                        {formatPrice(product.originalPrice || product.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatPrice(product.discountedPrice || product.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm font-medium ${product.discountPercentage && product.discountPercentage !== 'N/A' && product.discountPercentage !== '' ? 'text-orange-600' : 'text-gray-400'}`}>
                        {product.discountPercentage || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMarketplaceBadgeColor(product.marketplace)}>
                        {product.marketplace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {product.size_info || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(product.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(cleanUrl(product.product_url), '_blank')}
                            title="Open Product URL"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onNavigateToProductDetails?.(product.name)}
                          title="View Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 