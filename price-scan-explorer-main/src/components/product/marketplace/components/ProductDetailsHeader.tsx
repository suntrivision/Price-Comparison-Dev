import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Eye, ChevronLeft, ChevronRight, Package, Loader2, Database, Link, Download } from "lucide-react";
import { cleanUrl } from '@/lib/utils';

interface ProductDetail {
  name: string;
  price: number;
  marketplace: string;
  product_url: string;
  image_url: string;
  source_search_url: string;
  size_info: string;
  similarity_to_best_price: number;
  matched_products: any[];
}

interface ParsedSize {
  value: string;
  unit: string;
  full: string;
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

export function ProductDetailsTab() {
  const [productData, setProductData] = useState<ProductDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>('original');

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const dataSource = DATA_SOURCES[selectedDataSource];
        console.log(`Fetching detailed product data from: ${dataSource.label}`, dataSource.url);
        
        const response = await fetch(dataSource.url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        console.log('Raw JSON data received:', jsonData);
        console.log('Data type:', typeof jsonData);
        console.log('Data keys:', Object.keys(jsonData));
        
        // Extract all products from all clusters
        const allProducts: ProductDetail[] = [];
        
        // Check if data has clusters property
        if (jsonData && jsonData.clusters && Array.isArray(jsonData.clusters)) {
          console.log('Found clusters:', jsonData.clusters.length);
          
          jsonData.clusters.forEach((cluster: any, clusterIndex: number) => {
            console.log(`Processing cluster ${clusterIndex}:`, cluster);
            
            if (cluster.product_details && Array.isArray(cluster.product_details)) {
              console.log(`Cluster ${clusterIndex} has ${cluster.product_details.length} products`);
              allProducts.push(...cluster.product_details);
            } else {
              console.log(`Cluster ${clusterIndex} has no product_details or it's not an array`);
            }
          });
        } else if (Array.isArray(jsonData)) {
          // If jsonData is directly an array of products
          console.log('Data is directly an array of products');
          allProducts.push(...jsonData);
        } else {
          console.log('Data structure not recognized:', jsonData);
        }
        
        console.log('Total extracted products:', allProducts.length);
        console.log('Sample product:', allProducts[0]);
        setProductData(allProducts);
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [selectedDataSource]);

  const formatPrice = (price: number | string | null) => {
    if (price === null || price === undefined || price === '') return "-";
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/[^0-9.-]+/g, '')) : price;
    return numPrice > 0 ? `RM ${numPrice.toFixed(2)}` : "-";
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace?.toLowerCase()) {
      case 'shopee':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'lazada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'lotus':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Enhanced size parsing to extract value and unit separately
  const parseSizeFromName = (productName: string): ParsedSize | null => {
    if (!productName) return null;
    
    // Common size patterns to look for with separate value and unit capture
    const sizePatterns = [
      // Patterns like "110ml X 36boxes" or "250ml X 4pcs" 
      /(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds)\s*[xX×]\s*(\d+)\s*(box|boxes|units?|pcs?|pieces?|pack|packs|count|ct)\b/gi,
      // Patterns like "65ml x 6 units" or "250ml x 4 pcs"
      /(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds)\s*[x×]\s*(\d+)\s*(units?|pcs?|pieces?|pack|packs|count|ct)\b/gi,
      // Patterns like "6 x 65ml" or "4 x 250ml"
      /(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds)\b/gi,
      // Standard weight/volume patterns: 100g, 250ml, 1kg, 2L, etc.
      /(\d+(?:\.\d+)?)\s*(g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|oz|ounce|ounces|lb|pound|pounds)\b/gi,
      // Pack/count patterns: 12pk, 6 pack, 24pcs, etc.
      /(\d+)\s*(pk|pack|packs|pcs|pieces|pc|piece|count|ct|units?|box|boxes)\b/gi,
      // Numeric sizes with units: 32", 42 inch, etc.
      /(\d+(?:\.\d+)?)\s*("|inch|inches|cm|centimeter|centimeters|mm|millimeter|millimeters|ft|foot|feet)\b/gi,
      // Serving/portion sizes: 500ml, 1.5L, etc.
      /(\d+(?:\.\d+)?)\s*(serving|servings|portion|portions)\b/gi
    ];

    for (const pattern of sizePatterns) {
      const matches = [...productName.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const fullMatch = match[0].trim();
        
        // Handle "110ml X 36boxes" format (first pattern)
        if (fullMatch.includes('X') || fullMatch.includes('x') || fullMatch.includes('×')) {
          // Check if it's the first pattern (e.g., "110ml X 36boxes")
          if (match.length >= 5) {
            return {
              value: `${match[1]} ${match[2]} × ${match[3]}`,
              unit: match[4],
              full: fullMatch
            };
          }
          // Check if it's the second pattern (e.g., "65ml x 6 units")
          else if (match.length >= 4 && (match[4] || match[2])) {
            return {
              value: `${match[1]} ${match[2]} × ${match[3]}`,
              unit: match[4] || '',
              full: fullMatch
            };
          }
          // Check if it's the third pattern (e.g., "6 x 65ml")
          else if (match.length >= 4) {
            return {
              value: `${match[1]} × ${match[2]} ${match[3]}`,
              unit: '',
              full: fullMatch
            };
          }
        } else {
          // Standard single value patterns
          if (match.length >= 3) {
            return {
              value: `${match[1]} ${match[2]}`,
              unit: '',
              full: fullMatch
            };
          }
        }
      }
    }

    // Handle size descriptors separately: XS, S, M, L, XL, XXL, etc.
    const sizeDescriptorPattern = /\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b/gi;
    const sizeMatch = productName.match(sizeDescriptorPattern);
    if (sizeMatch) {
      return {
        value: sizeMatch[0].trim(),
        unit: "",
        full: sizeMatch[0].trim()
      };
    }

    return null;
  };

  // Calculate price per unit based on parsed size
  const calculatePricePerUnit = (price: number | string, parsedSize: ParsedSize | null) => {
    if (!parsedSize || !price) return null;
    
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/[^0-9.-]+/g, '')) : price;
    if (numPrice <= 0) return null;

    // Handle multiplication formats like "110 ml × 36" where we have both volume/weight and unit count
    if (parsedSize.value.includes('×') || parsedSize.value.includes('x')) {
      const parts = parsedSize.value.split(/[×x]/);
      if (parts.length === 2) {
        // Extract numbers from the parts (ignoring units in the value string)
        const value1Match = parts[0].trim().match(/(\d+(?:\.\d+)?)/);
        const value2Match = parts[1].trim().match(/(\d+(?:\.\d+)?)/);
        
        if (value1Match && value2Match) {
          const value1 = parseFloat(value1Match[1]);
          const value2 = parseFloat(value2Match[1]);
          
          // Check if we have unit count (units, pcs, pack, boxes, etc.) in the unit string
          const unitLower = parsedSize.unit.toLowerCase();
          const hasUnitCount = /\b(units?|pcs?|pieces?|pack|packs|count|ct|box|boxes)\b/.test(unitLower);
          
          if (hasUnitCount) {
            // For formats like "110 ml × 36 boxes", divide by the unit count (36)
            const unitCount = value2;
            const pricePerUnit = numPrice / unitCount;
            return {
              value: pricePerUnit,
              unit: 'unit',
              formatted: `RM ${pricePerUnit.toFixed(2)}/unit`
            };
          } else {
            // For formats like "6 × 65 ml", multiply the values for total volume/weight
            const totalUnits = value1 * value2;
            // Extract unit from the value string
            const unitMatch = parts[1].trim().match(/[a-zA-Z]+/);
            const unitType = unitMatch ? unitMatch[0] : 'unit';
            const pricePerUnit = numPrice / totalUnits;
            return {
              value: pricePerUnit,
              unit: unitType,
              formatted: `RM ${pricePerUnit.toFixed(3)}/${unitType}`
            };
          }
        }
      }
    } else {
      // Single value format - extract number and unit
      const valueMatch = parsedSize.value.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
      if (valueMatch) {
        const value = parseFloat(valueMatch[1]);
        const unit = valueMatch[2] || parsedSize.unit;
        if (!isNaN(value)) {
          const pricePerUnit = numPrice / value;
          return {
            value: pricePerUnit,
            unit: unit,
            formatted: `RM ${pricePerUnit.toFixed(3)}/${unit}`
          };
        }
      }
    }

    return null;
  };

  // Sort matched products by similarity score (highest first)
  const sortMatchedProductsBySimilarity = (matchedProducts: any[]) => {
    if (!matchedProducts || matchedProducts.length === 0) return [];
    
    return [...matchedProducts].sort((a, b) => {
      const similarityA = a.similarity_score || a.similarity || 0;
      const similarityB = b.similarity_score || b.similarity || 0;
      return similarityB - similarityA; // Descending order (highest first)
    });
  };

  // Pagination
  const totalPages = Math.ceil(productData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = productData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const downloadProductData = () => {
    const dataToDownload = {
      metadata: {
        source: DATA_SOURCES[selectedDataSource].label,
        url: DATA_SOURCES[selectedDataSource].url,
        totalProducts: productData.length,
        downloadedAt: new Date().toISOString(),
        currentPage: currentPage,
        itemsPerPage: ITEMS_PER_PAGE
      },
      products: productData
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-details-${selectedDataSource}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading product details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (productData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No product details available.</p>
          <p className="text-sm text-muted-foreground mt-2">
            The data source might be empty or the structure has changed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details & Matched Products
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{productData.length} products</Badge>
            <Button 
              onClick={downloadProductData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={productData.length === 0}
            >
              <Download className="h-4 w-4" />
              Download Data
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed product information with JSON fields and matched products (sorted by similarity)
        </p>
        
        {/* Data Source Selector */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Data Source:</span>
          </div>
          <Select value={selectedDataSource} onValueChange={(value: DataSource) => setSelectedDataSource(value)}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATA_SOURCES).map(([key, source]) => (
                <SelectItem key={key} value={key}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          Current source: {DATA_SOURCES[selectedDataSource].url}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[250px]">Product Name & Image</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Size Info</TableHead>
                <TableHead>Similarity %</TableHead>
                <TableHead className="min-w-[300px]">Matched Products</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((product, index) => {
                const sortedMatchedProducts = sortMatchedProductsBySimilarity(product.matched_products);
                
                return (
                  <TableRow key={`product-${startIndex + index}`}>
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="min-w-[250px]">
                      <div className="space-y-2">
                        <div className="font-medium text-sm whitespace-normal break-words">
                          {product.name}
                        </div>
                        {product.image_url && (
                          <div className="w-20 h-20 border rounded-md overflow-hidden bg-muted/30">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {product.image_url && (
                          <div className="text-xs text-muted-foreground">
                            <a 
                              href={product.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Full Size
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(product.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMarketplaceBadgeColor(product.marketplace)}>
                        {product.marketplace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.product_url ? (
                        <a 
                          href={cleanUrl(product.product_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">No URL</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground max-w-[100px] truncate" title={product.size_info}>
                        {product.size_info || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {product.similarity_to_best_price ? `${product.similarity_to_best_price.toFixed(1)}%` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      <div className="space-y-1">
                        {sortedMatchedProducts && sortedMatchedProducts.length > 0 ? (
                          <div className="text-xs space-y-1">
                            <div className="font-medium text-muted-foreground">
                              {sortedMatchedProducts.length} matched product(s):
                            </div>
                            {sortedMatchedProducts.slice(0, 5).map((match: any, idx: number) => {
                              const productName = match.matched_product_name || match.name || 'No name available';
                              const parsedSize = parseSizeFromName(productName);
                              const pricePerUnit = calculatePricePerUnit(match.matched_product_price || match.price, parsedSize);
                              
                              return (
                                <div key={idx} className="p-2 bg-muted/30 rounded border-l-2 border-primary/20">
                                  <div className="font-medium truncate" title={productName}>
                                    {productName}
                                  </div>
                                  {parsedSize && (
                                    <div className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                                      <span>Size:</span>
                                      <div className="flex items-center gap-1">
                                        <span className="bg-orange-100 text-orange-700 px-1 py-0.5 rounded text-xs font-bold">
                                          {parsedSize.value}
                                        </span>
                                        {parsedSize.unit && (
                                          <span className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded text-xs">
                                            {parsedSize.unit}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-green-600 font-medium">
                                      {formatPrice(match.matched_product_price || match.price)}
                                    </span>
                                    {(match.matched_product_marketplace || match.marketplace) && (
                                      <Badge variant="outline" className="text-xs">
                                        {match.matched_product_marketplace || match.marketplace}
                                      </Badge>
                                    )}
                                  </div>
                                  {pricePerUnit && (
                                    <div className="text-purple-600 text-xs mt-1 font-medium">
                                      Price per unit: {pricePerUnit.formatted}
                                    </div>
                                  )}
                                  {(match.similarity_score || match.similarity) && (
                                    <div className="text-blue-600 text-xs mt-1">
                                      Similarity: {(match.similarity_score || match.similarity)}%
                                    </div>
                                  )}
                                  {match.similarity_level && (
                                    <div className="text-purple-600 text-xs">
                                      Level: {match.similarity_level}
                                    </div>
                                  )}
                                  
                                  {/* URL Verification Links */}
                                  <div className="flex flex-col gap-1 mt-2 border-t pt-2">
                                    {(match.matched_product_url || match.product_url) && (
                                      <div className="flex items-center gap-1">
                                        <Link className="w-3 h-3 text-blue-500" />
                                        <a 
                                          href={cleanUrl(match.matched_product_url || match.product_url)} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                                          title={cleanUrl(match.matched_product_url || match.product_url)}
                                        >
                                          Verify Product URL
                                        </a>
                                      </div>
                                    )}
                                    {(match.matched_product_image || match.image_url) && (
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-green-500" />
                                        <a 
                                          href={match.matched_product_image || match.image_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs underline"
                                          title={match.matched_product_image || match.image_url}
                                        >
                                          Verify Image URL
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {sortedMatchedProducts.length > 5 && (
                              <div className="text-xs text-muted-foreground">
                                +{sortedMatchedProducts.length - 5} more matches
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No matched products</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, productData.length)} of {productData.length} products
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
