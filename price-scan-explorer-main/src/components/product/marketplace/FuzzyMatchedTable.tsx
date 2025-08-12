import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useMatchedCSVData } from "./hooks/useMatchedCSVData";
import { useLotusShopeeCSVData } from "./hooks/useLotusShopeeCSVData";
import { cleanUrl } from "@/lib/utils";

export function FuzzyMatchedTable() {
  const { csvData, isLoading, error, refetch } = useMatchedCSVData();
  const { csvData: detailedPricingData, isLoading: detailedLoading } = useLotusShopeeCSVData();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // Increased from 20 to show more records

  // Debug data loading status
  React.useEffect(() => {
    console.log('🔍 CSV Data Loading Status:', {
      isLoading,
      error,
      csvDataLength: csvData?.length || 0,
      detailedLoading,
      detailedDataLength: detailedPricingData?.length || 0
    });
  }, [isLoading, error, csvData, detailedLoading, detailedPricingData]);

  // Function to find detailed pricing information for a product
  const findDetailedPricing = (productName: string, marketplace: string) => {
    if (!detailedPricingData || detailedPricingData.length === 0) return null;
    
    const normalizedProductName = productName.toLowerCase().trim();
    const targetMarketplace = marketplace.toLowerCase().includes('lotus') ? 'lotus' : 'shopee';
    
    // Find matching product by name and marketplace
    const matchedProduct = detailedPricingData.find(product => {
      const productNameMatch = product.productName.toLowerCase().includes(normalizedProductName) || 
                              normalizedProductName.includes(product.productName.toLowerCase());
      const marketplaceMatch = product.marketplace.toLowerCase().includes(targetMarketplace) ||
                              (targetMarketplace === 'lotus' && product.marketplace.toLowerCase().includes('lotus')) ||
                              (targetMarketplace === 'shopee' && product.marketplace.toLowerCase().includes('shopee'));
      
      return productNameMatch && marketplaceMatch;
    });
    
    return matchedProduct || null;
  };

  // Function to extract quantity from product name
  const extractQuantity = (productName: string): number => {
    if (!productName) return 1;
    
    // New: If pattern like '8 X 5 X 80', use the first number as pack size
    const tripleXPattern = /^(\d+)\s*[xX×]\s*\d+\s*[xX×]\s*\d+/;
    const tripleXMatch = productName.match(tripleXPattern);
    if (tripleXMatch) {
      const packSize = parseInt(tripleXMatch[1]);
      if (packSize > 1) return packSize;
    }

    // Look for patterns like "5X", "5 X", "5x", "5 x"
    const multiplyPatterns = [
      /(\d+)\s*[xX×]\s*\d+[a-zA-Z]*/g, // 5X85G, 3x100ml
      /(\d+)\s*[xX×]/g, // 5X, 3x
    ];
    
    for (const pattern of multiplyPatterns) {
      const match = productName.match(pattern);
      if (match) {
        const quantity = parseInt(match[0].match(/(\d+)/)?.[1] || '1');
        if (quantity > 1) return quantity;
      }
    }
    
    // Look for pack patterns like "12PK", "6PACK", "24 PACK"
    const packPatterns = [
      /(\d+)\s*(?:pk|pack|pcs?|pieces?|units?)/gi,
    ];
    
    for (const pattern of packPatterns) {
      const match = productName.match(pattern);
      if (match) {
        const quantity = parseInt(match[0].match(/(\d+)/)?.[1] || '1');
        if (quantity > 1) return quantity;
      }
    }
    
    return 1; // Default to 1 if no quantity found
  };

  // Function to extract numeric price from price string
  const extractPrice = (priceString: string): number => {
    if (!priceString) return 0;
    
    // Remove currency symbols and extract numbers
    const numericPrice = priceString.replace(/[^\d.-]/g, '');
    return parseFloat(numericPrice) || 0;
  };

  // Function to calculate per unit price
  const calculatePerUnit = (priceString: string, productName: string): string => {
    const price = extractPrice(priceString);
    const quantity = extractQuantity(productName);
    
    if (price <= 0 || quantity <= 0) return '-';
    
    const perUnit = price / quantity;
    return `RM ${perUnit.toFixed(2)}`;
  };

  // Function to calculate per unit price from numeric value
  const calculatePerUnitFromNumber = (price: number, productName: string): string => {
    const quantity = extractQuantity(productName);
    
    if (price <= 0 || quantity <= 0) return '-';
    
    const perUnit = price / quantity;
    return `RM ${perUnit.toFixed(2)}`;
  };

  // Helper function to check if two prices are essentially the same
  const pricesAreEqual = (price1: number, price2: number): boolean => {
    if (!price1 || !price2) return false;
    const difference = Math.abs(price1 - price2);
    return difference < 0.01; // Less than 1 cent difference
  };

  // Helper function to check if there's a real discount
  const hasRealDiscount = (originalPrice: number, discountedPrice: number): boolean => {
    if (!originalPrice || !discountedPrice) return false;
    return !pricesAreEqual(originalPrice, discountedPrice);
  };

  const filteredData = useMemo(() => {
    console.log('🔍 Filtering data. Search term:', searchTerm || 'none');
    console.log('🔍 Raw data count:', csvData?.length || 0);
    
    if (!csvData || csvData.length === 0) {
      console.log('🔍 No CSV data available');
      return [];
    }
    
    // Show first few product names and prices for debugging
    if (csvData.length > 0) {
      console.log('🔍 Sample product data from CSV:');
      csvData.slice(0, 5).forEach((row, index) => {
        console.log(`  ${index + 1}. Lotus: "${row['Lotus Product']}" (${row['Lotus Price']}) | Shopee: "${row['Shopee Product']}" (${row['Shopee Price']}) | Score: ${row['Match Score']}`);
        console.log(`    Row keys:`, Object.keys(row));
        console.log(`    Row values:`, Object.values(row));
      });
    }
    
    if (!searchTerm) {
      console.log('🔍 No search filter applied, returning all', csvData.length, 'records');
      return csvData;
    }
    
    const filtered = csvData.filter(row => 
      row['Lotus Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row['Shopee Product']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('🔍 Filtered data count:', filtered.length);
    return filtered;
  }, [csvData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ['Lotus Product', 'Lotus Original Price', 'Lotus Discounted Price', 'Lotus Price', 'Lotus Per Unit', 'Lotus URL', 'Shopee Product', 'Shopee Original Price', 'Shopee Discounted Price', 'Shopee Price', 'Shopee Per Unit', 'Shopee URL', 'Match Score'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => {
        const lotusPerUnit = calculatePerUnit(row['Lotus Price'] || '', row['Lotus Product'] || '');
        const shopeePerUnit = calculatePerUnit(row['Shopee Price'] || '', row['Shopee Product'] || '');
        const lotusDetails = findDetailedPricing(row['Lotus Product'] || '', 'lotus');
        const shopeeDetails = findDetailedPricing(row['Shopee Product'] || '', 'shopee');
        
        return [
          `"${row['Lotus Product'] || ''}"`,
          `"${lotusDetails ? `RM ${lotusDetails.originalPrice.toFixed(2)}` : 'N/A'}"`,
          `"${lotusDetails ? `RM ${lotusDetails.discountedPrice.toFixed(2)}` : 'N/A'}"`,
          `"${row['Lotus Price'] || ''}"`,
          `"${lotusPerUnit}"`,
          `"${cleanUrl(row['Lotus URL'] || '')}"`,
          `"${row['Shopee Product'] || ''}"`,
          `"${shopeeDetails ? `RM ${shopeeDetails.originalPrice.toFixed(2)}` : 'N/A'}"`,
          `"${shopeeDetails ? `RM ${shopeeDetails.discountedPrice.toFixed(2)}` : 'N/A'}"`,
          `"${row['Shopee Price'] || ''}"`,
          `"${shopeePerUnit}"`,
          `"${cleanUrl(row['Shopee URL'] || '')}"`,
          `"${row['Match Score'] || ''}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'matched_lotus_shopee_horeca_publitasA.csv';
    link.click();
  };

  if (isLoading || detailedLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading fuzzy matched data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading data: {error}</p>
            <Button onClick={refetch} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Smart Compare</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} matched product pairs
            </p>
            <p className="text-xs text-muted-foreground">
              Raw Data: {csvData?.length || 0} records • Page {currentPage} of {totalPages}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-left font-medium">Lotus Product</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Lotus Price</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Lotus Per Unit</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Lotus URL</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Shopee Product</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Shopee Price</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Shopee Per Unit</th>
                <th className="border border-gray-200 p-3 text-left font-medium">Shopee URL</th>
                <th className="border border-gray-200 p-3 text-center font-medium">Match Score</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, index) => {
                const matchScore = parseFloat(row['Match Score'] || '0');
                const lotusPerUnitPrice = calculatePerUnit(row['Lotus Price'] || '', row['Lotus Product'] || '');
                const shopeePerUnitPrice = calculatePerUnit(row['Shopee Price'] || '', row['Shopee Product'] || '');
                const lotusQuantity = extractQuantity(row['Lotus Product'] || '');
                const shopeeQuantity = extractQuantity(row['Shopee Product'] || '');
                
                // Debug pricing data - show first few rows
                if (index < 3) {
                  console.log(`🔍 Row ${index} pricing debug:`, {
                    lotusPrice: row['Lotus Price'],
                    shopeePrice: row['Shopee Price'],
                    lotusProduct: row['Lotus Product']?.substring(0, 30),
                    shopeeProduct: row['Shopee Product']?.substring(0, 30),
                    allKeys: Object.keys(row),
                    matchScore: row['Match Score']
                  });
                }
                
                // Debug match score parsing
                if (matchScore === 0) {
                  console.log('🔍 Zero match score found:', {
                    product: row['Lotus Product']?.substring(0, 50),
                    rawScore: row['Match Score'],
                    parsedScore: matchScore
                  });
                }
                
                // Get detailed pricing information
                const lotusDetails = findDetailedPricing(row['Lotus Product'] || '', 'lotus');
                const shopeeDetails = findDetailedPricing(row['Shopee Product'] || '', 'shopee');
                
                return (
                  <tr key={startIndex + index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3">
                      <div className="font-semibold text-sm text-blue-900 mb-1">{row['Lotus Product']}</div>
                      {lotusQuantity > 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Qty: {lotusQuantity} units
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="space-y-1">
                        {/* Show raw CSV price data */}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {row['Lotus Price'] || 'N/A'}
                        </Badge>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="space-y-1">
                        {/* Show raw CSV per unit price */}
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {lotusPerUnitPrice}
                        </Badge>
                        {lotusQuantity > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ÷ {lotusQuantity}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="text-xs text-blue-600 break-all max-w-xs">
                        <a 
                          href={cleanUrl(row['Lotus URL'] || '')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          title={cleanUrl(row['Lotus URL'] || '')}
                        >
                          {cleanUrl(row['Lotus URL'] || '')?.substring(0, 60)}...
                        </a>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="font-semibold text-sm text-orange-900 mb-1">{row['Shopee Product']}</div>
                      {shopeeQuantity > 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Qty: {shopeeQuantity} units
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="space-y-1">
                        {/* Show raw CSV price data */}
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {row['Shopee Price'] || 'N/A'}
                        </Badge>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="space-y-1">
                        {/* Show raw CSV per unit price */}
                        <Badge variant="outline" className="bg-pink-50 text-pink-700">
                          {shopeePerUnitPrice}
                        </Badge>
                        {shopeeQuantity > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ÷ {shopeeQuantity}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div className="text-xs text-orange-600 break-all max-w-xs">
                        <a 
                          href={cleanUrl(row['Shopee URL'] || '')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          title={cleanUrl(row['Shopee URL'] || '')}
                        >
                          {cleanUrl(row['Shopee URL'] || '')?.substring(0, 60)}...
                        </a>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3 text-center">
                      <Badge 
                        className={
                          matchScore >= 90 ? "bg-green-100 text-green-800" :
                          matchScore >= 70 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }
                      >
                        {matchScore.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No matching products found.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 